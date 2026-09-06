// HydroGraph Mock Data Layer
// Replace with real API adapters when backend is connected

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "SEVERE";
export type IncidentStatus =
  | "RECEIVED"
  | "VERIFIED"
  | "ASSIGNED"
  | "EN_ROUTE"
  | "RESCUED"
  | "CLOSED";
export type ServiceStatus = "HEALTHY" | "DEGRADED" | "OFFLINE";

export interface KPIData {
  floodRisk: RiskLevel;
  criticalRoads: number;
  sosIncidents: number;
  peakDepthCm: number;
  timeToCriticalMin: number;
  activeRescueTeams: number;
  rainfallMmHr: number;
  confidencePct: number;
}

export interface Road {
  id: string;
  name: string;
  risk: RiskLevel;
  depthCm: number;
  peakDepthCm: number;
  velocityMs: number;
  durationMin: number;
  timeToFloodMin: number;
  confidencePct: number;
  rainfallMmHr: number;
  drainUtilPct: number;
  cause: string[];
  closed: boolean;
  svgPath?: string;
  lat: number;
  lng: number;
  geojson?: any;
}

export interface SOSIncident {
  id: string;
  priority: "CRITICAL" | "HIGH" | "MODERATE";
  location: string;
  people: number;
  children: number;
  elderly: number;
  medical: boolean;
  waterDepthM: number;
  waitingMin: number;
  status: IncidentStatus;
  floodRisk: RiskLevel;
  lat: number;
  lng: number;
  timestamps: { status: string; time: string }[];
  assignedTeam?: string;
}

export interface RescueTeam {
  id: string;
  name: string;
  status: "AVAILABLE" | "EN_ROUTE" | "ON_SCENE" | "RETURNING";
  distanceKm: number;
  etaMin: number;
  vehicle: string;
  capacity: number;
  routeSafety: "SAFE" | "HIGH" | "MODERATE";
  assignedSOS?: string;
}

export interface Shelter {
  id: string;
  name: string;
  address: string;
  capacity: number;
  occupancy: number;
  status: "OPEN" | "NEAR_FULL" | "FULL" | "UNAVAILABLE";
  floodRisk: RiskLevel;
  distanceKm: number;
  etaMin: number;
  medical: boolean;
  food: boolean;
  water: boolean;
  power: boolean;
  accessibility: boolean;
  lastUpdated: string;
  recommended?: boolean;
  lat: number;
  lng: number;
  phone?: string;
  contactOfficer?: string;
  officerRole?: string;
}

export interface DrainageNode {
  id: string;
  name: string;
  utilizationPct: number;
  capacityLs: number;
  flowLs: number;
  status: "NORMAL" | "STRESSED" | "CRITICAL";
  anomaly?: string;
  confidencePct: number;
  x: number;
  y: number;
  lat: number;
  lng: number;
}

export interface SystemService {
  name: string;
  status: ServiceStatus;
  latencyMs: number;
  errorRate: number;
  lastUpdate: string;
  dataFreshnessSec: number;
}

export interface ForecastPoint {
  time: string;
  depthCm: number;
  risk: RiskLevel;
  confidencePct: number;
}

export interface ScenarioResult {
  floodedRoadsDelta: number;
  peakDepthDeltaCm: number;
  floodedAreaPct: number;
  timeToFloodDeltaMin: number;
  affectedSheltersDelta: number;
  sosExposurePct: number;
}

// ─── Live KPIs ───────────────────────────────────────────────────────────────
export const kpiData: KPIData = {
  floodRisk: "HIGH",
  criticalRoads: 12,
  sosIncidents: 18,
  peakDepthCm: 42,
  timeToCriticalMin: 27,
  activeRescueTeams: 9,
  rainfallMmHr: 76,
  confidencePct: 87,
};

