"""
FRAWatch / Vanraksha - Authenticity Layer Module
================================================
Integrity, provenance, and tamper validation for citizen-submitted photos
in the FRAWatch / Vanraksha early-warning encroachment detection system (SIH 2026 / MoTA).

Module Contract:
----------------
analyze_photo(photo_file, reverse_search_backend=None, verbose=False) -> {
    "authenticity_score": float,              # 0.0 - 1.0
    "exif_gps_present": bool,
    "exif_editing_software_detected": bool,
    "reverse_image_match_found": bool,
    "ela_anomaly_score": float,               # 0.0 - 1.0
    "flags": [string],
    # Optional diagnostics dictionary when verbose=True:
    # "diagnostics": { ... }
}

Accepts:
- Filesystem path (str or os.PathLike)
- Raw bytes (bytes)
- Binary stream / file-like object (io.BytesIO, BinaryIO, FastAPI UploadFile.file)
"""

from abc import ABC, abstractmethod
import io
import logging
import os
from typing import Any, BinaryIO, Dict, List, Optional, Tuple, Union

import numpy as np
from PIL import Image, ExifTags

logger = logging.getLogger(__name__)

# ==============================================================================
# AUTHENTICITY SCORING WEIGHTS & THRESHOLDS (Named Constants)
# ==============================================================================
# Base score is 1.0, with deductions for detected integrity issues:
# - Editing software detected in EXIF: 0.40 deduction
# - Duplicate web image found in reverse search: 0.30 deduction
# - High ELA anomaly score: up to 0.35 deduction
# - Stripped EXIF metadata on claimed camera photo: 0.10 deduction
WEIGHT_EDITING_SOFTWARE: float = 0.40
WEIGHT_REVERSE_MATCH: float = 0.30
WEIGHT_ELA_ANOMALY: float = 0.35
WEIGHT_METADATA_STRIPPED: float = 0.10

# Error Level Analysis (ELA) Multi-Scale Signal Processing Constants
ELA_JPEG_QUALITY_PRIMARY: int = 90
ELA_JPEG_QUALITY_SECONDARY: int = 75
ELA_BLOCK_SIZE: int = 16
ELA_HIGH_THRESHOLD: float = 0.50

# Known Editing & Retouching Software Signatures (Case-Insensitive Substrings)
# Includes desktop suites, mobile editors, magic eraser tools, and inpainting utilities
EDITING_SOFTWARE_SIGNATURES: Tuple[str, ...] = (
    "adobe photoshop",
    "photoshop",
    "gimp",
    "lightroom",
    "affinity photo",
    "affinity",
    "snapseed",
    "picsart",
    "canva",
    "capture one",
    "luminar",
    "paint.net",
    "corel photopaint",
    "corel photo-paint",
    "photo-paint",
    "coreldraw",
    "pixlr",
    "photoscape",
    "vsco",
    "fotor",
    "befunky",
    "facetune",
    "afterlight",
    "pixelmator",
    "seashore",
    "photopad",
    "magic eraser",
    "touchretouch",
    "inpaint",
    "retouch",
    "photo editor",
    "gallery editor",
    "samsung photo editor",
    "apple photos",
    "quickshot",
    "bazaart",
    "remini",
    "meitu",
    "photoroom",
    "photopea",
    "photodirector",
    "polish",
    "epik",
    "prisma",
    "hypic",
)


# ==============================================================================
# REVERSE IMAGE SEARCH BACKENDS
# ==============================================================================
class ReverseImageSearchBackend(ABC):
    """
    Abstract interface for reverse image search providers.
    
    Sub-checks must never block or crash the pipeline. If an external service
    fails, times out, or has exceeded its rate limit, analyze_photo() will catch
    the exception, set reverse_image_match_found = False, append the flag
    'reverse_search_skipped', and proceed.
    """

    @abstractmethod
    def search(self, image_bytes: bytes) -> bool:
        """
        Perform reverse image lookup for the provided image bytes.

        Returns:
            bool: True if an identical or near-duplicate match is found online,
                  False otherwise.
        """
        pass


