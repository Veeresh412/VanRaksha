from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

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
    tier: int
    authenticity_score: float

    class Config:
        from_attributes = True

# -------- FLAGS --------
class FlagBase(BaseModel):
    lat: float
    lng: float
    status: str
    corroboration_state: str
    satellite_confidence: Optional[float] = None
    before_image_url: Optional[str] = None
    after_image_url: Optional[str] = None
    citizen_photo_url: Optional[str] = None

class FlagResponse(FlagBase):
    id: int
    
    class Config:
        from_attributes = True

class FlagUpdate(BaseModel):
    status: Optional[str] = None
    escalated_to_district: Optional[bool] = None # We can use this to update status internally

# -------- AUTH --------
class LoginRequest(BaseModel):
    phone_number: str
    otp: str

class LoginResponse(BaseModel):
    token: str
    role: str
    jurisdiction_id: Optional[int] = None
