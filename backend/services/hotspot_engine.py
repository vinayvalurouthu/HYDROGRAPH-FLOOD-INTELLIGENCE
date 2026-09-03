"""
HydroGraph Hotspot Intelligence Engine.

Provides multi-factor composite risk scoring, spatial proximity correlation,
trend analysis, and AI-driven action recommendations for flood hotspots.

Scoring Model:
  - Depth Factor        (35%): current depth relative to danger threshold (30 cm)
  - Velocity Factor     (20%): flow speed relative to pedestrian danger (0.5 m/s)
  - Drainage Stress     (15%): drain utilization proximity to overflow
  - Urgency Factor      (15%): inverse of time-to-flood — less time = more urgent
  - Rainfall Intensity  (10%): precipitation rate relative to extreme (100 mm/hr)
  - Confidence Penalty  ( 5%): higher confidence → higher score certainty

The engine also correlates each hotspot with nearby SOS incidents, shelters,
and drainage nodes to produce a full situational awareness profile.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from models import Road, SOSIncident, Shelter, DrainageNode


# ─── Scoring Constants ───────────────────────────────────────────────────────

DEPTH_DANGER_CM = 30.0        # depth above which roads become dangerous
VELOCITY_DANGER_MS = 0.5      # pedestrian-unsafe flow velocity
EXTREME_RAINFALL_MM = 100.0   # mm/hr considered extreme

# Weight allocation (must sum to 1.0)
W_DEPTH = 0.35
W_VELOCITY = 0.20
W_DRAINAGE = 0.15
W_URGENCY = 0.15
W_RAINFALL = 0.10
W_CONFIDENCE = 0.05

# Proximity radius for correlating nearby entities (in km)
NEARBY_RADIUS_KM = 2.0


# ─── Risk Tier Classification ────────────────────────────────────────────────

def classify_risk_tier(score: float) -> str:
    """Classify urgency score into a named risk tier."""
    if score >= 85:
        return "CRITICAL"
    elif score >= 65:
        return "SEVERE"
    elif score >= 45:
        return "HIGH"
    elif score >= 25:
        return "MODERATE"
    return "LOW"


def risk_tier_ordinal(tier: str) -> int:
    """Return a sort-friendly ordinal for risk tiers (higher = worse)."""
    return {"CRITICAL": 5, "SEVERE": 4, "HIGH": 3, "MODERATE": 2, "LOW": 1}.get(tier, 0)


# ─── Haversine Distance ──────────────────────────────────────────────────────

def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate great-circle distance in km between two lat/lng points."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ─── Scoring Engine ──────────────────────────────────────────────────────────

@dataclass
class HotspotScore:
    """Breakdown of all scoring factors for a hotspot."""
    composite: float = 0.0
    depth_factor: float = 0.0
    velocity_factor: float = 0.0
    drainage_factor: float = 0.0
    urgency_factor: float = 0.0
    rainfall_factor: float = 0.0
    confidence_factor: float = 0.0
    risk_tier: str = "LOW"


@dataclass
class NearbyEntity:
    """A nearby SOS incident, shelter, or drainage node."""
    id: str = ""
    name: str = ""
    distance_km: float = 0.0
    entity_type: str = ""      # "SOS" | "SHELTER" | "DRAINAGE"
    status: str = ""
    detail: str = ""


@dataclass
class HotspotProfile:
    """Complete intelligence profile for a single hotspot."""
    id: str = ""
    name: str = ""
    risk: str = "LOW"
    depth_cm: float = 0.0
    peak_depth_cm: float = 0.0
    velocity_ms: float = 0.0
    duration_min: int = 0
    time_to_flood_min: int = 0
    confidence_pct: float = 0.0
    rainfall_mm_hr: float = 0.0
    drain_util_pct: float = 0.0
    cause: list[str] = field(default_factory=list)
    is_closed: bool = False
    lat: float = 0.0
    lng: float = 0.0
    geojson: str | None = None

    # Intelligence layers
    score: HotspotScore = field(default_factory=HotspotScore)
    action_recommendation: str = ""
    action_priority: str = ""
    trend: str = "STABLE"      # WORSENING / STABLE / IMPROVING
    nearby_sos: list[NearbyEntity] = field(default_factory=list)
    nearby_shelters: list[NearbyEntity] = field(default_factory=list)
    nearby_drainage: list[NearbyEntity] = field(default_factory=list)
    affected_population: int = 0


def compute_hotspot_score(road: Road) -> HotspotScore:
    """
    Compute a weighted composite risk score for a road segment.

    Each factor is normalized to [0, 100], then weighted and summed.
    """
    # Depth factor: ratio of current depth to danger threshold, capped at 200%
    depth_f = min(200.0, (road.depth_cm / DEPTH_DANGER_CM) * 100.0)

    # Velocity factor: ratio of flow speed to pedestrian-danger threshold
    velocity_f = min(200.0, (road.velocity_ms / VELOCITY_DANGER_MS) * 100.0)

    # Drainage stress: directly from utilization percentage
    drainage_f = min(100.0, road.drain_util_pct)

    # Urgency: inversely proportional to time-to-flood (less time = higher score)
    # 0 min → 100, 120 min → 0
    ttf = max(0, min(120, road.time_to_flood_min))
    urgency_f = ((120 - ttf) / 120) * 100.0

    # Rainfall intensity relative to extreme
    rainfall_f = min(100.0, (road.rainfall_mm_hr / EXTREME_RAINFALL_MM) * 100.0)

    # Confidence contributes positively (higher confidence = more trustworthy score)
    confidence_f = road.confidence_pct

    # Weighted composite
    composite = (
        W_DEPTH * depth_f
        + W_VELOCITY * velocity_f
        + W_DRAINAGE * drainage_f
        + W_URGENCY * urgency_f
        + W_RAINFALL * rainfall_f
        + W_CONFIDENCE * confidence_f
    )

    # Clamp to 0–100
    composite = round(min(100.0, max(0.0, composite)), 1)

    return HotspotScore(
        composite=composite,
        depth_factor=round(depth_f, 1),
        velocity_factor=round(velocity_f, 1),
        drainage_factor=round(drainage_f, 1),
        urgency_factor=round(urgency_f, 1),
        rainfall_factor=round(rainfall_f, 1),
        confidence_factor=round(confidence_f, 1),
        risk_tier=classify_risk_tier(composite),
    )


def generate_action_recommendation(road: Road, score: HotspotScore) -> tuple[str, str]:
    """
    Generate an AI-style action recommendation and priority level.

    Returns (recommendation_text, priority_level).
    """
    tier = score.risk_tier

    if tier == "CRITICAL":
        if road.is_closed:
            action = (
                f"MAINTAIN CLOSURE — Active severe flooding ({road.depth_cm} cm, "
                f"{road.velocity_ms} m/s). Deploy sandbag barriers and pumping crew. "
                f"Drainage at {road.drain_util_pct}% capacity."
            )
        else:
            action = (
                f"CLOSE IMMEDIATELY — Severe flooding imminent in {road.time_to_flood_min} min. "
                f"Current depth {road.depth_cm} cm, flow velocity {road.velocity_ms} m/s. "
                f"Drainage system at {road.drain_util_pct}% — activate emergency pumps."
            )
        priority = "P0 — IMMEDIATE"

    elif tier == "SEVERE":
        action = (
            f"RESTRICT TRAFFIC — Depth projected to reach {road.peak_depth_cm} cm. "
            f"Reroute emergency vehicles via flood-safe corridors. "
            f"Monitor drain utilization ({road.drain_util_pct}%). "
            f"Pre-position barriers within {max(5, road.time_to_flood_min - 10)} min."
        )
        priority = "P1 — URGENT"

    elif tier == "HIGH":
        action = (
            f"AVOID AFTER +{road.time_to_flood_min} min — Depth will exceed safe threshold. "
            f"Alert commuters and emergency dispatch. "
            f"Inspect nearest drainage nodes for blockages."
        )
        priority = "P2 — HIGH"

    elif tier == "MODERATE":
        action = (
            f"MONITOR — Moderate risk with {road.depth_cm} cm depth. "
            f"Time to critical: {road.time_to_flood_min} min. "
            f"No immediate closure needed but keep under surveillance."
        )
        priority = "P3 — MODERATE"

    else:
        action = (
            f"NORMAL OPERATIONS — Low risk. Depth {road.depth_cm} cm, "
            f"drain utilization {road.drain_util_pct}%. Routine monitoring sufficient."
        )
        priority = "P4 — LOW"

    return action, priority


def estimate_trend(road: Road) -> str:
    """
    Estimate whether the hotspot situation is worsening, stable, or improving.

    Heuristic based on peak-vs-current depth and time-to-flood.
    """
    depth_ratio = road.depth_cm / max(1, road.peak_depth_cm)

    if depth_ratio >= 0.85 and road.time_to_flood_min <= 20:
        return "WORSENING"
    elif depth_ratio >= 0.7 and road.time_to_flood_min <= 40:
        return "WORSENING"
    elif depth_ratio <= 0.4:
        return "IMPROVING"
    return "STABLE"


def find_nearby_sos(
    road: Road,
    sos_incidents: list[SOSIncident],
    radius_km: float = NEARBY_RADIUS_KM,
) -> list[NearbyEntity]:
    """Find SOS incidents within radius of a road's coordinates."""
    nearby = []
    for sos in sos_incidents:
        dist = haversine_km(road.lat, road.lng, sos.lat, sos.lng)
        if dist <= radius_km:
            nearby.append(NearbyEntity(
                id=sos.id,
                name=sos.location,
                distance_km=round(dist, 2),
                entity_type="SOS",
                status=sos.status,
                detail=f"{sos.people} people, {sos.priority} priority",
            ))
    nearby.sort(key=lambda e: e.distance_km)
    return nearby


