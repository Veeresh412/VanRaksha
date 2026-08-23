from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os

import models
import schemas
import database
import engine



from pydantic import BaseModel

class AuthOTPRequest(BaseModel):
    phone_number: str

class AuthOTPVerify(BaseModel):
    phone_number: str
    otp: str

app = FastAPI(title="VanRaksha API", version="2.0.0")

# --- CORS (For local frontend testing) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTH (MOCK FOR DEMO) ---
@app.post("/auth/request-otp")
def request_otp(data: AuthOTPRequest):
    return {"success": True, "message": "OTP sent successfully.", "dev_otp": "123456"}

@app.post("/auth/verify-otp")
def verify_otp(data: AuthOTPVerify):
    if data.otp != "123456":
        return {"success": False, "error": "Invalid OTP"}
    return {
        "success": True,
        "access_token": "demo-live-token",
        "token_type": "bearer",
        "user": {
            "user_id": "admin_001",
            "name": "Live Admin",
            "role": "admin",
            "phone_number": data.phone_number
        }
    }

# --- REPORTS ---
@app.post("/reports", response_model=schemas.ReportResponse)
def create_report(report: schemas.ReportCreate, db: Session = Depends(database.get_db)):
    db_report = models.Report(
        photo_url=report.photo_file_url,
        lat=report.lat,
        lng=report.lng,
        description=report.description,
        tier=report.tier,
        reporter_trust=engine.get_reporter_trust_from_tier(report.tier),
        authenticity_score=report.authenticity_score
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    # Run the engine
    engine.process_report_corroboration(db, db_report)
    
    db.refresh(db_report)
    # Inherit status from the flag if it was escalated
    if db_report.linked_flag:
        db_report.status = db_report.linked_flag.status
        db.commit()
        db.refresh(db_report)
        
    return db_report

@app.get("/reports", response_model=List[schemas.ReportResponse])
def get_reports(db: Session = Depends(database.get_db)):
    reports = db.query(models.Report).all()
    # Ensure statuses are synced with linked flags
    for r in reports:
        if r.linked_flag and r.status != r.linked_flag.status:
            r.status = r.linked_flag.status
    db.commit()
    return reports

@app.get("/reports/{report_id}", response_model=schemas.ReportResponse)
def get_report(report_id: int, db: Session = Depends(database.get_db)):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if report.linked_flag and report.status != report.linked_flag.status:
        report.status = report.linked_flag.status
        db.commit()
    return report

# --- SATELLITE PINGS ---
@app.post("/satellite-pings", response_model=schemas.SatellitePingResponse)
def create_satellite_ping(ping: schemas.SatellitePingCreate, db: Session = Depends(database.get_db)):
    db_ping = models.SatellitePing(
        lat=ping.lat,
        lng=ping.lng,
        confidence_score=ping.confidence_score,
        signal_type=ping.signal_type,
        fra_parcel_id=ping.fra_parcel_id
    )
    db.add(db_ping)
    db.commit()
    db.refresh(db_ping)
    
    engine.process_satellite_ping_corroboration(db, db_ping)
    db.refresh(db_ping)
    return db_ping

# --- FLAGS ---
@app.get("/flags", response_model=List[schemas.FlagResponse])
def get_flags(fra_parcel_id: str = None, db: Session = Depends(database.get_db)):
    query = db.query(models.Flag)
    if fra_parcel_id:
        query = query.filter(models.Flag.fra_parcel_id == fra_parcel_id)
    return query.all()

@app.get("/flags/{flag_id}", response_model=schemas.FlagResponse)
def get_flag(flag_id: int, db: Session = Depends(database.get_db)):
    flag = db.query(models.Flag).filter(models.Flag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    return flag

@app.patch("/flags/{flag_id}", response_model=schemas.FlagResponse)
def update_flag(flag_id: int, flag_update: schemas.FlagUpdate, db: Session = Depends(database.get_db)):
    flag = db.query(models.Flag).filter(models.Flag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
        
    if flag_update.status:
        flag.status = flag_update.status
        # Explicitly update all linked reports in the database
        for report in flag.reports:
            report.status = flag_update.status
            
    if flag_update.officer_notes is not None:
        flag.officer_notes = flag_update.officer_notes
        
    db.commit()
    db.refresh(flag)
    return flag


# --- DEBUG / TESTING ---
@app.delete("/test/clear-data")
def clear_test_data(db: Session = Depends(database.get_db)):
    db.query(models.Report).delete()
    db.query(models.SatellitePing).delete()
    db.query(models.Flag).delete()
    db.commit()
    return {"message": "All data cleared successfully."}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
