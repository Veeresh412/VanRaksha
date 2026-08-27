from sqlalchemy.orm import Session
import models
import schemas
import math
from datetime import datetime, timedelta, timezone
from sqlalchemy import func

# Earth radius in meters
R = 6371e3 
FP_SUPPRESSION_DEFAULT_RADIUS_METERS = 250.0
FP_SUPPRESSION_TTL_DAYS = 90
FP_SUPPRESSION_OVERRIDE_CONFIDENCE = 0.92
FP_SUPPRESSION_CORROBORATION_RADIUS_METERS = 500

def _utc_now():
    return datetime.now(timezone.utc)

def _normalize_to_utc(value: datetime):
    if value is None:
        return None

    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)

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

def assign_fra_parcel(db: Session, lat: float, lng: float):
    # PostGIS Spatial Query: Does this GPS coordinate fall inside any forest map polygon?
    point = func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)
    parcel = db.query(models.FRAParcel).filter(func.ST_Contains(models.FRAParcel.boundary, point)).first()
    if parcel:
        return parcel.id
    return None

def create_false_positive_suppression_for_flag(
    db: Session,
    flag: models.Flag,
    suppression_reason: str = "Rejected as false positive by reviewer",
    radius_m: float = FP_SUPPRESSION_DEFAULT_RADIUS_METERS,
    ttl_days: int = FP_SUPPRESSION_TTL_DAYS,
):
    if flag is None:
        return None

    if flag.source not in [schemas.SourceEnum.satellite, schemas.SourceEnum.combined]:
        return None

    now = _utc_now()

    existing_suppressions = (
        db.query(models.FalsePositiveSuppression)
        .filter(models.FalsePositiveSuppression.active == True)
        .all()
    )

    for suppression in existing_suppressions:
        suppression_expires_at = _normalize_to_utc(suppression.expires_at)
        if suppression_expires_at and suppression_expires_at <= now:
            continue

        if suppression.signal_type and suppression.signal_type != flag.signal_type:
            continue

        if suppression.fra_parcel_id and flag.fra_parcel_id and suppression.fra_parcel_id != flag.fra_parcel_id:
            continue

        distance = haversine_distance(flag.lat, flag.lng, suppression.lat, suppression.lng)
        if distance <= max(radius_m, suppression.radius_m or 0):
            return suppression

    suppression = models.FalsePositiveSuppression(
        flag_id=flag.id,
        lat=flag.lat,
        lng=flag.lng,
        radius_m=radius_m,
        signal_type=flag.signal_type,
        fra_parcel_id=flag.fra_parcel_id,
        active=True,
        expires_at=now + timedelta(days=ttl_days),
        suppression_reason=suppression_reason,
    )
    db.add(suppression)
    db.commit()
    db.refresh(suppression)
    return suppression

def _find_matching_suppression_zones(db: Session, new_ping: models.SatellitePing):
    now = _utc_now()

    all_active_suppressions = (
        db.query(models.FalsePositiveSuppression)
        .filter(models.FalsePositiveSuppression.active == True)
        .all()
    )

    matching_suppressions = []
    for suppression in all_active_suppressions:
        suppression_expires_at = _normalize_to_utc(suppression.expires_at)
        if suppression_expires_at and suppression_expires_at <= now:
            continue

        if suppression.signal_type and suppression.signal_type != new_ping.signal_type:
            continue

        if suppression.fra_parcel_id and new_ping.fra_parcel_id and suppression.fra_parcel_id != new_ping.fra_parcel_id:
            continue

        distance = haversine_distance(new_ping.lat, new_ping.lng, suppression.lat, suppression.lng)
        if distance <= (suppression.radius_m or FP_SUPPRESSION_DEFAULT_RADIUS_METERS):
            matching_suppressions.append((suppression, distance))

    return matching_suppressions

def _has_suppression_override_signal(db: Session, new_ping: models.SatellitePing):
    if new_ping.confidence_score >= FP_SUPPRESSION_OVERRIDE_CONFIDENCE:
        return True, "high_confidence"

    all_reports = db.query(models.Report).all()
    nearby_reports = [
        report
        for report in all_reports
        if haversine_distance(new_ping.lat, new_ping.lng, report.lat, report.lng)
        <= FP_SUPPRESSION_CORROBORATION_RADIUS_METERS
    ]

    if len(nearby_reports) >= 1:
        return True, "citizen_corroboration"

    all_unsuppressed_pings = (
        db.query(models.SatellitePing)
        .filter(models.SatellitePing.suppressed == False)
        .filter(models.SatellitePing.id != new_ping.id)
        .all()
    )
    nearby_unsuppressed_pings = [
        ping
        for ping in all_unsuppressed_pings
        if haversine_distance(new_ping.lat, new_ping.lng, ping.lat, ping.lng)
        <= FP_SUPPRESSION_CORROBORATION_RADIUS_METERS
    ]

    if len(nearby_unsuppressed_pings) >= 1:
        return True, "multiple_satellite_signals"

    return False, None

def apply_false_positive_suppression_if_needed(db: Session, new_ping: models.SatellitePing):
    matching_suppressions = _find_matching_suppression_zones(db, new_ping)
    if not matching_suppressions:
        return False

    has_override, override_reason = _has_suppression_override_signal(db, new_ping)
    if has_override:
        new_ping.suppression_reason = f"Suppression override ({override_reason})"
        db.commit()
        return False

    nearest_suppression, _ = sorted(matching_suppressions, key=lambda item: item[1])[0]

    new_ping.suppressed = True
    new_ping.suppression_id = nearest_suppression.id
    new_ping.suppression_reason = (
        f"Suppressed by FP zone {nearest_suppression.id} until {nearest_suppression.expires_at.isoformat()}"
    )
    db.commit()
    return True

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
                schemas.SignalTypeEnum.citizen, schemas.SourceEnum.citizen, schemas.CorroborationStateEnum.multiple_reports,
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
                schemas.SignalTypeEnum.citizen, schemas.SourceEnum.citizen, schemas.CorroborationStateEnum.multiple_reports,
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

    if apply_false_positive_suppression_if_needed(db, new_ping):
        return
    
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
        fra_id = assign_fra_parcel(db, lat, lng)
        
        target_flag = models.Flag(
            lat=lat,
            lng=lng,
            signal_type=signal_type,
            source=source,
            corroboration_state=corroboration_state,
            fra_parcel_id=fra_id
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
