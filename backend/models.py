from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Enum as SQLEnum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import schemas

try:
    from geoalchemy2 import Geometry
except ImportError:
    Geometry = String

class FRAParcel(Base):
    __tablename__ = "fra_parcels"

    id = Column(String, primary_key=True)
    title_holder_type = Column(String)
    is_synthetic = Column(Boolean, default=True)
    boundary = Column(Geometry('POLYGON', srid=4326))

    flags = relationship("Flag", back_populates="fra_parcel")

class Flag(Base):
    __tablename__ = "flags"

    id = Column(Integer, primary_key=True, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    
    signal_type = Column(SQLEnum(schemas.SignalTypeEnum), nullable=False)
    source = Column(SQLEnum(schemas.SourceEnum), nullable=False)
    status = Column(SQLEnum(schemas.StatusEnum), default=schemas.StatusEnum.unverified)
    corroboration_state = Column(SQLEnum(schemas.CorroborationStateEnum), nullable=False)
    
    satellite_confidence = Column(Float, nullable=True)
    district = Column(String, nullable=True)
    state = Column(String, nullable=True)
    officer_notes = Column(String, nullable=True)
    
    fra_parcel_id = Column(String, ForeignKey("fra_parcels.id"), nullable=True)
    fra_parcel = relationship("FRAParcel", back_populates="flags")
    
    reports = relationship("Report", back_populates="linked_flag")
    satellite_pings = relationship("SatellitePing", back_populates="linked_flag")
    suppressions = relationship("FalsePositiveSuppression", back_populates="flag")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    photo_url = Column(String, nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    
    tier = Column(Integer, default=1)
    reporter_trust = Column(String, default="Basic Reporter") 
    authenticity_score = Column(Float, default=0.0)
    geotag_status = Column(String, default="Unverified")
    
    status = Column(SQLEnum(schemas.StatusEnum), default=schemas.StatusEnum.unverified)
    
    linked_flag_id = Column(Integer, ForeignKey("flags.id"), nullable=True)
    linked_flag = relationship("Flag", back_populates="reports")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SatellitePing(Base):
    __tablename__ = "satellite_pings"

    id = Column(Integer, primary_key=True, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)
    
    signal_type = Column(SQLEnum(schemas.SignalTypeEnum), nullable=False)
    
    fra_parcel_id = Column(String, ForeignKey("fra_parcels.id"), nullable=True)
    
    linked_flag_id = Column(Integer, ForeignKey("flags.id"), nullable=True)
    linked_flag = relationship("Flag", back_populates="satellite_pings")

    suppressed = Column(Boolean, default=False, nullable=False)
    suppression_reason = Column(String, nullable=True)
    suppression_id = Column(Integer, ForeignKey("false_positive_suppressions.id"), nullable=True)
    suppression = relationship("FalsePositiveSuppression", back_populates="satellite_pings")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FalsePositiveSuppression(Base):
    __tablename__ = "false_positive_suppressions"

    id = Column(Integer, primary_key=True, index=True)
    flag_id = Column(Integer, ForeignKey("flags.id"), nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    radius_m = Column(Float, default=250.0, nullable=False)

    signal_type = Column(SQLEnum(schemas.SignalTypeEnum), nullable=True)
    fra_parcel_id = Column(String, ForeignKey("fra_parcels.id"), nullable=True)
    model_version = Column(String, nullable=True)

    active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    suppression_reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    flag = relationship("Flag", back_populates="suppressions")
    satellite_pings = relationship("SatellitePing", back_populates="suppression")
