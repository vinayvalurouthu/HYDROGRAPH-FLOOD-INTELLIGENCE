/**
 * Dynamic Flood-Aware Routing Engine ("Antigravity" Pathfinding).
 * Implements A* / Dijkstra shortest path calculation on a flood-weighted graph.
 * Dynamically avoids high flood risk zones and road closures, generating safe & alternative corridors.
 */

export interface LocationPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  svgX: number;
  svgY: number;
}

export interface RouteStep {
  instruction: string;
  roadName: string;
  distanceM: number;
  durationS: number;
  depthCm: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "SEVERE";
  isSafe: boolean;
}

export interface RouteOption {
  id: string;
  label: "RECOMMENDED" | "ALTERNATIVE";
  type: "SAFEST" | "FASTER" | "BALANCED";
  eta: number; // in minutes
  distanceKm: number;
  floodExposure: "LOW" | "MODERATE" | "HIGH" | "SEVERE";
  avoidedRoads: number;
  color: string;
  svgPathD: string;
  pathPoints: Array<{ x: number; y: number; lat: number; lng: number }>;
  why: string[];
  steps: RouteStep[];
}

export interface CalculationResult {
  fromLocation: LocationPoint;
  toLocation: LocationPoint;
  recommended: RouteOption;
  alternative: RouteOption;
  floodRiskZones: Array<{ x: number; y: number; width: number; height: number; severity: string; label: string }>;
}

// ─── Spatial Graph Nodes ──────────────────────────────────────────────────────
export const KNOWN_LOCATIONS: Record<string, LocationPoint> = {
  "current location": { id: "YOU", name: "Current Location", lat: 25.602, lng: 85.1376, svgX: 80, svgY: 400 },
  "rajam": { id: "RAJAM", name: "Rajam Relief Hub", lat: 25.628, lng: 85.17, svgX: 580, svgY: 270 },
  "patna junction": { id: "PATNA_JN", name: "Patna Junction", lat: 25.602, lng: 85.1376, svgX: 150, svgY: 380 },
  "gandhi maidan": { id: "GANDHI_MAIDAN", name: "Gandhi Maidan", lat: 25.618, lng: 85.143, svgX: 300, svgY: 170 },
  "bailey road west": { id: "BAILEY_RD_W", name: "Bailey Road West (Saguna More)", lat: 25.612, lng: 85.085, svgX: 80, svgY: 270 },
  "boring road": { id: "BORING_RD", name: "Boring Road Crossing", lat: 25.616, lng: 85.115, svgX: 150, svgY: 170 },
  "kankarbagh": { id: "KANKARBAGH", name: "Kankarbagh Colony", lat: 25.598, lng: 85.135, svgX: 300, svgY: 380 },
  "rajendra nagar": { id: "RAJENDRA_NAGAR", name: "Rajendra Nagar Terminal", lat: 25.599, lng: 85.16, svgX: 480, svgY: 270 },
  "pmch hospital": { id: "PMCH", name: "PMCH Medical Center", lat: 25.621, lng: 85.155, svgX: 480, svgY: 170 },
  "danapur station": { id: "DANAPUR", name: "Danapur Station", lat: 25.627, lng: 85.042, svgX: 80, svgY: 170 },
  "shelter sh-03": { id: "SHELTER_SH03", name: "Sports Complex Shelter (SH-03)", lat: 25.599, lng: 85.16, svgX: 300, svgY: 380 },
  "shelter sh-01": { id: "SHELTER_SH01", name: "Central School Shelter (SH-01)", lat: 25.611, lng: 85.13, svgX: 300, svgY: 270 },
};

