/**
 * Overpass API Utility for Real-World OpenStreetMap Geospatial Infrastructure Fetching
 * 
 * Fetches real road segments, shelter buildings, and drainage water nodes
 * within a bounding box centered at (lat, lng) with radius (meters).
 */

import { REAL_CITY_ROADS, PRESET_CITIES } from "./cityDataGenerator";

export interface GeoJSONFeature<G = any, P = any> {
  type: "Feature";
  id?: string;
  geometry: G;
  properties: P;
}

export interface GeoJSONFeatureCollection<G = any, P = any> {
  type: "FeatureCollection";
  features: GeoJSONFeature<G, P>[];
}

export interface CityGeospatialResult {
  roadsGeoJSON: GeoJSONFeatureCollection;
  sheltersGeoJSON: GeoJSONFeatureCollection;
  drainageGeoJSON: GeoJSONFeatureCollection;
  rawElementsCount: number;
  source: "OVERPASS_API" | "FALLBACK_SIMULATION";
}

/**
 * Helper to convert center lat/lng and radius (in meters) to bounding box coordinates:
 * [south, west, north, east]
 */
export function getBoundingBox(lat: number, lng: number, radiusMeters = 5000): {
  south: number;
  west: number;
  north: number;
  east: number;
} {
  const latDelta = radiusMeters / 111320;
  const lngDelta = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180));

  return {
    south: +(lat - latDelta).toFixed(5),
    north: +(lat + latDelta).toFixed(5),
    west: +(lng - lngDelta).toFixed(5),
    east: +(lng + lngDelta).toFixed(5),
  };
}

/**
 * Queries OpenStreetMap Overpass API for real-world infrastructure around a city center.
 */
