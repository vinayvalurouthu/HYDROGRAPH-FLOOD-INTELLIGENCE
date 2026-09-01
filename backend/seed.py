"""
Seed the database with realistic flood data for Patna, Bihar.

Patna (25.6093°N, 85.1376°E) sits on the southern bank of the Ganges
and is one of India's most flood-affected cities. The road network,
drainage points, and flood zones below are modeled on real Patna geography.

Run: python seed.py
"""

import asyncio
import json
from datetime import datetime

from database import engine, async_session, Base
from models import Road, FloodZone, DrainageNode, ForecastTimeline


# ─── Real Patna roads with approximate coordinates ──────────────────────────

ROADS = [
    {
        "id": "R-102",
        "name": "Bailey Road",
        "lat": 25.6120,
        "lng": 85.1180,
        "risk_level": "SEVERE",
        "depth_cm": 34,
        "peak_depth_cm": 52,
        "velocity_ms": 0.62,
        "duration_min": 48,
        "time_to_flood_min": 18,
        "confidence_pct": 87,
        "rainfall_mm_hr": 91,
        "drain_util_pct": 98,
        "cause": ["Heavy rainfall", "Drainage stress"],
        "is_closed": False,
        "geojson": json.dumps({
            "type": "LineString",
            "coordinates": [
                [85.1050, 25.6130], [85.1120, 25.6125], [85.1200, 25.6118],
                [85.1280, 25.6112], [85.1350, 25.6108]
            ]
        }),
    },
    {
        "id": "JN-14",
        "name": "Kankarbagh Main Road",
        "lat": 25.5980,
        "lng": 85.1250,
        "risk_level": "HIGH",
        "depth_cm": 27,
        "peak_depth_cm": 38,
        "velocity_ms": 0.42,
        "duration_min": 36,
        "time_to_flood_min": 24,
        "confidence_pct": 82,
        "rainfall_mm_hr": 76,
        "drain_util_pct": 88,
        "cause": ["Surface runoff", "Blocked inlet"],
        "is_closed": False,
        "geojson": json.dumps({
            "type": "LineString",
            "coordinates": [
                [85.1180, 25.5960], [85.1220, 25.5970], [85.1280, 25.5985],
                [85.1340, 25.5995], [85.1400, 25.6005]
            ]
        }),
    },
    {
        "id": "MR-01",
        "name": "Ashok Rajpath",
        "lat": 25.6180,
        "lng": 85.1400,
        "risk_level": "HIGH",
        "depth_cm": 25,
        "peak_depth_cm": 34,
        "velocity_ms": 0.38,
        "duration_min": 32,
        "time_to_flood_min": 31,
        "confidence_pct": 79,
        "rainfall_mm_hr": 76,
        "drain_util_pct": 82,
        "cause": ["Heavy rainfall", "Low elevation near Ganges"],
        "is_closed": False,
        "geojson": json.dumps({
            "type": "LineString",
            "coordinates": [
                [85.1250, 25.6185], [85.1350, 25.6180], [85.1450, 25.6175],
                [85.1550, 25.6170], [85.1650, 25.6168]
            ]
        }),
    },
    {
        "id": "NH-48",
        "name": "NH-30 (Grand Trunk Road)",
        "lat": 25.6050,
        "lng": 85.1550,
        "risk_level": "MODERATE",
        "depth_cm": 12,
        "peak_depth_cm": 22,
        "velocity_ms": 0.21,
        "duration_min": 24,
        "time_to_flood_min": 52,
        "confidence_pct": 74,
        "rainfall_mm_hr": 68,
        "drain_util_pct": 64,
        "cause": ["Rainfall accumulation"],
        "is_closed": False,
        "geojson": json.dumps({
            "type": "LineString",
            "coordinates": [
                [85.1400, 25.6060], [85.1480, 25.6055], [85.1560, 25.6048],
                [85.1640, 25.6042], [85.1720, 25.6038]
            ]
        }),
    },
    {
        "id": "CR-07",
        "name": "Rajendra Nagar Canal Road",
        "lat": 25.5920,
        "lng": 85.1100,
        "risk_level": "SEVERE",
        "depth_cm": 41,
        "peak_depth_cm": 58,
        "velocity_ms": 0.71,
        "duration_min": 60,
        "time_to_flood_min": 8,
        "confidence_pct": 91,
        "rainfall_mm_hr": 98,
        "drain_util_pct": 100,
        "cause": ["Ganges overflow", "Drainage failure"],
        "is_closed": True,
        "geojson": json.dumps({
            "type": "LineString",
            "coordinates": [
                [85.1000, 25.5900], [85.1050, 25.5915], [85.1100, 25.5925],
                [85.1150, 25.5935], [85.1200, 25.5945]
            ]
        }),
    },
    {
        "id": "RD-23",
        "name": "Boring Road",
        "lat": 25.6080,
        "lng": 85.1300,
        "risk_level": "LOW",
        "depth_cm": 4,
        "peak_depth_cm": 11,
        "velocity_ms": 0.09,
        "duration_min": 16,
        "time_to_flood_min": 94,
        "confidence_pct": 68,
        "rainfall_mm_hr": 58,
        "drain_util_pct": 42,
        "cause": ["Light rainfall"],
        "is_closed": False,
        "geojson": json.dumps({
            "type": "LineString",
            "coordinates": [
                [85.1230, 25.6090], [85.1280, 25.6085], [85.1330, 25.6080],
                [85.1380, 25.6075], [85.1430, 25.6070]
            ]
        }),
    },
]