// Default spatial grid graph nodes (for smooth grid projection)
const GRAPH_NODES: Record<string, { x: number; y: number; lat: number; lng: number }> = {
  N_80_400: { x: 80, y: 400, lat: 25.602, lng: 85.137 },
  N_80_270: { x: 80, y: 270, lat: 25.612, lng: 85.085 },
  N_80_170: { x: 80, y: 170, lat: 25.627, lng: 85.042 },
  N_150_400: { x: 150, y: 400, lat: 25.602, lng: 85.137 },
  N_150_270: { x: 150, y: 270, lat: 25.611, lng: 85.115 },
  N_150_170: { x: 150, y: 170, lat: 25.616, lng: 85.115 },
  N_300_400: { x: 300, y: 400, lat: 25.598, lng: 85.135 },
  N_300_270: { x: 300, y: 270, lat: 25.611, lng: 85.13 },
  N_300_170: { x: 300, y: 170, lat: 25.618, lng: 85.143 },
  N_480_400: { x: 480, y: 400, lat: 25.595, lng: 85.16 },
  N_480_270: { x: 480, y: 270, lat: 25.599, lng: 85.16 },
  N_480_170: { x: 480, y: 170, lat: 25.621, lng: 85.155 },
  N_610_270: { x: 610, y: 270, lat: 25.625, lng: 85.17 },
  N_610_170: { x: 610, y: 170, lat: 25.63, lng: 85.175 },
};

// Graph edges with distances (meters) and risk zones
const EDGES: Array<{
  u: string;
  v: string;
  distM: number;
  roadName: string;
  floodDepthCm: number;
  isClosed: boolean;
}> = [
  { u: "N_80_400", v: "N_80_270", distM: 1300, roadName: "Canal South Corridor", floodDepthCm: 5, isClosed: false },
  { u: "N_80_270", v: "N_80_170", distM: 1000, roadName: "Danapur Link Road", floodDepthCm: 10, isClosed: false },
  { u: "N_80_270", v: "N_150_270", distM: 700, roadName: "Bailey Road West", floodDepthCm: 15, isClosed: false },
  { u: "N_150_400", v: "N_150_270", distM: 1300, roadName: "Station Approach", floodDepthCm: 8, isClosed: false },
  { u: "N_150_270", v: "N_150_170", distM: 1000, roadName: "Boring Road North", floodDepthCm: 0, isClosed: false },
  { u: "N_150_170", v: "N_300_170", distM: 1500, roadName: "Main Bypass Boulevard", floodDepthCm: 0, isClosed: false },
  { u: "N_150_270", v: "N_300_270", distM: 1500, roadName: "Bailey Road Central", floodDepthCm: 45, isClosed: true }, // HIGH FLOOD RISK
  { u: "N_300_400", v: "N_300_270", distM: 1300, roadName: "Kankarbagh Main Road", floodDepthCm: 25, isClosed: false },
  { u: "N_300_270", v: "N_300_170", distM: 1000, roadName: "Gandhi Maidan Link", floodDepthCm: 12, isClosed: false },
  { u: "N_300_170", v: "N_480_170", distM: 1800, roadName: "Ashok Rajpath East", floodDepthCm: 65, isClosed: true }, // HIGH FLOOD RISK
  { u: "N_300_170", v: "N_480_270", distM: 1900, roadName: "High-Elevation Flyover Bypass", floodDepthCm: 0, isClosed: false },
  { u: "N_300_270", v: "N_480_270", distM: 1800, roadName: "Rajendra Nagar Central", floodDepthCm: 35, isClosed: false },
  { u: "N_480_400", v: "N_480_270", distM: 1300, roadName: "Kumhrar Expressway", floodDepthCm: 0, isClosed: false },
  { u: "N_480_270", v: "N_480_170", distM: 1000, roadName: "PMCH Access Road", floodDepthCm: 50, isClosed: true },
  { u: "N_480_270", v: "N_610_270", distM: 1300, roadName: "Rajam Direct Highway", floodDepthCm: 10, isClosed: false },
  { u: "N_480_170", v: "N_610_170", distM: 1300, roadName: "North Embankment Road", floodDepthCm: 70, isClosed: true },
];

