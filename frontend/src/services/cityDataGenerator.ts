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

// Helper to create GeoJSON LineString from real road coordinates
export function createGeoJSONLineString(coordinates: [number, number][]) {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
}

// Legacy helper maintained for backward compatibility
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

export interface PresetRoadDef {
  id: string;
  name: string;
  risk: RiskLevel;
  depth: number;
  vel: number;
  closed: boolean;
  coordinates: [number, number][]; // [longitude, latitude] pairs along real physical roads
  cause?: string[];
}

// ─── Real Street Coordinates for Cities (Aligned precisely with OSM & MapTiler) ─────
export const REAL_CITY_ROADS: Record<string, PresetRoadDef[]> = {
  patna: [
    {
      id: "PA-01",
      name: "Bailey Road (Jawaharlal Nehru Marg / NH-22)",
      risk: "SEVERE",
      depth: 45,
      vel: 0.70,
      closed: true,
      coordinates: [
        [85.0680, 25.6135],
        [85.0880, 25.6128],
        [85.1050, 25.6130],
        [85.1180, 25.6120],
        [85.1280, 25.6112],
        [85.1370, 25.6105],
      ],
      cause: ["Bailey Road sump overflow", "Extreme storm runoff towards Ganges", "Pumping station surcharge"],
    },
    {
      id: "PA-02",
      name: "Ashok Rajpath (PMCH / NIT Corridor)",
      risk: "HIGH",
      depth: 34,
      vel: 0.49,
      closed: false,
      coordinates: [
        [85.1480, 25.6185],
        [85.1580, 25.6180],
        [85.1700, 25.6174],
        [85.1850, 25.6162],
        [85.2020, 25.6140],
      ],
      cause: ["Low riverbank elevation", "PMCH drainage backwater"],
    },
    {
      id: "PA-03",
      name: "Patna Marine Drive (Loknayak Ganga Path)",
      risk: "MODERATE",
      depth: 22,
      vel: 0.35,
      closed: false,
      coordinates: [
        [85.0920, 25.6510],
        [85.1080, 25.6420],
        [85.1280, 25.6330],
        [85.1520, 25.6260],
        [85.1820, 25.6220],
        [85.2150, 25.6160],
      ],
      cause: ["Ganges high watermark swell", "Collectorate ghat apron overflow"],
    },
    {
      id: "PA-04",
      name: "Atal Path Expressway (Digha - R-Block)",
      risk: "LOW",
      depth: 8,
      vel: 0.14,
      closed: false,
      coordinates: [
        [85.1030, 25.6420],
        [85.1080, 25.6310],
        [85.1125, 25.6210],
        [85.1170, 25.6130],
        [85.1220, 25.6030],
      ],
      cause: ["Controlled grade separation runoff"],
    },
    {
      id: "PA-05",
      name: "Kankarbagh Main Road",
      risk: "HIGH",
      depth: 38,
      vel: 0.52,
      closed: false,
      coordinates: [
        [85.1180, 25.5960],
        [85.1260, 25.5975],
        [85.1350, 25.5992],
        [85.1450, 25.6008],
        [85.1580, 25.6015],
      ],
      cause: ["Depression basin topography", "Residential sector storm inlet choking"],
    },
    {
      id: "PA-06",
      name: "Boring Canal Road (Hartali to Rajapur)",
      risk: "MODERATE",
      depth: 19,
      vel: 0.26,
      closed: false,
      coordinates: [
        [85.1180, 25.6118],
        [85.1150, 25.6160],
        [85.1120, 25.6210],
        [85.1085, 25.6270],
        [85.1060, 25.6330],
      ],
      cause: ["Drain culvert surcharge", "Water logging near AN College"],
    },
    {
      id: "PA-07",
      name: "Patna Bypass Highway (NH-30 / NH-22)",
      risk: "HIGH",
      depth: 32,
      vel: 0.44,
      closed: false,
      coordinates: [
        [85.0980, 25.5880],
        [85.1220, 25.5915],
        [85.1460, 25.5955],
        [85.1660, 25.5980],
        [85.1920, 25.6005],
      ],
      cause: ["Heavy freight corridor surface wear", "Anisabad culvert backflow"],
    },
    {
      id: "PA-08",
      name: "Rajendra Nagar Overbridge Corridor",
      risk: "SEVERE",
      depth: 63,
      vel: 0.88,
      closed: true,
      coordinates: [
        [85.1500, 25.6050],
        [85.1560, 25.6010],
        [85.1610, 25.5985],
        [85.1670, 25.5960],
      ],
      cause: ["Saidpur nala outfall obstruction", "Low bowl depression around Terminal"],
    },
  ],
  vizag: [
    {
      id: "VZ-01",
      name: "RK Beach Promenade (Beach Road)",
      risk: "SEVERE",
      depth: 46,
      vel: 0.72,
      closed: true,
      coordinates: [
        [83.3050, 17.7080],
        [83.3150, 17.7120],
        [83.3240, 17.7180],
        [83.3320, 17.7260],
        [83.3420, 17.7380],
      ],
      cause: ["High tidal wave ingress", "Beach storm drain surcharging"],
    },
    {
      id: "VZ-02",
      name: "Jagadamba Junction Arterial",
      risk: "HIGH",
      depth: 32,
      vel: 0.51,
      closed: false,
      coordinates: [
        [83.2920, 17.7060],
        [83.2980, 17.7090],
        [83.3030, 17.7125],
        [83.3080, 17.7160],
      ],
      cause: ["Commercial district runoff", "Low-lying intersection accumulation"],
    },
    {
      id: "VZ-03",
      name: "Waltair Main Road (Siripuram Link)",
      risk: "MODERATE",
      depth: 18,
      vel: 0.28,
      closed: false,
      coordinates: [
        [83.3120, 17.7200],
        [83.3160, 17.7235],
        [83.3210, 17.7270],
        [83.3260, 17.7310],
      ],
      cause: ["Hilly slope rapid runoff"],
    },
    {
      id: "VZ-04",
      name: "Maddilapalem NH-16 Flyover Corridor",
      risk: "SEVERE",
      depth: 52,
      vel: 0.81,
      closed: true,
      coordinates: [
        [83.3100, 17.7300],
        [83.3180, 17.7360],
        [83.3250, 17.7420],
        [83.3340, 17.7500],
      ],
      cause: ["Highway underpass dip", "Meghadrigedda basin runoff overflow"],
    },
    {
      id: "VZ-05",
      name: "Gajuwaka Industrial Highway Link",
      risk: "HIGH",
      depth: 38,
      vel: 0.45,
      closed: false,
      coordinates: [
        [83.1950, 17.6800],
        [83.2100, 17.6840],
        [83.2250, 17.6880],
        [83.2400, 17.6910],
      ],
      cause: ["Industrial catchment bottleneck", "Unpaved apron pooling"],
    },
    {
      id: "VZ-06",
      name: "Rushikonda IT Coastal Linkway",
      risk: "LOW",
      depth: 8,
      vel: 0.12,
      closed: false,
      coordinates: [
        [83.3600, 17.7700],
        [83.3690, 17.7790],
        [83.3760, 17.7880],
        [83.3820, 17.7980],
      ],
      cause: ["Mild coastal breeze wash"],
    },
    {
      id: "VZ-07",
      name: "Dwaraka Nagar Commercial Spine",
      risk: "HIGH",
      depth: 29,
      vel: 0.39,
      closed: false,
      coordinates: [
        [83.2960, 17.7210],
        [83.3010, 17.7240],
        [83.3060, 17.7275],
        [83.3110, 17.7310],
      ],
      cause: ["Dense shopping complex runoff", "Silt in main storm conduits"],
    },
    {
      id: "VZ-08",
      name: "Scindia Port Access Expressway",
      risk: "SEVERE",
      depth: 61,
      vel: 0.94,
      closed: false,
      coordinates: [
        [83.2550, 17.6850],
        [83.2680, 17.6910],
        [83.2790, 17.6970],
        [83.2880, 17.7020],
      ],
      cause: ["Harbour tidal backflow", "Port channel embankment spill"],
    },
  ],
  mumbai: [
    {
      id: "MB-01",
      name: "Western Express Highway (Milan Subway)",
      risk: "SEVERE",
      depth: 58,
      vel: 0.84,
      closed: true,
      coordinates: [
        [72.8420, 19.0550],
        [72.8480, 19.0750],
        [72.8530, 19.0980],
        [72.8550, 19.1150],
      ],
      cause: ["Milan subway bowl low point", "Vile Parle stormwater backflow"],
    },
    {
      id: "MB-02",
      name: "SV Road (Bandra-Andheri Link)",
      risk: "SEVERE",
      depth: 48,
      vel: 0.65,
      closed: false,
      coordinates: [
        [72.8360, 19.0560],
        [72.8380, 19.0720],
        [72.8400, 19.0880],
        [72.8420, 19.1020],
      ],
      cause: ["Heavy monsoon high tide lock", "Khar Danda nala surcharge"],
    },
    {
      id: "MB-03",
      name: "Eastern Freeway (Kurla Junction)",
      risk: "HIGH",
      depth: 34,
      vel: 0.44,
      closed: false,
      coordinates: [
        [72.8880, 19.0200],
        [72.8850, 19.0400],
        [72.8800, 19.0600],
        [72.8750, 19.0750],
      ],
      cause: ["Chembur low-lying catchment runoff"],
    },
    {
      id: "MB-04",
      name: "LBS Marg (Mithi River Corridor)",
      risk: "SEVERE",
      depth: 68,
      vel: 0.92,
      closed: true,
      coordinates: [
        [72.8780, 19.0650],
        [72.8810, 19.0780],
        [72.8840, 19.0920],
        [72.8880, 19.1050],
      ],
      cause: ["Mithi River floodgate overflow", "Bail Bazar depression inundation"],
    },
    {
      id: "MB-05",
      name: "Hindmata Flyover Underpass",
      risk: "HIGH",
      depth: 41,
      vel: 0.55,
      closed: false,
      coordinates: [
        [72.8420, 19.0040],
        [72.8435, 19.0110],
        [72.8450, 19.0180],
        [72.8465, 19.0250],
      ],
      cause: ["Chronic Hindmata bowl saucer effect", "Britannia pumping station limits"],
    },
    {
      id: "MB-06",
      name: "BKC Connector (Bandra Kurla)",
      risk: "MODERATE",
      depth: 19,
      vel: 0.22,
      closed: false,
      coordinates: [
        [72.8550, 19.0620],
        [72.8640, 19.0650],
        [72.8730, 19.0665],
        [72.8820, 19.0680],
      ],
      cause: ["Vakola nala tributary level rise"],
    },
    {
      id: "MB-07",
      name: "Marine Drive Promenade",
      risk: "LOW",
      depth: 12,
      vel: 0.15,
      closed: false,
      coordinates: [
        [72.8220, 18.9280],
        [72.8235, 18.9380],
        [72.8245, 18.9480],
        [72.8230, 18.9560],
      ],
      cause: ["Arabian Sea high wave spray"],
    },
    {
      id: "MB-08",
      name: "Dadar TT Circle Arterial",
      risk: "HIGH",
      depth: 36,
      vel: 0.48,
      closed: false,
      coordinates: [
        [72.8460, 19.0120],
        [72.8475, 19.0220],
        [72.8485, 19.0320],
        [72.8500, 19.0420],
      ],
      cause: ["Rainfall runoff converging from Matunga ridge"],
    },
  ],
  chennai: [
    {
      id: "CH-01",
      name: "Mount Road (Anna Salai Arterial)",
      risk: "HIGH",
      depth: 35,
      vel: 0.48,
      closed: false,
      coordinates: [
        [80.2180, 13.0100],
        [80.2350, 13.0320],
        [80.2520, 13.0540],
        [80.2720, 13.0780],
      ],
      cause: ["Cooum river tributary swelling", "Central station drain headback"],
    },
    {
      id: "CH-02",
      name: "GST Road (Kathipara Flyover Area)",
      risk: "SEVERE",
      depth: 54,
      vel: 0.76,
      closed: true,
      coordinates: [
        [80.1980, 12.9950],
        [80.2030, 13.0030],
        [80.2080, 13.0100],
        [80.2150, 13.0160],
      ],
      cause: ["Adyar River water discharge overflow", "Kathipara underpass bowl"],
    },
    {
      id: "CH-03",
      name: "OMR IT Expressway (Velachery Link)",
      risk: "SEVERE",
      depth: 62,
      vel: 0.88,
      closed: true,
      coordinates: [
        [80.2500, 12.9900],
        [80.2480, 12.9650],
        [80.2450, 12.9400],
        [80.2420, 12.9150],
      ],
      cause: ["Pallikaranai marshland runoff spill", "Buckingham canal backpressure"],
    },
    {
      id: "CH-04",
      name: "Poonamallee High Road",
      risk: "HIGH",
      depth: 38,
      vel: 0.52,
      closed: false,
      coordinates: [
        [80.2200, 13.0750],
        [80.2400, 13.0775],
        [80.2600, 13.0805],
        [80.2800, 13.0830],
      ],
      cause: ["Otteri Nullah overflow across Kilpauk"],
    },
    {
      id: "CH-05",
      name: "Kamarajar Promenade (Marina Coastal)",
      risk: "MODERATE",
      depth: 22,
      vel: 0.31,
      closed: false,
      coordinates: [
        [80.2820, 13.0450],
        [80.2840, 13.0560],
        [80.2855, 13.0680],
        [80.2865, 13.0800],
      ],
      cause: ["Bay of Bengal surge tide barrier"],
    },
    {
      id: "CH-06",
      name: "Adyar Bridge Approach Road",
      risk: "SEVERE",
      depth: 49,
      vel: 0.67,
      closed: false,
      coordinates: [
        [80.2550, 13.0040],
        [80.2590, 13.0080],
        [80.2630, 13.0120],
        [80.2680, 13.0160],
      ],
      cause: ["Adyar Estuary high tide flood wave"],
    },
    {
      id: "CH-07",
      name: "Koyambedu Wholesale Market Road",
      risk: "HIGH",
      depth: 31,
      vel: 0.40,
      closed: false,
      coordinates: [
        [80.1880, 13.0680],
        [80.1950, 13.0710],
        [80.2020, 13.0735],
        [80.2100, 13.0760],
      ],
      cause: ["Market apron drainage sediment buildup"],
    },
    {
      id: "CH-08",
      name: "Inner Ring Road (Jafferkhanpet)",
      risk: "MODERATE",
      depth: 16,
      vel: 0.20,
      closed: false,
      coordinates: [
        [80.2050, 13.0200],
        [80.2080, 13.0350],
        [80.2110, 13.0500],
        [80.2130, 13.0650],
      ],
      cause: ["Surface runoff along Ashok Nagar link"],
    },
  ],
  kochi: [
    {
      id: "KO-01",
      name: "MG Road (Ernakulam Arterial)",
      risk: "HIGH",
      depth: 36,
      vel: 0.48,
      closed: false,
      coordinates: [
        [76.2810, 9.9650],
        [76.2825, 9.9750],
        [76.2840, 9.9850],
        [76.2850, 9.9950],
      ],
      cause: ["Mullassery canal backflow", "Monsoon high tide blockage"],
    },
    {
      id: "KO-02",
      name: "Marine Drive Promenade (Shanmugham Road)",
      risk: "SEVERE",
      depth: 52,
      vel: 0.74,
      closed: true,
      coordinates: [
        [76.2750, 9.9780],
        [76.2760, 9.9850],
        [76.2770, 9.9920],
        [76.2785, 9.9980],
      ],
      cause: ["Vembanad Lake backwater surge", "High tide sea water ingress"],
    },
    {
      id: "KO-03",
      name: "Sahodaran Ayyappan Road (Kadavanthra Link)",
      risk: "HIGH",
      depth: 42,
      vel: 0.58,
      closed: false,
      coordinates: [
        [76.2860, 9.9660],
        [76.2950, 9.9675],
        [76.3040, 9.9690],
        [76.3130, 9.9700],
      ],
      cause: ["Perandoor canal overflowing banks"],
    },
    {
      id: "KO-04",
      name: "Edappally - Aroor Bypass (NH-66)",
      risk: "MODERATE",
      depth: 21,
      vel: 0.30,
      closed: false,
      coordinates: [
        [76.3180, 9.9600],
        [76.3160, 9.9800],
        [76.3140, 10.0000],
        [76.3120, 10.0200],
      ],
      cause: ["Highway shoulder runoff accumulation"],
    },
    {
      id: "KO-05",
      name: "Banerjee Road (High Court Link)",
      risk: "HIGH",
      depth: 34,
      vel: 0.45,
      closed: false,
      coordinates: [
        [76.2760, 9.9840],
        [76.2860, 9.9860],
        [76.2960, 9.9880],
        [76.3060, 9.9900],
      ],
      cause: ["Town Hall culvert capacity limit"],
    },
    {
      id: "KO-06",
      name: "Willingdon Island Wharf Expressway",
      risk: "SEVERE",
      depth: 59,
      vel: 0.82,
      closed: true,
      coordinates: [
        [76.2650, 9.9420],
        [76.2680, 9.9520],
        [76.2700, 9.9620],
        [76.2720, 9.9700],
      ],
      cause: ["Cochin Port wharf tidal submergence"],
    },
    {
      id: "KO-07",
      name: "Kalamassery Premier Corridor",
      risk: "LOW",
      depth: 9,
      vel: 0.12,
      closed: false,
      coordinates: [
        [76.3120, 10.0250],
        [76.3170, 10.0350],
        [76.3220, 10.0450],
        [76.3260, 10.0550],
      ],
      cause: ["Controlled upland runoff"],
    },
    {
      id: "KO-08",
      name: "Vyttila Mobility Hub Approach Road",
      risk: "HIGH",
      depth: 39,
      vel: 0.54,
      closed: false,
      coordinates: [
        [76.3150, 9.9630],
        [76.3200, 9.9660],
        [76.3250, 9.9680],
        [76.3300, 9.9700],
      ],
      cause: ["Kaniyampuzha river surge backwash"],
    },
  ],
  kolkata: [
    {
      id: "KL-01",
      name: "EM Bypass (Eastern Metropolitan Bypass)",
      risk: "HIGH",
      depth: 38,
      vel: 0.50,
      closed: false,
      coordinates: [
        [88.3980, 22.5200],
        [88.4020, 22.5450],
        [88.4050, 22.5700],
        [88.4070, 22.5950],
      ],
      cause: ["East Kolkata Wetlands runoff saturation"],
    },
    {
      id: "KL-02",
      name: "AJC Bose Road Flyover / Maa Corridor",
      risk: "SEVERE",
      depth: 56,
      vel: 0.78,
      closed: true,
      coordinates: [
        [88.3500, 22.5420],
        [88.3650, 22.5435],
        [88.3800, 22.5450],
        [88.3950, 22.5470],
      ],
      cause: ["Park Circus underpass inundation", "Palmer Bridge pumping station overload"],
    },
    {
      id: "KL-03",
      name: "Strand Road (Hooghly Riverfront)",
      risk: "SEVERE",
      depth: 64,
      vel: 0.90,
      closed: true,
      coordinates: [
        [88.3410, 22.5650],
        [88.3430, 22.5750],
        [88.3450, 22.5850],
        [88.3480, 22.5950],
      ],
      cause: ["Hooghly River tidal surge and lock gate closure"],
    },
    {
      id: "KL-04",
      name: "Central Avenue (Chittaranjan Avenue)",
      risk: "HIGH",
      depth: 42,
      vel: 0.60,
      closed: false,
      coordinates: [
        [88.3580, 22.5650],
        [88.3600, 22.5750],
        [88.3620, 22.5850],
        [88.3640, 22.5950],
      ],
      cause: ["College Street low-elevation basin overflow"],
    },
    {
      id: "KL-05",
      name: "Park Street Commercial Corridor",
      risk: "MODERATE",
      depth: 20,
      vel: 0.28,
      closed: false,
      coordinates: [
        [88.3520, 22.5510],
        [88.3600, 22.5505],
        [88.3680, 22.5500],
        [88.3760, 22.5495],
      ],
      cause: ["Intense localized cloudburst runoff"],
    },
    {
      id: "KL-06",
      name: "VIP Road (Airport Linkway)",
      risk: "HIGH",
      depth: 35,
      vel: 0.46,
      closed: false,
      coordinates: [
        [88.4050, 22.5950],
        [88.4150, 22.6100],
        [88.4250, 22.6250],
        [88.4350, 22.6400],
      ],
      cause: ["Kestopur canal water level surge"],
    },
    {
      id: "KL-07",
      name: "Diamond Harbour Road",
      risk: "MODERATE",
      depth: 18,
      vel: 0.24,
      closed: false,
      coordinates: [
        [88.3200, 22.5350],
        [88.3180, 22.5150],
        [88.3150, 22.4950],
        [88.3120, 22.4750],
      ],
      cause: ["Behala drainage depression pooling"],
    },
    {
      id: "KL-08",
      name: "Belghoria Expressway",
      risk: "LOW",
      depth: 7,
      vel: 0.10,
      closed: false,
      coordinates: [
        [88.3750, 22.6500],
        [88.3950, 22.6480],
        [88.4150, 22.6460],
        [88.4350, 22.6440],
      ],
      cause: ["Elevated highway rapid runoff shedding"],
    },
  ],
  guwahati: [
    {
      id: "GW-01",
      name: "GS Road (Khanapara - Paltan Bazar Arterial)",
      risk: "HIGH",
      depth: 39,
      vel: 0.52,
      closed: false,
      coordinates: [
        [91.7920, 26.1150],
        [91.7760, 26.1300],
        [91.7600, 26.1450],
        [91.7450, 26.1580],
      ],
      cause: ["Meghalaya hills sudden flush flood runoff"],
    },
    {
      id: "GW-02",
      name: "MG Road (Brahmaputra Riverfront)",
      risk: "SEVERE",
      depth: 66,
      vel: 0.94,
      closed: true,
      coordinates: [
        [91.7350, 26.1880],
        [91.7480, 26.1910],
        [91.7620, 26.1925],
        [91.7750, 26.1910],
      ],
      cause: ["Brahmaputra River danger level breaching"],
    },
    {
      id: "GW-03",
      name: "RGB Road (Zoo Road Corridor)",
      risk: "SEVERE",
      depth: 54,
      vel: 0.77,
      closed: true,
      coordinates: [
        [91.7820, 26.1550],
        [91.7730, 26.1640],
        [91.7650, 26.1720],
        [91.7580, 26.1780],
      ],
      cause: ["Nabin Nagar depression saucer flooding"],
    },
    {
      id: "GW-04",
      name: "AT Road (Bharalu Bridge corridor)",
      risk: "HIGH",
      depth: 45,
      vel: 0.62,
      closed: false,
      coordinates: [
        [91.7250, 26.1680],
        [91.7380, 26.1670],
        [91.7500, 26.1650],
        [91.7620, 26.1620],
      ],
      cause: ["Bharalu River silt siltation and backpressure"],
    },
    {
      id: "GW-05",
      name: "VIP Road (Six Mile to Narengi)",
      risk: "MODERATE",
      depth: 22,
      vel: 0.32,
      closed: false,
      coordinates: [
        [91.8050, 26.1350],
        [91.8100, 26.1480],
        [91.8150, 26.1600],
        [91.8200, 26.1720],
      ],
      cause: ["Local canal culvert bottleneck"],
    },
    {
      id: "GW-06",
      name: "Jalukbari NH-27 Corridor",
      risk: "LOW",
      depth: 9,
      vel: 0.12,
      closed: false,
      coordinates: [
        [91.6600, 26.1450],
        [91.6750, 26.1480],
        [91.6900, 26.1510],
        [91.7050, 26.1540],
      ],
      cause: ["Controlled highway gradient runoff"],
    },
    {
      id: "GW-07",
      name: "Maligaon Kamakhya Road",
      risk: "HIGH",
      depth: 33,
      vel: 0.44,
      closed: false,
      coordinates: [
        [91.6950, 26.1550],
        [91.7080, 26.1600],
        [91.7200, 26.1660],
        [91.7300, 26.1720],
      ],
      cause: ["Nilachal hill slope water convergence"],
    },
    {
      id: "GW-08",
      name: "Chandmari - Noonmati Corridor",
      risk: "MODERATE",
      depth: 19,
      vel: 0.26,
      closed: false,
      coordinates: [
        [91.7750, 26.1850],
        [91.7880, 26.1870],
        [91.8020, 26.1885],
        [91.8150, 26.1900],
      ],
      cause: ["Refinery road gutter overflow"],
    },
  ],
};

