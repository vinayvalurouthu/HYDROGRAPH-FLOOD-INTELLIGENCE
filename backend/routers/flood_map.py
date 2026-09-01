"""
API router for the Live Map page.

Endpoints:
  GET   /api/map/config          → Map center, zoom, and tile key
  GET   /api/roads               → All road segments with flood status
  PATCH /api/roads/{road_id}     → Close or reopen a road
  GET   /api/forecast/timeline   → Flood forecast timeline (NOW → +180m)
  GET   /api/drainage/nodes      → Drainage node statuses
  GET   /api/flood/zones         → Flood depth polygons for a forecast step
  GET   /api/weather/current     → Live weather from OpenWeatherMap
"""

from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models import Road, FloodZone, DrainageNode, ForecastTimeline
from schemas import (
    RoadOut,
    RoadCloseRequest,
    RoadCloseResponse,
    FloodZoneOut,
    DrainageNodeOut,
    ForecastPointOut,
    WeatherOut,
    MapConfigOut,
)

router = APIRouter()


# ─── Helper: convert DB Road model → frontend-compatible dict ─────────────────


def road_to_out(road: Road) -> RoadOut:
    """Map SQLAlchemy Road model to the Pydantic response schema."""
    return RoadOut(
        id=road.id,
        name=road.name,
        risk=road.risk_level,
        depthCm=road.depth_cm,
        peakDepthCm=road.peak_depth_cm,
        velocityMs=road.velocity_ms,
        durationMin=road.duration_min,
        timeToFloodMin=road.time_to_flood_min,
        confidencePct=road.confidence_pct,
        rainfallMmHr=road.rainfall_mm_hr,
        drainUtilPct=road.drain_util_pct,
        cause=road.cause or [],
        closed=road.is_closed,
        lat=road.lat,
        lng=road.lng,
        geojson=road.geojson,
    )


def drainage_to_out(node: DrainageNode) -> DrainageNodeOut:
    """Map SQLAlchemy DrainageNode model to the Pydantic response schema."""
    return DrainageNodeOut(
        id=node.id,
        name=node.name,
        utilizationPct=node.utilization_pct,
        capacityLs=node.capacity_ls,
        flowLs=node.flow_ls,
        status=node.status,
        anomaly=node.anomaly,
        confidencePct=node.confidence_pct,
        lat=node.lat,
        lng=node.lng,
    )


def forecast_to_out(point: ForecastTimeline) -> ForecastPointOut:
    """Map SQLAlchemy ForecastTimeline model to the Pydantic response schema."""
    return ForecastPointOut(
        time=point.forecast_time,
        depthCm=point.depth_cm,
        risk=point.risk_level,
        confidencePct=point.confidence_pct,
    )


# ─── 1. Map Configuration ────────────────────────────────────────────────────


@router.get("/api/map/config", response_model=MapConfigOut)
async def get_map_config():
    """Return map center coordinates, zoom level, and MapTiler API key."""
    return MapConfigOut(
        center_lat=settings.DEFAULT_LAT,
        center_lng=settings.DEFAULT_LNG,
        zoom=settings.DEFAULT_ZOOM,
        maptiler_key=settings.MAPTILER_API_KEY,
    )


# ─── 2. Roads ────────────────────────────────────────────────────────────────


@router.get("/api/roads", response_model=list[RoadOut])
async def get_roads(db: AsyncSession = Depends(get_db)):
    """Fetch all monitored road segments with live flood metrics."""
    result = await db.execute(select(Road).order_by(Road.depth_cm.desc()))
    roads = result.scalars().all()
    return [road_to_out(r) for r in roads]