def find_nearby_shelters(
    road: Road,
    shelters: list[Shelter],
    radius_km: float = NEARBY_RADIUS_KM,
) -> list[NearbyEntity]:
    """Find shelters within radius of a road's coordinates."""
    nearby = []
    for sh in shelters:
        dist = haversine_km(road.lat, road.lng, sh.lat, sh.lng)
        if dist <= radius_km:
            occ_pct = round((sh.occupancy / max(1, sh.capacity)) * 100)
            nearby.append(NearbyEntity(
                id=sh.id,
                name=sh.name,
                distance_km=round(dist, 2),
                entity_type="SHELTER",
                status=sh.status,
                detail=f"{occ_pct}% occupied ({sh.occupancy}/{sh.capacity})",
            ))
    nearby.sort(key=lambda e: e.distance_km)
    return nearby


def find_nearby_drainage(
    road: Road,
    drainage_nodes: list[DrainageNode],
    radius_km: float = NEARBY_RADIUS_KM,
) -> list[NearbyEntity]:
    """Find drainage nodes within radius of a road's coordinates."""
    nearby = []
    for dn in drainage_nodes:
        dist = haversine_km(road.lat, road.lng, dn.lat, dn.lng)
        if dist <= radius_km:
            nearby.append(NearbyEntity(
                id=dn.id,
                name=dn.name,
                distance_km=round(dist, 2),
                entity_type="DRAINAGE",
                status=dn.status,
                detail=f"{dn.utilization_pct}% utilization ({dn.flow_ls}/{dn.capacity_ls} L/s)",
            ))
    nearby.sort(key=lambda e: e.distance_km)
    return nearby