// ─── Roads ───────────────────────────────────────────────────────────────────
export const roads: Road[] = [
  {
    id: "R-102",
    name: "R-102 Main Connector",
    risk: "SEVERE",
    depthCm: 34,
    peakDepthCm: 52,
    velocityMs: 0.62,
    durationMin: 48,
    timeToFloodMin: 18,
    confidencePct: 87,
    rainfallMmHr: 91,
    drainUtilPct: 98,
    cause: ["Heavy rainfall", "Drainage stress"],
    closed: false,
    lat: 25.6145,
    lng: 85.1320,
  },
  {
    id: "JN-14",
    name: "Junction 14",
    risk: "HIGH",
    depthCm: 27,
    peakDepthCm: 38,
    velocityMs: 0.42,
    durationMin: 36,
    timeToFloodMin: 24,
    confidencePct: 82,
    rainfallMmHr: 76,
    drainUtilPct: 88,
    cause: ["Surface runoff", "Blocked inlet"],
    closed: false,
    lat: 25.6073,
    lng: 85.1456,
  },
  {
    id: "MR-01",
    name: "Market Road",
    risk: "HIGH",
    depthCm: 25,
    peakDepthCm: 34,
    velocityMs: 0.38,
    durationMin: 32,
    timeToFloodMin: 31,
    confidencePct: 79,
    rainfallMmHr: 76,
    drainUtilPct: 82,
    cause: ["Heavy rainfall", "Low elevation"],
    closed: false,
    lat: 25.6030,
    lng: 85.1290,
  },
  {
    id: "NH-48",
    name: "National Highway 48",
    risk: "MODERATE",
    depthCm: 12,
    peakDepthCm: 22,
    velocityMs: 0.21,
    durationMin: 24,
    timeToFloodMin: 52,
    confidencePct: 74,
    rainfallMmHr: 68,
    drainUtilPct: 64,
    cause: ["Rainfall accumulation"],
    closed: false,
    lat: 25.6190,
    lng: 85.1180,
  },
  {
    id: "CR-07",
    name: "Canal Road",
    risk: "SEVERE",
    depthCm: 41,
    peakDepthCm: 58,
    velocityMs: 0.71,
    durationMin: 60,
    timeToFloodMin: 8,
    confidencePct: 91,
    rainfallMmHr: 98,
    drainUtilPct: 100,
    cause: ["River overflow", "Drainage failure"],
    closed: true,
    lat: 25.5960,
    lng: 85.1510,
  },
  {
    id: "RD-23",
    name: "Ring Road East",
    risk: "LOW",
    depthCm: 4,
    peakDepthCm: 11,
    velocityMs: 0.09,
    durationMin: 16,
    timeToFloodMin: 94,
    confidencePct: 68,
    rainfallMmHr: 58,
    drainUtilPct: 42,
    cause: ["Light rainfall"],
    closed: false,
    lat: 25.6250,
    lng: 85.1550,
  },
];

// ─── SOS Incidents ────────────────────────────────────────────────────────────
export const sosIncidents: SOSIncident[] = [
  {
    id: "#10284",
    priority: "CRITICAL",
    location: "Market Road, Near Post Office",
    people: 4,
    children: 1,
    elderly: 1,
    medical: true,
    waterDepthM: 1.0,
    waitingMin: 8,
    status: "EN_ROUTE",
    floodRisk: "SEVERE",
    lat: 25.6040,
    lng: 85.1290,
    timestamps: [
      { status: "SOS received", time: "14:02" },
      { status: "Location verified", time: "14:03" },
      { status: "Team assigned", time: "14:05" },
      { status: "Team en route", time: "14:08" },
    ],
    assignedTeam: "R-07",
  },
  {
    id: "#10276",
    priority: "HIGH",
    location: "Canal Road Bridge",
    people: 2,
    children: 0,
    elderly: 0,
    medical: false,
    waterDepthM: 0.7,
    waitingMin: 14,
    status: "ASSIGNED",
    floodRisk: "SEVERE",
    lat: 25.5970,
    lng: 85.1500,
    timestamps: [
      { status: "SOS received", time: "13:52" },
      { status: "Location verified", time: "13:54" },
      { status: "Team assigned", time: "13:58" },
    ],
    assignedTeam: "R-04",
  },
  {
    id: "#10251",
    priority: "MODERATE",
    location: "Junction 14 Underpass",
    people: 1,
    children: 0,
    elderly: 1,
    medical: false,
    waterDepthM: 0.4,
    waitingMin: 22,
    status: "VERIFIED",
    floodRisk: "HIGH",
    lat: 25.6080,
    lng: 85.1450,
    timestamps: [
      { status: "SOS received", time: "13:42" },
      { status: "Location verified", time: "13:45" },
    ],
  },
  {
    id: "#10298",
    priority: "CRITICAL",
    location: "Central Market Area",
    people: 6,
    children: 2,
    elderly: 0,
    medical: true,
    waterDepthM: 0.85,
    waitingMin: 4,
    status: "RECEIVED",
    floodRisk: "HIGH",
    lat: 25.6100,
    lng: 85.1340,
    timestamps: [{ status: "SOS received", time: "14:18" }],
  },
];

