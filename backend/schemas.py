"""
Pydantic schemas for request/response validation.
These mirror the frontend TypeScript interfaces in mockData.ts.
"""

from datetime import datetime
from pydantic import BaseModel


# ─── Road ─────────────────────────────────────────────────────────────────────


class RoadOut(BaseModel):
    """Response schema for a road segment — matches frontend Road interface."""

    id: str
    name: str
    risk: str  # LOW / MODERATE / HIGH / SEVERE
    depthCm: float
    peakDepthCm: float
    velocityMs: float
    durationMin: int
    timeToFloodMin: int
    confidencePct: float
    rainfallMmHr: float
    drainUtilPct: float
    cause: list[str]
    closed: bool
    lat: float
    lng: float
    geojson: str | None = None

    class Config:
        from_attributes = True


class RoadCloseRequest(BaseModel):
    """Request body for closing/reopening a road."""

    is_closed: bool
    reason: str | None = None


class RoadCloseResponse(BaseModel):
    """Response after closing/reopening a road."""

    id: str
    is_closed: bool
    closed_at: datetime | None = None
    affected_routes: int = 0
    message: str


# ─── Flood Zone ───────────────────────────────────────────────────────────────


class FloodZoneOut(BaseModel):
    """A flood depth polygon for map rendering."""

    id: int
    severity: str
    geojson: str  # GeoJSON Polygon as string
    depth_cm: float
    forecast_step: int

    class Config:
        from_attributes = True


# ─── Drainage Node ────────────────────────────────────────────────────────────


class DrainageNodeOut(BaseModel):
    """Response schema for a drainage node — matches frontend DrainageNode interface."""

    id: str
    name: str
    utilizationPct: float
    capacityLs: float
    flowLs: float
    status: str
    anomaly: str | None = None
    confidencePct: float
    lat: float
    lng: float

    class Config:
        from_attributes = True


# ─── Forecast Timeline ───────────────────────────────────────────────────────


class ForecastPointOut(BaseModel):
    """A single forecast time step — matches frontend ForecastPoint interface."""

    time: str
    depthCm: float
    risk: str
    confidencePct: float

    class Config:
        from_attributes = True


# ─── Weather (external API) ──────────────────────────────────────────────────


class WeatherOut(BaseModel):
    """Current weather data from OpenWeatherMap."""

    rainfall_mm_hr: float
    temperature_c: float
    humidity_pct: float
    wind_speed_ms: float
    description: str
    icon: str


# ─── Map Config ───────────────────────────────────────────────────────────────


class MapConfigOut(BaseModel):
    """Initial map configuration for the frontend."""

    center_lat: float
    center_lng: float
    zoom: int
    maptiler_key: str
