from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class StatusEnum(str, Enum):
    unverified = "Unverified"
    under_review = "Under Review"
    verified = "Verified"
    rejected = "Rejected"
    resolved = "Resolved"

class SourceEnum(str, Enum):
    citizen = "Citizen Report"
    satellite = "Satellite"
    combined = "Combined"

class SignalTypeEnum(str, Enum):
    structure = "Potential Structure Change"
    land_use = "Unverified Land-use Change"
    vegetation = "Potential Vegetation Loss"
    citizen = "Citizen Observation"

class CorroborationStateEnum(str, Enum):
    single = "Single-source"
    multiple_reports = "Corroborated (Multiple reports)"
    report_satellite = "Corroborated (1 report + satellite)"
    tier_3 = "Tier 3 Fast-track"

# -------- REPORTS --------
class ReportCreate(BaseModel):
    photo_file_url: Optional[str] = None
    lat: float
    lng: float
    description: Optional[str] = None
    reporter_type: str = "citizen" # "citizen" or "verified"
    tier: int = 1
    authenticity_score: float = 0.0

class ReportResponse(BaseModel):
    id: int
    lat: float
    lng: float
    description: Optional[str] = None
    tier: int
    reporter_trust: str
    authenticity_score: float
    geotag_status: str
    status: StatusEnum
    linked_flag_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# -------- SATELLITE PINGS --------
class SatellitePingCreate(BaseModel):
    lat: float
    lng: float
    confidence_score: float
    signal_type: SignalTypeEnum
    fra_parcel_id: Optional[str] = None

class SatellitePingResponse(SatellitePingCreate):
    id: int
    linked_flag_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# -------- FLAGS (ALERTS) --------
class FlagBase(BaseModel):
    lat: float
    lng: float
    signal_type: SignalTypeEnum
    source: SourceEnum
    status: StatusEnum
    corroboration_state: CorroborationStateEnum
    satellite_confidence: Optional[float] = None
    district: Optional[str] = None
    state: Optional[str] = None
    officer_notes: Optional[str] = None
    fra_parcel_id: Optional[str] = None

class FlagResponse(FlagBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class FlagUpdate(BaseModel):
    status: Optional[StatusEnum] = None
    officer_notes: Optional[str] = None