@router.get("/api/roads/{road_id}", response_model=RoadOut)
async def get_road(road_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch a single road segment by ID."""
    result = await db.execute(select(Road).where(Road.id == road_id))
    road = result.scalar_one_or_none()
    if not road:
        raise HTTPException(status_code=404, detail=f"Road {road_id} not found")
    return road_to_out(road)


@router.patch("/api/roads/{road_id}", response_model=RoadCloseResponse)
async def toggle_road_closure(
    road_id: str,
    body: RoadCloseRequest,
    db: AsyncSession = Depends(get_db),
):
    """Close or reopen a road. Returns updated status and affected route count."""
    result = await db.execute(select(Road).where(Road.id == road_id))
    road = result.scalar_one_or_none()
    if not road:
        raise HTTPException(status_code=404, detail=f"Road {road_id} not found")

    road.is_closed = body.is_closed
    road.closed_at = datetime.utcnow() if body.is_closed else None
    road.updated_at = datetime.utcnow()
    await db.commit()

    # Count affected routes (simplified: count of non-closed roads in the area)
    count_result = await db.execute(
        select(Road).where(Road.is_closed == False, Road.id != road_id)
    )
    affected = len(count_result.scalars().all())

    action = "CLOSED" if body.is_closed else "REOPENED"
    return RoadCloseResponse(
        id=road.id,
        is_closed=road.is_closed,
        closed_at=road.closed_at,
        affected_routes=min(affected, 7),
        message=f"Road {road.id} {action} · {min(affected, 7)} routes recalculated",
    )


# ─── 3. Forecast Timeline ────────────────────────────────────────────────────


@router.get("/api/forecast/timeline", response_model=list[ForecastPointOut])
async def get_forecast_timeline(db: AsyncSession = Depends(get_db)):
    """Fetch the flood forecast timeline (NOW → +180 minutes)."""
    result = await db.execute(
        select(ForecastTimeline).order_by(ForecastTimeline.id)
    )
    points = result.scalars().all()
    return [forecast_to_out(p) for p in points]


# ─── 4. Drainage Nodes ───────────────────────────────────────────────────────


@router.get("/api/drainage/nodes", response_model=list[DrainageNodeOut])
async def get_drainage_nodes(db: AsyncSession = Depends(get_db)):
    """Fetch all drainage network monitoring nodes."""
    result = await db.execute(
        select(DrainageNode).order_by(DrainageNode.utilization_pct.desc())
    )
    nodes = result.scalars().all()
    return [drainage_to_out(n) for n in nodes]


# ─── 5. Flood Zones ──────────────────────────────────────────────────────────


@router.get("/api/flood/zones", response_model=list[FloodZoneOut])
async def get_flood_zones(
    step: int = Query(0, ge=0, le=7, description="Forecast step (0=NOW, 1=+15m, etc.)"),
    db: AsyncSession = Depends(get_db),
):
    """Fetch flood depth polygons (GeoJSON) for a specific forecast time step."""
    result = await db.execute(
        select(FloodZone).where(FloodZone.forecast_step == step)
    )
    zones = result.scalars().all()
    return zones


# ─── 6. Live Weather (OpenWeatherMap) ────────────────────────────────────────


@router.get("/api/weather/current", response_model=WeatherOut)
async def get_current_weather():
    """Fetch live weather for the demo area from OpenWeatherMap API."""
    api_key = settings.OWM_API_KEY
    if not api_key:
        raise HTTPException(status_code=503, detail="OpenWeatherMap API key not configured")

    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?lat={settings.DEFAULT_LAT}&lon={settings.DEFAULT_LNG}"
        f"&appid={api_key}&units=metric"
    )

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"Weather API error: {e.response.status_code}")
        except httpx.RequestError:
            raise HTTPException(status_code=502, detail="Could not reach weather API")

    # Extract rainfall (may not exist if it is not raining)
    rain_1h = data.get("rain", {}).get("1h", 0.0)

    return WeatherOut(
        rainfall_mm_hr=rain_1h,
        temperature_c=data["main"]["temp"],
        humidity_pct=data["main"]["humidity"],
        wind_speed_ms=data["wind"]["speed"],
        description=data["weather"][0]["description"],
        icon=data["weather"][0]["icon"],
    )