// ─── Rescue Teams ─────────────────────────────────────────────────────────────
export const rescueTeams: RescueTeam[] = [
  {
    id: "R-04",
    name: "Team R-04",
    status: "EN_ROUTE",
    distanceKm: 2.4,
    etaMin: 11,
    vehicle: "Rescue Van",
    capacity: 8,
    routeSafety: "SAFE",
    assignedSOS: "#10276",
  },
  {
    id: "R-07",
    name: "Team R-07",
    status: "EN_ROUTE",
    distanceKm: 4.8,
    etaMin: 17,
    vehicle: "Inflatable Boat",
    capacity: 10,
    routeSafety: "HIGH",
    assignedSOS: "#10284",
  },
  {
    id: "R-12",
    name: "Team R-12",
    status: "AVAILABLE",
    distanceKm: 1.2,
    etaMin: 6,
    vehicle: "Rescue Van",
    capacity: 8,
    routeSafety: "SAFE",
  },
  {
    id: "R-03",
    name: "Team R-03",
    status: "ON_SCENE",
    distanceKm: 0,
    etaMin: 0,
    vehicle: "Motor Boat",
    capacity: 6,
    routeSafety: "MODERATE",
  },
  {
    id: "R-09",
    name: "Team R-09",
    status: "AVAILABLE",
    distanceKm: 3.1,
    etaMin: 14,
    vehicle: "Rescue Van",
    capacity: 8,
    routeSafety: "SAFE",
  },
];

// ─── Shelters ─────────────────────────────────────────────────────────────────
export const shelters: Shelter[] = [
  {
    id: "SH-01",
    name: "Central School",
    address: "MG Road, District 4",
    capacity: 500,
    occupancy: 340,
    status: "OPEN",
    floodRisk: "LOW",
    distanceKm: 2.1,
    etaMin: 8,
    medical: true,
    food: true,
    water: true,
    power: true,
    accessibility: true,
    lastUpdated: "2 min ago",
    recommended: false,
    lat: 25.6200,
    lng: 85.1230,
    phone: "+91 612 223 4567",
    contactOfficer: "Capt. R. K. Varma",
    officerRole: "Relief Camp In-Charge",
  },
  {
    id: "SH-02",
    name: "Community Hall North",
    address: "Lake View Road, District 2",
    capacity: 300,
    occupancy: 291,
    status: "NEAR_FULL",
    floodRisk: "MODERATE",
    distanceKm: 1.5,
    etaMin: 6,
    medical: false,
    food: true,
    water: true,
    power: true,
    accessibility: false,
    lastUpdated: "5 min ago",
    lat: 25.6160,
    lng: 85.1410,
    phone: "+91 612 254 8901",
    contactOfficer: "Dr. Sunita Prasad",
    officerRole: "Civil Defense Officer",
  },
  {
    id: "SH-03",
    name: "Sports Complex East",
    address: "Ring Road, District 7",
    capacity: 800,
    occupancy: 320,
    status: "OPEN",
    floodRisk: "LOW",
    distanceKm: 3.4,
    etaMin: 14,
    medical: true,
    food: true,
    water: true,
    power: true,
    accessibility: true,
    lastUpdated: "1 min ago",
    recommended: true,
    lat: 25.5920,
    lng: 85.1580,
    phone: "+91 612 278 3412",
    contactOfficer: "Insp. Amit Kumar",
    officerRole: "Shelter Commander",
  },
  {
    id: "SH-04",
    name: "Government College",
    address: "Sector 12, District 5",
    capacity: 400,
    occupancy: 122,
    status: "OPEN",
    floodRisk: "LOW",
    distanceKm: 4.2,
    etaMin: 18,
    medical: true,
    food: true,
    water: true,
    power: false,
    accessibility: true,
    lastUpdated: "8 min ago",
    lat: 25.6270,
    lng: 85.1110,
  },
];