# ─── Drainage nodes near Patna's actual drainage problem areas ───────────────

DRAINAGE_NODES = [
    {
        "id": "N-204",
        "name": "Kankarbagh Nala Junction",
        "lat": 25.5985,
        "lng": 85.1240,
        "utilization_pct": 94,
        "capacity_ls": 82,
        "flow_ls": 77,
        "status": "STRESSED",
        "anomaly": "Possible capacity reduction — field inspection recommended",
        "confidence_pct": 76,
    },
    {
        "id": "N-187",
        "name": "Rajendra Nagar Pump Station",
        "lat": 25.5930,
        "lng": 85.1120,
        "utilization_pct": 100,
        "capacity_ls": 65,
        "flow_ls": 65,
        "status": "CRITICAL",
        "anomaly": "Flow exceeding design capacity",
        "confidence_pct": 88,
    },
    {
        "id": "N-312",
        "name": "Gandhi Maidan Drain Outfall",
        "lat": 25.6150,
        "lng": 85.1380,
        "utilization_pct": 58,
        "capacity_ls": 110,
        "flow_ls": 64,
        "status": "NORMAL",
        "anomaly": None,
        "confidence_pct": 91,
    },
    {
        "id": "N-089",
        "name": "Patna Junction Underpass Drain",
        "lat": 25.6070,
        "lng": 85.1360,
        "utilization_pct": 81,
        "capacity_ls": 90,
        "flow_ls": 73,
        "status": "STRESSED",
        "anomaly": "Elevated flow near predicted threshold",
        "confidence_pct": 72,
    },
    {
        "id": "N-156",
        "name": "Danapur Cantonment Outlet",
        "lat": 25.6230,
        "lng": 85.0650,
        "utilization_pct": 34,
        "capacity_ls": 75,
        "flow_ls": 25,
        "status": "NORMAL",
        "anomaly": None,
        "confidence_pct": 94,
    },
]

# ─── Forecast timeline ──────────────────────────────────────────────────────

FORECAST = [
    {"forecast_time": "NOW",   "depth_cm": 18, "risk_level": "HIGH",   "confidence_pct": 91},
    {"forecast_time": "+15m",  "depth_cm": 24, "risk_level": "HIGH",   "confidence_pct": 89},
    {"forecast_time": "+30m",  "depth_cm": 31, "risk_level": "SEVERE", "confidence_pct": 87},
    {"forecast_time": "+45m",  "depth_cm": 38, "risk_level": "SEVERE", "confidence_pct": 84},
    {"forecast_time": "+60m",  "depth_cm": 42, "risk_level": "SEVERE", "confidence_pct": 80},
    {"forecast_time": "+90m",  "depth_cm": 44, "risk_level": "SEVERE", "confidence_pct": 74},
    {"forecast_time": "+120m", "depth_cm": 39, "risk_level": "HIGH",   "confidence_pct": 68},
    {"forecast_time": "+180m", "depth_cm": 28, "risk_level": "HIGH",   "confidence_pct": 60},
]

