"""
Seed the database with realistic disaster intelligence data for Patna, Bihar.

Patna (25.6093°N, 85.1376°E) sits on the southern bank of the Ganges
and is one of India's most flood-affected urban centers.

This seed script populates all 10 HydroGraph database tables:
  1. roads             (Monitored arterial roads with flood depth & velocities)
  2. flood_zones       (Predicted multi-step flood inundation polygons)
  3. drainage_nodes    (Hydraulic sensor points and pump station telemetry)
  4. forecast_timeline (Time-series flood prediction lead times NOW -> +180m)
  5. sos_incidents     (Distress signals with triage scores & timestamps)
  6. rescue_teams      (Emergency response units, vehicles, & dispatch)
  7. shelters          (Designated relief camps, live capacity, & supplies)
  8. system_services   (Microservice health telemetry & pipeline latencies)
  9. alerts            (Operational incident broadcasts)
  10. historical_events(Past flood benchmarks & replay timeline frames)

Run: python seed.py
"""

import asyncio
import json
from datetime import datetime

from database import engine, async_session, Base
from models import (
    Road,
    FloodZone,
    DrainageNode,
    ForecastTimeline,
    SOSIncident,
    RescueTeam,
    Shelter,
    SystemService,
    Alert,
    HistoricalEvent,
)


# ─── 1. Real Patna Roads ──────────────────────────────────────────────────────