def build_hotspot_profile(
    road: Road,
    sos_incidents: list[SOSIncident] | None = None,
    shelters: list[Shelter] | None = None,
    drainage_nodes: list[DrainageNode] | None = None,
) -> HotspotProfile:
    """
    Build a complete intelligence profile for a road hotspot.

    Combines risk scoring, action recommendations, trend analysis,
    and spatial proximity correlations into a single profile.
    """
    score = compute_hotspot_score(road)
    action_text, action_priority = generate_action_recommendation(road, score)
    trend = estimate_trend(road)

    # Spatial correlations
    nearby_sos = find_nearby_sos(road, sos_incidents or [])
    nearby_sh = find_nearby_shelters(road, shelters or [])
    nearby_dn = find_nearby_drainage(road, drainage_nodes or [])

    # Estimate affected population from nearby SOS
    affected_pop = sum(
        int(e.detail.split(" ")[0]) for e in nearby_sos
        if e.detail and e.detail[0].isdigit()
    )

    return HotspotProfile(
        id=road.id,
        name=road.name,
        risk=road.risk_level,
        depth_cm=road.depth_cm,
        peak_depth_cm=road.peak_depth_cm,
        velocity_ms=road.velocity_ms,
        duration_min=road.duration_min,
        time_to_flood_min=road.time_to_flood_min,
        confidence_pct=road.confidence_pct,
        rainfall_mm_hr=road.rainfall_mm_hr,
        drain_util_pct=road.drain_util_pct,
        cause=road.cause or [],
        is_closed=road.is_closed,
        lat=road.lat,
        lng=road.lng,
        geojson=road.geojson,
        score=score,
        action_recommendation=action_text,
        action_priority=action_priority,
        trend=trend,
        nearby_sos=nearby_sos,
        nearby_shelters=nearby_sh,
        nearby_drainage=nearby_dn,
        affected_population=affected_pop,
    )