// Generates orthogonal grid street centerlines for any non-preset custom location
function generateGridRoads(city: CityPreset): PresetRoadDef[] {
  const [lat, lng] = city.center;
  const prefix = city.id.toUpperCase().slice(0, 2);
  const d = 0.015;
  return [
    {
      id: `${prefix}-01`,
      name: `${city.name} Central Arterial`,
      risk: "SEVERE",
      depth: 45,
      vel: 0.70,
      closed: true,
      coordinates: [
        [lng - d * 1.5, lat],
        [lng - d * 0.5, lat],
        [lng + d * 0.5, lat],
        [lng + d * 1.5, lat],
      ],
    },
    {
      id: `${prefix}-02`,
      name: `${city.name} Central Avenue (North-South)`,
      risk: "HIGH",
      depth: 34,
      vel: 0.49,
      closed: false,
      coordinates: [
        [lng, lat - d * 1.5],
        [lng, lat - d * 0.5],
        [lng, lat + d * 0.5],
        [lng, lat + d * 1.5],
      ],
    },
    {
      id: `${prefix}-03`,
      name: `${city.name} Northern Ring Corridor`,
      risk: "SEVERE",
      depth: 58,
      vel: 0.85,
      closed: false,
      coordinates: [
        [lng - d * 1.2, lat + d * 0.8],
        [lng, lat + d * 0.8],
        [lng + d * 1.2, lat + d * 0.8],
      ],
    },
    {
      id: `${prefix}-04`,
      name: `${city.name} Southern Bypass Highway`,
      risk: "HIGH",
      depth: 28,
      vel: 0.38,
      closed: false,
      coordinates: [
        [lng - d * 1.4, lat - d * 0.8],
        [lng, lat - d * 0.8],
        [lng + d * 1.4, lat - d * 0.8],
      ],
    },
    {
      id: `${prefix}-05`,
      name: `${city.name} Eastern Linkway`,
      risk: "MODERATE",
      depth: 19,
      vel: 0.24,
      closed: false,
      coordinates: [
        [lng + d * 0.8, lat - d * 1.0],
        [lng + d * 0.8, lat],
        [lng + d * 0.8, lat + d * 1.0],
      ],
    },
    {
      id: `${prefix}-06`,
      name: `${city.name} Western Industrial Corridor`,
      risk: "HIGH",
      depth: 36,
      vel: 0.44,
      closed: false,
      coordinates: [
        [lng - d * 0.8, lat - d * 1.0],
        [lng - d * 0.8, lat],
        [lng - d * 0.8, lat + d * 1.0],
      ],
    },
    {
      id: `${prefix}-07`,
      name: `${city.name} Station Approach Road`,
      risk: "LOW",
      depth: 11,
      vel: 0.15,
      closed: false,
      coordinates: [
        [lng - d * 0.6, lat - d * 0.4],
        [lng + d * 0.6, lat - d * 0.4],
      ],
    },
    {
      id: `${prefix}-08`,
      name: `${city.name} Canal Bridge Link`,
      risk: "SEVERE",
      depth: 63,
      vel: 0.91,
      closed: true,
      coordinates: [
        [lng - d * 0.5, lat + d * 0.4],
        [lng + d * 0.5, lat + d * 0.4],
      ],
    },
  ];
}

