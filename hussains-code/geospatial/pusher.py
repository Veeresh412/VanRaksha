"""
Backend Push Client module for Person 1 Geospatial Engine.
Pushes candidate satellite flags to Person 2's backend via POST /satellite-flags.
Includes local JSON queuing on connection failures so no flags are lost.
"""

import json
import os
import requests
from typing import Dict, Any, List

from geospatial.config import (
    BACKEND_URL,
    BACKEND_SATELLITE_FLAGS_ENDPOINT,
    BACKEND_API_KEY,
    FAILED_PUSHES_FILE_PATH,
)
from geospatial.logger import get_logger

logger = get_logger("pusher")


def save_failed_push_locally(payload: Dict[str, Any]) -> None:
    """Saves unpushed flag payload to local JSON queue file."""
    failed_file = FAILED_PUSHES_FILE_PATH
    os.makedirs(os.path.dirname(os.path.abspath(failed_file)), exist_ok=True)

    queue: List[Dict[str, Any]] = []
    if os.path.exists(failed_file):
        try:
            with open(failed_file, "r") as f:
                queue = json.load(f)
        except Exception:
            queue = []

    queue.append(payload)
    with open(failed_file, "w") as f:
        json.dump(queue, f, indent=2)

    logger.info(f"Queued unpushed flag locally to {failed_file} (total queued: {len(queue)}).")


def push_flag_to_backend(flag: Dict[str, Any]) -> bool:
    """
    Pushes a detected satellite flag to Person 2's backend POST /satellite-flags endpoint.

    Args:
        flag: Candidate flag dictionary from pipeline.

    Returns:
        bool: True if backend accepted flag with 2xx response, False otherwise.
    """
    endpoint_url = f"{BACKEND_URL.rstrip('/')}/satellite-pings"

    # Dynamically determine the exact type of deforestation anomaly
    ndvi_loss = abs(float(flag["ndvi_delta"]))
    ndbi_rise = float(flag["ndbi_delta"])

    if ndvi_loss > 0.30 and ndbi_rise < 0.15:
        signal_type = "Potential Vegetation Loss"
    elif ndbi_rise > 0.20 and ndvi_loss < 0.20:
        signal_type = "Potential Structure Change"
    else:
        signal_type = "Unverified Land-use Change"

    # Construct exact payload contract required by Person 2 backend
    payload = {
        "lat": float(flag["lat"]),
        "lng": float(flag["lng"]),
        "confidence_score": float(flag["confidence_score"]),
        "signal_type": signal_type,
        "ndvi_delta": float(flag["ndvi_delta"]),
        "ndbi_delta": float(flag["ndbi_delta"]),
        "fra_parcel_id": str(flag["fra_parcel_id"]),
        "detected_at": str(flag["detected_at"]),
        "data_source": str(flag["data_source"]),
    }

    headers = {"Content-Type": "application/json"}
    if BACKEND_API_KEY:
        headers["Authorization"] = f"Bearer {BACKEND_API_KEY}"
        headers["X-API-Key"] = BACKEND_API_KEY

    try:
        response = requests.post(endpoint_url, json=payload, headers=headers, timeout=5)
        
        # 2xx Success
        if 200 <= response.status_code < 300:
            try:
                res_data = response.json()
                backend_flag_id = res_data.get("flag_id", res_data.get("id", "success"))
            except Exception:
                backend_flag_id = "2xx_ok"

            logger.info(f"Flag pushed successfully, backend flag_id: {backend_flag_id}")
            return True

        # 4xx Client Error (Contract mismatch / Bad Request / Auth failure)
        elif 400 <= response.status_code < 500:
            logger.error(f"Backend contract mismatch or 4xx error (status {response.status_code}): {response.text}")
            return False

        # 5xx Server Error
        else:
            logger.error(f"Backend 5xx server error (status {response.status_code}): {response.text}")
            return False

    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as conn_err:
        logger.warning(f"Backend unreachable — flag queued locally ({conn_err}).")
        save_failed_push_locally(payload)
        return False
    except Exception as err:
        logger.error(f"Unexpected exception while pushing flag to backend: {err}")
        save_failed_push_locally(payload)
        return False
