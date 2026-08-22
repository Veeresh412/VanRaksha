from sqlalchemy.orm import Session
import models
import schemas
import math

# Earth radius in meters
R = 6371e3 

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
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

def get_reporter_trust_from_tier(tier: int) -> str:
    if tier == 3: return "Verified Reporter"
    if tier == 2: return "Geo-tagged Reporter"
    return "Basic Reporter"

def process_report_corroboration(db: Session, new_report: models.Report):
    NEARBY_RADIUS_METERS = 500
    
    if new_report.tier == 3:
        create_or_update_flag(
            db, 
            lat=new_report.lat, 
            lng=new_report.lng, 
            signal_type=schemas.SignalTypeEnum.citizen,
            source=schemas.SourceEnum.citizen,
            corroboration_state=schemas.CorroborationStateEnum.tier_3,
            reports_to_link=[new_report]
        )
        return

    all_reports = db.query(models.Report).filter(models.Report.id != new_report.id).all()
    nearby_reports = [r for r in all_reports if haversine_distance(new_report.lat, new_report.lng, r.lat, r.lng) <= NEARBY_RADIUS_METERS]
            
    all_pings = db.query(models.SatellitePing).all()
    nearby_pings = [p for p in all_pings if haversine_distance(new_report.lat, new_report.lng, p.lat, p.lng) <= NEARBY_RADIUS_METERS]
            
    if new_report.tier == 2:
        if len(nearby_reports) >= 1:
            create_or_update_flag(
                db, new_report.lat, new_report.lng, 
                schemas.SignalTypeEnum.citizen, schemas.SourceEnum.citizen, schemas.CorroborationStateEnum.two_reports,
                reports_to_link=[new_report, nearby_reports[0]]
            )
        elif len(nearby_pings) >= 1:
             create_or_update_flag(
                db, new_report.lat, new_report.lng, 
                nearby_pings[0].signal_type, schemas.SourceEnum.combined, schemas.CorroborationStateEnum.report_satellite,
                reports_to_link=[new_report],
                pings_to_link=[nearby_pings[0]]
            )
            
    elif new_report.tier == 1:
        if len(nearby_reports) >= 2:
            create_or_update_flag(
                db, new_report.lat, new_report.lng, 
                schemas.SignalTypeEnum.citizen, schemas.SourceEnum.citizen, schemas.CorroborationStateEnum.two_reports,
                reports_to_link=[new_report, nearby_reports[0], nearby_reports[1]]
            )
        elif len(nearby_reports) >= 1 and len(nearby_pings) >= 1:
             create_or_update_flag(
                db, new_report.lat, new_report.lng, 
                nearby_pings[0].signal_type, schemas.SourceEnum.combined, schemas.CorroborationStateEnum.report_satellite,
                reports_to_link=[new_report, nearby_reports[0]],
                pings_to_link=[nearby_pings[0]]
            )

def process_satellite_ping_corroboration(db: Session, new_ping: models.SatellitePing):
    NEARBY_RADIUS_METERS = 500
    
    # Check for existing flags to join
    all_flags = db.query(models.Flag).all()
    for f in all_flags:
        if haversine_distance(new_ping.lat, new_ping.lng, f.lat, f.lng) <= NEARBY_RADIUS_METERS:
            # Upgrade existing flag
            f.source = schemas.SourceEnum.combined
            f.corroboration_state = schemas.CorroborationStateEnum.report_satellite
            f.signal_type = new_ping.signal_type
            if f.satellite_confidence is None or new_ping.confidence_score > f.satellite_confidence:
                f.satellite_confidence = new_ping.confidence_score
            new_ping.linked_flag_id = f.id
            db.commit()
            return
            
    # For a hackathon, we assume a satellite ping creates an unverified flag
    create_or_update_flag(
        db, new_ping.lat, new_ping.lng, 
        new_ping.signal_type, schemas.SourceEnum.satellite, schemas.CorroborationStateEnum.single,
        pings_to_link=[new_ping]
    )

def create_or_update_flag(db: Session, lat: float, lng: float, signal_type: schemas.SignalTypeEnum, source: schemas.SourceEnum, corroboration_state: schemas.CorroborationStateEnum, reports_to_link=None, pings_to_link=None):
    NEARBY_RADIUS_METERS = 500
    all_flags = db.query(models.Flag).all()
    
    target_flag = None
    for f in all_flags:
        if haversine_distance(lat, lng, f.lat, f.lng) <= NEARBY_RADIUS_METERS:
            target_flag = f
            break
            
    if target_flag:
        target_flag.corroboration_state = corroboration_state
        target_flag.source = source
        target_flag.signal_type = signal_type
    else:
        target_flag = models.Flag(
            lat=lat,
            lng=lng,
            signal_type=signal_type,
            source=source,
            corroboration_state=corroboration_state
        )
        db.add(target_flag)
        db.commit()
        db.refresh(target_flag)
        
    if reports_to_link:
        for r in reports_to_link:
            r.linked_flag_id = target_flag.id
            
    if pings_to_link:
        for p in pings_to_link:
            p.linked_flag_id = target_flag.id
            if target_flag.satellite_confidence is None or p.confidence_score > target_flag.satellite_confidence:
                target_flag.satellite_confidence = p.confidence_score
                
    db.commit()
