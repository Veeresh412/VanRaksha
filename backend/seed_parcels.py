import json
import os
from sqlalchemy.orm import Session
from shapely.geometry import shape
from database import SessionLocal
from models import FRAParcel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GEOJSON_PATH = os.path.abspath(os.path.join(BASE_DIR, "../../VanRaksha_Hussain/geospatial/data/fra_parcels_demo.geojson"))

def seed():
    db: Session = SessionLocal()
    
    if not os.path.exists(GEOJSON_PATH):
        print(f"Error: GeoJSON file not found at {GEOJSON_PATH}")
        return

    with open(GEOJSON_PATH, "r") as f:
        data = json.load(f)
    
    features = data.get("features", [])
    
    for feature in features:
        props = feature.get("properties", {})
        geom = feature.get("geometry")
        
        # Convert GeoJSON geometry to Shapely shape, then to WKT format that GeoAlchemy2 accepts
        s_geom = shape(geom)
        wkt_geom = f"SRID=4326;{s_geom.wkt}"
        
        parcel = FRAParcel(
            id=props.get("fra_parcel_id"),
            title_holder_type=props.get("title_holder_type"),
            is_synthetic=props.get("is_synthetic", True),
            boundary=wkt_geom
        )
        db.merge(parcel)
    
    db.commit()
    print(f"Successfully seeded {len(features)} FRA parcels with Spatial Geometry into the database!")
    db.close()

if __name__ == "__main__":
    seed()
