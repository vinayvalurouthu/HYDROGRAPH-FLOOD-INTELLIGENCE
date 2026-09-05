/**
 * HydroGraph API Client Service
 * Connects frontend UI components to the FastAPI backend endpoints with fallback to local mock data.
 */

import * as mock from "../mockData";
import type {
  Road,
  SOSIncident,
  RescueTeam,
  Shelter,
  DrainageNode,
  SystemService,
  ForecastPoint,
  ScenarioResult,
  Alert,
  KPIData,
} from "../mockData";

const API_BASE = "/api";

async function fetchJSON<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (fallback !== undefined) {
      console.warn(`[HydroGraph API] Fallback used for ${url}:`, err);
      return fallback;
    }
    throw err;
  }
}

// ─── 1. Map & Roads ──────────────────────────────────────────────────────────

export async function getRoads(): Promise<Road[]> {
  return fetchJSON<Road[]>(`${API_BASE}/roads`, undefined, mock.roads);
}

export async function getRoad(id: string): Promise<Road | undefined> {
  return fetchJSON<Road>(
    `${API_BASE}/roads/${id}`,
    undefined,
    mock.roads.find((r) => r.id === id)
  );
}

export async function toggleRoadClosure(
  roadId: string,
  isClosed: boolean
): Promise<{ id: string; is_closed: boolean; message: string }> {
  return fetchJSON(
    `${API_BASE}/roads/${roadId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_closed: isClosed }),
    },
    {
      id: roadId,
      is_closed: isClosed,
      message: `Road ${roadId} ${isClosed ? "CLOSED" : "REOPENED"} (local mode)`,
    }
  );
}

// ─── Hotspot Intelligence Types ──────────────────────────────────────────────

export interface HotspotScore {
  composite: number;
  depth_factor: number;
  velocity_factor: number;
  drainage_factor: number;
  urgency_factor: number;
  rainfall_factor: number;
  confidence_factor: number;
  risk_tier: string;
}

export interface NearbyEntity {
  id: string;
  name: string;
  distance_km: number;
  entity_type: string;
  status: string;
  detail: string;
}

export interface HotspotDetail {
  id: string;
  name: string;
  risk: string;
  depthCm: number;
  peakDepthCm: number;
  velocityMs: number;
  durationMin: number;
  timeToFloodMin: number;
  confidencePct: number;
  rainfallMmHr: number;
  drainUtilPct: number;
  cause: string[];
  is_closed: boolean;
  lat: number;
  lng: number;
  geojson?: string | null;
  score: HotspotScore;
  actionRecommendation: string;
  actionPriority: string;
  trend: string;
  nearbySOS: NearbyEntity[];
  nearbyShelters: NearbyEntity[];
  nearbyDrainage: NearbyEntity[];
  affectedPopulation: number;
}

export interface HotspotListResponse {
  count: number;
  critical_count: number;
  severe_count: number;
  high_count: number;
  total_affected_population: number;
  avg_urgency_score: number;
  worst_hotspot_id: string | null;
  hotspots: HotspotDetail[];
}

export interface HotspotSummary {
  total_hotspots: number;
  critical_hotspots: number;
  severe_hotspots: number;
  high_hotspots: number;
  moderate_hotspots: number;
  low_hotspots: number;
  closed_roads: number;
  avg_depth_cm: number;
  max_depth_cm: number;
  avg_urgency_score: number;
  total_affected_population: number;
  worsening_count: number;
  stable_count: number;
  improving_count: number;
  risk_distribution: Record<string, number>;
}

// ─── Hotspot API Functions ───────────────────────────────────────────────────

export async function getHotspots(
  risk?: string,
  minScore?: number,
  limit?: number,
): Promise<HotspotListResponse> {
  const params = new URLSearchParams();
  if (risk) params.set("risk", risk);
  if (minScore !== undefined) params.set("min_score", String(minScore));
  if (limit !== undefined) params.set("limit", String(limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return fetchJSON<HotspotListResponse>(
    `${API_BASE}/v1/hotspots${qs}`,
    undefined,
    {
      count: mock.roads.length,
      critical_count: mock.roads.filter((r) => r.risk === "SEVERE").length,
      severe_count: mock.roads.filter((r) => r.risk === "SEVERE").length,
      high_count: mock.roads.filter((r) => r.risk === "HIGH").length,
      total_affected_population: 0,
      avg_urgency_score: 0,
      worst_hotspot_id: null,
      hotspots: mock.roads.map((r) => ({
        ...r,
        is_closed: r.closed,
        score: { composite: 0, depth_factor: 0, velocity_factor: 0, drainage_factor: 0, urgency_factor: 0, rainfall_factor: 0, confidence_factor: 0, risk_tier: r.risk },
        actionRecommendation: "",
        actionPriority: "",
        trend: "STABLE",
        nearbySOS: [],
        nearbyShelters: [],
        nearbyDrainage: [],
        affectedPopulation: 0,
      })),
    },
  );
}

export async function getHotspotDetail(id: string): Promise<HotspotDetail | null> {
  return fetchJSON<HotspotDetail>(
    `${API_BASE}/v1/hotspots/${id}`,
    undefined,
    null as unknown as HotspotDetail,
  );
}

export async function getHotspotSummary(): Promise<HotspotSummary> {
  return fetchJSON<HotspotSummary>(
    `${API_BASE}/v1/hotspots/summary`,
    undefined,
    {
      total_hotspots: 0,
      critical_hotspots: 0,
      severe_hotspots: 0,
      high_hotspots: 0,
      moderate_hotspots: 0,
      low_hotspots: 0,
      closed_roads: 0,
      avg_depth_cm: 0,
      max_depth_cm: 0,
      avg_urgency_score: 0,
      total_affected_population: 0,
      worsening_count: 0,
      stable_count: 0,
      improving_count: 0,
      risk_distribution: {},
    },
  );
}

export async function closeHotspotRoad(id: string) {
  const r = mock.roads.find(road => road.id === id);
  if (r) r.closed = true;
  return fetchJSON(
    `${API_BASE}/v1/hotspots/${id}/close`,
    { method: "POST" },
    { id, is_closed: true, message: `Road ${id} CLOSED (local mode)`, action: "CLOSED" },
  );
}

export async function reopenHotspotRoad(id: string) {
  const r = mock.roads.find(road => road.id === id);
  if (r) r.closed = false;
  return fetchJSON(
    `${API_BASE}/v1/hotspots/${id}/reopen`,
    { method: "POST" },
    { id, is_closed: false, message: `Road ${id} REOPENED (local mode)`, action: "REOPENED" },
  );
}

export async function getForecastTimeline(): Promise<ForecastPoint[]> {
  return fetchJSON<ForecastPoint[]>(`${API_BASE}/forecast/timeline`, undefined, mock.forecastTimeline);
}

export async function getCurrentWeather() {
  return fetchJSON(`${API_BASE}/weather/current`, undefined, {
    rainfall_mm_hr: 76,
    temperature_c: 29.4,
    humidity_pct: 88,
    wind_speed_ms: 6.2,
    description: "Heavy Monsoon Rain",
    icon: "10d",
  });
}

// ─── 2. SOS & Dispatch ───────────────────────────────────────────────────────

export async function getSOSIncidents(status?: string): Promise<SOSIncident[]> {
  const q = status ? `?status=${status}` : "";
  return fetchJSON<SOSIncident[]>(`${API_BASE}/v1/sos${q}`, undefined, mock.sosIncidents);
}

export async function getSOSPriorityQueue(): Promise<SOSIncident[]> {
  return fetchJSON<SOSIncident[]>(`${API_BASE}/v1/sos/priority`, undefined, mock.sosIncidents);
}

export async function createSOSAlert(data: Partial<SOSIncident>): Promise<SOSIncident> {
  return fetchJSON<SOSIncident>(
    `${API_BASE}/v1/sos`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    {
      id: `#${Math.floor(10300 + Math.random() * 500)}`,
      priority: data.medical ? "CRITICAL" : "HIGH",
      location: data.location || "Patna Region",
      people: data.people || 1,
      children: data.children || 0,
      elderly: data.elderly || 0,
      medical: data.medical || false,
      waterDepthM: data.waterDepthM || 0.6,
      waitingMin: 1,
      status: "RECEIVED",
      floodRisk: "HIGH",
      lat: data.lat || 25.6093,
      lng: data.lng || 85.1376,
      timestamps: [{ status: "SOS received", time: "Just now" }],
    }
  );
}