class NullReverseImageSearchBackend(ReverseImageSearchBackend):
    """
    Default unconfigured backend.
    
    Raises NotImplementedError so that analyze_photo() safely catches it,
    logs a warning, and flags 'reverse_search_skipped' without failing the pipeline.
    """

    def search(self, image_bytes: bytes) -> bool:
        raise NotImplementedError(
            "Reverse image search backend is not configured (NullReverseImageSearchBackend)."
        )


# ==============================================================================
# HELPER FUNCTIONS: FILE & EXIF INGESTION
# ==============================================================================
def _read_bytes_from_input(
    photo_file: Union[str, bytes, BinaryIO, os.PathLike, io.BytesIO]
) -> bytes:
    """
    Read raw bytes from a path, raw bytes, or stream/file-like object.
    Preserves stream position if the object is seekable.
    """
    if isinstance(photo_file, (bytes, bytearray)):
        return bytes(photo_file)
    elif isinstance(photo_file, (str, os.PathLike)):
        with open(photo_file, "rb") as f:
            return f.read()
    elif hasattr(photo_file, "read"):
        pos = None
        if hasattr(photo_file, "tell") and hasattr(photo_file, "seek"):
            try:
                pos = photo_file.tell()
            except Exception:
                pos = None

        content = photo_file.read()

        if pos is not None and hasattr(photo_file, "seek"):
            try:
                photo_file.seek(pos)
            except Exception:
                pass

        return bytes(content)
    else:
        raise TypeError(f"Unsupported photo_file type: {type(photo_file)}")


def _to_float(value: Any) -> float:
    """Safely convert IFDRational, (num, den) tuple, int, or float to Python float."""
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, tuple) and len(value) == 2:
        num, den = value
        return float(num) / float(den) if den != 0 else 0.0
    if hasattr(value, "numerator") and hasattr(value, "denominator"):
        return float(value.numerator) / float(value.denominator) if value.denominator != 0 else 0.0
    if hasattr(value, "num") and hasattr(value, "den"):
        return float(value.num) / float(value.den) if value.den != 0 else 0.0
    try:
        return float(value)
    except Exception:
        return 0.0


def _parse_dms_to_decimal(dms_values: Any, ref: Optional[str]) -> Optional[float]:
    """
    Convert GPS coordinates from degrees/minutes/seconds rational representation
    to signed decimal degrees.
    """
    try:
        if not isinstance(dms_values, (tuple, list)) or len(dms_values) < 3:
            return None
        deg = _to_float(dms_values[0])
        min_val = _to_float(dms_values[1])
        sec = _to_float(dms_values[2])
        decimal = deg + (min_val / 60.0) + (sec / 3600.0)
        if ref and str(ref).strip().upper() in ("S", "W"):
            decimal = -decimal
        return decimal
    except Exception as exc:
        logger.debug("Error parsing DMS rational to decimal: %s", exc)
        return None


