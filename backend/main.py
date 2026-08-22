from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
import database
import engine

# Create the database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="VanRaksha API", version="1.0.0")

# --- REPORTS ---
@app.post("/reports", response_model=schemas.ReportResponse) # for new report coming from tanisha's frontend
def create_report(report: schemas.ReportCreate, db: Session = Depends(database.get_db)):
    # Create the report record
    db_report = models.Report(
        photo_url=report.photo_file_url,
        lat=report.lat,
        lng=report.lng,
        description=report.description,
        reporter_type=report.reporter_type,
        tier=report.tier,
        authenticity_score=report.authenticity_score
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    # Trigger corroboration engine
    engine.process_report_corroboration(db, db_report)
    
    return db_report

# --- FLAGS ---
@app.get("/flags", response_model=List[schemas.FlagResponse])   # for flags list request that omkar's frontend wants
def get_flags(jurisdiction_id: int = None, db: Session = Depends(database.get_db)):
    # Note: In a real app with Auth, jurisdiction_id would come from the JWT token.
    query = db.query(models.Flag)
    if jurisdiction_id:
        query = query.filter(models.Flag.jurisdiction_id == jurisdiction_id)
    return query.all()

@app.get("/flags/{flag_id}", response_model=schemas.FlagResponse)  # for specific flags
def get_flag(flag_id: int, db: Session = Depends(database.get_db)):
    flag = db.query(models.Flag).filter(models.Flag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    return flag

@app.patch("/flags/{flag_id}", response_model=schemas.FlagResponse) # for updates on existing flags
def update_flag(flag_id: int, flag_update: schemas.FlagUpdate, db: Session = Depends(database.get_db)):
    flag = db.query(models.Flag).filter(models.Flag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
        
    if flag_update.status:
        flag.status = flag_update.status
        
    if flag_update.escalated_to_district:
        # Example logic: move to district view
        flag.status = "under_review"
        
    db.commit()
    db.refresh(flag)
    return flag

# --- AUTH (MOCK) ---
@app.post("/auth/login", response_model=schemas.LoginResponse)
def login(request: schemas.LoginRequest):
    # Mock login logic
    # In a real app, verify OTP and fetch user role from DB.
    if request.phone_number == "1234567890":
        return {"token": "mock-citizen-token", "role": "citizen"}
    elif request.phone_number == "9999999999":
        return {"token": "mock-admin-token", "role": "admin", "jurisdiction_id": 1}
    else:
        return {"token": "mock-gram-sabha-token", "role": "gram_sabha", "jurisdiction_id": 1}

# --- DEBUG / TESTING ---
@app.delete("/test/clear-data")
def clear_test_data(db: Session = Depends(database.get_db)):
    """
    Utility endpoint to clear all dummy reports and flags during hackathon testing.
    DO NOT use in production!
    """
    db.query(models.Flag).delete()
    db.query(models.Report).delete()
    db.commit()
    return {"message": "All flags and reports have been successfully deleted from the database."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