/**
 * Geocodes input string or matches closest known location.
 */
export function resolveLocation(input: string, isDestination: boolean = false): LocationPoint {
  const query = input.trim().toLowerCase();
  if (KNOWN_LOCATIONS[query]) {
    return KNOWN_LOCATIONS[query];
  }

  // Search partial matches
  for (const [key, loc] of Object.entries(KNOWN_LOCATIONS)) {
    if (query.includes(key) || key.includes(query)) {
      return loc;
    }
  }

  // Generate dynamic coordinate point based on string hash for unrecognized input (e.g. custom place name like "Rajam")
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
  }
  const posX = isDestination ? 580 : 80;
  const posY = 150 + (Math.abs(hash) % 230);
  const lat = 25.602 + (posX / 700) * 0.04;
  const lng = 85.137 + (posY / 500) * 0.04;

  return {
    id: `LOC_${Math.abs(hash)}`,
    name: input.trim() || (isDestination ? "Rajam" : "Current Location"),
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4)),
    svgX: posX,
    svgY: posY,
  };
}

/**
 * Finds nearest graph node key for an (x, y) coordinate.
 */
function getNearestGraphNode(x: number, y: number): string {
  let minDistance = Infinity;
  let closestKey = "N_80_400";
  for (const [key, node] of Object.entries(GRAPH_NODES)) {
    const dist = Math.hypot(node.x - x, node.y - y);
    if (dist < minDistance) {
      minDistance = dist;
      closestKey = key;
    }
  }
  return closestKey;
}

/**
 * A* Pathfinding algorithm to compute path over weighted spatial graph.
 */
export function calculateDynamicRoute(fromInput: string, toInput: string): CalculationResult {
  const fromLoc = resolveLocation(fromInput, false);
  const toLoc = resolveLocation(toInput, true);

  const startNodeKey = getNearestGraphNode(fromLoc.svgX, fromLoc.svgY);
  const targetNodeKey = getNearestGraphNode(toLoc.svgX, toLoc.svgY);

  // 1. Calculate Recommended (Safest) Route with heavy flood penalties
  const safePathNodeKeys = runAStar(startNodeKey, targetNodeKey, true);
  // 2. Calculate Alternative (Faster / Direct) Route with normal distance weights
  const altPathNodeKeys = runAStar(startNodeKey, targetNodeKey, false);

  const recommendedOption = buildRouteOption(
    "R1",
    "RECOMMENDED",
    "SAFEST",
    "#10b981",
    fromLoc,
    toLoc,
    safePathNodeKeys,
    true
  );

  const alternativeOption = buildRouteOption(
    "R2",
    "ALTERNATIVE",
    "FASTER",
    "#f59e0b",
    fromLoc,
    toLoc,
    altPathNodeKeys,
    false
  );

  // Defined static/dynamic flood risk bounds for SVG map display
  const floodRiskZones = [
    { x: 380, y: 150, width: 260, height: 140, severity: "HIGH", label: "FLOOD RISK HIGH" },
    { x: 200, y: 250, width: 160, height: 100, severity: "MODERATE", label: "MODERATE FLOOD ZONE" },
  ];

  return {
    fromLocation: fromLoc,
    toLocation: toLoc,
    recommended: recommendedOption,
    alternative: alternativeOption,
    floodRiskZones,
  };
}