// ─── Drainage Nodes ───────────────────────────────────────────────────────────
export const drainageNodes: DrainageNode[] = [
  {
    id: "N-204",
    name: "Node N-204",
    utilizationPct: 94,
    capacityLs: 82,
    flowLs: 77,
    status: "STRESSED",
    anomaly: "Possible capacity reduction — field inspection recommended",
    confidencePct: 76,
    x: 380,
    y: 220,
    lat: 25.6110,
    lng: 85.1350,
  },
  {
    id: "N-187",
    name: "Node N-187",
    utilizationPct: 100,
    capacityLs: 65,
    flowLs: 65,
    status: "CRITICAL",
    anomaly: "Flow exceeding design capacity",
    confidencePct: 88,
    x: 260,
    y: 310,
    lat: 25.6020,
    lng: 85.1270,
  },
  {
    id: "N-312",
    name: "Node N-312",
    utilizationPct: 58,
    capacityLs: 110,
    flowLs: 64,
    status: "NORMAL",
    confidencePct: 91,
    x: 520,
    y: 180,
    lat: 25.6180,
    lng: 85.1480,
  },
  {
    id: "N-089",
    name: "Node N-089",
    utilizationPct: 81,
    capacityLs: 90,
    flowLs: 73,
    status: "STRESSED",
    anomaly: "Elevated flow near predicted threshold",
    confidencePct: 72,
    x: 440,
    y: 360,
    lat: 25.5990,
    lng: 85.1400,
  },
  {
    id: "N-156",
    name: "Node N-156",
    utilizationPct: 34,
    capacityLs: 75,
    flowLs: 25,
    status: "NORMAL",
    confidencePct: 94,
    x: 160,
    y: 140,
    lat: 25.6240,
    lng: 85.1190,
  },
];

// ─── System Services ──────────────────────────────────────────────────────────
export const systemServices: SystemService[] = [
  {
    name: "Radar Ingestion",
    status: "HEALTHY",
    latencyMs: 142,
    errorRate: 0.0,
    lastUpdate: "14:32:08",
    dataFreshnessSec: 45,
  },
  {
    name: "CWC River Data",
    status: "HEALTHY",
    latencyMs: 238,
    errorRate: 0.1,
    lastUpdate: "14:31:55",
    dataFreshnessSec: 120,
  },
  {
    name: "GIS Platform",
    status: "HEALTHY",
    latencyMs: 87,
    errorRate: 0.0,
    lastUpdate: "14:32:10",
    dataFreshnessSec: 30,
  },
  {
    name: "SWMM Engine",
    status: "HEALTHY",
    latencyMs: 1840,
    errorRate: 0.2,
    lastUpdate: "14:30:00",
    dataFreshnessSec: 180,
  },
  {
    name: "2D Flood Model",
    status: "DEGRADED",
    latencyMs: 4200,
    errorRate: 2.1,
    lastUpdate: "14:24:30",
    dataFreshnessSec: 480,
  },
  {
    name: "GNN Predictor",
    status: "HEALTHY",
    latencyMs: 920,
    errorRate: 0.0,
    lastUpdate: "14:32:05",
    dataFreshnessSec: 60,
  },
  {
    name: "Routing Engine",
    status: "HEALTHY",
    latencyMs: 312,
    errorRate: 0.0,
    lastUpdate: "14:32:09",
    dataFreshnessSec: 30,
  },
  {
    name: "Database",
    status: "HEALTHY",
    latencyMs: 12,
    errorRate: 0.0,
    lastUpdate: "14:32:11",
    dataFreshnessSec: 5,
  },
  {
    name: "SOS Gateway",
    status: "HEALTHY",
    latencyMs: 189,
    errorRate: 0.0,
    lastUpdate: "14:32:10",
    dataFreshnessSec: 10,
  },
];