# ==============================================================================
# SUB-CHECK 1: EXIF EXTRACTION & PROVENANCE INSPECTION
# ==============================================================================
def _inspect_exif(img: Image.Image) -> Dict[str, Any]:
    """
    Extract all EXIF metadata tags, scan for editing software signatures,
    and assess metadata completeness.
    """
    raw_exif_dict: Dict[str, str] = {}
    matched_tags: List[str] = []
    software_detected = False
    camera_make = None
    camera_model = None
    datetime_orig = None

    try:
        exif = img.getexif()
        if exif:
            for tag_id, value in exif.items():
                tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                val_str = str(value)
                raw_exif_dict[tag_name] = val_str

                if tag_name == "Make":
                    camera_make = val_str
                elif tag_name == "Model":
                    camera_model = val_str
                elif tag_name in ("DateTimeOriginal", "DateTime"):
                    datetime_orig = val_str

                if tag_name in ("Software", "ProcessingSoftware", "ImageSoftware", "HostComputer", "UserComment", "ImageDescription"):
                    norm_val = val_str.lower().strip()
                    for sig in EDITING_SOFTWARE_SIGNATURES:
                        if sig in norm_val:
                            software_detected = True
                            matched_tags.append(f"{tag_name}: {val_str} (matched '{sig}')")

            # Pillow 10+ IFD Exif inspection
            if hasattr(ExifTags, "IFD") and hasattr(ExifTags.IFD, "Exif"):
                try:
                    exif_ifd = exif.get_ifd(ExifTags.IFD.Exif)
                    for tag_id, value in exif_ifd.items():
                        tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                        val_str = str(value)
                        raw_exif_dict[f"ExifIFD.{tag_name}"] = val_str

                        if tag_name in ("DateTimeOriginal", "DateTimeDigitized"):
                            datetime_orig = val_str

                        if tag_name in ("Software", "ProcessingSoftware", "UserComment"):
                            norm_val = val_str.lower().strip()
                            for sig in EDITING_SOFTWARE_SIGNATURES:
                                if sig in norm_val:
                                    software_detected = True
                                    matched_tags.append(f"ExifIFD.{tag_name}: {val_str} (matched '{sig}')")
                except Exception:
                    pass
    except Exception as exc:
        logger.debug("Failed extracting EXIF via getexif: %s", exc)

    # Legacy _getexif() fallback
    if not raw_exif_dict and hasattr(img, "_getexif"):
        try:
            legacy_exif = img._getexif()
            if legacy_exif:
                for tag_id, value in legacy_exif.items():
                    tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                    val_str = str(value)
                    raw_exif_dict[tag_name] = val_str
                    if tag_name in ("Software", "ProcessingSoftware", "HostComputer", "UserComment"):
                        norm_val = val_str.lower().strip()
                        for sig in EDITING_SOFTWARE_SIGNATURES:
                            if sig in norm_val:
                                software_detected = True
                                matched_tags.append(f"{tag_name}: {val_str} (matched '{sig}')")
        except Exception:
            pass

    # Check info dictionary (PNG / TIFF / JPEG metadata fields)
    for key in ("Software", "software", "Comment", "Description", "History", "xmp"):
        val = img.info.get(key)
        if isinstance(val, (str, bytes)):
            val_str = str(val)
            raw_exif_dict[f"info.{key}"] = val_str
            norm_val = val_str.lower().strip()
            for sig in EDITING_SOFTWARE_SIGNATURES:
                if sig in norm_val:
                    software_detected = True
                    matched_tags.append(f"info.{key}: {val_str} (matched '{sig}')")

    tag_count = len(raw_exif_dict)
    exif_present = tag_count > 0
    # Metadata is considered stripped if 0 tags or no camera hardware/datetime provenance exists
    metadata_stripped = (tag_count == 0) or (camera_make is None and camera_model is None and datetime_orig is None)

    return {
        "exif_present": exif_present,
        "tag_count": tag_count,
        "metadata_stripped": metadata_stripped,
        "editing_software_detected": software_detected,
        "matched_tags": matched_tags,
        "camera_make": camera_make,
        "camera_model": camera_model,
        "datetime_original": datetime_orig,
        "dump": raw_exif_dict,
    }