ROADS = [
    {
        "id": "R-102",
        "name": "Bailey Road (Jawaharlal Nehru Marg)",
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
        "cause": ["Heavy rainfall", "Drainage sump overflow", "Pumping station backflow"],
        "is_closed": False,
        "geojson": json.dumps({
            "type": "LineString",
            "coordinates": [
                [85.0850, 25.6120],
                [85.1050, 25.6130],
                [85.1180, 25.6120],
                [85.1280, 25.6112],
                [85.1350, 25.6108],
            ],
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
        "cause": ["Surface runoff", "Severe inlet clogging", "Depression basin topography"],
        "is_closed": False,
        "geojson": json.dumps({
            "type": "LineString",
            "coordinates": [
                [85.1180, 25.5960],
                [85.1220, 25.5970],
                [85.1280, 25.5985],
                [85.1340, 25.5995],
                [85.1400, 25.6005],
            ],
        }),
    },
    {
        "id": "MR-01",
        "name": "Ashok Rajpath (PMCH Corridor)",
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
        "cause": ["Heavy rainfall", "Low elevation near Ganges outfall"],
        "is_closed": False,
        "geojson": json.dumps({
            "type": "LineString",
            "coordinates": [
                [85.1250, 25.6185],
                [85.1350, 25.6180],
                [85.1450, 25.6175],
                [85.1550, 25.6170],
                [85.1650, 25.6168],
            ],
        }),
    },
    {
        "id": "NH-48",
        "name": "NH-30 (Grand Trunk Road / Patna Bypass)",
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
        "cause": ["Rainfall accumulation", "High freight vibration surface wear"],
        "is_closed": False,
        "geojson": json.dumps({
            "type": "LineString",
            "coordinates": [
                [85.1450, 25.6070],
                [85.1500, 25.6060],
                [85.1550, 25.6050],
                [85.1620, 25.6035],
                [85.1700, 25.6020],
            ],
        }),
    },
    {
        "id": "CR-07",
        "name": "Patna Canal Road",
        "lat": 25.6020,
        "lng": 85.1050,
        "risk_level": "SEVERE",
        "depth_cm": 41,
        "peak_depth_cm": 58,
        "velocity_ms": 0.71,
        "duration_min": 60,
        "time_to_flood_min": 8,
        "confidence_pct": 91,
        "rainfall_mm_hr": 98,
        "drain_util_pct": 100,
        "cause": ["Canal embankment overtopping", "Secondary sluice gate failure"],
        "is_closed": True,
        "geojson": json.dumps({
            "type": "LineString",
            "coordinates": [
                [85.0950, 25.6050],
                [85.1000, 25.6035],
                [85.1050, 25.6020],
                [85.1100, 25.6005],
                [85.1150, 25.5990],
            ],
        }),
    },
    {
        "id": "RD-23",
        "name": "Boring Canal Road (East Corridor)",
        "lat": 25.6140,
        "lng": 85.1120,
        "risk_level": "LOW",
        "depth_cm": 4,
        "peak_depth_cm": 11,
        "velocity_ms": 0.09,
        "duration_min": 16,
        "time_to_flood_min": 94,
        "confidence_pct": 68,
        "rainfall_mm_hr": 58,
        "drain_util_pct": 42,
        "cause": ["Light localized runoff"],
        "is_closed": False,
        "geojson": json.dumps({
            "type": "LineString",
            "coordinates": [
                [85.1080, 25.6160],
                [85.1100, 25.6150],
                [85.1120, 25.6140],
                [85.1150, 25.6125],
                [85.1180, 25.6110],
            ],
        }),
    },
    {
        "id": "RN-05",
        "name": "Rajendra Nagar Overbridge Link",
        "lat": 25.5990,
        "lng": 85.1600,
        "risk_level": "SEVERE",
        "depth_cm": 38,
        "peak_depth_cm": 54,
        "velocity_ms": 0.58,
        "duration_min": 52,
        "time_to_flood_min": 14,
        "confidence_pct": 89,
        "rainfall_mm_hr": 94,
        "drain_util_pct": 96,
        "cause": ["Saidpur drain backwater", "Low-lying bowl geography"],
        "is_closed": False,
        "geojson": json.dumps({
            "type": "LineString",
            "coordinates": [
                [85.1500, 25.6000],
                [85.1550, 25.5995],
                [85.1600, 25.5990],
                [85.1650, 25.5985],
            ],
        }),
    },
    {
        "id": "DG-09",
        "name": "Digha Ghat Road",
        "lat": 25.6450,
        "lng": 85.1020,
        "risk_level": "MODERATE",
        "depth_cm": 16,
        "peak_depth_cm": 26,
        "velocity_ms": 0.32,
        "duration_min": 28,
        "time_to_flood_min": 45,
        "confidence_pct": 76,
        "rainfall_mm_hr": 64,
        "drain_util_pct": 60,
        "cause": ["River proximity", "Riparian bank seepage"],
        "is_closed": False,
        "geojson": json.dumps({
            "type": "LineString",
            "coordinates": [
                [85.0950, 25.6480],
                [85.1020, 25.6450],
                [85.1080, 25.6420],
            ],
        }),
    },
]


# ─── 2. Drainage Nodes ────────────────────────────────────────────────────────

DRAINAGE_NODES = [
    {
        "id": "N-204",
        "name": "Saidpur Sump Node (N-204)",
        "lat": 25.6060,
        "lng": 85.1520,
        "x": 380,
        "y": 220,
        "utilization_pct": 94,
        "capacity_ls": 82,
        "flow_ls": 77,
        "status": "STRESSED",
        "anomaly": "Possible capacity reduction — severe sediment buildup detected",
        "confidence_pct": 76,
    },
    {
        "id": "N-187",
        "name": "Kankarbagh Outfall Pump (N-187)",
        "lat": 25.5950,
        "lng": 85.1320,
        "x": 260,
        "y": 310,
        "utilization_pct": 100,
        "capacity_ls": 65,
        "flow_ls": 65,
        "status": "CRITICAL",
        "anomaly": "Flow exceeding design capacity — surcharge condition active",
        "confidence_pct": 88,
    },
    {
        "id": "N-312",
        "name": "Boring Road Trunk Drain (N-312)",
        "lat": 25.6170,
        "lng": 85.1180,
        "x": 520,
        "y": 180,
        "utilization_pct": 58,
        "capacity_ls": 110,
        "flow_ls": 64,
        "status": "NORMAL",
        "anomaly": None,
        "confidence_pct": 91,
    },
    {
        "id": "N-089",
        "name": "Pahari Sluice Node (N-089)",
        "lat": 25.5890,
        "lng": 85.1710,
        "x": 440,
        "y": 360,
        "utilization_pct": 81,
        "capacity_ls": 90,
        "flow_ls": 73,
        "status": "STRESSED",
        "anomaly": "Elevated flow near predicted river backflow threshold",
        "confidence_pct": 72,
    },
    {
        "id": "N-156",
        "name": "Digha Outfall Regulator (N-156)",
        "lat": 25.6380,
        "lng": 85.0980,
        "x": 160,
        "y": 140,
        "utilization_pct": 34,
        "capacity_ls": 75,
        "flow_ls": 25,
        "status": "NORMAL",
        "anomaly": None,
        "confidence_pct": 94,
    },
    {
        "id": "N-405",
        "name": "Dak Bungalow Storm Drain (N-405)",
        "lat": 25.6100,
        "lng": 85.1320,
        "x": 410,
        "y": 250,
        "utilization_pct": 89,
        "capacity_ls": 95,
        "flow_ls": 84.5,
        "status": "STRESSED",
        "anomaly": "Debris accumulation at intake grill",
        "confidence_pct": 83,
    },
]


# ─── 3. Forecast Timeline ─────────────────────────────────────────────────────

FORECAST_TIMELINE = [
    {"forecast_time": "NOW", "depth_cm": 18, "risk_level": "HIGH", "confidence_pct": 91},
    {"forecast_time": "+15m", "depth_cm": 24, "risk_level": "HIGH", "confidence_pct": 89},
    {"forecast_time": "+30m", "depth_cm": 31, "risk_level": "SEVERE", "confidence_pct": 87},
    {"forecast_time": "+45m", "depth_cm": 38, "risk_level": "SEVERE", "confidence_pct": 84},
    {"forecast_time": "+60m", "depth_cm": 42, "risk_level": "SEVERE", "confidence_pct": 80},
    {"forecast_time": "+90m", "depth_cm": 44, "risk_level": "SEVERE", "confidence_pct": 74},
    {"forecast_time": "+120m", "depth_cm": 39, "risk_level": "HIGH", "confidence_pct": 68},
    {"forecast_time": "+180m", "depth_cm": 28, "risk_level": "HIGH", "confidence_pct": 60},
]


# ─── 4. Flood Zone Polygons ───────────────────────────────────────────────────

def _make_polygon(min_lng, min_lat, max_lng, max_lat):
    """Create a GeoJSON polygon string."""
    return json.dumps({
        "type": "Polygon",
        "coordinates": [[
            [min_lng, min_lat],
            [max_lng, min_lat],
            [max_lng, max_lat],
            [min_lng, max_lat],
            [min_lng, min_lat],
        ]],
    })


FLOOD_ZONES = [
    # NOW (step 0)
    {"forecast_step": 0, "severity": "SEVERE", "depth_cm": 41, "geojson": _make_polygon(85.098, 25.599, 85.112, 25.606)},
    {"forecast_step": 0, "severity": "HIGH", "depth_cm": 28, "geojson": _make_polygon(85.120, 25.595, 85.138, 25.602)},
    {"forecast_step": 0, "severity": "MODERATE", "depth_cm": 15, "geojson": _make_polygon(85.105, 25.610, 85.130, 25.615)},
    # +15m (step 1)
    {"forecast_step": 1, "severity": "SEVERE", "depth_cm": 46, "geojson": _make_polygon(85.095, 25.597, 85.115, 25.608)},
    {"forecast_step": 1, "severity": "HIGH", "depth_cm": 32, "geojson": _make_polygon(85.118, 25.593, 85.142, 25.604)},
    # +30m (step 2)
    {"forecast_step": 2, "severity": "SEVERE", "depth_cm": 52, "geojson": _make_polygon(85.090, 25.595, 85.120, 25.610)},
    {"forecast_step": 2, "severity": "HIGH", "depth_cm": 38, "geojson": _make_polygon(85.115, 25.590, 85.148, 25.608)},
    # +60m (step 4 - peak)
    {"forecast_step": 4, "severity": "SEVERE", "depth_cm": 58, "geojson": _make_polygon(85.085, 25.590, 85.155, 25.615)},
    {"forecast_step": 4, "severity": "HIGH", "depth_cm": 42, "geojson": _make_polygon(85.110, 25.585, 85.165, 25.620)},
]


# ─── 5. SOS Incidents ─────────────────────────────────────────────────────────

SOS_INCIDENTS = [
    {
        "id": "#10284",
        "priority": "CRITICAL",
        "location": "Market Road, Near Central Post Office",
        "lat": 25.6180,
        "lng": 85.1400,
        "people": 4,
        "children": 1,
        "elderly": 1,
        "medical": True,
        "contact_phone": "+91 98350 11204",
        "water_depth_m": 1.0,
        "waiting_min": 8,
        "status": "EN_ROUTE",
        "flood_risk": "SEVERE",
        "assigned_team": "R-07",
        "timestamps": [
            {"status": "SOS received", "time": "14:02"},
            {"status": "Location verified", "time": "14:03"},
            {"status": "Team assigned", "time": "14:05"},
            {"status": "Team en route", "time": "14:08"},
        ],
    },
    {
        "id": "#10276",
        "priority": "HIGH",
        "location": "Canal Road Bridge, Sector 3",
        "lat": 25.6020,
        "lng": 85.1050,
        "people": 2,
        "children": 0,
        "elderly": 0,
        "medical": False,
        "contact_phone": "+91 94310 88219",
        "water_depth_m": 0.7,
        "waiting_min": 14,
        "status": "ASSIGNED",
        "flood_risk": "SEVERE",
        "assigned_team": "R-04",
        "timestamps": [
            {"status": "SOS received", "time": "13:52"},
            {"status": "Location verified", "time": "13:54"},
            {"status": "Team assigned", "time": "13:58"},
        ],
    },
    {
        "id": "#10251",
        "priority": "MODERATE",
        "location": "Junction 14 Underpass, Kankarbagh",
        "lat": 25.5980,
        "lng": 85.1250,
        "people": 1,
        "children": 0,
        "elderly": 1,
        "medical": False,
        "contact_phone": "+91 99342 77103",
        "water_depth_m": 0.4,
        "waiting_min": 22,
        "status": "VERIFIED",
        "flood_risk": "HIGH",
        "assigned_team": None,
        "timestamps": [
            {"status": "SOS received", "time": "13:42"},
            {"status": "Location verified", "time": "13:45"},
        ],
    },
    {
        "id": "#10298",
        "priority": "CRITICAL",
        "location": "Saidpur Colony Road No. 4",
        "lat": 25.6040,
        "lng": 85.1580,
        "people": 6,
        "children": 2,
        "elderly": 0,
        "medical": True,
        "contact_phone": "+91 91220 44589",
        "water_depth_m": 0.85,
        "waiting_min": 4,
        "status": "RECEIVED",
        "flood_risk": "HIGH",
        "assigned_team": None,
        "timestamps": [{"status": "SOS received", "time": "14:18"}],
    },
    {
        "id": "#10302",
        "priority": "HIGH",
        "location": "Rajendra Nagar Terminal West Gate",
        "lat": 25.5990,
        "lng": 85.1600,
        "people": 3,
        "children": 0,
        "elderly": 2,
        "medical": False,
        "contact_phone": "+91 98352 90123",
        "water_depth_m": 0.65,
        "waiting_min": 11,
        "status": "RECEIVED",
        "flood_risk": "SEVERE",
        "assigned_team": None,
        "timestamps": [{"status": "SOS received", "time": "14:22"}],
    },
]


# ─── 6. Rescue Teams ──────────────────────────────────────────────────────────

RESCUE_TEAMS = [
    {
        "id": "R-04",
        "name": "NDRF Quick Response Team 04",
        "status": "EN_ROUTE",
        "lat": 25.6080,
        "lng": 85.1120,
        "distance_km": 2.4,
        "eta_min": 11,
        "vehicle": "Rescue Van",
        "capacity": 8,
        "route_safety": "SAFE",
        "assigned_sos": "#10276",
        "contact_phone": "+91 80020 11004",
    },
    {
        "id": "R-07",
        "name": "SDRF Water Rescue Unit 07",
        "status": "EN_ROUTE",
        "lat": 25.6220,
        "lng": 85.1450,
        "distance_km": 4.8,
        "eta_min": 17,
        "vehicle": "Inflatable Boat",
        "capacity": 10,
        "route_safety": "HIGH",
        "assigned_sos": "#10284",
        "contact_phone": "+91 80020 11007",
    },
    {
        "id": "R-12",
        "name": "Municipal Disaster Squad 12",
        "status": "AVAILABLE",
        "lat": 25.6110,
        "lng": 85.1300,
        "distance_km": 1.2,
        "eta_min": 6,
        "vehicle": "Rescue Van",
        "capacity": 8,
        "route_safety": "SAFE",
        "assigned_sos": None,
        "contact_phone": "+91 80020 11012",
    },
    {
        "id": "R-03",
        "name": "Flood Taskforce Motorboat 03",
        "status": "ON_SCENE",
        "lat": 25.6020,
        "lng": 85.1050,
        "distance_km": 0.0,
        "eta_min": 0,
        "vehicle": "Motor Boat",
        "capacity": 6,
        "route_safety": "MODERATE",
        "assigned_sos": None,
        "contact_phone": "+91 80020 11003",
    },
    {
        "id": "R-09",
        "name": "Amphibious Evacuation Unit 09",
        "status": "AVAILABLE",
        "lat": 25.5900,
        "lng": 85.1400,
        "distance_km": 3.1,
        "eta_min": 14,
        "vehicle": "Rescue Van",
        "capacity": 8,
        "route_safety": "SAFE",
        "assigned_sos": None,
        "contact_phone": "+91 80020 11009",
    },
]


# ─── 7. Shelters ──────────────────────────────────────────────────────────────

SHELTERS = [
    {
        "id": "SH-01",
        "name": "Central School Relief Center",
        "address": "Bailey Road, Near High Court, Patna",
        "lat": 25.6110,
        "lng": 85.1300,
        "capacity": 500,
        "occupancy": 340,
        "status": "OPEN",
        "flood_risk": "LOW",
        "distance_km": 2.1,
        "eta_min": 8,
        "medical": True,
        "food": True,
        "water": True,
        "power": True,
        "accessibility": True,
        "last_updated": "2 min ago",
        "recommended": False,
    },
    {
        "id": "SH-02",
        "name": "Kankarbagh Community Hall",
        "address": "Doctor's Colony, Kankarbagh, Patna",
        "lat": 25.5960,
        "lng": 85.1300,
        "capacity": 300,
        "occupancy": 291,
        "status": "NEAR_FULL",
        "flood_risk": "MODERATE",
        "distance_km": 1.5,
        "eta_min": 6,
        "medical": False,
        "food": True,
        "water": True,
        "power": True,
        "accessibility": False,
        "last_updated": "5 min ago",
        "recommended": False,
    },
    {
        "id": "SH-03",
        "name": "Moin-ul-Haq Sports Complex (East)",
        "address": "Rajendra Nagar Stadium Road, Patna",
        "lat": 25.5990,
        "lng": 85.1600,
        "capacity": 800,
        "occupancy": 320,
        "status": "OPEN",
        "flood_risk": "LOW",
        "distance_km": 3.4,
        "eta_min": 14,
        "medical": True,
        "food": True,
        "water": True,
        "power": True,
        "accessibility": True,
        "last_updated": "1 min ago",
        "recommended": True,
    },
    {
        "id": "SH-04",
        "name": "Patna College Campus Relief Base",
        "address": "Ashok Rajpath, Near Gandhi Ghat",
        "lat": 25.6200,
        "lng": 85.1680,
        "capacity": 400,
        "occupancy": 122,
        "status": "OPEN",
        "flood_risk": "LOW",
        "distance_km": 4.2,
        "eta_min": 18,
        "medical": True,
        "food": True,
        "water": True,
        "power": False,
        "accessibility": True,
        "last_updated": "8 min ago",
        "recommended": False,
    },
]


# ─── 8. System Services ───────────────────────────────────────────────────────

SYSTEM_SERVICES = [
    {"name": "Radar Ingestion", "status": "HEALTHY", "latency_ms": 142, "error_rate": 0.0, "last_update": "14:32:08", "data_freshness_sec": 45, "component_type": "Ingestion"},
    {"name": "CWC River Data", "status": "HEALTHY", "latency_ms": 238, "error_rate": 0.1, "last_update": "14:31:55", "data_freshness_sec": 120, "component_type": "Ingestion"},
    {"name": "GIS Platform", "status": "HEALTHY", "latency_ms": 87, "error_rate": 0.0, "last_update": "14:32:10", "data_freshness_sec": 30, "component_type": "Spatial"},
    {"name": "SWMM Engine", "status": "HEALTHY", "latency_ms": 1840, "error_rate": 0.2, "last_update": "14:30:00", "data_freshness_sec": 180, "component_type": "Modeling"},
    {"name": "2D Flood Model", "status": "DEGRADED", "latency_ms": 4200, "error_rate": 2.1, "last_update": "14:24:30", "data_freshness_sec": 480, "component_type": "Modeling"},
    {"name": "GNN Predictor", "status": "HEALTHY", "latency_ms": 920, "error_rate": 0.0, "last_update": "14:32:05", "data_freshness_sec": 60, "component_type": "AI Engine"},
    {"name": "Routing Engine", "status": "HEALTHY", "latency_ms": 312, "error_rate": 0.0, "last_update": "14:32:09", "data_freshness_sec": 30, "component_type": "Navigation"},
    {"name": "Database", "status": "HEALTHY", "latency_ms": 12, "error_rate": 0.0, "last_update": "14:32:11", "data_freshness_sec": 5, "component_type": "Storage"},
    {"name": "SOS Gateway", "status": "HEALTHY", "latency_ms": 189, "error_rate": 0.0, "last_update": "14:32:10", "data_freshness_sec": 10, "component_type": "Emergency"},
]


# ─── 9. Alerts ────────────────────────────────────────────────────────────────

ALERTS = [
    {
        "id": "a1",
        "type": "CRITICAL",
        "title": "Road R-102 — Severe flood imminent",
        "message": "Bailey Road predicted severe flooding in 18 min. Immediate traffic diversion recommended.",
        "time": "14:32",
        "read": False,
        "road_id": "R-102",
    },
    {
        "id": "a2",
        "type": "CRITICAL",
        "title": "New SOS — Market Road (#10298)",
        "message": "6 people including 2 children stranded. Medical emergency reported.",
        "time": "14:31",
        "read": False,
        "road_id": None,
    },
    {
        "id": "a3",
        "type": "WARNING",
        "title": "Drain Node N-204 — Approaching capacity",
        "message": "Saidpur sump utilization at 94%. Desiltation crew inspection recommended.",
        "time": "14:28",
        "read": False,
        "road_id": None,
    },
    {
        "id": "a4",
        "type": "WARNING",
        "title": "2D Flood Model — High Compute Latency",
        "message": "Model latency elevated (4.2s). Confidence confidence bound adjusted by -8%.",
        "time": "14:24",
        "read": True,
        "road_id": None,
    },
    {
        "id": "a5",
        "type": "INFO",
        "title": "Rainfall forecast updated",
        "message": "+60min forecast revised to 91 mm/hr. Storm tracking Northeast across the Ganges basin.",
        "time": "14:20",
        "read": True,
        "road_id": None,
    },
    {
        "id": "a6",
        "type": "INFO",
        "title": "Shelter SH-03 capacity update",
        "message": "Sports Complex East now at 40% capacity. Evacuation routing priority active.",
        "time": "14:18",
        "read": True,
        "road_id": None,
    },
]


# ─── 10. Historical Events ────────────────────────────────────────────────────

HISTORICAL_EVENTS = [
    {
        "id": "2025-MONSOON",
        "name": "2025 Monsoon Severe Inundation Event",
        "date": "2025-09-14",
        "duration": "6h 30m",
        "peak_depth_cm": 68,
        "flooded_roads": 24,
        "sos_count": 47,
        "accuracy": 84.2,
        "description": "Prolonged high-intensity monsoon storm with Ganges backwater in Rajendra Nagar and Kankarbagh.",
        "timeline_data": [
            {"time_offset": "00:00", "rainfall_mm_hr": 24.0, "peak_depth_cm": 8.0, "flooded_roads_count": 2, "sos_count": 3, "model_accuracy_pct": 89.1, "active_hazard_areas": ["Rajendra Nagar Lowland"]},
            {"time_offset": "+01:30", "rainfall_mm_hr": 68.0, "peak_depth_cm": 28.0, "flooded_roads_count": 9, "sos_count": 14, "model_accuracy_pct": 86.4, "active_hazard_areas": ["Rajendra Nagar", "Kankarbagh"]},
            {"time_offset": "+03:00", "rainfall_mm_hr": 112.0, "peak_depth_cm": 54.0, "flooded_roads_count": 18, "sos_count": 32, "model_accuracy_pct": 84.2, "active_hazard_areas": ["Rajendra Nagar", "Kankarbagh", "Bailey Road", "Ashok Rajpath"]},
            {"time_offset": "+04:30", "rainfall_mm_hr": 92.0, "peak_depth_cm": 68.0, "flooded_roads_count": 24, "sos_count": 47, "model_accuracy_pct": 83.5, "active_hazard_areas": ["Citywide Inundation"]},
            {"time_offset": "+06:30", "rainfall_mm_hr": 18.0, "peak_depth_cm": 44.0, "flooded_roads_count": 14, "sos_count": 12, "model_accuracy_pct": 85.0, "active_hazard_areas": ["Receding Waters"]},
        ],
    },
    {
        "id": "2025-CYCLONE",
        "name": "2025 Cyclone Residual Outer Band Storm",
        "date": "2025-11-02",
        "duration": "4h 15m",
        "peak_depth_cm": 52,
        "flooded_roads": 18,
        "sos_count": 31,
        "accuracy": 79.8,
        "description": "Rapid convective squall line following Bay of Bengal cyclone landfall.",
        "timeline_data": [
            {"time_offset": "00:00", "rainfall_mm_hr": 35.0, "peak_depth_cm": 12.0, "flooded_roads_count": 4, "sos_count": 5, "model_accuracy_pct": 82.0, "active_hazard_areas": ["Digha", "Danapur"]},
            {"time_offset": "+02:00", "rainfall_mm_hr": 95.0, "peak_depth_cm": 52.0, "flooded_roads_count": 18, "sos_count": 31, "model_accuracy_pct": 79.8, "active_hazard_areas": ["Bailey Road", "Boring Road", "Canal Road"]},
            {"time_offset": "+04:15", "rainfall_mm_hr": 15.0, "peak_depth_cm": 30.0, "flooded_roads_count": 8, "sos_count": 8, "model_accuracy_pct": 81.5, "active_hazard_areas": ["Canal Road"]},
        ],
    },
    {
        "id": "2024-JULY",
        "name": "2024 July Intense Cloudburst",
        "date": "2024-07-18",
        "duration": "3h 45m",
        "peak_depth_cm": 44,
        "flooded_roads": 14,
        "sos_count": 22,
        "accuracy": 88.6,
        "description": "Localized cloudburst delivering 120mm in 2 hours over central Patna commercial corridor.",
        "timeline_data": [
            {"time_offset": "00:00", "rainfall_mm_hr": 45.0, "peak_depth_cm": 14.0, "flooded_roads_count": 3, "sos_count": 4, "model_accuracy_pct": 91.0, "active_hazard_areas": ["Dak Bungalow"]},
            {"time_offset": "+01:30", "rainfall_mm_hr": 120.0, "peak_depth_cm": 44.0, "flooded_roads_count": 14, "sos_count": 22, "model_accuracy_pct": 88.6, "active_hazard_areas": ["Dak Bungalow", "Exhibition Road", "Gandhi Maidan"]},
            {"time_offset": "+03:45", "rainfall_mm_hr": 10.0, "peak_depth_cm": 18.0, "flooded_roads_count": 5, "sos_count": 3, "model_accuracy_pct": 89.2, "active_hazard_areas": ["Station Underpass"]},
        ],
    },
]


# ─── Seed Execution ───────────────────────────────────────────────────────────

async def seed_all():
    """Drop and recreate all tables, then insert seed records."""
    print("[HYDROGRAPH SEED] Rebuilding database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    print("[HYDROGRAPH SEED] Populating tables with Patna disaster dataset...")
    async with async_session() as session:
        # 1. Roads
        for r_data in ROADS:
            session.add(Road(**r_data))

        # 2. Drainage Nodes
        for d_data in DRAINAGE_NODES:
            session.add(DrainageNode(**d_data))

        # 3. Forecast Timeline
        for f_data in FORECAST_TIMELINE:
            session.add(ForecastTimeline(**f_data))

        # 4. Flood Zones
        for z_data in FLOOD_ZONES:
            session.add(FloodZone(**z_data))

        # 5. SOS Incidents
        for s_data in SOS_INCIDENTS:
            session.add(SOSIncident(**s_data))

        # 6. Rescue Teams
        for t_data in RESCUE_TEAMS:
            session.add(RescueTeam(**t_data))

        # 7. Shelters
        for sh_data in SHELTERS:
            session.add(Shelter(**sh_data))

        # 8. System Services
        for svc_data in SYSTEM_SERVICES:
            session.add(SystemService(**svc_data))

        # 9. Alerts
        for a_data in ALERTS:
            session.add(Alert(**a_data))

        # 10. Historical Events
        for h_data in HISTORICAL_EVENTS:
            session.add(HistoricalEvent(**h_data))

        await session.commit()

    print("[HYDROGRAPH SEED] [OK] Successfully populated:")
    print(f"   -> {len(ROADS)} Road segments")
    print(f"   -> {len(DRAINAGE_NODES)} Drainage nodes")
    print(f"   -> {len(FORECAST_TIMELINE)} Forecast timeline steps")
    print(f"   -> {len(FLOOD_ZONES)} Flood zone depth polygons")
    print(f"   -> {len(SOS_INCIDENTS)} SOS emergency incidents")
    print(f"   -> {len(RESCUE_TEAMS)} Rescue teams")
    print(f"   -> {len(SHELTERS)} Evacuation shelters")
    print(f"   -> {len(SYSTEM_SERVICES)} System microservices")
    print(f"   -> {len(ALERTS)} Operational alerts")
    print(f"   -> {len(HISTORICAL_EVENTS)} Historical flood events")
    print("[HYDROGRAPH SEED] Database ready for production & demo execution.")


if __name__ == "__main__":
    asyncio.run(seed_all())