// ─── Forecast Timeline ────────────────────────────────────────────────────────
export const forecastTimeline: ForecastPoint[] = [
  { time: "NOW", depthCm: 18, risk: "HIGH", confidencePct: 91 },
  { time: "+15m", depthCm: 24, risk: "HIGH", confidencePct: 89 },
  { time: "+30m", depthCm: 31, risk: "SEVERE", confidencePct: 87 },
  { time: "+45m", depthCm: 38, risk: "SEVERE", confidencePct: 84 },
  { time: "+60m", depthCm: 42, risk: "SEVERE", confidencePct: 80 },
  { time: "+90m", depthCm: 44, risk: "SEVERE", confidencePct: 74 },
  { time: "+120m", depthCm: 39, risk: "HIGH", confidencePct: 68 },
  { time: "+180m", depthCm: 28, risk: "HIGH", confidencePct: 60 },
];

// ─── Road Flood Forecast (for chart) ─────────────────────────────────────────
export const roadForecast = [
  { time: "NOW", depth: 18, threshold: 30 },
  { time: "+15m", depth: 24, threshold: 30 },
  { time: "+30m", depth: 31, threshold: 30 },
  { time: "+45m", depth: 38, threshold: 30 },
  { time: "+60m", depth: 42, threshold: 30 },
  { time: "+90m", depth: 44, threshold: 30 },
  { time: "+120m", depth: 39, threshold: 30 },
  { time: "+180m", depth: 28, threshold: 30 },
];

// ─── Rainfall Data ────────────────────────────────────────────────────────────
export const rainfallData = [
  { time: "-60m", mm: 52 },
  { time: "-45m", mm: 61 },
  { time: "-30m", mm: 68 },
  { time: "-15m", mm: 74 },
  { time: "NOW", mm: 76 },
  { time: "+15m", mm: 82 },
  { time: "+30m", mm: 86 },
  { time: "+45m", mm: 89 },
  { time: "+60m", mm: 91 },
];

// ─── Confidence Factors ───────────────────────────────────────────────────────
export const confidenceFactors = [
  { name: "Radar freshness", pass: true },
  { name: "DEM quality", pass: true },
  { name: "Drainage coverage", pass: true },
  { name: "Model agreement", pass: true },
  { name: "Historical validation", pass: true },
  { name: "Forecast lead time", pass: false },
];

// ─── Scenario Baseline ────────────────────────────────────────────────────────
export const baselineScenario: ScenarioResult = {
  floodedRoadsDelta: 0,
  peakDepthDeltaCm: 0,
  floodedAreaPct: 34,
  timeToFloodDeltaMin: 0,
  affectedSheltersDelta: 0,
  sosExposurePct: 42,
};

export function runScenario(
  rainfallPct: number,
  drainagePct: number,
  riverLevel: string
): ScenarioResult {
  const rainFactor = rainfallPct / 100;
  const drainFactor = 1 - drainagePct / 100;
  const riverMult = riverLevel === "EXTREME" ? 1.4 : riverLevel === "DANGER" ? 1.2 : riverLevel === "WARNING" ? 1.1 : 1.0;

  const floodedRoads = Math.round((rainFactor - 1) * 12 + drainFactor * 8 + (riverMult - 1) * 10);
  const peakDepth = Math.round((rainFactor - 1) * 15 + drainFactor * 12 + (riverMult - 1) * 8);
  const floodedArea = Math.round(baselineScenario.floodedAreaPct + floodedRoads * 1.2 + peakDepth * 0.4);
  const timeToFlood = Math.round(-(rainFactor - 1) * 8 - drainFactor * 6);
  const shelters = Math.round(floodedRoads * 0.12);
  const sos = Math.round(baselineScenario.sosExposurePct + floodedRoads * 0.8 + peakDepth * 0.3);

  return {
    floodedRoadsDelta: floodedRoads,
    peakDepthDeltaCm: peakDepth,
    floodedAreaPct: floodedArea,
    timeToFloodDeltaMin: timeToFlood,
    affectedSheltersDelta: shelters,
    sosExposurePct: sos,
  };
}

