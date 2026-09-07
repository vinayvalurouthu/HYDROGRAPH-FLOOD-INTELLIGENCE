import json
import random
from datetime import datetime, timezone
import psycopg2
from shapely.geometry import shape, mapping

DB_CONN = "dbname=hydrograph user=postgres password=postgres host=localhost port=5432"

def load_geojson(filepath="pilot_data.geojson"):
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

def populate_postgis_db(geojson_data, db_conn_str=DB_CONN):
    print(f"Connecting to PostGIS database: {db_conn_str}")
    try:
        conn = psycopg2.connect(db_conn_str)
        cursor = conn.cursor()

        # 1. Execute schema creation
        with open("schema_postgis.sql", "r", encoding="utf-8") as f:
            cursor.execute(f.read())
        conn.commit()
        print("[PostGIS] Schema initialized successfully.")

        features = geojson_data.get("features", [])
        roads_count = 0
        shelters_count = 0

        for feat in features:
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            feat_id = str(feat.get("id", random.randint(10000, 99999)))
            geom_json = json.dumps(geom)

            # Insert Roads
            if geom.get("type") == "LineString":
                road_name = props.get("name", f"Road {feat_id}")
                road_class = props.get("highway", "secondary")
                criticality = random.choice(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
                
                cursor.execute("""
                    INSERT INTO roads (id, name, road_class, criticality, geom, status)
                    VALUES (%s, %s, %s, %s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326), 'OPEN')
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        road_class = EXCLUDED.road_class,
                        criticality = EXCLUDED.criticality,
                        geom = EXCLUDED.geom;
                """, (feat_id, road_name, road_class, criticality, geom_json))
                roads_count += 1

                # Generate sample forecast for this road segment
                depth_cm = round(random.uniform(0.0, 120.0), 1)
                velocity_ms = round(random.uniform(0.1, 2.5), 2)
                risk_level = "LOW" if depth_cm < 15 else ("MODERATE" if depth_cm < 45 else ("HIGH" if depth_cm < 80 else "SEVERE"))
                confidence = round(random.uniform(0.85, 0.99), 2)
                valid_time = datetime.now(timezone.utc)

                cursor.execute("""
                    INSERT INTO flood_fcst (road_id, valid_time, depth_cm, velocity_ms, time_to_flood_min, risk_level, confidence)
                    VALUES (%s, %s, %s, %s, %s, %s, %s);
                """, (feat_id, valid_time, depth_cm, velocity_ms, random.randint(10, 120), risk_level, confidence))

            # Insert Shelters
            elif geom.get("type") == "Point" and props.get("type") == "amenity":
                shelter_name = props.get("name", f"Emergency Shelter {feat_id}")
                capacity = random.randint(100, 1000)
                occupancy = random.randint(10, capacity // 2)
                has_medical = "hospital" in props.get("amenity", "")

                cursor.execute("""
                    INSERT INTO shelters (id, name, capacity, occupancy, status, has_medical, has_power, has_food, geom)
                    VALUES (%s, %s, %s, %s, 'OPEN', %s, TRUE, TRUE, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326))
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        capacity = EXCLUDED.capacity,
                        occupancy = EXCLUDED.occupancy,
                        geom = EXCLUDED.geom;
                """, (feat_id, shelter_name, capacity, occupancy, has_medical, geom_json))
                shelters_count += 1

                # Place sample SOS report near shelter location
                sos_id = f"SOS-{random.randint(1000, 9999)}"
                cursor.execute("""
                    INSERT INTO sos_reports (id, victim_count, children_count, elderly_count, has_medical, reported_water_depth_cm, priority_score, status, geom)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'RECEIVED', ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326))
                    ON CONFLICT (id) DO NOTHING;
                """, (sos_id, random.randint(1, 6), random.randint(0, 2), random.randint(0, 2), has_medical, depth_cm, round(random.uniform(50.0, 95.0), 1), geom_json))

        conn.commit()
        cursor.close()
        conn.close()
        print(f"[PostGIS] Success! Ingested {roads_count} roads and {shelters_count} shelters into PostgreSQL.")

    except Exception as err:
        print(f"[PostGIS] Database connection / ingestion skipped: {err}")

if __name__ == "__main__":
    geojson_data = load_geojson()
    populate_postgis_db(geojson_data)
