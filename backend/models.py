"""
SQLAlchemy ORM models for the Live Map page.

Tables:
  - roads            : Monitored road segments with flood metrics
  - flood_zones      : Predicted flood depth polygons (GeoJSON stored as text)
  - drainage_nodes   : Drainage network monitoring points
  - forecast_timeline: Time-series flood forecast (regenerated each model run)
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

    # Geospatial (stored as GeoJSON LineString string — upgrade to PostGIS later)
    geojson: Mapped[str | None] = mapped_column(Text, nullable=True)
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lng: Mapped[float] = mapped_column(Float, default=0.0)

    # Flood metrics
    risk_level: Mapped[str] = mapped_column(String(10), default="LOW")
    depth_cm: Mapped[float] = mapped_column(Float, default=0.0)
    peak_depth_cm: Mapped[float] = mapped_column(Float, default=0.0)
    velocity_ms: Mapped[float] = mapped_column(Float, default=0.0)
    duration_min: Mapped[int] = mapped_column(Integer, default=0)
    time_to_flood_min: Mapped[int] = mapped_column(Integer, default=0)
    confidence_pct: Mapped[float] = mapped_column(Float, default=0.0)
    rainfall_mm_hr: Mapped[float] = mapped_column(Float, default=0.0)
    drain_util_pct: Mapped[float] = mapped_column(Float, default=0.0)

    # Cause analysis (JSON array of strings)
    cause: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Road status
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class FloodZone(Base):
    """A predicted flood depth polygon for a specific forecast time."""

    __tablename__ = "flood_zones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    severity: Mapped[str] = mapped_column(String(10), nullable=False)  # LOW/MODERATE/HIGH/SEVERE
    # GeoJSON Polygon stored as text
    geojson: Mapped[str] = mapped_column(Text, nullable=False)
    depth_cm: Mapped[float] = mapped_column(Float, default=0.0)
    # Which forecast step this zone belongs to (0 = NOW, 1 = +15m, etc.)
    forecast_step: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class DrainageNode(Base):
    """A drainage network monitoring point."""

    __tablename__ = "drainage_nodes"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Location
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lng: Mapped[float] = mapped_column(Float, default=0.0)

    # Metrics
    utilization_pct: Mapped[float] = mapped_column(Float, default=0.0)
    capacity_ls: Mapped[float] = mapped_column(Float, default=0.0)
    flow_ls: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(10), default="NORMAL")  # NORMAL/STRESSED/CRITICAL
    anomaly: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence_pct: Mapped[float] = mapped_column(Float, default=0.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ForecastTimeline(Base):
    """A single point in the flood forecast timeline."""

    __tablename__ = "forecast_timeline"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    forecast_time: Mapped[str] = mapped_column(String(10), nullable=False)  # "NOW", "+15m", etc.
    depth_cm: Mapped[float] = mapped_column(Float, default=0.0)
    risk_level: Mapped[str] = mapped_column(String(10), default="LOW")
    confidence_pct: Mapped[float] = mapped_column(Float, default=0.0)
    model_run_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
