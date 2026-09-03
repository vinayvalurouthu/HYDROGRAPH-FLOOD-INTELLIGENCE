import type { Road, Shelter, SOSIncident, DrainageNode, ForecastPoint, RiskLevel } from "../mockData";

export interface CityPreset {
  id: string;
  name: string;
  state: string;
  regionType: string;
  center: [number, number];
  zoom: number;
  rainfallMmHr: number;
  waterBody: string;
}

export interface CityFloodDataset {
  city: CityPreset;
  roads: Road[];
  floodZones: any[];
  sosIncidents: SOSIncident[];
  shelters: Shelter[];
  drainageNodes: DrainageNode[];
  forecast: ForecastPoint[];
  source: "PRESET" | "OSM_LIVE" | "SIMULATION";
}

// ─── 1. Pre-configured City Presets ──────────────────────────────────────────

export const PRESET_CITIES: CityPreset[] = [
  {
    id: "patna",
    name: "Patna",
    state: "Bihar",
    regionType: "Ganges River Basin",
    center: [25.6093, 85.1376],
    zoom: 13,
    rainfallMmHr: 88,
    waterBody: "Ganges River",
  },
  {
    id: "vizag",
    name: "Visakhapatnam (Vizag)",
    state: "Andhra Pradesh",
    regionType: "Coastal Zone · Bay of Bengal",
    center: [17.6868, 83.2185],
    zoom: 13,
    rainfallMmHr: 104,
    waterBody: "Bay of Bengal & Meghadrigedda",
  },
  {
    id: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    regionType: "Coastal Estuary · Mithi Basin",
    center: [19.0760, 72.8777],
    zoom: 13,
    rainfallMmHr: 125,
    waterBody: "Arabian Sea & Mithi River",
  },
  {
    id: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    regionType: "Coastal Plain · Adyar Basin",
    center: [13.0827, 80.2707],
    zoom: 13,
    rainfallMmHr: 96,
    waterBody: "Bay of Bengal & Adyar River",
  },
  {
    id: "kochi",
    name: "Kochi",
    state: "Kerala",
    regionType: "Backwater Estuary · Arabian Sea",
    center: [9.9312, 76.2673],
    zoom: 13,
    rainfallMmHr: 110,
    waterBody: "Vembanad Lake & Arabian Sea",
  },
  {
    id: "kolkata",
    name: "Kolkata",
    state: "West Bengal",
    regionType: "Deltaic Lowlands · Hooghly Basin",
    center: [22.5726, 88.3639],
    zoom: 13,
    rainfallMmHr: 92,
    waterBody: "Hooghly River & East Wetlands",
  },
  {
    id: "guwahati",
    name: "Guwahati",
    state: "Assam",
    regionType: "Brahmaputra Flood Corridor",
    center: [26.1445, 91.7362],
    zoom: 13,
    rainfallMmHr: 118,
    waterBody: "Brahmaputra River & Bharalu Basin",
  },
];

// Helper to create GeoJSON curved LineString
function createRoadLineString(startLat: number, startLng: number, endLat: number, endLng: number, curveOffset = 0.002) {
  const midLat = (startLat + endLat) / 2 + (Math.random() - 0.5) * curveOffset;
  const midLng = (startLng + endLng) / 2 + (Math.random() - 0.5) * curveOffset;
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [
        [startLng, startLat],
        [midLng, midLat],
        [endLng, endLat],
      ],
    },
  };
}

// Helper to create GeoJSON Polygon for flood zone
function createPolygon(centerLat: number, centerLng: number, radiusLat: number, radiusLng: number, points = 8) {
  const coords: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const rL = radiusLat * (0.8 + Math.sin(i * 1.5) * 0.2);
    const rG = radiusLng * (0.8 + Math.cos(i * 1.3) * 0.2);
    coords.push([centerLng + Math.cos(angle) * rG, centerLat + Math.sin(angle) * rL]);
  }
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  };
}

// ─── 2. City Specific Preset Data Generator ──────────────────────────────────