export async function fetchCityInfrastructure(
  lat: number,
  lng: number,
  radiusMeters = 5000,
  signal?: AbortSignal
): Promise<CityGeospatialResult> {
  const bbox = getBoundingBox(lat, lng, radiusMeters);

  // Overpass QL Query for Roads, Shelters, and Drainage Infrastructure
  const overpassQuery = `[out:json][timeout:12];
(
  way["highway"~"primary|secondary|tertiary|trunk"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["amenity"~"school|community_centre|college|university|hospital"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["waterway"~"drain|canal"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["man_made"="wastewater_plant"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["waterway"~"drain|canal"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
);
out geom 50;`;

  const overpassEndpoint = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
    overpassQuery
  )}`;

  try {
    const response = await fetch(overpassEndpoint, { signal });
    if (!response.ok) {
      throw new Error(`Overpass API responded with HTTP status ${response.status}`);
    }

    const data = await response.json();
    const elements: any[] = data.elements || [];

    // Parse Roads (Ways with highway tags)
    const roadElements = elements.filter(
      (e) => e.type === "way" && e.tags?.highway && e.geometry && e.geometry.length > 1
    );

    // Parse Shelters (Nodes/Ways with amenity tags)
    const shelterElements = elements.filter(
      (e) =>
        (e.type === "node" || e.type === "way") &&
        e.tags?.amenity &&
        ["school", "community_centre", "college", "university", "hospital"].includes(e.tags.amenity)
    );

    // Parse Drainage (Nodes/Ways with waterway or man_made tags)
    const drainageElements = elements.filter(
      (e) =>
        e.tags?.waterway === "drain" ||
        e.tags?.waterway === "canal" ||
        e.tags?.man_made === "wastewater_plant"
    );

    // Convert Roads into GeoJSON LineString Features
    const roadFeatures: GeoJSONFeature[] = roadElements.map((way, idx) => {
      const coords = way.geometry.map((g: { lat: number; lon: number }) => [g.lon, g.lat]);
      const name = way.tags.name || way.tags.ref || `Road Segment ${way.id}`;
      const highwayType = way.tags.highway;

      // Assign risk level based on highway importance & mock flood profile
      const risk =
        idx % 5 === 0 ? "SEVERE" : idx % 5 === 1 ? "HIGH" : idx % 5 === 2 ? "MODERATE" : "LOW";
      const depthCm = risk === "SEVERE" ? 45 : risk === "HIGH" ? 30 : risk === "MODERATE" ? 18 : 5;

      return {
        type: "Feature",
        id: `way-${way.id}`,
        geometry: {
          type: "LineString",
          coordinates: coords,
        },
        properties: {
          id: `WAY-${way.id}`,
          name,
          highway: highwayType,
          risk,
          depthCm,
          peakDepthCm: Math.round(depthCm * 1.3),
          velocityMs: 0.4,
          closed: risk === "SEVERE",
          osmId: way.id,
        },
      };
    });

    // Convert Shelters into GeoJSON Point Features with Spatial Decluttering (max 8 well-spaced shelters)
    const declutteredShelterElements: any[] = [];
    shelterElements.forEach((elem) => {
      const elemLat = elem.lat || (elem.geometry && elem.geometry[0]?.lat) || lat;
      const elemLng = elem.lon || (elem.geometry && elem.geometry[0]?.lon) || lng;
      
      const isTooClose = declutteredShelterElements.some((existing) => {
        const exLat = existing.lat || (existing.geometry && existing.geometry[0]?.lat) || lat;
        const exLng = existing.lon || (existing.geometry && existing.geometry[0]?.lon) || lng;
        const dLat = Math.abs(elemLat - exLat);
        const dLng = Math.abs(elemLng - exLng);
        return dLat < 0.004 && dLng < 0.004; // ~400m minimum spacing
      });

      if (!isTooClose && declutteredShelterElements.length < 8) {
        declutteredShelterElements.push(elem);
      }
    });

    const shelterFeatures: GeoJSONFeature[] = declutteredShelterElements.map((elem, idx) => {
      const shelterLat = elem.lat || (elem.geometry && elem.geometry[0]?.lat) || lat;
      const shelterLng = elem.lon || (elem.geometry && elem.geometry[0]?.lon) || lng;
      const name = elem.tags.name || `${elem.tags.amenity.toUpperCase()} Shelter ${elem.id}`;

      return {
        type: "Feature",
        id: `shelter-${elem.id}`,
        geometry: {
          type: "Point",
          coordinates: [shelterLng, shelterLat],
        },
        properties: {
          id: `SH-OSM-${elem.id}`,
          name,
          amenity: elem.tags.amenity,
          capacity: 350 + (idx * 120) % 600,
          occupancy: 120 + (idx * 50) % 300,
          status: "OPEN",
          medical: true,
          food: true,
          water: true,
          power: true,
          osmId: elem.id,
        },
      };
    });

    // Convert Drainage Nodes into GeoJSON Point Features
    const drainageFeatures: GeoJSONFeature[] = drainageElements.map((elem, idx) => {
      const dLat = elem.lat || (elem.geometry && elem.geometry[0]?.lat) || lat;
      const dLng = elem.lon || (elem.geometry && elem.geometry[0]?.lon) || lng;
      const name =
        elem.tags.name ||
        (elem.tags.waterway ? `OSM ${elem.tags.waterway} Node` : `OSM Pumping Station ${elem.id}`);
      const status = idx % 3 === 0 ? "CRITICAL" : idx % 3 === 1 ? "STRESSED" : "NORMAL";

      return {
        type: "Feature",
        id: `drainage-${elem.id}`,
        geometry: {
          type: "Point",
          coordinates: [dLng, dLat],
        },
        properties: {
          id: `DN-OSM-${elem.id}`,
          name,
          waterway: elem.tags.waterway,
          manMade: elem.tags.man_made,
          status,
          flowRateM3s: status === "CRITICAL" ? 14.5 : 8.2,
          capacityM3s: 20.0,
          osmId: elem.id,
        },
      };
    });

    return {
      roadsGeoJSON: {
        type: "FeatureCollection",
        features: roadFeatures,
      },
      sheltersGeoJSON: {
        type: "FeatureCollection",
        features: shelterFeatures,
      },
      drainageGeoJSON: {
        type: "FeatureCollection",
        features: drainageFeatures,
      },
      rawElementsCount: elements.length,
      source: "OVERPASS_API",
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.warn("[Overpass API] Request aborted due to city navigation change or timeout.");
    } else {
      console.warn("[Overpass API] Query error, generating synthetic fallback:", error);
    }
    return generateFallbackGeoJSON(lat, lng, radiusMeters);
  }
}

/**
 * Fallback GeoJSON generator in case Overpass API is rate limited or offline.
 */
function generateFallbackGeoJSON(
  lat: number,
  lng: number,
  radiusMeters: number
): CityGeospatialResult {
  // Check if near any of our pre-configured cities (within ~15km)
  const matchedPreset = PRESET_CITIES.find(
    (c) => Math.abs(c.center[0] - lat) < 0.15 && Math.abs(c.center[1] - lng) < 0.15
  );

  let roadFeatures: GeoJSONFeature[] = [];

  if (matchedPreset && REAL_CITY_ROADS[matchedPreset.id]) {
    roadFeatures = REAL_CITY_ROADS[matchedPreset.id].map((r) => ({
      type: "Feature",
      id: `way-${r.id}`,
      geometry: {
        type: "LineString",
        coordinates: r.coordinates,
      },
      properties: {
        id: r.id,
        name: r.name,
        risk: r.risk,
        depthCm: r.depth,
        peakDepthCm: Math.round(r.depth * 1.3),
        velocityMs: r.vel,
        closed: r.closed,
      },
    }));
  } else {
    // Orthogonal grid street features aligned with cardinal directions
    const d = 0.015;
    roadFeatures = [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [lng - d * 1.5, lat],
            [lng, lat],
            [lng + d * 1.5, lat],
          ],
        },
        properties: { id: "FB-R1", name: "Main Central Arterial", risk: "SEVERE", depthCm: 45, closed: true },
      },
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [lng, lat - d * 1.5],
            [lng, lat],
            [lng, lat + d * 1.5],
          ],
        },
        properties: { id: "FB-R2", name: "Central North-South Avenue", risk: "HIGH", depthCm: 32, closed: false },
      },
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [lng - d * 1.2, lat + d * 0.7],
            [lng + d * 1.2, lat + d * 0.7],
          ],
        },
        properties: { id: "FB-R3", name: "Northern Bypass Road", risk: "MODERATE", depthCm: 20, closed: false },
      },
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [lng - d * 1.2, lat - d * 0.7],
            [lng + d * 1.2, lat - d * 0.7],
          ],
        },
        properties: { id: "FB-R4", name: "Southern Ring Road", risk: "HIGH", depthCm: 36, closed: false },
      },
    ];
  }

  const shelters: GeoJSONFeature[] = [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng + 0.008, lat + 0.008] },
      properties: { id: "FB-SH1", name: "Central Relief Center", amenity: "community_centre", capacity: 600, occupancy: 210, status: "OPEN" },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng - 0.009, lat - 0.006] },
      properties: { id: "FB-SH2", name: "District Emergency Shelter", amenity: "school", capacity: 450, occupancy: 180, status: "OPEN" },
    },
  ];

  const drainage: GeoJSONFeature[] = [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng - 0.006, lat + 0.004] },
      properties: { id: "FB-DN1", name: "Main Basin Sluice Gate", status: "STRESSED", flowRateM3s: 12.4 },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng + 0.007, lat - 0.005] },
      properties: { id: "FB-DN2", name: "Central Stormwater Pumping Station", status: "CRITICAL", flowRateM3s: 18.2 },
    },
  ];

  return {
    roadsGeoJSON: { type: "FeatureCollection", features: roadFeatures },
    sheltersGeoJSON: { type: "FeatureCollection", features: shelters },
    drainageGeoJSON: { type: "FeatureCollection", features: drainage },
    rawElementsCount: roadFeatures.length + shelters.length + drainage.length,
    source: "FALLBACK_SIMULATION",
  };
}