// ─── Historical Events ────────────────────────────────────────────────────────
export const historicalEvents = [
  {
    id: "2025-MONSOON",
    name: "2025 Monsoon Event",
    date: "2025-09-14",
    duration: "6h 30m",
    peakDepthCm: 68,
    floodedRoads: 24,
    sosCount: 47,
    accuracy: 84,
  },
  {
    id: "2025-CYCLONE",
    name: "2025 Cyclone Residual",
    date: "2025-11-02",
    duration: "4h 15m",
    peakDepthCm: 52,
    floodedRoads: 18,
    sosCount: 31,
    accuracy: 79,
  },
  {
    id: "2024-JULY",
    name: "2024 July Cloudburst",
    date: "2024-07-18",
    duration: "3h 45m",
    peakDepthCm: 44,
    floodedRoads: 14,
    sosCount: 22,
    accuracy: 88,
  },
];

// ─── Alerts ───────────────────────────────────────────────────────────────────
export interface Alert {
  id: string;
  type: "CRITICAL" | "WARNING" | "INFO" | "SUCCESS";
  title: string;
  message: string;
  time: string;
  read: boolean;
  roadId?: string;
}

export const alerts: Alert[] = [
  {
    id: "a1",
    type: "CRITICAL",
    title: "Road R-102 — Severe flood imminent",
    message: "R-102 predicted severe flooding in 18 min. Immediate closure recommended.",
    time: "14:32",
    read: false,
    roadId: "R-102",
  },
  {
    id: "a2",
    type: "CRITICAL",
    title: "New SOS — Market Road (#10298)",
    message: "6 people including 2 children stranded. Medical emergency reported.",
    time: "14:31",
    read: false,
  },
  {
    id: "a3",
    type: "WARNING",
    title: "Drain Node N-204 — Approaching capacity",
    message: "Utilization at 94%. Field inspection recommended.",
    time: "14:28",
    read: false,
  },
  {
    id: "a4",
    type: "WARNING",
    title: "2D Flood Model — Degraded",
    message: "Model latency elevated (4.2s). Confidence reduced by 8%.",
    time: "14:24",
    read: true,
  },
  {
    id: "a5",
    type: "INFO",
    title: "Rainfall forecast updated",
    message: "+60min forecast revised to 91 mm/hr. Storm tracking NE.",
    time: "14:20",
    read: true,
  },
  {
    id: "a6",
    type: "INFO",
    title: "Shelter SH-03 capacity update",
    message: "Sports Complex East now at 40% capacity. Routing updated.",
    time: "14:18",
    read: true,
  },
];

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsData = {
  floodedRoads: 12,
  peakDepthCm: 42,
  maxVelocityMs: 0.71,
  floodDurationMin: 180,
  affectedPopulation: 14200,
  shelterUtilizationPct: 68,
  sosCount: 18,
  rescueResponseMin: 13.4,
  modelConfidencePct: 87,
  historicalAccuracyPct: 84,
  hourlyFlood: [
    { hour: "10:00", roads: 0, depth: 0 },
    { hour: "10:30", roads: 2, depth: 8 },
    { hour: "11:00", roads: 5, depth: 18 },
    { hour: "11:30", roads: 8, depth: 28 },
    { hour: "12:00", roads: 11, depth: 36 },
    { hour: "12:30", roads: 12, depth: 42 },
    { hour: "13:00", roads: 14, depth: 44 },
    { hour: "13:30", roads: 13, depth: 41 },
  ],
};
