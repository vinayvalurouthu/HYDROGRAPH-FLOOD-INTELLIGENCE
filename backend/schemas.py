"""
Pydantic schemas for request/response validation across all HydroGraph domains.
These match frontend TypeScript interfaces in mockData.ts and the PRD API specifications.
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


# ─── 1. Road & Live Map ────────────────────────────────────────────────────────


class RoadOut(BaseModel):
    """Response schema for a road segment — matches frontend Road interface."""

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

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
    cause: list[str] = Field(default_factory=list)
    closed: bool
    lat: float
    lng: float
    geojson: str | None = None


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


# ─── 2. Flood Zone ─────────────────────────────────────────────────────────────


class FloodZoneOut(BaseModel):
    """A flood depth polygon for map rendering."""

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    severity: str
    geojson: str  # GeoJSON Polygon as string
    depth_cm: float
    forecast_step: int


# ─── 3. Drainage ───────────────────────────────────────────────────────────────


class DrainageNodeOut(BaseModel):
    """Response schema for a drainage node — matches frontend DrainageNode interface."""

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    name: str
    utilizationPct: float
    capacityLs: float
    flowLs: float
    status: str  # NORMAL / STRESSED / CRITICAL
    anomaly: str | None = None
    confidencePct: float
    lat: float
    lng: float
    x: float = 0.0
    y: float = 0.0


class DrainageStatusOut(BaseModel):
    """Network-wide summary of drainage health."""

    total_nodes: int
    critical_nodes: int
    stressed_nodes: int
    avg_utilization_pct: float
    nodes: list[DrainageNodeOut]


class DrainageAnomalyOut(BaseModel):
    """Drainage anomaly alert item."""

    node_id: str
    node_name: str
    severity: str
    anomaly_type: str
    description: str
    utilization_pct: float
    confidence_pct: float


# ─── 4. Forecast Timeline ─────────────────────────────────────────────────────


class ForecastPointOut(BaseModel):
    """A single forecast time step — matches frontend ForecastPoint interface."""

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    time: str
    depthCm: float
    risk: str
    confidencePct: float


# ─── 5. Weather (external API) ────────────────────────────────────────────────


class WeatherOut(BaseModel):
    """Current weather data from OpenWeatherMap."""

    rainfall_mm_hr: float
    temperature_c: float
    humidity_pct: float
    wind_speed_ms: float
    description: str
    icon: str


# ─── 6. Map Config ────────────────────────────────────────────────────────────


class MapConfigOut(BaseModel):
    """Initial map configuration for the frontend."""

    center_lat: float
    center_lng: float
    zoom: int
    maptiler_key: str


# ─── 7. SOS Incidents & Emergency Dispatch ─────────────────────────────────────


class TimestampItem(BaseModel):
    status: str
    time: str


class SOSIncidentOut(BaseModel):
    """Response schema for an SOS emergency incident."""

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    priority: str  # CRITICAL / HIGH / MODERATE
    location: str
    people: int
    children: int
    elderly: int
    medical: bool
    waterDepthM: float
    waitingMin: int
    status: str  # RECEIVED / VERIFIED / ASSIGNED / EN_ROUTE / RESCUED / CLOSED
    floodRisk: str
    lat: float
    lng: float
    timestamps: list[TimestampItem] = Field(default_factory=list)
    assignedTeam: str | None = None
    contact_phone: str | None = None


class SOSCreateRequest(BaseModel):
    """Citizen or operator SOS alert intake payload."""

    location: str
    lat: float
    lng: float
    people: int = 1
    children: int = 0
    elderly: int = 0
    medical: bool = False
    water_depth_m: float = 0.5
    contact_phone: str | None = None
    notes: str | None = None


class SOSStatusUpdateRequest(BaseModel):
    """Status transition request for an SOS incident."""

    status: str  # RECEIVED / VERIFIED / ASSIGNED / EN_ROUTE / RESCUED / CLOSED
    note: str | None = None


class SOSAssignRequest(BaseModel):
    """Dispatch/assign a rescue team to an SOS incident."""

    incident_id: str
    team_id: str


# ─── 8. Rescue Teams ──────────────────────────────────────────────────────────


class RescueTeamOut(BaseModel):
    """Response schema for a rescue response team."""

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    name: str
    status: str  # AVAILABLE / EN_ROUTE / ON_SCENE / RETURNING
    distanceKm: float
    etaMin: int
    vehicle: str
    capacity: int
    routeSafety: str  # SAFE / HIGH / MODERATE
    assignedSOS: str | None = None
    lat: float = 0.0
    lng: float = 0.0
    contact_phone: str | None = None


class RescueTeamUpdateRequest(BaseModel):
    """Update team status or location."""

    status: str | None = None
    lat: float | None = None
    lng: float | None = None
    assigned_sos: str | None = None


# ─── 9. Shelters ──────────────────────────────────────────────────────────────


class ShelterOut(BaseModel):
    """Response schema for an emergency evacuation shelter."""

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    name: str
    address: str
    capacity: int
    occupancy: int
    status: str  # OPEN / NEAR_FULL / FULL / UNAVAILABLE
    floodRisk: str
    distanceKm: float
    etaMin: int
    medical: bool
    food: bool
    water: bool
    power: bool
    accessibility: bool
    lastUpdated: str
    recommended: bool = False
    lat: float = 0.0
    lng: float = 0.0


class ShelterOccupancyUpdateRequest(BaseModel):
    """Update shelter head count & status."""

    occupancy: int
    status: str | None = None


# ─── 10. Flood-Aware Routing Engine ──────────────────────────────────────────


class LatLng(BaseModel):
    lat: float
    lng: float


class RouteRequest(BaseModel):
    """Input payload for flood-aware pathfinding."""

    origin: LatLng
    destination: LatLng
    vehicle_type: str = "Rescue Van"  # Rescue Van / Inflatable Boat / Motor Boat / 4x4 / Light Vehicle
    avoid_flooded: bool = True
    max_depth_cm: float = 30.0


class RouteStep(BaseModel):
    instruction: str
    road_name: str
    distance_m: float
    duration_s: float
    depth_cm: float
    risk_level: str
    is_safe: bool


class RouteOption(BaseModel):
    route_id: str
    title: str  # e.g. "Primary Safe Route (Flood-Avoidant)"
    total_distance_km: float
    eta_min: int
    max_depth_cm: float
    risk_level: str
    safety_rating: str  # SAFE / CAUTION / HAZARDOUS
    coordinates: list[list[float]]  # [[lng, lat], ...]
    steps: list[RouteStep]
    warnings: list[str] = Field(default_factory=list)


class RouteResponse(BaseModel):
    primary_route: RouteOption
    alternative_route: RouteOption | None = None
    recommended_shelter_id: str | None = None
    calculated_at: str


# ─── 11. Scenario Simulation Engine ──────────────────────────────────────────


class ScenarioRequest(BaseModel):
    """Parameters for running what-if hydrodynamic flood simulation."""

    rainfall_pct: int = 100  # 50% to 200%
    drainage_pct: int = 100  # 0% to 100%
    river_level: str = "NORMAL"  # NORMAL / WARNING / DANGER / EXTREME
    sluice_gate_open_pct: int = 100


class ScenarioResultOut(BaseModel):
    """Predicted delta impacts from scenario simulation."""

    floodedRoadsDelta: int
    peakDepthDeltaCm: int
    floodedAreaPct: int
    timeToFloodDeltaMin: int
    affectedSheltersDelta: int
    sosExposurePct: int
    high_risk_roads: list[str] = Field(default_factory=list)
    impact_summary: str


# ─── 12. Historical Replay ────────────────────────────────────────────────────


class HistoricalReplayStep(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    time_offset: str  # "00:00", "+01:00", "+02:00"
    rainfall_mm_hr: float
    peak_depth_cm: float
    flooded_roads_count: int
    sos_count: int
    model_accuracy_pct: float
    active_hazard_areas: list[str] = Field(default_factory=list)


class HistoricalEventOut(BaseModel):
    """Archived historical flood event metadata."""

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    name: str
    date: str
    duration: str
    peakDepthCm: float
    floodedRoads: int
    sosCount: int
    accuracy: float
    description: str | None = None


class HistoricalEventDetailOut(HistoricalEventOut):
    """Historical flood event with timeline replay frames."""

    timeline: list[HistoricalReplayStep] = Field(default_factory=list)


# ─── 13. System Health & Diagnostics ──────────────────────────────────────────


class SystemServiceOut(BaseModel):
    """Status of an ingestion / computation microservice."""

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    name: str
    status: str  # HEALTHY / DEGRADED / OFFLINE
    latencyMs: int
    errorRate: float
    lastUpdate: str
    dataFreshnessSec: int
    componentType: str | None = None


class SystemHealthSummaryOut(BaseModel):
    overall_status: str  # HEALTHY / DEGRADED / CRITICAL
    healthy_services: int
    total_services: int
    avg_latency_ms: float
    uptime_pct: float
    services: list[SystemServiceOut]


# ─── 14. Alerts & KPIs ────────────────────────────────────────────────────────


class AlertOut(BaseModel):
    """Operational alert notice."""

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    type: str  # CRITICAL / WARNING / INFO / SUCCESS
    title: str
    message: str
    time: str
    read: bool
    roadId: str | None = None


class AlertMarkReadResponse(BaseModel):
    id: str
    read: bool
    message: str


class KPIDataOut(BaseModel):
    """Top-level command center KPIs."""

    floodRisk: str
    criticalRoads: int
    sosIncidents: int
    peakDepthCm: float
    timeToCriticalMin: int
    activeRescueTeams: int
    rainfallMmHr: float
    confidencePct: float
    affectedPopulation: int
    shelterCapacityPct: int


class AnalyticsOverviewOut(BaseModel):
    """Analytics overview page metrics & hourly flood progression."""

    floodedRoads: int
    peakDepthCm: float
    maxVelocityMs: float
    floodDurationMin: int
    affectedPopulation: int
    shelterUtilizationPct: float
    sosCount: int
    rescueResponseMin: float
    modelConfidencePct: float
    historicalAccuracyPct: float
    hourlyFlood: list[dict]