# ==============================================================================
# SUB-CHECK 2: GPS TAG EXTRACTION & VALIDATION
# ==============================================================================
def _check_gps_tag(img: Image.Image) -> Tuple[bool, Optional[float], Optional[float]]:
    """
    Check for valid GPS coordinates in EXIF GPSInfo block.
    
    Validation requirements:
    - Latitude in [-90.0, 90.0], Longitude in [-180.0, 180.0]
    - Rejects (0, 0) 'Null Island' pattern resulting from stripped/corrupted EXIF.
    
    Returns:
        (gps_present: bool, lat: Optional[float], lng: Optional[float])
    """
    try:
        exif = img.getexif()
        gps_dict: Dict[Any, Any] = {}

        if exif:
            if hasattr(ExifTags, "IFD") and hasattr(ExifTags.IFD, "GPSInfo"):
                try:
                    gps_ifd = exif.get_ifd(ExifTags.IFD.GPSInfo)
                    if gps_ifd:
                        gps_dict = dict(gps_ifd)
                except Exception:
                    pass

            if not gps_dict:
                gps_info_raw = exif.get(34853) or exif.get(0x8825)
                if isinstance(gps_info_raw, dict):
                    gps_dict = gps_info_raw

        if not gps_dict and hasattr(img, "_getexif"):
            legacy_exif = img._getexif()
            if legacy_exif:
                gps_info_raw = legacy_exif.get(34853) or legacy_exif.get(0x8825)
                if isinstance(gps_info_raw, dict):
                    gps_dict = gps_info_raw

        if not gps_dict:
            return False, None, None

        parsed_gps: Dict[str, Any] = {}
        for tag_id, val in gps_dict.items():
            tag_name = ExifTags.GPSTAGS.get(tag_id, str(tag_id))
            parsed_gps[tag_name] = val

        lat_dms = parsed_gps.get("GPSLatitude")
        lat_ref = parsed_gps.get("GPSLatitudeRef")
        lng_dms = parsed_gps.get("GPSLongitude")
        lng_ref = parsed_gps.get("GPSLongitudeRef")

        if lat_dms is None or lng_dms is None:
            return False, None, None

        lat = _parse_dms_to_decimal(lat_dms, lat_ref)
        lng = _parse_dms_to_decimal(lng_dms, lng_ref)

        if lat is None or lng is None:
            return False, None, None

        if not (-90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0):
            return False, None, None

        # Null Island check
        if abs(lat) < 1e-5 and abs(lng) < 1e-5:
            return False, None, None

        return True, round(lat, 6), round(lng, 6)

    except Exception as exc:
        logger.warning("Error while inspecting GPS EXIF block: %s", exc)
        return False, None, None


