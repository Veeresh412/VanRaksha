from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Jurisdiction(Base):
    __tablename__ = "jurisdictions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    
    # We will use simple bounding box coordinates since we dropped PostGIS for now
    min_lat = Column(Float, nullable=True)
    max_lat = Column(Float, nullable=True)
    min_lng = Column(Float, nullable=True)
    max_lng = Column(Float, nullable=True)

    flags = relationship("Flag", back_populates="jurisdiction")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    photo_url = Column(String, nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    
    # Tier: 1 (Basic), 2 (Geo-tagged), 3 (Verified Reporter)
    tier = Column(Integer, default=1)
    authenticity_score = Column(Float, default=0.0)
    
    # Simple role string since auth is mocked for now ("citizen", "verified")
    reporter_type = Column(String, default="citizen") 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Flag(Base):
    __tablename__ = "flags"

    id = Column(Integer, primary_key=True, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    
    # Status: "new", "under_review", "resolved"
    status = Column(String, default="new")
    
    # Corroboration State: "single_source", "corroborated", "verified_fast_track"
    corroboration_state = Column(String, default="single_source")
    
    satellite_confidence = Column(Float, nullable=True)
    before_image_url = Column(String, nullable=True)
    after_image_url = Column(String, nullable=True)
    citizen_photo_url = Column(String, nullable=True)
    
    jurisdiction_id = Column(Integer, ForeignKey("jurisdictions.id"), nullable=True)
    jurisdiction = relationship("Jurisdiction", back_populates="flags")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
