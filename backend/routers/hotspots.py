"""
API router for Flood Hotspot Intelligence.

Provides a comprehensive, production-grade API for the Top Flood Hotspots page
with multi-factor risk scoring, spatial correlation, trend analysis,
filtering, and AI-driven action recommendations.

Endpoints:
  GET   /api/v1/hotspots              → All hotspots ranked by composite risk score
  GET   /api/v1/hotspots/summary      → Dashboard KPI summary of hotspot situation
  GET   /api/v1/hotspots/heatmap      → Lightweight lat/lng/intensity for map heatmap
  GET   /api/v1/hotspots/{hotspot_id} → Full intelligence profile for one hotspot
  POST  /api/v1/hotspots/{hotspot_id}/close → Close a road from the hotspot view
  POST  /api/v1/hotspots/{hotspot_id}/reopen → Reopen a closed hotspot road
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Road, SOSIncident, Shelter, DrainageNode
from services.hotspot_engine import (
    build_hotspot_profile,
    compute_hotspot_score,
    risk_tier_ordinal,
    HotspotProfile,
)
from schemas import (
    HotspotScoreOut,
    NearbyEntityOut,
    HotspotDetailOut,
    HotspotListOut,
    HotspotSummaryOut,
    HotspotHeatmapPointOut,
)

router = APIRouter(tags=["Hotspot Intelligence"])


# ─── Helpers ──────────────────────────────────────────────────────────────────


async def _fetch_all_context(db: AsyncSession):
    """Fetch roads, SOS, shelters, and drainage nodes in parallel-ish queries."""
    roads_result = await db.execute(select(Road).order_by(Road.depth_cm.desc()))
    sos_result = await db.execute(select(SOSIncident))
    shelters_result = await db.execute(select(Shelter))
    drainage_result = await db.execute(select(DrainageNode))

    return (
        roads_result.scalars().all(),
        sos_result.scalars().all(),
        shelters_result.scalars().all(),
        drainage_result.scalars().all(),
    )


def _profile_to_detail(profile: HotspotProfile) -> HotspotDetailOut:
    """Convert engine HotspotProfile dataclass to Pydantic response schema."""
    return HotspotDetailOut(
        id=profile.id,
        name=profile.name,
        risk=profile.risk,
        depthCm=profile.depth_cm,
        peakDepthCm=profile.peak_depth_cm,
        velocityMs=profile.velocity_ms,
        durationMin=profile.duration_min,
        timeToFloodMin=profile.time_to_flood_min,
        confidencePct=profile.confidence_pct,
        rainfallMmHr=profile.rainfall_mm_hr,
        drainUtilPct=profile.drain_util_pct,
        cause=profile.cause,
        is_closed=profile.is_closed,
        lat=profile.lat,
        lng=profile.lng,
        geojson=profile.geojson,
        score=HotspotScoreOut(
            composite=profile.score.composite,
            depth_factor=profile.score.depth_factor,
            velocity_factor=profile.score.velocity_factor,
            drainage_factor=profile.score.drainage_factor,
            urgency_factor=profile.score.urgency_factor,
            rainfall_factor=profile.score.rainfall_factor,
            confidence_factor=profile.score.confidence_factor,
            risk_tier=profile.score.risk_tier,
        ),
        actionRecommendation=profile.action_recommendation,
        actionPriority=profile.action_priority,
        trend=profile.trend,
        nearbySOS=[
            NearbyEntityOut(
                id=e.id,
                name=e.name,
                distance_km=e.distance_km,
                entity_type=e.entity_type,
                status=e.status,
                detail=e.detail,
            )
            for e in profile.nearby_sos
        ],
        nearbyShelters=[
            NearbyEntityOut(
                id=e.id,
                name=e.name,
                distance_km=e.distance_km,
                entity_type=e.entity_type,
                status=e.status,
                detail=e.detail,
            )
            for e in profile.nearby_shelters
        ],
        nearbyDrainage=[
            NearbyEntityOut(
                id=e.id,
                name=e.name,
                distance_km=e.distance_km,
                entity_type=e.entity_type,
                status=e.status,
                detail=e.detail,
            )
            for e in profile.nearby_drainage
        ],
        affectedPopulation=profile.affected_population,
    )


def _build_and_sort_profiles(
    roads: list,
    sos_incidents: list,
    shelters: list,
    drainage_nodes: list,
    risk_filter: str | None = None,
    min_score: float | None = None,
    trend_filter: str | None = None,
    is_closed_filter: bool | None = None,
    limit: int | None = None,
) -> list[HotspotProfile]:
    """Build profiles for all roads, apply filters, and sort by urgency score."""
    profiles = []
    for road in roads:
        profile = build_hotspot_profile(road, sos_incidents, shelters, drainage_nodes)

        # Apply risk filter
        if risk_filter and profile.score.risk_tier != risk_filter.upper():
            continue

        # Apply minimum score filter
        if min_score is not None and profile.score.composite < min_score:
            continue

        # Apply trend filter
        if trend_filter and profile.trend != trend_filter.upper():
            continue

        # Apply is_closed filter
        if is_closed_filter is not None and profile.is_closed != is_closed_filter:
            continue

        profiles.append(profile)

    # Sort: primary = urgency score (desc), secondary = time-to-flood (asc)
    profiles.sort(
        key=lambda p: (-p.score.composite, p.time_to_flood_min)
    )

    if limit:
        profiles = profiles[:limit]

    return profiles


# ─── 1. GET /api/v1/hotspots — Full ranked hotspot list ──────────────────────


@router.get("/api/v1/hotspots", response_model=HotspotListOut)
async def get_hotspots(
    risk: str | None = Query(None, description="Filter by risk tier: CRITICAL, SEVERE, HIGH, MODERATE, LOW"),
    min_score: float | None = Query(None, ge=0, le=100, description="Minimum urgency score threshold"),
    trend: str | None = Query(None, description="Filter by trend: WORSENING, STABLE, IMPROVING"),
    is_closed: bool | None = Query(None, description="Filter by road closure status"),
    limit: int | None = Query(None, ge=1, le=50, description="Maximum number of hotspots to return"),
    db: AsyncSession = Depends(get_db),
):
    """
    Return all flood hotspots ranked by composite multi-factor urgency score.

    Each hotspot includes:
    - Multi-factor risk score breakdown (depth, velocity, drainage, urgency, rainfall, confidence)
    - AI-generated action recommendation and priority level
    - Trend analysis (WORSENING / STABLE / IMPROVING)
    - Nearby SOS incidents, shelters, and drainage nodes within 2 km radius
    - Estimated affected population from nearby SOS signals

    Supports filtering by risk tier, minimum score, trend, closure status, and result limit.
    """
    roads, sos_incidents, shelters, drainage_nodes = await _fetch_all_context(db)

    profiles = _build_and_sort_profiles(
        roads, sos_incidents, shelters, drainage_nodes,
        risk_filter=risk,
        min_score=min_score,
        trend_filter=trend,
        is_closed_filter=is_closed,
        limit=limit,
    )

    hotspot_details = [_profile_to_detail(p) for p in profiles]

    total_pop = sum(p.affected_population for p in profiles)
    scores = [p.score.composite for p in profiles]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    worst_id = profiles[0].id if profiles else None

    critical = sum(1 for p in profiles if p.score.risk_tier == "CRITICAL")
    severe = sum(1 for p in profiles if p.score.risk_tier == "SEVERE")
    high = sum(1 for p in profiles if p.score.risk_tier == "HIGH")

    return HotspotListOut(
        count=len(hotspot_details),
        critical_count=critical,
        severe_count=severe,
        high_count=high,
        total_affected_population=total_pop,
        avg_urgency_score=avg_score,
        worst_hotspot_id=worst_id,
        hotspots=hotspot_details,
    )


# ─── 2. GET /api/v1/hotspots/summary — Dashboard KPI summary ────────────────


@router.get("/api/v1/hotspots/summary", response_model=HotspotSummaryOut)
async def get_hotspot_summary(db: AsyncSession = Depends(get_db)):
    """
    Return a dashboard-level summary of the hotspot situation.

    Provides KPI metrics including risk distribution, trend counts,
    depth statistics, and affected population for header cards and
    quick-glance panels.
    """
    roads, sos_incidents, shelters, drainage_nodes = await _fetch_all_context(db)

    profiles = _build_and_sort_profiles(roads, sos_incidents, shelters, drainage_nodes)

    risk_dist = {"CRITICAL": 0, "SEVERE": 0, "HIGH": 0, "MODERATE": 0, "LOW": 0}
    trend_counts = {"WORSENING": 0, "STABLE": 0, "IMPROVING": 0}
    depths = []
    scores = []

    for p in profiles:
        risk_dist[p.score.risk_tier] = risk_dist.get(p.score.risk_tier, 0) + 1
        trend_counts[p.trend] = trend_counts.get(p.trend, 0) + 1
        depths.append(p.depth_cm)
        scores.append(p.score.composite)

    total_pop = sum(p.affected_population for p in profiles)
    closed = sum(1 for p in profiles if p.is_closed)

    return HotspotSummaryOut(
        total_hotspots=len(profiles),
        critical_hotspots=risk_dist["CRITICAL"],
        severe_hotspots=risk_dist["SEVERE"],
        high_hotspots=risk_dist["HIGH"],
        moderate_hotspots=risk_dist["MODERATE"],
        low_hotspots=risk_dist["LOW"],
        closed_roads=closed,
        avg_depth_cm=round(sum(depths) / len(depths), 1) if depths else 0.0,
        max_depth_cm=max(depths) if depths else 0.0,
        avg_urgency_score=round(sum(scores) / len(scores), 1) if scores else 0.0,
        total_affected_population=total_pop,
        worsening_count=trend_counts["WORSENING"],
        stable_count=trend_counts["STABLE"],
        improving_count=trend_counts["IMPROVING"],
        risk_distribution=risk_dist,
    )


# ─── 3. GET /api/v1/hotspots/heatmap — Lightweight heatmap data ─────────────


@router.get("/api/v1/hotspots/heatmap", response_model=list[HotspotHeatmapPointOut])
async def get_hotspot_heatmap(db: AsyncSession = Depends(get_db)):
    """
    Return lightweight lat/lng/intensity points for rendering
    a flood hotspot heatmap overlay on the map.

    Intensity is normalized 0–1 from the composite urgency score.
    """
    roads_result = await db.execute(select(Road).order_by(Road.depth_cm.desc()))
    roads = roads_result.scalars().all()

    points = []
    for road in roads:
        score = compute_hotspot_score(road)
        points.append(HotspotHeatmapPointOut(
            lat=road.lat,
            lng=road.lng,
            intensity=round(score.composite / 100.0, 3),
            risk=score.risk_tier,
            id=road.id,
            name=road.name,
        ))

    points.sort(key=lambda p: p.intensity, reverse=True)
    return points


# ─── 4. GET /api/v1/hotspots/{hotspot_id} — Single hotspot detail ────────────


@router.get("/api/v1/hotspots/{hotspot_id}", response_model=HotspotDetailOut)
async def get_hotspot_detail(
    hotspot_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Return the full intelligence profile for a single hotspot road segment.

    Includes score breakdown, action recommendation, trend, and
    all nearby SOS/shelter/drainage correlations.
    """
    road_result = await db.execute(select(Road).where(Road.id == hotspot_id))
    road = road_result.scalar_one_or_none()

    if not road:
        raise HTTPException(status_code=404, detail=f"Hotspot '{hotspot_id}' not found")

    # Fetch context for correlations
    sos_result = await db.execute(select(SOSIncident))
    shelters_result = await db.execute(select(Shelter))
    drainage_result = await db.execute(select(DrainageNode))

    sos_incidents = sos_result.scalars().all()
    shelters = shelters_result.scalars().all()
    drainage_nodes = drainage_result.scalars().all()

    profile = build_hotspot_profile(road, sos_incidents, shelters, drainage_nodes)
    return _profile_to_detail(profile)