# ─── Flood zones (GeoJSON polygons around Patna for each forecast step) ──────

def make_flood_zones(step: int):
    """Generate flood zone polygons that grow with each forecast step."""
    intensity = step / 7.0
    base_lat = 25.6093
    base_lng = 85.1376

    zones = []

    # SEVERE zone — near Rajendra Nagar Canal (most flood-prone)
    spread = 0.005 + intensity * 0.008
    zones.append({
        "severity": "SEVERE",
        "depth_cm": 35 + intensity * 25,
        "forecast_step": step,
        "geojson": json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [85.1050 - spread, 25.5900 - spread],
                [85.1200 + spread, 25.5900 - spread],
                [85.1200 + spread, 25.5960 + spread],
                [85.1050 - spread, 25.5960 + spread],
                [85.1050 - spread, 25.5900 - spread],
            ]]
        }),
    })

    # HIGH zone — around Kankarbagh
    spread = 0.008 + intensity * 0.010
    zones.append({
        "severity": "HIGH",
        "depth_cm": 20 + intensity * 18,
        "forecast_step": step,
        "geojson": json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [85.1150 - spread, 25.5950 - spread],
                [85.1350 + spread, 25.5950 - spread],
                [85.1350 + spread, 25.6050 + spread],
                [85.1150 - spread, 25.6050 + spread],
                [85.1150 - spread, 25.5950 - spread],
            ]]
        }),
    })

    # MODERATE zone — Bailey Road area
    spread = 0.010 + intensity * 0.012
    zones.append({
        "severity": "MODERATE",
        "depth_cm": 10 + intensity * 14,
        "forecast_step": step,
        "geojson": json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [85.1080 - spread, 25.6080 - spread],
                [85.1380 + spread, 25.6080 - spread],
                [85.1380 + spread, 25.6160 + spread],
                [85.1080 - spread, 25.6160 + spread],
                [85.1080 - spread, 25.6080 - spread],
            ]]
        }),
    })

    # LOW zone — broader city area
    spread = 0.015 + intensity * 0.015
    zones.append({
        "severity": "LOW",
        "depth_cm": 3 + intensity * 8,
        "forecast_step": step,
        "geojson": json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [85.1000 - spread, 25.6000 - spread],
                [85.1600 + spread, 25.6000 - spread],
                [85.1600 + spread, 25.6200 + spread],
                [85.1000 - spread, 25.6200 + spread],
                [85.1000 - spread, 25.6000 - spread],
            ]]
        }),
    })

    return zones


# ─── Main seed function ─────────────────────────────────────────────────────

async def seed():
    """Drop and recreate all tables, then insert seed data."""
    print("[HYDRO] HydroGraph - Seeding database for Patna, Bihar...")

    # Recreate tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("  [OK] Tables created")

    async with async_session() as session:
        # Roads
        for r in ROADS:
            session.add(Road(**r, updated_at=datetime.utcnow()))
        print(f"  [OK] {len(ROADS)} roads seeded (Bailey Rd, Ashok Rajpath, NH-30, etc.)")

        # Drainage nodes
        for d in DRAINAGE_NODES:
            session.add(DrainageNode(**d, updated_at=datetime.utcnow()))
        print(f"  [OK] {len(DRAINAGE_NODES)} drainage nodes seeded")

        # Forecast timeline
        for f in FORECAST:
            session.add(ForecastTimeline(**f))
        print(f"  [OK] {len(FORECAST)} forecast points seeded (NOW -> +180m)")

        # Flood zones for all 8 forecast steps
        zone_count = 0
        for step in range(8):
            for z in make_flood_zones(step):
                session.add(FloodZone(**z))
                zone_count += 1
        print(f"  [OK] {zone_count} flood zone polygons seeded (8 steps x 4 severities)")

        await session.commit()

    print("")
    print("[OK] Database seeded successfully!")
    print(f"   Location: Patna, Bihar (25.6093N, 85.1376E)")
    print(f"   Roads: {len(ROADS)} | Drainage: {len(DRAINAGE_NODES)} | Forecast: {len(FORECAST)} steps")


if __name__ == "__main__":
    asyncio.run(seed())