export function generatePresetCityData(city: CityPreset): CityFloodDataset {
  const [lat, lng] = city.center;
  const isVizag = city.id === "vizag";
  const isMumbai = city.id === "mumbai";
  const isChennai = city.id === "chennai";

  // City-specific named landmarks
  const roadNames = isVizag
    ? [
        { id: "VZ-01", name: "RK Beach Promenade (Beach Road)", risk: "SEVERE" as RiskLevel, depth: 46, vel: 0.72 },
        { id: "VZ-02", name: "Jagadamba Junction Arterial", risk: "HIGH" as RiskLevel, depth: 32, vel: 0.51 },
        { id: "VZ-03", name: "Waltair Main Road (Siripuram Link)", risk: "MODERATE" as RiskLevel, depth: 18, vel: 0.28 },
        { id: "VZ-04", name: "Maddilapalem NH-16 Flyover Corridor", risk: "SEVERE" as RiskLevel, depth: 52, vel: 0.81 },
        { id: "VZ-05", name: "Gajuwaka Industrial Highway Link", risk: "HIGH" as RiskLevel, depth: 38, vel: 0.45 },
        { id: "VZ-06", name: "Rushikonda IT Coastal Linkway", risk: "LOW" as RiskLevel, depth: 8, vel: 0.12 },
        { id: "VZ-07", name: "Dwaraka Nagar Commercial Spine", risk: "HIGH" as RiskLevel, depth: 29, vel: 0.39 },
        { id: "VZ-08", name: "Scindia Port Access Expressway", risk: "SEVERE" as RiskLevel, depth: 61, vel: 0.94 },
      ]
    : isMumbai
    ? [
        { id: "MB-01", name: "Western Express Highway (Milan Subway)", risk: "SEVERE" as RiskLevel, depth: 58, vel: 0.84 },
        { id: "MB-02", name: "SV Road (Bandra-Andheri Link)", risk: "SEVERE" as RiskLevel, depth: 48, vel: 0.65 },
        { id: "MB-03", name: "Eastern Freeway (Kurla Junction)", risk: "HIGH" as RiskLevel, depth: 34, vel: 0.44 },
        { id: "MB-04", name: "LBS Marg (Mithi River Corridor)", risk: "SEVERE" as RiskLevel, depth: 68, vel: 0.92 },
        { id: "MB-05", name: "Hindmata Flyover Underpass", risk: "HIGH" as RiskLevel, depth: 41, vel: 0.55 },
        { id: "MB-06", name: "BKC Connector (Bandra Kurla)", risk: "MODERATE" as RiskLevel, depth: 19, vel: 0.22 },
        { id: "MB-07", name: "Marine Drive Promenade", risk: "LOW" as RiskLevel, depth: 12, vel: 0.15 },
        { id: "MB-08", name: "Dadar TT Circle Arterial", risk: "HIGH" as RiskLevel, depth: 36, vel: 0.48 },
      ]
    : isChennai
    ? [
        { id: "CH-01", name: "Mount Road (Anna Salai Arterial)", risk: "HIGH" as RiskLevel, depth: 35, vel: 0.48 },
        { id: "CH-02", name: "GST Road (Kathipara Flyover Area)", risk: "SEVERE" as RiskLevel, depth: 54, vel: 0.76 },
        { id: "CH-03", name: "OMR IT Expressway (Velachery Link)", risk: "SEVERE" as RiskLevel, depth: 62, vel: 0.88 },
        { id: "CH-04", name: "Poonamallee High Road", risk: "HIGH" as RiskLevel, depth: 38, vel: 0.52 },
        { id: "CH-05", name: "Kamarajar Promenade (Marina Coastal)", risk: "MODERATE" as RiskLevel, depth: 22, vel: 0.31 },
        { id: "CH-06", name: "Adyar Bridge Approach Road", risk: "SEVERE" as RiskLevel, depth: 49, vel: 0.67 },
        { id: "CH-07", name: "Koyambedu Wholesale Market Road", risk: "HIGH" as RiskLevel, depth: 31, vel: 0.40 },
        { id: "CH-08", name: "Inner Ring Road (Jafferkhanpet)", risk: "MODERATE" as RiskLevel, depth: 16, vel: 0.20 },
      ]
    : [
        { id: `${city.id.toUpperCase().slice(0, 2)}-01`, name: `${city.name} Central Arterial`, risk: "SEVERE" as RiskLevel, depth: 45, vel: 0.70 },
        { id: `${city.id.toUpperCase().slice(0, 2)}-02`, name: `${city.name} Station Road Link`, risk: "HIGH" as RiskLevel, depth: 34, vel: 0.49 },
        { id: `${city.id.toUpperCase().slice(0, 2)}-03`, name: `${city.name} Riverfront / Coastal Way`, risk: "SEVERE" as RiskLevel, depth: 58, vel: 0.85 },
        { id: `${city.id.toUpperCase().slice(0, 2)}-04`, name: `${city.name} Market Commercial Spine`, risk: "HIGH" as RiskLevel, depth: 28, vel: 0.38 },
        { id: `${city.id.toUpperCase().slice(0, 2)}-05`, name: `${city.name} Bypass Highway (NH)`, risk: "MODERATE" as RiskLevel, depth: 19, vel: 0.24 },
        { id: `${city.id.toUpperCase().slice(0, 2)}-06`, name: `${city.name} Industrial Corridor`, risk: "HIGH" as RiskLevel, depth: 36, vel: 0.44 },
        { id: `${city.id.toUpperCase().slice(0, 2)}-07`, name: `${city.name} University Avenue`, risk: "LOW" as RiskLevel, depth: 11, vel: 0.15 },
        { id: `${city.id.toUpperCase().slice(0, 2)}-08`, name: `${city.name} East Canal Linkway`, risk: "SEVERE" as RiskLevel, depth: 63, vel: 0.91 },
      ];

  // Generate Roads with realistic GeoJSON lines
  const roads: Road[] = roadNames.map((r, i) => {
    const angle = (i / roadNames.length) * Math.PI * 2;
    const distance = 0.012 + (i % 3) * 0.008;
    const rLat = lat + Math.sin(angle) * distance;
    const rLng = lng + Math.cos(angle) * distance * 1.1;

    const endLat = rLat + (Math.sin(angle + 0.8) * 0.014);
    const endLng = rLng + (Math.cos(angle + 0.8) * 0.016);

    return {
      id: r.id,
      name: r.name,
      risk: r.risk,
      depthCm: r.depth,
      peakDepthCm: Math.round(r.depth * 1.35),
      velocityMs: r.vel,
      durationMin: 35 + (i * 7),
      timeToFloodMin: r.risk === "SEVERE" ? 8 : r.risk === "HIGH" ? 22 : 45,
      confidencePct: 82 + (i % 15),
      rainfallMmHr: city.rainfallMmHr + (i % 10) * 2,
      drainUtilPct: r.risk === "SEVERE" ? 96 : r.risk === "HIGH" ? 84 : 58,
      cause: r.risk === "SEVERE"
        ? [`Extreme runoff towards ${city.waterBody}`, "Inlet sluice gate surcharge"]
        : ["Localized catchment depression", "Sediment accumulation in drain"],
      closed: r.risk === "SEVERE" && i % 2 === 0,
      lat: (rLat + endLat) / 2,
      lng: (rLng + endLng) / 2,
      geojson: createRoadLineString(rLat, rLng, endLat, endLng),
    };
  });

  // Generate Flood Zones (MultiPolygons)
  const floodZones = [
    {
      id: `FZ-${city.id}-01`,
      severity: "SEVERE",
      depth_cm: 65,
      geojson: createPolygon(lat - 0.006, lng + 0.004, 0.012, 0.014),
    },
    {
      id: `FZ-${city.id}-02`,
      severity: "HIGH",
      depth_cm: 42,
      geojson: createPolygon(lat + 0.009, lng - 0.008, 0.016, 0.018),
    },
    {
      id: `FZ-${city.id}-03`,
      severity: "MODERATE",
      depth_cm: 26,
      geojson: createPolygon(lat + 0.015, lng + 0.012, 0.014, 0.015),
    },
    {
      id: `FZ-${city.id}-04`,
      severity: "SEVERE",
      depth_cm: 74,
      geojson: createPolygon(lat - 0.014, lng - 0.012, 0.018, 0.020),
    },
  ];

  // Shelters
  const shelterNames = isVizag
    ? [
        { name: "Swarna Bharathi Indoor Stadium Relief Camp", addr: "Resapuvanipalem, Vizag", cap: 850, occ: 420, rec: true },
        { name: "Andhra University Convocation Relief Base", addr: "Waltair Uplands, Vizag", cap: 1200, occ: 680, rec: true },
        { name: "Gajuwaka Municipal High School Shelter", addr: "Main Road, Gajuwaka", cap: 500, occ: 470, rec: false },
        { name: "Port Trust Diamond Jubilee Community Hall", addr: "Salagramapuram, Vizag", cap: 650, occ: 210, rec: true },
      ]
    : isMumbai
    ? [
        { name: "Bandra Kurla MMRDA Relief Complex", addr: "BKC Complex, Bandra East", cap: 1500, occ: 890, rec: true },
        { name: "Dadar West Municipal Sports Ground Shelter", addr: "Gokhale Road, Dadar West", cap: 900, occ: 820, rec: false },
        { name: "Andheri Sports Complex Evacuation Center", addr: "Veera Desai Road, Andheri", cap: 1100, occ: 530, rec: true },
        { name: "SNDT Women's University Relief Base", addr: "Juhu Road, Santacruz", cap: 700, occ: 290, rec: true },
      ]
    : [
        { name: `${city.name} District Sports Stadium Complex`, addr: `Stadium Road, ${city.name}`, cap: 1000, occ: 520, rec: true },
        { name: `${city.name} University Central Relief Hub`, addr: `University Campus, ${city.name}`, cap: 800, occ: 380, rec: true },
        { name: `${city.name} Municipal Town Hall Shelter`, addr: `Civic Center, ${city.name}`, cap: 600, occ: 540, rec: false },
        { name: `${city.name} Red Cross Disaster Relief Base`, addr: `Relief Avenue, ${city.name}`, cap: 450, occ: 190, rec: true },
      ];

  const shelters: Shelter[] = shelterNames.map((s, i) => {
    const angle = (i / shelterNames.length) * Math.PI * 2 + 0.4;
    const sLat = lat + Math.sin(angle) * 0.022;
    const sLng = lng + Math.cos(angle) * 0.025;
    const occPct = (s.occ / s.cap) * 100;
    return {
      id: `SH-${city.id.toUpperCase().slice(0, 2)}-${i + 1}`,
      name: s.name,
      address: s.addr,
      capacity: s.cap,
      occupancy: s.occ,
      status: occPct >= 90 ? "NEAR_FULL" : "OPEN",
      floodRisk: occPct >= 90 ? "MODERATE" : "LOW",
      distanceKm: +(1.4 + i * 1.8).toFixed(1),
      etaMin: +(8 + i * 6).toFixed(0),
      medical: true,
      food: true,
      water: true,
      power: true,
      accessibility: true,
      lastUpdated: "Just now",
      recommended: s.rec,
      lat: sLat,
      lng: sLng,
    };
  });

  // SOS Incidents
  const sosIncidents: SOSIncident[] = [
    {
      id: `SOS-${city.id.toUpperCase().slice(0, 2)}-01`,
      priority: "CRITICAL",
      location: `${roadNames[0].name}, ${city.name}`,
      people: 7,
      children: 2,
      elderly: 1,
      medical: true,
      waterDepthM: 1.4,
      waitingMin: 32,
      status: "ASSIGNED",
      floodRisk: "SEVERE",
      lat: lat - 0.005,
      lng: lng + 0.007,
      timestamps: [{ status: "RECEIVED", time: "10 min ago" }],
    },
    {
      id: `SOS-${city.id.toUpperCase().slice(0, 2)}-02`,
      priority: "CRITICAL",
      location: `${roadNames[3].name} Low-lying Sector`,
      people: 12,
      children: 4,
      elderly: 3,
      medical: false,
      waterDepthM: 1.8,
      waitingMin: 48,
      status: "EN_ROUTE",
      floodRisk: "SEVERE",
      lat: lat + 0.008,
      lng: lng - 0.006,
      timestamps: [{ status: "RECEIVED", time: "18 min ago" }],
    },
    {
      id: `SOS-${city.id.toUpperCase().slice(0, 2)}-03`,
      priority: "HIGH",
      location: `${roadNames[1].name} Apartment Basement`,
      people: 5,
      children: 1,
      elderly: 0,
      medical: true,
      waterDepthM: 0.9,
      waitingMin: 19,
      status: "VERIFIED",
      floodRisk: "HIGH",
      lat: lat - 0.011,
      lng: lng - 0.009,
      timestamps: [{ status: "RECEIVED", time: "5 min ago" }],
    },
    {
      id: `SOS-${city.id.toUpperCase().slice(0, 2)}-04`,
      priority: "HIGH",
      location: `${roadNames[4].name} Transit Hub`,
      people: 9,
      children: 3,
      elderly: 2,
      medical: false,
      waterDepthM: 1.1,
      waitingMin: 24,
      status: "RECEIVED",
      floodRisk: "HIGH",
      lat: lat + 0.014,
      lng: lng + 0.012,
      timestamps: [{ status: "RECEIVED", time: "2 min ago" }],
    },
  ];

  // Drainage Nodes
  const drainageNodes: DrainageNode[] = [
    {
      id: `DN-${city.id.toUpperCase().slice(0, 2)}-01`,
      name: `${city.name} Main Outfall Sluice #1`,
      utilizationPct: 98,
      capacityLs: 120,
      flowLs: 118,
      status: "CRITICAL",
      anomaly: "Severe backwater pressure from outfall basin",
      confidencePct: 94,
      x: 35,
      y: 40,
      lat: lat - 0.008,
      lng: lng + 0.005,
    },
    {
      id: `DN-${city.id.toUpperCase().slice(0, 2)}-02`,
      name: `${city.name} North Storm Trunk Line`,
      utilizationPct: 86,
      capacityLs: 95,
      flowLs: 82,
      status: "STRESSED",
      anomaly: "Heavy trash gate blockage detected at intake",
      confidencePct: 88,
      x: 70,
      y: 25,
      lat: lat + 0.012,
      lng: lng - 0.007,
    },
    {
      id: `DN-${city.id.toUpperCase().slice(0, 2)}-03`,
      name: `${city.name} Commercial Sector Gravity Culvert`,
      utilizationPct: 62,
      capacityLs: 80,
      flowLs: 50,
      status: "NORMAL",
      confidencePct: 91,
      x: 55,
      y: 65,
      lat: lat + 0.004,
      lng: lng + 0.015,
    },
    {
      id: `DN-${city.id.toUpperCase().slice(0, 2)}-04`,
      name: `${city.name} Coastal / River Interceptor Node`,
      utilizationPct: 94,
      capacityLs: 140,
      flowLs: 132,
      status: "CRITICAL",
      anomaly: "High tidal surge resisting gravity discharge",
      confidencePct: 96,
      x: 20,
      y: 80,
      lat: lat - 0.015,
      lng: lng - 0.003,
    },
  ];

  // Forecast Timeline
  const forecast: ForecastPoint[] = [
    { time: "NOW", depthCm: Math.round(city.rainfallMmHr * 0.45), risk: "HIGH", confidencePct: 98 },
    { time: "+15m", depthCm: Math.round(city.rainfallMmHr * 0.58), risk: "HIGH", confidencePct: 94 },
    { time: "+30m", depthCm: Math.round(city.rainfallMmHr * 0.72), risk: "SEVERE", confidencePct: 89 },
    { time: "+45m", depthCm: Math.round(city.rainfallMmHr * 0.85), risk: "SEVERE", confidencePct: 85 },
    { time: "+60m", depthCm: Math.round(city.rainfallMmHr * 0.92), risk: "SEVERE", confidencePct: 80 },
    { time: "+90m", depthCm: Math.round(city.rainfallMmHr * 0.78), risk: "HIGH", confidencePct: 74 },
    { time: "+120m", depthCm: Math.round(city.rainfallMmHr * 0.55), risk: "MODERATE", confidencePct: 68 },
    { time: "+180m", depthCm: Math.round(city.rainfallMmHr * 0.32), risk: "LOW", confidencePct: 62 },
  ];

  return {
    city,
    roads,
    floodZones,
    sosIncidents,
    shelters,
    drainageNodes,
    forecast,
    source: "PRESET",
  };
}