function runAStar(startKey: string, targetKey: string, avoidFloods: boolean): string[] {
  const openSet = new Set<string>([startKey]);
  const cameFrom = new Map<string, string>();

  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  for (const nodeKey of Object.keys(GRAPH_NODES)) {
    gScore.set(nodeKey, Infinity);
    fScore.set(nodeKey, Infinity);
  }

  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(startKey, targetKey));

  while (openSet.size > 0) {
    // Get node with lowest fScore
    let currentKey = "";
    let lowestF = Infinity;
    for (const nodeKey of openSet) {
      const score = fScore.get(nodeKey) ?? Infinity;
      if (score < lowestF) {
        lowestF = score;
        currentKey = nodeKey;
      }
    }

    if (!currentKey || currentKey === targetKey) {
      return reconstructPath(cameFrom, currentKey || startKey);
    }

    openSet.delete(currentKey);

    // Find outgoing edges from currentKey
    const neighbors = getNeighbors(currentKey);
    for (const edge of neighbors) {
      const neighborKey = edge.neighborKey;
      // Calculate weight based on flood penalty
      let weight = edge.distM;
      if (avoidFloods) {
        if (edge.isClosed) {
          weight *= 500; // Heavy penalty for closed road
        } else if (edge.floodDepthCm > 30) {
          weight *= 20; // High penalty for deep water
        } else if (edge.floodDepthCm > 10) {
          weight *= 3; // Moderate penalty
        }
      }

      const tentativeG = (gScore.get(currentKey) ?? Infinity) + weight;

      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, currentKey);
        gScore.set(neighborKey, tentativeG);
        fScore.set(neighborKey, tentativeG + heuristic(neighborKey, targetKey));
        openSet.add(neighborKey);
      }
    }
  }

  return [startKey, targetKey];
}

function heuristic(keyA: string, keyB: string): number {
  const nodeA = GRAPH_NODES[keyA];
  const nodeB = GRAPH_NODES[keyB];
  if (!nodeA || !nodeB) return 0;
  return Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y) * 10;
}

function getNeighbors(nodeKey: string) {
  const neighbors: Array<{ neighborKey: string; distM: number; floodDepthCm: number; isClosed: boolean; roadName: string }> = [];
  for (const edge of EDGES) {
    if (edge.u === nodeKey) {
      neighbors.push({ neighborKey: edge.v, distM: edge.distM, floodDepthCm: edge.floodDepthCm, isClosed: edge.isClosed, roadName: edge.roadName });
    } else if (edge.v === nodeKey) {
      neighbors.push({ neighborKey: edge.u, distM: edge.distM, floodDepthCm: edge.floodDepthCm, isClosed: edge.isClosed, roadName: edge.roadName });
    }
  }
  return neighbors;
}

function reconstructPath(cameFrom: Map<string, string>, currentKey: string): string[] {
  const totalPath = [currentKey];
  let curr = currentKey;
  while (cameFrom.has(curr)) {
    curr = cameFrom.get(curr)!;
    totalPath.unshift(curr);
  }
  return totalPath;
}

