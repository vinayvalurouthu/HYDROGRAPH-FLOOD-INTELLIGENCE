"""
SQLAlchemy ORM models for HydroGraph Flood Intelligence & Emergency Response Platform.

Tables:
  - roads            : Monitored road segments with real-time flood metrics
  - flood_zones      : Predicted flood depth polygons (GeoJSON stored as text)
  - drainage_nodes   : Drainage network monitoring points
  - forecast_timeline: Time-series flood forecast across lead times (NOW -> +180m)
  - sos_incidents    : Emergency SOS requests with priority scoring & audit trails
  - rescue_teams     : Emergency response units, status, vehicle type & capacity
  - shelters         : Evacuation shelters, live capacity, supplies & risk status
  - system_services  : System telemetry, component health, latency & error rates
  - alerts           : Operational emergency alerts and warnings
  - historical_events: Past flood events with validation replay data
"""

from datetime import datetime
from sqlalchemy import (
    String,
    Float,
    Integer,
    Boolean,
    Text,
    DateTime,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Road(Base):
    """A monitored road segment with live flood intelligence."""

    __tablename__ = "roads"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)

    # Geospatial (GeoJSON LineString string for map rendering)
    geojson: Mapped[str | None] = mapped_column(Text, nullable=True)
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lng: Mapped[float] = mapped_column(Float, default=0.0)

    # Flood metrics
    risk_level: Mapped[str] = mapped_column(String(10), default="LOW")  # LOW / MODERATE / HIGH / SEVERE
    depth_cm: Mapped[float] = mapped_column(Float, default=0.0)
    peak_depth_cm: Mapped[float] = mapped_column(Float, default=0.0)
    velocity_ms: Mapped[float] = mapped_column(Float, default=0.0)
    duration_min: Mapped[int] = mapped_column(Integer, default=0)
    time_to_flood_min: Mapped[int] = mapped_column(Integer, default=0)
    confidence_pct: Mapped[float] = mapped_column(Float, default=0.0)
    rainfall_mm_hr: Mapped[float] = mapped_column(Float, default=0.0)
    drain_util_pct: Mapped[float] = mapped_column(Float, default=0.0)

    # Cause analysis (JSON array of string factors)
    cause: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Road status
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class FloodZone(Base):
    """A predicted flood depth polygon for a specific forecast time step."""

    __tablename__ = "flood_zones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    severity: Mapped[str] = mapped_column(String(10), nullable=False)  # LOW / MODERATE / HIGH / SEVERE
    # GeoJSON Polygon stored as text
    geojson: Mapped[str] = mapped_column(Text, nullable=False)
    depth_cm: Mapped[float] = mapped_column(Float, default=0.0)
    # Which forecast step this zone belongs to (0 = NOW, 1 = +15m, 2 = +30m, etc.)
    forecast_step: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class DrainageNode(Base):
    """A drainage network monitoring point / telemetry sensor."""

    __tablename__ = "drainage_nodes"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    city_id: Mapped[str | None] = mapped_column(String(50), nullable=True, default="patna")

    # Geographic and schematic coordinates
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lng: Mapped[float] = mapped_column(Float, default=0.0)
    x: Mapped[float] = mapped_column(Float, default=0.0)
    y: Mapped[float] = mapped_column(Float, default=0.0)

    # Hydraulic metrics
    utilization_pct: Mapped[float] = mapped_column(Float, default=0.0)
    capacity_ls: Mapped[float] = mapped_column(Float, default=0.0)
    flow_ls: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(10), default="NORMAL")  # NORMAL / STRESSED / CRITICAL
    anomaly: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence_pct: Mapped[float] = mapped_column(Float, default=0.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ForecastTimeline(Base):
    """A single point in the flood forecast timeline (NOW -> +180m)."""

    __tablename__ = "forecast_timeline"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    forecast_time: Mapped[str] = mapped_column(String(10), nullable=False)  # "NOW", "+15m", "+30m", etc.
    depth_cm: Mapped[float] = mapped_column(Float, default=0.0)
    risk_level: Mapped[str] = mapped_column(String(10), default="LOW")
    confidence_pct: Mapped[float] = mapped_column(Float, default=0.0)
    model_run_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SOSIncident(Base):
    """Emergency SOS distress signal submitted by citizens or field teams."""

    __tablename__ = "sos_incidents"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)  # e.g. "#10284"
    priority: Mapped[str] = mapped_column(String(10), default="HIGH")  # CRITICAL / HIGH / MODERATE
    location: Mapped[str] = mapped_column(String(200), nullable=False)
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lng: Mapped[float] = mapped_column(Float, default=0.0)

    # Population at risk
    people: Mapped[int] = mapped_column(Integer, default=1)
    children: Mapped[int] = mapped_column(Integer, default=0)
    elderly: Mapped[int] = mapped_column(Integer, default=0)
    medical: Mapped[bool] = mapped_column(Boolean, default=False)
    contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Environmental hazard
    water_depth_m: Mapped[float] = mapped_column(Float, default=0.0)
    waiting_min: Mapped[int] = mapped_column(Integer, default=0)
    flood_risk: Mapped[str] = mapped_column(String(10), default="HIGH")  # LOW / MODERATE / HIGH / SEVERE

    # Status and audit trail
    status: Mapped[str] = mapped_column(String(20), default="RECEIVED")  # RECEIVED / VERIFIED / ASSIGNED / EN_ROUTE / RESCUED / CLOSED
    assigned_team: Mapped[str | None] = mapped_column(String(20), nullable=True)
    timestamps: Mapped[list | None] = mapped_column(JSON, default=list)  # [{"status": "SOS received", "time": "14:02"}]

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class RescueTeam(Base):
    """Emergency response team / NDRF / SDRF / Municipal unit."""

    __tablename__ = "rescue_teams"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)  # e.g. "R-04"
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="AVAILABLE")  # AVAILABLE / EN_ROUTE / ON_SCENE / RETURNING
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lng: Mapped[float] = mapped_column(Float, default=0.0)

    distance_km: Mapped[float] = mapped_column(Float, default=0.0)
    eta_min: Mapped[int] = mapped_column(Integer, default=0)
    vehicle: Mapped[str] = mapped_column(String(50), default="Rescue Van")  # Rescue Van / Inflatable Boat / Motor Boat / Amphibious
    capacity: Mapped[int] = mapped_column(Integer, default=6)
    route_safety: Mapped[str] = mapped_column(String(10), default="SAFE")  # SAFE / MODERATE / HIGH
    assigned_sos: Mapped[str | None] = mapped_column(String(20), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Shelter(Base):
    """Designated emergency relief shelter or relief camp."""

    __tablename__ = "shelters"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)  # e.g. "SH-01"
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    address: Mapped[str] = mapped_column(String(250), nullable=False)
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lng: Mapped[float] = mapped_column(Float, default=0.0)

    capacity: Mapped[int] = mapped_column(Integer, default=500)
    occupancy: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="OPEN")  # OPEN / NEAR_FULL / FULL / UNAVAILABLE
    flood_risk: Mapped[str] = mapped_column(String(10), default="LOW")

    distance_km: Mapped[float] = mapped_column(Float, default=0.0)
    eta_min: Mapped[int] = mapped_column(Integer, default=0)

    # Life safety supplies & amenities
    medical: Mapped[bool] = mapped_column(Boolean, default=True)
    food: Mapped[bool] = mapped_column(Boolean, default=True)
    water: Mapped[bool] = mapped_column(Boolean, default=True)
    power: Mapped[bool] = mapped_column(Boolean, default=True)
    accessibility: Mapped[bool] = mapped_column(Boolean, default=True)

    recommended: Mapped[bool] = mapped_column(Boolean, default=False)
    last_updated: Mapped[str] = mapped_column(String(50), default="Just now")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SystemService(Base):
    """Backend microservice / data ingestion pipeline status."""

    __tablename__ = "system_services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="HEALTHY")  # HEALTHY / DEGRADED / OFFLINE
    latency_ms: Mapped[int] = mapped_column(Integer, default=50)
    error_rate: Mapped[float] = mapped_column(Float, default=0.0)
    last_update: Mapped[str] = mapped_column(String(20), default="14:32:00")
    data_freshness_sec: Mapped[int] = mapped_column(Integer, default=30)
    component_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Ingestion / Modeling / Routing / Database
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Alert(Base):
    """Operational alert and incident notification broadcast."""

    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)  # e.g. "a1"
    type: Mapped[str] = mapped_column(String(10), default="INFO")  # CRITICAL / WARNING / INFO / SUCCESS
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    time: Mapped[str] = mapped_column(String(20), default="Just now")
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    road_id: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class HistoricalEvent(Base):
    """Archived historical flood event for model validation and replay."""

    __tablename__ = "historical_events"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)  # e.g. "2025-MONSOON"
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    date: Mapped[str] = mapped_column(String(20), nullable=False)  # "2025-09-14"
    duration: Mapped[str] = mapped_column(String(20), default="6h 30m")
    peak_depth_cm: Mapped[float] = mapped_column(Float, default=0.0)
    flooded_roads: Mapped[int] = mapped_column(Integer, default=0)
    sos_count: Mapped[int] = mapped_column(Integer, default=0)
    accuracy: Mapped[float] = mapped_column(Float, default=85.0)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    timeline_data: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