# ==============================================================================
# SUB-CHECK 3: MULTI-SCALE ERROR LEVEL ANALYSIS (SIGNAL PROCESSING)
# ==============================================================================
def _compute_multi_scale_ela(img: Image.Image) -> Dict[str, Any]:
    """
    Perform multi-scale Error Level Analysis (ELA) via deterministic signal processing.
    
    Forensic Methodology:
    1. Multi-Quality Probing: Recompresses image at Q1=90 and Q2=75.
    2. Vectorized Spatial Tiling: Calculates mean block quantization error in 16x16 pixel blocks.
    3. Multi-Q Quantization Inconsistency: Measures local ratio anomaly R(y,x) = E75/max(E90, 0.2).
       Inpainted / magic-eraser regions synthesize unquantized smooth pixels that trigger high
       ratio variance against the natural background.
    4. Local Spatial Discrepancy: Measures local departure from neighborhood median error.
       Spliced / pasted objects trigger strong local discrepancy and high spatial contrast.
    5. Anomaly Localization: Computes exact bounding box (ymin, xmin, ymax, xmax) of the
       most anomalous block cluster.
    """
    img_rgb = img.convert("RGB")
    arr = np.array(img_rgb, dtype=np.float32)
    h, w, _ = arr.shape

    # Step 1: Recompress at Q=90 and Q=75
    buf90 = io.BytesIO()
    img_rgb.save(buf90, format="JPEG", quality=ELA_JPEG_QUALITY_PRIMARY)
    buf90.seek(0)
    rec90 = np.array(Image.open(buf90).convert("RGB"), dtype=np.float32)

    buf75 = io.BytesIO()
    img_rgb.save(buf75, format="JPEG", quality=ELA_JPEG_QUALITY_SECONDARY)
    buf75.seek(0)
    rec75 = np.array(Image.open(buf75).convert("RGB"), dtype=np.float32)

    diff90 = np.mean(np.abs(arr - rec90), axis=2)
    diff75 = np.mean(np.abs(arr - rec75), axis=2)

    # Step 2: Vectorized Block Tiling (16x16)
    bs = ELA_BLOCK_SIZE
    gh = max(1, h // bs)
    gw = max(1, w // bs)
    h_crop = gh * bs
    w_crop = gw * bs

    e90 = diff90[:h_crop, :w_crop].reshape(gh, bs, gw, bs).mean(axis=(1, 3))
    e75 = diff75[:h_crop, :w_crop].reshape(gh, bs, gw, bs).mean(axis=(1, 3))

    # Step 3: Multi-Q Quantization Inconsistency (Ratio of Q75 to Q90 error)
    ratio = e75 / np.maximum(e90, 0.2)
    med_ratio = float(np.median(ratio))
    ratio_anomaly_map = np.abs(ratio - med_ratio)
    max_ratio_anomaly = float(np.max(ratio_anomaly_map))
    p95_ratio_anomaly = float(np.percentile(ratio_anomaly_map, 95))

    # Step 4: Vectorized Local Spatial Discrepancy (3x3 Neighborhood Median)
    pad90 = np.pad(e90, 1, mode="edge")
    windows = np.lib.stride_tricks.sliding_window_view(pad90, (3, 3))
    med_neigh = np.median(windows, axis=(-2, -1))
    disc90 = np.abs(e90 - med_neigh)

    max_disc = float(np.max(disc90))
    p95_disc = float(np.percentile(disc90, 95))
    med_e90 = float(np.median(e90))
    max_e90 = float(np.max(e90))
    mean_e90 = float(np.mean(e90))
    p95_e90 = float(np.percentile(e90, 95))

    # Step 5: Spatial Contrast
    spatial_contrast = float((max_e90 - med_e90) / max(med_e90, 0.5))

    # Step 6: Anomaly Localization (Hotspot Bounding Box)
    combined_anomaly_map = (disc90 / max(float(np.median(disc90)), 0.5)) + (ratio_anomaly_map / max(med_ratio, 0.5))
    max_idx = np.unravel_index(np.argmax(combined_anomaly_map), (gh, gw))
    hotspot_bbox = (
        int(max_idx[0] * bs),
        int(max_idx[1] * bs),
        int(min(h, (max_idx[0] + 1) * bs)),
        int(min(w, (max_idx[1] + 1) * bs)),
    )

    # Step 7: Calibrated Component Scoring
    if mean_e90 < 0.35 and p95_e90 < 1.5:
        # Near-zero global error indicates pristine single-generation JPEG in equilibrium
        composite_score = 0.0
    else:
        # Inpainted / magic-eraser regions spike ratio anomaly (> 1.2)
        s_ratio = min(1.0, max(0.0, (max_ratio_anomaly - 1.2) / 2.5))
        # Spliced / pasted regions spike local discrepancy (> 2.2) and spatial contrast (> 2.2)
        s_disc = min(1.0, max(0.0, (max_disc - 2.2) / 3.0))
        s_contrast = min(1.0, max(0.0, (spatial_contrast - 2.2) / 2.5))
        composite_score = max(s_ratio, s_disc, 0.5 * s_contrast + 0.5 * max(s_ratio, s_disc))

    ela_anomaly_score = round(float(np.clip(composite_score, 0.0, 1.0)), 4)

    return {
        "ela_anomaly_score": ela_anomaly_score,
        "mean_error": round(mean_e90, 4),
        "median_error": round(med_e90, 4),
        "p95_error": round(p95_e90, 4),
        "max_error": round(max_e90, 4),
        "max_local_discrepancy": round(max_disc, 4),
        "p95_local_discrepancy": round(p95_disc, 4),
        "max_ratio_anomaly": round(max_ratio_anomaly, 4),
        "p95_ratio_anomaly": round(p95_ratio_anomaly, 4),
        "spatial_contrast": round(spatial_contrast, 4),
        "hotspot_bbox": hotspot_bbox,
    }


# ==============================================================================
# MAIN ENTRYPOINT: analyze_photo
# ==============================================================================
def analyze_photo(
    photo_file: Union[str, bytes, BinaryIO, os.PathLike, io.BytesIO],
    reverse_search_backend: Optional[ReverseImageSearchBackend] = None,
    verbose: bool = False,
) -> Dict[str, Any]:
    """
    Analyze a photo for digital manipulation, EXIF integrity, GPS provenance,
    and online duplicates.

    Args:
        photo_file: Filesystem path (str/Path), raw bytes, or a binary file-like stream
                    (such as FastAPI's UploadFile.file).
        reverse_search_backend: Optional pluggable ReverseImageSearchBackend.
                                Defaults to NullReverseImageSearchBackend.
        verbose: Optional boolean. If True, returns detailed diagnostic intermediate values.

    Returns:
        Dict[str, Any] matching the module contract:
        {
            "authenticity_score": float,              # 0.0 - 1.0
            "exif_gps_present": bool,
            "exif_editing_software_detected": bool,
            "reverse_image_match_found": bool,
            "ela_anomaly_score": float,               # 0.0 - 1.0
            "flags": [string]
        }
    """
    flags: List[str] = []

    # 1. Ingest Raw Bytes & Open Image
    try:
        raw_bytes = _read_bytes_from_input(photo_file)
        if not raw_bytes:
            raise ValueError("Input photo file is empty (0 bytes).")
        img = Image.open(io.BytesIO(raw_bytes))
    except Exception as exc:
        logger.error("Failed to decode image input: %s", exc)
        flags.append("image_decode_failed")
        flags.append("no_valid_gps")
        flags.append("reverse_search_skipped")
        flags.append("ela_failed")
        res: Dict[str, Any] = {
            "authenticity_score": 0.0,
            "exif_gps_present": False,
            "exif_editing_software_detected": False,
            "reverse_image_match_found": False,
            "ela_anomaly_score": 0.0,
            "flags": flags,
        }
        if verbose:
            res["diagnostics"] = {
                "decode_error": str(exc),
                "exif_present": False,
                "metadata_stripped": True,
            }
        return res

    # 2. Check 1: EXIF Metadata & Software Detection
    exif_info: Dict[str, Any] = {
        "exif_present": False,
        "tag_count": 0,
        "metadata_stripped": True,
        "editing_software_detected": False,
        "matched_tags": [],
        "camera_make": None,
        "camera_model": None,
        "datetime_original": None,
        "dump": {},
    }
    try:
        exif_info = _inspect_exif(img)
        if exif_info["editing_software_detected"]:
            flags.append("editing_software_detected")
        if exif_info["metadata_stripped"]:
            flags.append("exif_metadata_stripped")
    except Exception as exc:
        logger.warning("EXIF software check encountered an error: %s", exc)

    # 3. Check 2: GPS Tag Validation
    exif_gps_present = False
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    try:
        exif_gps_present, gps_lat, gps_lng = _check_gps_tag(img)
        if not exif_gps_present:
            flags.append("no_valid_gps")
    except Exception as exc:
        logger.warning("EXIF GPS check encountered an error: %s", exc)
        exif_gps_present = False
        flags.append("no_valid_gps")

    # 4. Check 3: Pluggable Reverse Image Search
    reverse_image_match_found = False
    reverse_status = "ok"
    backend_name = "NullReverseImageSearchBackend"
    try:
        backend = reverse_search_backend if reverse_search_backend is not None else NullReverseImageSearchBackend()
        backend_name = backend.__class__.__name__
        reverse_image_match_found = bool(backend.search(raw_bytes))
        if reverse_image_match_found:
            flags.append("reverse_image_match_found")
            reverse_status = "match_found"
        else:
            reverse_status = "no_match"
    except Exception as exc:
        logger.warning("Reverse image search skipped or failed gracefully: %s", exc)
        reverse_image_match_found = False
        reverse_status = f"skipped: {str(exc)}"
        flags.append("reverse_search_skipped")

    # 5. Check 4: Multi-Scale Error Level Analysis (Signal Processing)
    ela_res: Dict[str, Any] = {
        "ela_anomaly_score": 0.0,
        "mean_error": 0.0,
        "median_error": 0.0,
        "p95_error": 0.0,
        "max_error": 0.0,
        "max_local_discrepancy": 0.0,
        "p95_local_discrepancy": 0.0,
        "max_ratio_anomaly": 0.0,
        "p95_ratio_anomaly": 0.0,
        "spatial_contrast": 0.0,
        "hotspot_bbox": (0, 0, 0, 0),
    }
    try:
        ela_res = _compute_multi_scale_ela(img)
        if ela_res["ela_anomaly_score"] >= ELA_HIGH_THRESHOLD:
            flags.append("high_ela_anomaly")
    except Exception as exc:
        logger.warning("ELA computation failed gracefully: %s", exc)
        flags.append("ela_failed")

    # 6. Check 5: Combined Authenticity Score Calculation
    deductions = (
        (WEIGHT_EDITING_SOFTWARE * float(exif_info["editing_software_detected"]))
        + (WEIGHT_REVERSE_MATCH * float(reverse_image_match_found))
        + (WEIGHT_ELA_ANOMALY * float(ela_res["ela_anomaly_score"]))
        + (WEIGHT_METADATA_STRIPPED * float(exif_info["metadata_stripped"]))
    )
    raw_score = 1.0 - deductions
    authenticity_score = max(0.0, min(1.0, raw_score))

    result: Dict[str, Any] = {
        "authenticity_score": round(float(authenticity_score), 4),
        "exif_gps_present": bool(exif_gps_present),
        "exif_editing_software_detected": bool(exif_info["editing_software_detected"]),
        "reverse_image_match_found": bool(reverse_image_match_found),
        "ela_anomaly_score": round(float(ela_res["ela_anomaly_score"]), 4),
        "flags": flags,
    }

    if verbose:
        result["diagnostics"] = {
            "exif_present": exif_info["exif_present"],
            "exif_tag_count": exif_info["tag_count"],
            "exif_metadata_stripped": exif_info["metadata_stripped"],
            "exif_dump": exif_info["dump"],
            "exif_matched_tags": exif_info["matched_tags"],
            "exif_camera_make": exif_info["camera_make"],
            "exif_camera_model": exif_info["camera_model"],
            "exif_datetime_original": exif_info["datetime_original"],
            "gps_latitude": gps_lat,
            "gps_longitude": gps_lng,
            "ela_raw_stats": {
                "mean_error": ela_res["mean_error"],
                "median_error": ela_res["median_error"],
                "p95_error": ela_res["p95_error"],
                "max_error": ela_res["max_error"],
                "max_local_discrepancy": ela_res["max_local_discrepancy"],
                "p95_local_discrepancy": ela_res["p95_local_discrepancy"],
                "max_ratio_anomaly": ela_res["max_ratio_anomaly"],
                "p95_ratio_anomaly": ela_res["p95_ratio_anomaly"],
                "spatial_contrast": ela_res["spatial_contrast"],
                "hotspot_bbox": ela_res["hotspot_bbox"],
            },
            "reverse_search_details": {
                "match_found": reverse_image_match_found,
                "status": reverse_status,
                "backend": backend_name,
            },
        }

    return result