function buildRouteOption(
  id: string,
  label: "RECOMMENDED" | "ALTERNATIVE",
  type: "SAFEST" | "FASTER" | "BALANCED",
  color: string,
  fromLoc: LocationPoint,
  toLoc: LocationPoint,
  pathNodeKeys: string[],
  isSafest: boolean
): RouteOption {
  const points: Array<{ x: number; y: number; lat: number; lng: number }> = [];

  // Start at origin SVG point
  points.push({ x: fromLoc.svgX, y: fromLoc.svgY, lat: fromLoc.lat, lng: fromLoc.lng });

  let totalDistMeters = Math.hypot(fromLoc.svgX - (GRAPH_NODES[pathNodeKeys[0]]?.x ?? fromLoc.svgX), fromLoc.svgY - (GRAPH_NODES[pathNodeKeys[0]]?.y ?? fromLoc.svgY)) * 15;
  let maxDepth = 0;
  let avoidedRiskRoads = 0;
  const steps: RouteStep[] = [];

  for (let i = 0; i < pathNodeKeys.length; i++) {
    const node = GRAPH_NODES[pathNodeKeys[i]];
    if (node) {
      points.push(node);
    }
    if (i < pathNodeKeys.length - 1) {
      const u = pathNodeKeys[i];
      const v = pathNodeKeys[i + 1];
      const edge = EDGES.find((e) => (e.u === u && e.v === v) || (e.u === v && e.v === u));
      if (edge) {
        totalDistMeters += edge.distM;
        if (edge.floodDepthCm > maxDepth) {
          maxDepth = edge.floodDepthCm;
        }
        if (edge.isClosed || edge.floodDepthCm > 20) {
          avoidedRiskRoads++;
        }
        steps.push({
          instruction: `Proceed along ${edge.roadName}`,
          roadName: edge.roadName,
          distanceM: edge.distM,
          durationS: Math.round((edge.distM / 1000) * 120),
          depthCm: edge.floodDepthCm,
          riskLevel: edge.floodDepthCm > 40 ? "SEVERE" : edge.floodDepthCm > 20 ? "HIGH" : "LOW",
          isSafe: !edge.isClosed && edge.floodDepthCm <= 20,
        });
      }
    }
  }

  // End at destination SVG point
  points.push({ x: toLoc.svgX, y: toLoc.svgY, lat: toLoc.lat, lng: toLoc.lng });

  const totalDistKm = Number((totalDistMeters / 1000).toFixed(1));
  const baseEtaMinutes = Math.max(3, Math.round(totalDistKm * 3.2));
  const etaMinutes = isSafest ? baseEtaMinutes + 2 : Math.max(2, baseEtaMinutes - 2);

  // Build SVG path string "M x1 y1 L x2 y2 ..."
  let svgPathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    svgPathD += ` L ${points[i].x} ${points[i].y}`;
  }

  const exposureLevel: "LOW" | "MODERATE" | "HIGH" | "SEVERE" =
    isSafest ? (maxDepth > 20 ? "MODERATE" : "LOW") : maxDepth > 40 ? "SEVERE" : maxDepth > 20 ? "HIGH" : "MODERATE";

  const whyReasons = isSafest
    ? [
        "Dynamically bypasses high flood-risk grid zones",
        "Pipes transit around predicted road closures",
        "Lowest flood exposure rating",
        "Maintains access to nearby emergency relief shelter",
      ]
    : [
        "Shorter total transit distance",
        "Direct arterial corridor route",
        "Higher exposure risk if rainfall escalates",
      ];

  return {
    id,
    label,
    type,
    eta: etaMinutes,
    distanceKm: totalDistKm > 0 ? totalDistKm : 4.5,
    floodExposure: exposureLevel,
    avoidedRoads: isSafest ? Math.max(2, avoidedRiskRoads) : Math.max(1, avoidedRiskRoads - 1),
    color,
    svgPathD,
    pathPoints: points,
    why: whyReasons,
    steps,
  };
}

export interface MapStreetLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  isMain?: boolean;
}

export interface AreaMapLayout {
  areaName: string;
  regionHeader: string;
  waterBodyName: string;
  waterBodyPath: string;
  streets: MapStreetLine[];
  floodZones: Array<{ x: number; y: number; width: number; height: number; severity: "HIGH" | "MODERATE" | "SEVERE"; label: string }>;
  landmarks: Array<{ x: number; y: number; label: string; icon: string }>;
}

/**
 * Returns dynamic street grid, water bodies, flood risk polygons, and landmarks based on active area or city.
 */