// ─── 3. OpenStreetMap Overpass Live Extractor ────────────────────────────────

export async function fetchOsmCityData(
  lat: number,
  lng: number,
  cityName: string,
  stateName = "District"
): Promise<CityFloodDataset> {
  const customCity: CityPreset = {
    id: cityName.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 15),
    name: cityName,
    state: stateName,
    regionType: "Dynamic Geocoded Zone",
    center: [lat, lng],
    zoom: 13,
    rainfallMmHr: 95,
    waterBody: "Local Catchment Basin",
  };

  const delta = 0.025;
  const south = (lat - delta).toFixed(4);
  const north = (lat + delta).toFixed(4);
  const west = (lng - delta).toFixed(4);
  const east = (lng + delta).toFixed(4);

  // Overpass query for named primary/secondary/trunk roads and shelters
  const overpassQuery = `[out:json][timeout:4];
(
  way["highway"~"primary|secondary|trunk|tertiary|residential"]["name"](${south},${west},${north},${east});
  node["amenity"~"school|college|university|community_centre|hospital|place_of_worship"]["name"](${south},${west},${north},${east});
);
out geom 25;`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
    const data = await res.json();

    const ways = data.elements?.filter((e: any) => e.type === "way" && e.tags?.name && e.geometry?.length > 1) || [];
    const nodes = data.elements?.filter((e: any) => e.type === "node" && e.tags?.name) || [];

    if (ways.length >= 3) {
      // Build dynamic roads from real OSM ways
      const osmRoads: Road[] = ways.slice(0, 10).map((way: any, idx: number) => {
        const coords = way.geometry.map((g: any) => [g.lon, g.lat]);
        const midIdx = Math.floor(coords.length / 2);
        const [midLng, midLat] = coords[midIdx];

        const riskTier: RiskLevel = idx < 2 ? "SEVERE" : idx < 5 ? "HIGH" : idx < 8 ? "MODERATE" : "LOW";
        const depth = riskTier === "SEVERE" ? 48 + (idx * 4) : riskTier === "HIGH" ? 32 + (idx * 2) : 18;

        return {
          id: `OSM-${idx + 1}`,
          name: way.tags.name,
          risk: riskTier,
          depthCm: depth,
          peakDepthCm: Math.round(depth * 1.3),
          velocityMs: +(0.2 + (idx * 0.08)).toFixed(2),
          durationMin: 30 + idx * 5,
          timeToFloodMin: riskTier === "SEVERE" ? 10 : 25,
          confidencePct: 88,
          rainfallMmHr: 95,
          drainUtilPct: 75 + (idx * 3),
          cause: ["Catchment overflow", "Monsoon storm runoff"],
          closed: riskTier === "SEVERE" && idx === 0,
          lat: midLat,
          lng: midLng,
          geojson: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: coords,
            },
          },
        };
      });

      // Build shelters from real OSM amenity nodes
      const osmShelters: Shelter[] = nodes.slice(0, 5).map((node: any, idx: number) => ({
        id: `SH-OSM-${idx + 1}`,
        name: node.tags.name,
        address: `${node.tags.name}, ${cityName}`,
        capacity: 400 + idx * 200,
        occupancy: 150 + idx * 90,
        status: "OPEN",
        floodRisk: "LOW",
        distanceKm: +(1.2 + idx * 0.9).toFixed(1),
        etaMin: 10 + idx * 4,
        medical: true,
        food: true,
        water: true,
        power: true,
        accessibility: true,
        lastUpdated: "OSM Live",
        recommended: idx === 0,
        lat: node.lat,
        lng: node.lon,
      }));

      // Base synthetic layers for flood zones & SOS
      const basePreset = generatePresetCityData(customCity);

      return {
        city: customCity,
        roads: osmRoads,
        floodZones: basePreset.floodZones,
        sosIncidents: basePreset.sosIncidents,
        shelters: osmShelters.length >= 2 ? osmShelters : basePreset.shelters,
        drainageNodes: basePreset.drainageNodes,
        forecast: basePreset.forecast,
        source: "OSM_LIVE",
      };
    }
  } catch (err) {
    console.warn("[HydroGraph] Overpass API query skipped/failed, using Hydro-Simulation Engine:", err);
  }

  // Fallback to Hydro-Simulation Generator
  const dataset = generatePresetCityData(customCity);
  dataset.source = "SIMULATION";
  return dataset;
}
