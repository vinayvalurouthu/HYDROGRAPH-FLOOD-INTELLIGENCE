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

import { PRESET_CITIES, generatePresetCityData } from "./cityDataGenerator";

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
      hotspots: mock.roads.map((r) => {
        const depth_factor = Math.min(35, (r.depthCm / 100) * 35);
        const velocity_factor = Math.min(20, (r.velocityMs / 2) * 20);
        const drainage_factor = Math.min(15, ((r as any).drainUtilPct || 70) / 100 * 15);
        const urgency_factor = Math.min(15, Math.max(0, (1 - ((r as any).timeToFloodMin || 30) / 60) * 15));
        const rainfall_factor = Math.min(10, (((r as any).rainfallMmHr || 90) / 100) * 10);
        const confidence_factor = Math.min(5, (((r as any).confidencePct || 85) / 100) * 5);
        const composite = Math.round(depth_factor + velocity_factor + drainage_factor + urgency_factor + rainfall_factor + confidence_factor);
        return {
          ...r,
          is_closed: r.closed,
          score: {
            composite,
            depth_factor: Math.round(depth_factor),
            velocity_factor: Math.round(velocity_factor),
            drainage_factor: Math.round(drainage_factor),
            urgency_factor: Math.round(urgency_factor),
            rainfall_factor: Math.round(rainfall_factor),
            confidence_factor: Math.round(confidence_factor),
            risk_tier: r.risk
          },
          actionRecommendation: r.risk === "SEVERE" ? "CLOSE IMMEDIATELY" : r.risk === "HIGH" ? "MONITOR" : "OBSERVE",
          actionPriority: r.risk === "SEVERE" ? "CRITICAL" : "MODERATE",
          trend: "STABLE",
          nearbySOS: [],
          nearbyShelters: [],
          nearbyDrainage: [],
          affectedPopulation: 0,
        };
      }),
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

export const submitSOSReport = async (payload: any) => {
  return createSOSAlert({
    people: payload.victimCount || payload.people || 1,
    children: payload.childrenCount || payload.children || 0,
    elderly: payload.elderlyCount || payload.elderly || 0,
    medical: payload.hasMedical || payload.medical || false,
    waterDepthM: (payload.reportedWaterDepthCm || 60) / 100,
    lat: payload.lat,
    lng: payload.lng,
    location: payload.locationName || payload.location || "Patna Command Sector"
  });
};

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

export async function getDrainageStatus(cityId?: string) {
  const qs = cityId ? `?city_id=${encodeURIComponent(cityId)}` : "";
  const city = PRESET_CITIES.find((c) => c.id === cityId);
  const fallbackNodes = city ? generatePresetCityData(city).drainageNodes : mock.drainageNodes;

  return fetchJSON(
    `${API_BASE}/v1/drainage/status${qs}`,
    undefined,
    {
      total_nodes: fallbackNodes.length,
      critical_nodes: fallbackNodes.filter((n) => n.status === "CRITICAL").length,
      stressed_nodes: fallbackNodes.filter((n) => n.status === "STRESSED").length,
      avg_utilization_pct: 73.4,
      nodes: fallbackNodes,
    }
  );
}

export async function getDrainageAnomalies() {
  return fetchJSON(`${API_BASE}/v1/drainage/anomalies`, undefined, []);
}

export async function requestFieldInspection(nodeId: string) {
  const res = await fetchJSON(
    `${API_BASE}/v1/drainage/nodes/${encodeURIComponent(nodeId)}/inspect`,
    { method: "POST" },
    {
      status: "success",
      node_id: nodeId,
      action: "FIELD_INSPECTION_DISPATCHED",
      message: `Field inspection team dispatched for junction ${nodeId} (local mode).`,
    }
  );

  // Sync local mock data state for immediate cross-component reactivity
  const node = mock.drainageNodes.find((n) => n.id === nodeId);
  const nodeName = node ? node.name : nodeId;
  const teamId = `RT-${nodeId}`;

  let team = mock.rescueTeams.find((t) => t.id === teamId);
  if (!team) {
    const newTeam: RescueTeam = {
      id: teamId,
      name: `Drainage Clearance Unit (${nodeId})`,
      status: "EN_ROUTE",
      distanceKm: 2.1,
      etaMin: 10,
      vehicle: "Drainage Service Truck",
      capacity: 4,
      routeSafety: "SAFE",
      assignedSOS: `INSP-${nodeId}`,
    };
    team = newTeam;
    mock.rescueTeams.unshift(newTeam); // Add as new team at TOP of list
  } else {
    team.status = "EN_ROUTE";
    team.assignedSOS = `INSP-${nodeId}`;
  }

  const existingSOS = mock.sosIncidents.find((s) => s.id === `INSP-${nodeId}`);
  if (!existingSOS) {
    mock.sosIncidents.unshift({
      id: `INSP-${nodeId}`,
      priority: node?.status === "CRITICAL" ? "CRITICAL" : "HIGH",
      location: `Drainage Junction ${nodeName}`,
      people: 0,
      children: 0,
      elderly: 0,
      medical: false,
      waterDepthM: Number(((node?.flowLs || 77) / 100).toFixed(2)),
      waitingMin: 1,
      status: "ASSIGNED",
      floodRisk: node?.status === "CRITICAL" ? "SEVERE" : "HIGH",
      lat: node?.lat || 25.606,
      lng: node?.lng || 85.152,
      timestamps: [
        { status: "Drainage Inspection Dispatched", time: "Just now" },
        { status: "Clearance Team En Route", time: "Just now" },
      ],
      assignedTeam: teamId,
    });
  }

  mock.alerts.unshift({
    id: `alt-${Date.now()}`,
    type: "CRITICAL",
    title: `URGENT DISPATCH: ${nodeName}`,
    message: `Rescue & Clearance Unit assigned to junction ${nodeId}. Priority inspection en route.`,
    time: "Just now",
    read: false,
  });

  return res;
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

export async function getHistoricalEventCompare(eventId: string) {
  return fetchJSON(`${API_BASE}/v1/replay/events/${eventId}/compare`, undefined, null);
}

export async function getHistoricalEventSimulation(eventId: string) {
  return fetchJSON(`${API_BASE}/v1/replay/events/${eventId}/simulation`, undefined, null);
}

export async function getReplayBenchmarks() {
  return fetchJSON(`${API_BASE}/v1/replay/benchmarks`, undefined, null);
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

export async function retestSystemHealth() {
  return fetchJSON(`${API_BASE}/v1/system/retest`, { method: "POST" }, null);
}

export async function getSystemMetrics() {
  return fetchJSON(`${API_BASE}/v1/system/metrics`, undefined, {
    cpu_usage_pct: 28.4,
    memory_usage_pct: 42.1,
    database_conn_pool: { active: 4, idle: 16, max: 20 },
    radar_ingestion_rate_mb_s: 8.4,
    active_spatial_queries_per_sec: 42,
    gnn_inference_latency_p95_ms: 1140,
    swmm_hydraulic_step_s: 1.2,
    telemetry_timestamp: new Date().toISOString(),
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