// ─── 2. City Specific Preset Data Generator ──────────────────────────────────

export function generatePresetCityData(city: CityPreset): CityFloodDataset {
  const [lat, lng] = city.center;
  const isVizag = city.id === "vizag";
  const isMumbai = city.id === "mumbai";
  const isChennai = city.id === "chennai";

  // Select real road definitions precisely tracing real street centerlines
  const roadDefs = REAL_CITY_ROADS[city.id] || generateGridRoads(city);

  // Generate Roads with exact GeoJSON LineStrings and midpoints on actual streets
  const roads: Road[] = roadDefs.map((r, i) => {
    const coords = r.coordinates;
    const midIdx = Math.floor(coords.length / 2);
    const midPoint = coords[midIdx] || [lng, lat];
    const midLng = midPoint[0];
    const midLat = midPoint[1];

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
      cause: r.cause || (r.risk === "SEVERE"
        ? [`Extreme runoff towards ${city.waterBody}`, "Inlet sluice gate surcharge"]
        : ["Localized catchment depression", "Sediment accumulation in drain"]),
      closed: r.closed ?? false,
      lat: midLat,
      lng: midLng,
      geojson: createGeoJSONLineString(coords),
    };
  });

  // Generate Flood Zones (MultiPolygons)
  const floodZones = [
    {
      id: `FZ-${city.id}-01`,
      severity: "SEVERE",
      depth_cm: 65,
      geojson: createPolygon(lat - 0.004, isVizag || isChennai ? lng - 0.008 : lng + 0.004, 0.010, 0.012),
    },
    {
      id: `FZ-${city.id}-02`,
      severity: "HIGH",
      depth_cm: 42,
      geojson: createPolygon(lat + 0.007, isVizag || isChennai ? lng - 0.012 : lng - 0.008, 0.012, 0.014),
    },
    {
      id: `FZ-${city.id}-03`,
      severity: "MODERATE",
      depth_cm: 26,
      geojson: createPolygon(lat + 0.012, isVizag || isChennai ? lng - 0.006 : lng + 0.012, 0.010, 0.012),
    },
    {
      id: `FZ-${city.id}-04`,
      severity: "SEVERE",
      depth_cm: 74,
      geojson: createPolygon(lat - 0.010, isVizag || isChennai ? lng - 0.014 : lng - 0.012, 0.014, 0.016),
    },
  ];

  // Decluttered Shelters placed cleanly across inland grid
  const shelterNames = isVizag
    ? [
        { name: "Swarna Bharathi Indoor Stadium Relief Camp", addr: "Resapuvanipalem, Vizag", cap: 850, occ: 420, rec: true, latOff: 0.012, lngOff: -0.010 },
        { name: "Andhra University Convocation Relief Base", addr: "Waltair Uplands, Vizag", cap: 1200, occ: 680, rec: true, latOff: 0.006, lngOff: -0.006 },
        { name: "Gajuwaka Municipal High School Shelter", addr: "Main Road, Gajuwaka", cap: 500, occ: 470, rec: false, latOff: -0.015, lngOff: -0.018 },
        { name: "Port Trust Diamond Jubilee Community Hall", addr: "Salagramapuram, Vizag", cap: 650, occ: 210, rec: true, latOff: -0.008, lngOff: -0.012 },
      ]
    : isMumbai
    ? [
        { name: "Bandra Kurla MMRDA Relief Complex", addr: "BKC Complex, Bandra East", cap: 1500, occ: 890, rec: true, latOff: 0.008, lngOff: 0.012 },
        { name: "Dadar West Municipal Sports Ground Shelter", addr: "Gokhale Road, Dadar West", cap: 900, occ: 820, rec: false, latOff: -0.012, lngOff: 0.004 },
        { name: "Andheri Sports Complex Evacuation Center", addr: "Veera Desai Road, Andheri", cap: 1100, occ: 530, rec: true, latOff: 0.018, lngOff: 0.008 },
        { name: "SNDT Women's University Relief Base", addr: "Juhu Road, Santacruz", cap: 700, occ: 290, rec: true, latOff: 0.002, lngOff: 0.015 },
      ]
    : [
        { name: `${city.name} District Sports Stadium Complex`, addr: `Stadium Road, ${city.name}`, cap: 1000, occ: 520, rec: true, latOff: 0.010, lngOff: isChennai ? -0.012 : 0.010 },
        { name: `${city.name} University Central Relief Hub`, addr: `University Campus, ${city.name}`, cap: 800, occ: 380, rec: true, latOff: -0.008, lngOff: isChennai ? -0.008 : -0.012 },
        { name: `${city.name} Municipal Town Hall Shelter`, addr: `Civic Center, ${city.name}`, cap: 600, occ: 540, rec: false, latOff: 0.015, lngOff: isChennai ? -0.018 : 0.014 },
        { name: `${city.name} Red Cross Disaster Relief Base`, addr: `Relief Avenue, ${city.name}`, cap: 450, occ: 190, rec: true, latOff: -0.014, lngOff: isChennai ? -0.004 : -0.006 },
      ];

  const shelters: Shelter[] = shelterNames.map((s, i) => {
    const sLat = lat + s.latOff;
    const sLng = lng + s.lngOff;
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
      location: `${roads[0]?.name || "Central Arterial"}, ${city.name}`,
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
      location: `${roads[3]?.name || "Bypass Corridor"} Low-lying Sector`,
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
      location: `${roads[1]?.name || "Station Road"} Apartment Basement`,
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
      location: `${roads[4]?.name || "Transit Avenue"} Transit Hub`,
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
