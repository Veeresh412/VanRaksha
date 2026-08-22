from sqlalchemy.orm import Session
import models
import schemas
import math

# Earth radius in meters
R = 6371e3 

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in meters between two points 
    on the earth (specified in decimal degrees)
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return distance

def process_report_corroboration(db: Session, new_report: models.Report):
    """
    Core engine logic: evaluates if a new report should escalate a flag.
    - Tier 1: 2 independent reports, or 1 report + satellite flag
    - Tier 2: 1 additional report, or nearby satellite flag
    - Tier 3: Escalate immediately
    
    For now, we define "nearby" as within 500 meters.
    """
    NEARBY_RADIUS_METERS = 500
    
    # Base condition: if Tier 3, escalate immediately (create a flag)
    if new_report.tier == 3:
        create_or_update_flag(db, new_report.lat, new_report.lng, "verified_fast_track", new_report.photo_url)
        return

    # Check for nearby reports
    all_reports = db.query(models.Report).filter(models.Report.id != new_report.id).all()
    nearby_reports = []
    
    for r in all_reports:
        dist = haversine_distance(new_report.lat, new_report.lng, r.lat, r.lng)
        if dist <= NEARBY_RADIUS_METERS:
            nearby_reports.append(r)
            
    # Check for nearby satellite flags
    all_flags = db.query(models.Flag).all()
    nearby_flags = []
    for f in all_flags:
        dist = haversine_distance(new_report.lat, new_report.lng, f.lat, f.lng)
        if dist <= NEARBY_RADIUS_METERS:
            nearby_flags.append(f)
            
    # Evaluation logic
    if new_report.tier == 2:
        # Needs 1 additional report or a satellite flag
        if len(nearby_reports) >= 1 or len(nearby_flags) >= 1:
            create_or_update_flag(db, new_report.lat, new_report.lng, "corroborated", new_report.photo_url)
            
    elif new_report.tier == 1:
        # Needs 2 independent Tier 1+ reports or 1 report + satellite flag
        if len(nearby_reports) >= 2 or (len(nearby_reports) >= 1 and len(nearby_flags) >= 1):
            create_or_update_flag(db, new_report.lat, new_report.lng, "corroborated", new_report.photo_url)

def create_or_update_flag(db: Session, lat: float, lng: float, corroboration_state: str, citizen_photo: str):
    """
    If a nearby flag exists, update it. Otherwise, create a new one.
    """
    NEARBY_RADIUS_METERS = 500
    all_flags = db.query(models.Flag).all()
    
    for f in all_flags:
        dist = haversine_distance(lat, lng, f.lat, f.lng)
        if dist <= NEARBY_RADIUS_METERS:
            # Update existing flag
            f.corroboration_state = corroboration_state
            if citizen_photo:
                f.citizen_photo_url = citizen_photo
            db.commit()
            return
            
    # Create new flag
    new_flag = models.Flag(
        lat=lat,
        lng=lng,
        corroboration_state=corroboration_state,
        citizen_photo_url=citizen_photo
    )
    db.add(new_flag)
    db.commit()
