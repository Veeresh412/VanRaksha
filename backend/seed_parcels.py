import json
import os
from database import SessionLocal, engine
import models

def seed_parcels():
    # Make sure tables exist before seeding
    models.Base.metadata.create_all(bind=engine)
    
    file_path = "fra_parcels_demo.geojson"
    if not os.path.exists(file_path):
        print(f"Error: Could not find '{file_path}'. Please make sure Person 1 sends it to you and you place it in the backend folder!")
        return

    with open(file_path, 'r') as f:
        data = json.load(f)

    db = SessionLocal()
    
    count = 0
    for feature in data.get("features", []):
        props = feature.get("properties", {})
        geometry = feature.get("geometry", {})
        
        # Extract the string ID from either the feature root or properties
        parcel_id = props.get("id") or feature.get("id")
        title_holder_type = props.get("title_holder_type", "Gram Sabha")
        is_synthetic = props.get("is_synthetic", True)
        
        if not parcel_id:
            print("Warning: Found a feature with no ID, skipping...")
            continue
            
        # Check if it already exists so we don't duplicate
        existing = db.query(models.FRAParcel).filter(models.FRAParcel.id == parcel_id).first()
        if not existing:
            new_parcel = models.FRAParcel(
                id=parcel_id,
                title_holder_type=title_holder_type,
                is_synthetic=is_synthetic,
                boundary=geometry
            )
            db.add(new_parcel)
            count += 1
            
    db.commit()
    db.close()
    print(f"Success! Inserted {count} new FRA parcels into the database.")

if __name__ == "__main__":
    seed_parcels()
