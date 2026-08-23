"""
FastAPI REST Service Wrapper for Person 1 Geospatial Detection Engine.
Exposes HTTP interface (GET /geospatial/flags, GET /geospatial/health).
"""

import time
from datetime import datetime
from typing import Dict, Any

from fastapi import FastAPI, Query, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from geospatial.config import DISTRICT_NAME
from geospatial.pipeline import get_flags_for_district
from geospatial.core.gee_auth import get_data_source_tag
from geospatial.exceptions import GEEAuthError, NoImageryAvailableError, PipelineError
from geospatial.logger import get_logger

logger = get_logger("api")

app = FastAPI(
    title="FRAWatch Geospatial Detection Engine API",
    description="Satellite land-use change detection microservice for FRA community parcels.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def in_request_logging_middleware(request: Request, call_next):
    """Logs inbound HTTP requests with query params, status code, and execution time in ms."""
    start_time = time.time()
    response: Response = await call_next(request)
    process_time_ms = round((time.time() - start_time) * 1000, 2)
    logger.info(
        f"{request.method} {request.url.path} (params: {dict(request.query_params)}) "
        f"-> Status {response.status_code} [{process_time_ms}ms]"
    )
    return response


@app.get("/geospatial/health")
def health_check() -> Dict[str, str]:
    """Health check endpoint for Person 2 backend monitoring."""
    data_source = get_data_source_tag()
    return {
        "status": "ok",
        "mode": data_source,
        "version": "1.0.0"
    }


@app.get("/geospatial/flags")
def fetch_flags(
    district_id: str = Query(default=DISTRICT_NAME, description="Target district ID (e.g. Mayurbhanj)"),
    start_date: str = Query(default="2026-05-01", description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(default="2026-08-01", description="End date (YYYY-MM-DD)")
) -> Dict[str, Any]:
    """
    Returns candidate land-use change flags near FRA parcels.
    Includes strict parameter validation and structured error handling.
    """
    data_source = get_data_source_tag()

    # 1. Parameter Validation
    if not district_id or not district_id.strip() or len(district_id) > 64:
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "INVALID_PARAMS",
                "message": "district_id must be a non-empty string under 64 characters.",
                "data_source": data_source
            }
        )

    date_fmt = "%Y-%m-%d"
    try:
        start_dt = datetime.strptime(start_date, date_fmt)
        end_dt = datetime.strptime(end_date, date_fmt)
    except ValueError:
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "INVALID_PARAMS",
                "message": "start_date and end_date must be valid ISO8601 YYYY-MM-DD date strings.",
                "data_source": data_source
            }
        )

    if start_dt >= end_dt:
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "INVALID_PARAMS",
                "message": "start_date must be strictly before end_date.",
                "data_source": data_source
            }
        )

    # 2. Pipeline Execution with Structured Exception Catching
    try:
        flags = get_flags_for_district(
            district_id=district_id,
            start_date=start_date,
            end_date=end_date
        )
        return {
            "district_id": district_id,
            "count": len(flags),
            "data_source": data_source,
            "flags": flags
        }
    except (GEEAuthError, NoImageryAvailableError) as e:
        logger.warning(f"Imagery unavailable error in API: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "error_code": "IMAGERY_UNAVAILABLE",
                "message": str(e),
                "data_source": data_source
            }
        )
    except PipelineError as e:
        logger.error(f"Pipeline error in API: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "error_code": "PIPELINE_ERROR",
                "message": str(e),
                "data_source": data_source
            }
        )
    except Exception as e:
        logger.error(f"Unhandled unknown error in API: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error_code": "UNKNOWN_ERROR",
                "message": f"Unexpected server error: {e}",
                "data_source": data_source
            }
        )