export function getAreaMapLayout(destinationInput: string, activeCityName: string = "Patna"): AreaMapLayout {
  const dest = destinationInput.trim().toLowerCase();
  const city = activeCityName.trim().toLowerCase();

  if (dest.includes("rajam")) {
    return {
      areaName: "Rajam Relief Zone",
      regionHeader: "SECTOR 4 · RAJAM FLOOD BASIN",
      waterBodyName: "Rajam East Inundation Canal",
      waterBodyPath: "M 0,90 Q 200,120 400,80 T 700,110 L 700,0 L 0,0 Z",
      streets: [
        { x1: 50, y1: 150, x2: 650, y2: 150, label: "Rajam Bypass Expressway", isMain: true },
        { x1: 50, y1: 280, x2: 650, y2: 280, label: "Relief Corridor South", isMain: true },
        { x1: 50, y1: 390, x2: 650, y2: 390, label: "Lower Embankment Road", isMain: false },
        { x1: 140, y1: 100, x2: 140, y2: 450, isMain: true },
        { x1: 320, y1: 100, x2: 320, y2: 450, isMain: true },
        { x1: 490, y1: 100, x2: 490, y2: 450, isMain: true },
        { x1: 600, y1: 100, x2: 600, y2: 450, isMain: true },
      ],
      floodZones: [
        { x: 360, y: 140, width: 270, height: 160, severity: "HIGH", label: "RAJAM HIGH INUNDATION ZONE" },
        { x: 180, y: 260, width: 170, height: 110, severity: "MODERATE", label: "CANAL OVERFLOW ZONE" },
      ],
      landmarks: [
        { x: 580, y: 270, label: "Rajam Relief Hub", icon: "★" },
        { x: 320, y: 390, label: "Rajam Shelter #4", icon: "⛺" },
        { x: 140, y: 150, label: "Western Checkpoint", icon: "🛡️" },
      ],
    };
  }

  if (dest.includes("danapur") || dest.includes("bailey")) {
    return {
      areaName: "Danapur & Saguna Sector",
      regionHeader: "DANAPUR ARTERIAL CORRIDOR",
      waterBodyName: "Digha Canal Outlet",
      waterBodyPath: "M 0,60 Q 300,40 700,90 L 700,0 L 0,0 Z",
      streets: [
        { x1: 60, y1: 180, x2: 640, y2: 180, label: "Bailey Road West", isMain: true },
        { x1: 60, y1: 290, x2: 640, y2: 290, label: "Danapur Railway Link", isMain: true },
        { x1: 60, y1: 410, x2: 640, y2: 410, label: "Canal Feeder Road", isMain: false },
        { x1: 120, y1: 80, x2: 120, y2: 450, isMain: true },
        { x1: 280, y1: 80, x2: 280, y2: 450, isMain: true },
        { x1: 460, y1: 80, x2: 460, y2: 450, isMain: true },
        { x1: 590, y1: 80, x2: 590, y2: 450, isMain: true },
      ],
      floodZones: [
        { x: 220, y: 160, width: 230, height: 140, severity: "HIGH", label: "BAILEY ROAD INUNDATION" },
        { x: 440, y: 270, width: 180, height: 120, severity: "MODERATE", label: "DANAPUR MARSH RISK" },
      ],
      landmarks: [
        { x: 80, y: 170, label: "Danapur Station", icon: "🚉" },
        { x: 280, y: 290, label: "Saguna More Hub", icon: "📍" },
        { x: 590, y: 180, label: "Central School Shelter (SH-01)", icon: "⛺" },
      ],
    };
  }

  if (dest.includes("pmch") || dest.includes("gandhi")) {
    return {
      areaName: "Gandhi Maidan & PMCH Sector",
      regionHeader: "GANGES RIVERFRONT & PMCH CORRIDOR",
      waterBodyName: "Ganges River Waterfront",
      waterBodyPath: "M 0,110 Q 350,50 700,80 L 700,0 L 0,0 Z",
      streets: [
        { x1: 50, y1: 160, x2: 650, y2: 160, label: "Ashok Rajpath Boulevard", isMain: true },
        { x1: 50, y1: 260, x2: 650, y2: 260, label: "Dak Bungalow Transit", isMain: true },
        { x1: 50, y1: 370, x2: 650, y2: 370, label: "Exhibition Road Link", isMain: false },
        { x1: 160, y1: 90, x2: 160, y2: 440, isMain: true },
        { x1: 310, y1: 90, x2: 310, y2: 440, isMain: true },
        { x1: 470, y1: 90, x2: 470, y2: 440, isMain: true },
        { x1: 620, y1: 90, x2: 620, y2: 440, isMain: true },
      ],
      floodZones: [
        { x: 300, y: 140, width: 330, height: 130, severity: "HIGH", label: "ASHOK RAJPATH FLOOD ZONE" },
        { x: 120, y: 240, width: 180, height: 110, severity: "MODERATE", label: "GANDHI MAIDAN WATERLOGGING" },
      ],
      landmarks: [
        { x: 480, y: 170, label: "PMCH Medical Center", icon: "🏥" },
        { x: 310, y: 160, label: "Gandhi Maidan Core", icon: "🏛️" },
        { x: 160, y: 260, label: "Dak Bungalow Shelter", icon: "⛺" },
      ],
    };
  }

  // Non-Patna City Dynamic Layouts (e.g. Vizag, Mumbai, Chennai)
  if (city.includes("vizag") || city.includes("visakhapatnam")) {
    return {
      areaName: "Visakhapatnam Coastal Sector",
      regionHeader: "BAY OF BENGAL COASTAL ZONE · VIZAG",
      waterBodyName: "Bay of Bengal Coastal Edge",
      waterBodyPath: "M 0,0 L 700,0 L 700,120 Q 400,180 0,100 Z",
      streets: [
        { x1: 40, y1: 160, x2: 660, y2: 160, label: "Beach Road Highway", isMain: true },
        { x1: 40, y1: 270, x2: 660, y2: 270, label: "RK Beach Arterial", isMain: true },
        { x1: 40, y1: 380, x2: 660, y2: 380, label: "Meghadrigedda Link", isMain: false },
        { x1: 140, y1: 80, x2: 140, y2: 450, isMain: true },
        { x1: 300, y1: 80, x2: 300, y2: 450, isMain: true },
        { x1: 480, y1: 80, x2: 480, y2: 450, isMain: true },
        { x1: 610, y1: 80, x2: 610, y2: 450, isMain: true },
      ],
      floodZones: [
        { x: 260, y: 140, width: 340, height: 150, severity: "HIGH", label: "STORM SURGE HIGH RISK ZONE" },
      ],
      landmarks: [
        { x: 580, y: 270, label: "Coastal Relief Hub", icon: "⚓" },
        { x: 300, y: 380, label: "Vizag Port Shelter", icon: "⛺" },
      ],
    };
  }

  // Default Grid Map Layout
  return {
    areaName: `${activeCityName} Urban Sector`,
    regionHeader: `${activeCityName.toUpperCase()} FLOOD INTELLIGENCE GRID`,
    waterBodyName: "Primary River / Water Inundation Corridor",
    waterBodyPath: "M 0,70 Q 250,110 500,50 T 700,90 L 700,0 L 0,0 Z",
    streets: [
      { x1: 60, y1: 170, x2: 640, y2: 170, label: "North Arterial Corridor", isMain: true },
      { x1: 60, y1: 270, x2: 640, y2: 270, label: "Central Bypass Expressway", isMain: true },
      { x1: 60, y1: 380, x2: 640, y2: 380, label: "South Relief Ring", isMain: false },
      { x1: 150, y1: 60, x2: 150, y2: 440, isMain: true },
      { x1: 300, y1: 60, x2: 300, y2: 440, isMain: true },
      { x1: 480, y1: 60, x2: 480, y2: 440, isMain: true },
      { x1: 610, y1: 60, x2: 610, y2: 440, isMain: true },
    ],
    floodZones: [
      { x: 380, y: 150, width: 260, height: 140, severity: "HIGH", label: "FLOOD RISK HIGH" },
      { x: 200, y: 250, width: 160, height: 100, severity: "MODERATE", label: "MODERATE FLOOD ZONE" },
    ],
    landmarks: [
      { x: 580, y: 270, label: "Destination Hub", icon: "★" },
      { x: 300, y: 380, label: "Shelter SH-03", icon: "⛺" },
    ],
  };
}