export async function updateSOSStatus(incidentId: string, status: string): Promise<SOSIncident> {
  const encId = encodeURIComponent(incidentId);
  return fetchJSON<SOSIncident>(
    `${API_BASE}/v1/sos/${encId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
    mock.sosIncidents[0]
  );
}

export async function assignRescueTeam(incidentId: string, teamId: string) {
  return fetchJSON(
    `${API_BASE}/v1/rescue/assign`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incident_id: incidentId, team_id: teamId }),
    },
    { success: true, message: `Team ${teamId} assigned to ${incidentId}` }
  );
}

// ─── 3. Rescue Teams ─────────────────────────────────────────────────────────

export async function getRescueTeams(status?: string): Promise<RescueTeam[]> {
  const q = status ? `?status=${status}` : "";
  return fetchJSON<RescueTeam[]>(`${API_BASE}/v1/rescue/teams${q}`, undefined, mock.rescueTeams);
}

// ─── 4. Shelters ─────────────────────────────────────────────────────────────

export async function getShelters(): Promise<Shelter[]> {
  return fetchJSON<Shelter[]>(`${API_BASE}/v1/shelters`, undefined, mock.shelters);
}

export async function getSafeShelters(): Promise<Shelter[]> {
  return fetchJSON<Shelter[]>(`${API_BASE}/v1/shelters/safe`, undefined, mock.shelters.filter((s) => s.floodRisk === "LOW"));
}

export async function updateShelterOccupancy(shelterId: string, occupancy: number) {
  return fetchJSON<Shelter>(
    `${API_BASE}/v1/shelters/${shelterId}/occupancy`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occupancy }),
    },
    mock.shelters[0]
  );
}

// ─── 5. Drainage ─────────────────────────────────────────────────────────────

export async function getDrainageStatus() {
  return fetchJSON(
    `${API_BASE}/v1/drainage/status`,
    undefined,
    {
      total_nodes: mock.drainageNodes.length,
      critical_nodes: mock.drainageNodes.filter((n) => n.status === "CRITICAL").length,
      stressed_nodes: mock.drainageNodes.filter((n) => n.status === "STRESSED").length,
      avg_utilization_pct: 73.4,
      nodes: mock.drainageNodes,
    }
  );
}

export async function getDrainageAnomalies() {
  return fetchJSON(`${API_BASE}/v1/drainage/anomalies`, undefined, []);
}

export async function requestFieldInspection(nodeId: string) {
  return fetchJSON(
    `${API_BASE}/v1/drainage/nodes/${encodeURIComponent(nodeId)}/inspect`,
    { method: "POST" },
    {
      status: "success",
      node_id: nodeId,
      action: "FIELD_INSPECTION_DISPATCHED",
      message: `Field inspection team dispatched for junction ${nodeId} (local mode).`,
    }
  );
}


// ─── 6. Routing ──────────────────────────────────────────────────────────────

export async function calculateRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  vehicleType: string = "Rescue Van",
  avoidFlooded: boolean = true
) {
  return fetchJSON(
    `${API_BASE}/v1/route`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin,
        destination,
        vehicle_type: vehicleType,
        avoid_flooded: avoidFlooded,
      }),
    },
    null
  );
}

// ─── 7. Scenario Simulation ──────────────────────────────────────────────────

export async function runScenarioSimulation(
  rainfallPct: number,
  drainagePct: number,
  riverLevel: string,
  sluiceGatePct: number = 100
): Promise<ScenarioResult> {
  return fetchJSON<ScenarioResult>(
    `${API_BASE}/v1/scenario/run`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rainfall_pct: rainfallPct,
        drainage_pct: drainagePct,
        river_level: riverLevel,
        sluice_gate_open_pct: sluiceGatePct,
      }),
    },
    mock.runScenario(rainfallPct, drainagePct, riverLevel)
  );
}

// ─── 8. Historical Replay ────────────────────────────────────────────────────

export async function getHistoricalEvents() {
  return fetchJSON(`${API_BASE}/v1/replay/events`, undefined, mock.historicalEvents);
}

export async function getHistoricalEventDetail(eventId: string) {
  return fetchJSON(`${API_BASE}/v1/replay/events/${eventId}`, undefined, {
    ...mock.historicalEvents[0],
    timeline: [],
  });
}

// ─── 9. System Telemetry & KPIs ──────────────────────────────────────────────

export async function getSystemHealth() {
  return fetchJSON(`${API_BASE}/v1/system/health`, undefined, {
    overall_status: "HEALTHY",
    healthy_services: 8,
    total_services: 9,
    avg_latency_ms: 780,
    uptime_pct: 99.82,
    services: mock.systemServices,
  });
}

export async function getExecutiveKPIs(): Promise<KPIData> {
  return fetchJSON<KPIData>(`${API_BASE}/v1/kpis`, undefined, mock.kpiData);
}

export async function getAlerts(): Promise<Alert[]> {
  return fetchJSON<Alert[]>(`${API_BASE}/v1/alerts`, undefined, mock.alerts);
}

export async function markAlertRead(alertId: string) {
  return fetchJSON(`${API_BASE}/v1/alerts/${alertId}/read`, { method: "PATCH" }, { id: alertId, read: true });
}

export async function getAnalyticsOverview() {
  return fetchJSON(`${API_BASE}/v1/analytics/overview`, undefined, mock.analyticsData);
}