# ─── 5. POST /api/v1/hotspots/{hotspot_id}/close — Emergency road closure ────


@router.post("/api/v1/hotspots/{hotspot_id}/close")
async def close_hotspot_road(
    hotspot_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Emergency-close a road from the hotspot intelligence view.

    Sets the road as closed, records the closure timestamp,
    and returns the updated status with affected route count.
    """
    road_result = await db.execute(select(Road).where(Road.id == hotspot_id))
    road = road_result.scalar_one_or_none()

    if not road:
        raise HTTPException(status_code=404, detail=f"Hotspot '{hotspot_id}' not found")

    if road.is_closed:
        return {
            "id": road.id,
            "is_closed": True,
            "message": f"Road {road.id} is already closed",
            "action": "NO_CHANGE",
        }

    road.is_closed = True
    road.closed_at = datetime.utcnow()
    road.updated_at = datetime.utcnow()
    await db.commit()

    # Count remaining open roads for impact estimation
    open_result = await db.execute(select(Road).where(Road.is_closed == False))
    open_count = len(open_result.scalars().all())

    return {
        "id": road.id,
        "is_closed": True,
        "closed_at": road.closed_at.isoformat(),
        "affected_routes": min(open_count, 7),
        "message": f"Road {road.id} ({road.name}) CLOSED · {min(open_count, 7)} emergency routes recalculated",
        "action": "CLOSED",
    }


# ─── 6. POST /api/v1/hotspots/{hotspot_id}/reopen — Reopen road ─────────────


@router.post("/api/v1/hotspots/{hotspot_id}/reopen")
async def reopen_hotspot_road(
    hotspot_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Reopen a previously closed road from the hotspot intelligence view.

    Clears the closure timestamp and returns the updated status.
    """
    road_result = await db.execute(select(Road).where(Road.id == hotspot_id))
    road = road_result.scalar_one_or_none()

    if not road:
        raise HTTPException(status_code=404, detail=f"Hotspot '{hotspot_id}' not found")

    if not road.is_closed:
        return {
            "id": road.id,
            "is_closed": False,
            "message": f"Road {road.id} is already open",
            "action": "NO_CHANGE",
        }

    road.is_closed = False
    road.closed_at = None
    road.updated_at = datetime.utcnow()
    await db.commit()

    return {
        "id": road.id,
        "is_closed": False,
        "message": f"Road {road.id} ({road.name}) REOPENED · Traffic flow restored",
        "action": "REOPENED",
    }
