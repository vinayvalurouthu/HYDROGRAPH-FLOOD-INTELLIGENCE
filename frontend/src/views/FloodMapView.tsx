import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Layers,
  Search,
  MapPin,
  X,
  AlertTriangle,
  Building2,
  Droplets,
  Radio,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crosshair,
  Shield,
  Zap,
  Globe,
  Sparkles,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";
import {
  roads as mockRoads,
  forecastTimeline as mockForecast,
  drainageNodes as mockDrainageNodes,
  sosIncidents as mockSOS,
  shelters as mockShelters,
} from "../mockData";
import type { Road, ForecastPoint } from "../mockData";
import {
  PRESET_CITIES,
  generatePresetCityData,
  fetchOsmCityData,
} from "../services/cityDataGenerator";
import type { CityPreset, CityFloodDataset } from "../services/cityDataGenerator";

interface Props {
  selectedRoadId?: string;
  onRoadSelect: (roadId: string) => void;
  timelineIndex: number;
  onTimelineChange: (idx: number) => void;
  onCloseRoad: (roadId: string) => void;
  activeCity?: CityPreset;
  cityDataset?: CityFloodDataset | null;
  onCityChange?: (city: CityPreset) => void;
  onCityDatasetChange?: (dataset: CityFloodDataset) => void;
}

const PATNA_CENTER: [number, number] = [25.6093, 85.1376];
const DEFAULT_ZOOM = 13;

const RISK_COLORS: Record<string, string> = {
  SEVERE: "#ef4444",
  HIGH: "#f97316",
  MODERATE: "#eab308",
  LOW: "#22c55e",
};

const RISK_BG: Record<string, string> = {
  SEVERE: "rgba(239,68,68,0.18)",
  HIGH: "rgba(249,115,22,0.14)",
  MODERATE: "rgba(234,179,8,0.10)",
  LOW: "rgba(34,197,94,0.07)",
};

const STATUS_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MODERATE: "#eab308",
  NORMAL: "#22c55e",
  STRESSED: "#f97316",
};

interface LayerState {
  roads: boolean;
  floodZones: boolean;
  sos: boolean;
  shelters: boolean;
  drainage: boolean;
}

export default function FloodMapView({
  selectedRoadId,
  onRoadSelect,
  timelineIndex,
  onTimelineChange,
  onCloseRoad,
  activeCity,
  cityDataset,
  onCityChange,
  onCityDatasetChange,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupsRef = useRef<{
    roads: L.LayerGroup;
    floodZones: L.LayerGroup;
    sos: L.LayerGroup;
    shelters: L.LayerGroup;
    drainage: L.LayerGroup;
  } | null>(null);

  const [layers, setLayers] = useState<LayerState>({
    roads: true,
    floodZones: true,
    sos: true,
    shelters: true,
    drainage: true,
  });
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [searchResults, setSearchResults] = useState<Road[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Dynamic City Intelligence State
  const [currentCity, setCurrentCity] = useState<CityPreset>(activeCity || PRESET_CITIES[0]);
  const [locationInput, setLocationInput] = useState(`${(activeCity || PRESET_CITIES[0]).name}, ${(activeCity || PRESET_CITIES[0]).state}`);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchStatusMsg, setSearchStatusMsg] = useState("");
  const [dataSource, setDataSource] = useState<"PRESET" | "OSM_LIVE" | "SIMULATION">(cityDataset ? cityDataset.source : "PRESET");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(cityDataset ? cityDataset.city.center : PATNA_CENTER);

  // Data layers
  const [roads, setRoads] = useState<Road[]>(cityDataset ? cityDataset.roads : mockRoads);
  const [forecast, setForecast] = useState<ForecastPoint[]>(cityDataset ? cityDataset.forecast : mockForecast);
  const [floodZones, setFloodZones] = useState<any[]>(cityDataset ? cityDataset.floodZones : []);
  const [sosIncidents, setSosIncidents] = useState(cityDataset ? cityDataset.sosIncidents : mockSOS);
  const [shelters, setShelters] = useState(cityDataset ? cityDataset.shelters : mockShelters);
  const [drainageNodes, setDrainageNodes] = useState(cityDataset ? cityDataset.drainageNodes : mockDrainageNodes);

  // Apply complete city dataset
  const applyCityDataset = useCallback((dataset: CityFloodDataset) => {
    setCurrentCity(dataset.city);
    onCityChange?.(dataset.city);
    onCityDatasetChange?.(dataset);
    setLocationInput(`${dataset.city.name}, ${dataset.city.state}`);
    setMapCenter(dataset.city.center);
    setDataSource(dataset.source);
    setRoads(dataset.roads);
    setFloodZones(dataset.floodZones);
    setSosIncidents(dataset.sosIncidents);
    setShelters(dataset.shelters);
    setDrainageNodes(dataset.drainageNodes);
    setForecast(dataset.forecast);
    mapRef.current?.flyTo(dataset.city.center, dataset.city.zoom || DEFAULT_ZOOM, { duration: 0.8 });
  }, [onCityChange]);

  // Preset selector
  const selectPresetCity = useCallback((cityId: string) => {
    const preset = PRESET_CITIES.find((c) => c.id === cityId);
    if (!preset) return;
    const dataset = generatePresetCityData(preset);
    applyCityDataset(dataset);
    setCityDropdownOpen(false);
  }, [applyCityDataset]);

  // Search any location worldwide via Geocoding + Overpass + Simulation Fallback
  const searchLocation = async (query: string) => {
    const q = query.trim();
    if (!q) return;

    setIsSearchingLocation(true);
    setSearchStatusMsg("Geocoding coordinates...");

    try {
      // Check preset match first
      const matched = PRESET_CITIES.find(
        (p) =>
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          p.id.toLowerCase().includes(q.toLowerCase())
      );
      if (matched) {
        const dataset = generatePresetCityData(matched);
        applyCityDataset(dataset);
        setIsSearchingLocation(false);
        setSearchStatusMsg("");
        return;
      }

      // Geocode via OpenStreetMap Nominatim
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      if (!data || data.length === 0) {
        alert(`Location "${q}" not found on OpenStreetMap. Please try another place.`);
        setIsSearchingLocation(false);
        setSearchStatusMsg("");
        return;
      }

      const first = data[0];
      const lat = parseFloat(first.lat);
      const lon = parseFloat(first.lon);
      const parts = first.display_name.split(",");
      const cityName = parts[0].trim();
      const stateName = parts.length > 2 ? parts[parts.length - 3]?.trim() || "District" : "Region";

      setSearchStatusMsg("Extracting OSM roads & generating flood layers...");
      const dataset = await fetchOsmCityData(lat, lon, cityName, stateName);
      applyCityDataset(dataset);
    } catch (err) {
      console.error("Geocoding / Overpass search error", err);
    } finally {
      setIsSearchingLocation(false);
      setSearchStatusMsg("");
    }
  };

  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      searchLocation(locationInput);
    }
  };

  // Load backend data for default Patna
  useEffect(() => {
    if (currentCity.id !== "patna") return;
    async function loadData() {
      try {
        const [roadsRes, forecastRes, zonesRes, sosRes, sheltersRes, drainRes] = await Promise.allSettled([
          fetch("/api/roads").then((r) => r.json()),
          fetch("/api/forecast/timeline").then((r) => r.json()),
          fetch(`/api/flood/zones?step=${timelineIndex}`).then((r) => r.json()),
          fetch("/api/v1/sos").then((r) => r.json()),
          fetch("/api/v1/shelters").then((r) => r.json()),
          fetch("/api/v1/drainage/status").then((r) => r.json()),
        ]);
        if (roadsRes.status === "fulfilled") setRoads(roadsRes.value);
        if (forecastRes.status === "fulfilled") setForecast(forecastRes.value);
        if (zonesRes.status === "fulfilled") setFloodZones(zonesRes.value);
        if (sosRes.status === "fulfilled") setSosIncidents(sosRes.value);
        if (sheltersRes.status === "fulfilled") setShelters(sheltersRes.value);
        if (drainRes.status === "fulfilled" && drainRes.value.nodes) setDrainageNodes(drainRes.value.nodes);
      } catch {
        // Fallback already in place
      }
    }
    loadData();
  }, [currentCity.id, timelineIndex]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: mapCenter,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }
    ).addTo(map);

    // Attribution
    L.control
      .attribution({ position: "bottomright", prefix: false })
      .addAttribution(
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
      )
      .addTo(map);

    // Create layer groups
    const layerGroups = {
      roads: L.layerGroup().addTo(map),
      floodZones: L.layerGroup().addTo(map),
      sos: L.layerGroup().addTo(map),
      shelters: L.layerGroup().addTo(map),
      drainage: L.layerGroup().addTo(map),
    };

    mapRef.current = map;
    layerGroupsRef.current = layerGroups;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupsRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Render road segments on the map
  const renderRoads = useCallback(() => {
    if (!layerGroupsRef.current) return;
    const group = layerGroupsRef.current.roads;
    group.clearLayers();

    roads.forEach((road) => {
      if (!road.geojson && (!road.lat || !road.lng)) return;

      const color = road.closed ? "#6b7280" : RISK_COLORS[road.risk] || "#3b82f6";
      const weight = selectedRoadId === road.id ? 7 : road.risk === "SEVERE" || road.risk === "HIGH" ? 5 : 3;
      const opacity = road.closed ? 0.5 : selectedRoadId === road.id ? 1 : 0.8;
      const dashArray = road.closed ? "8 6" : undefined;

      if (road.geojson) {
        try {
          const geojson = typeof road.geojson === "string" ? JSON.parse(road.geojson) : road.geojson;
          const layer = L.geoJSON(geojson, {
            style: {
              color,
              weight,
              opacity,
              dashArray,
              lineCap: "round",
              lineJoin: "round",
            },
          });

          layer.on("click", () => onRoadSelect(road.id));
          layer.on("mouseover", function (this: L.Layer) {
            (this as any).setStyle?.({ weight: weight + 2, opacity: 1 });
          });
          layer.on("mouseout", function (this: L.Layer) {
            (this as any).setStyle?.({ weight, opacity });
          });

          // Road label at midpoint
          const coords = geojson.coordinates;
          if (coords && coords.length > 0) {
            const mid = coords[Math.floor(coords.length / 2)];
            let labelHtml = "";
            if (road.closed) {
              labelHtml = `<div style="
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid rgba(239, 68, 68, 0.8);
                color: #fca5a5;
                font-size: 11px;
                font-weight: 900;
                font-family: 'JetBrains Mono', monospace;
                padding: 4px 8px;
                border-radius: 4px;
                white-space: nowrap;
                backdrop-filter: blur(8px);
                text-shadow: 0 1px 4px rgba(0,0,0,0.9);
                letter-spacing: 0.5px;
                box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
              ">🚧 ROAD BLOCKED</div>`;
            } else {
              labelHtml = `<div style="
                background: ${color}22;
                border: 1px solid ${color}88;
                color: ${color};
                font-size: 10px;
                font-weight: 700;
                font-family: 'JetBrains Mono', monospace;
                padding: 2px 6px;
                border-radius: 4px;
                white-space: nowrap;
                backdrop-filter: blur(8px);
                text-shadow: 0 1px 3px rgba(0,0,0,0.8);
                letter-spacing: 0.5px;
              ">${road.id} · ${road.depthCm}cm</div>`;
            }

            const labelIcon = L.divIcon({
              className: "road-label-icon",
              html: labelHtml,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            });
            L.marker([mid[1], mid[0]], { icon: labelIcon, interactive: false }).addTo(group);
          }

          // Selected road glow effect
          if (selectedRoadId === road.id) {
            L.geoJSON(geojson, {
              style: {
                color: "#06b6d4",
                weight: weight + 6,
                opacity: 0.25,
              },
            }).addTo(group);
          }

          layer.addTo(group);
        } catch {
          // If GeoJSON fails, use lat/lng marker
          const marker = L.circleMarker([road.lat, road.lng], {
            radius: 8,
            color,
            fillColor: color,
            fillOpacity: 0.6,
            weight: 2,
          }).addTo(group);
          marker.on("click", () => onRoadSelect(road.id));
        }
      } else if (road.lat && road.lng) {
        const marker = L.circleMarker([road.lat, road.lng], {
          radius: selectedRoadId === road.id ? 12 : 8,
          color,
          fillColor: color,
          fillOpacity: 0.5,
          weight: 2,
        }).addTo(group);
        marker.on("click", () => onRoadSelect(road.id));
        marker.bindTooltip(`${road.id}: ${road.name} (${road.depthCm}cm)`, {
          className: "hydro-tooltip",
        });
      }
    });
  }, [roads, selectedRoadId, onRoadSelect]);

  // Render flood zone polygons
  const renderFloodZones = useCallback(() => {
    if (!layerGroupsRef.current) return;
    const group = layerGroupsRef.current.floodZones;
    group.clearLayers();

    floodZones.forEach((zone: any) => {
      if (!zone.geojson) return;
      try {
        const geojson = typeof zone.geojson === "string" ? JSON.parse(zone.geojson) : zone.geojson;
        const color = RISK_COLORS[zone.severity] || "#3b82f6";

        L.geoJSON(geojson, {
          style: {
            color: color,
            fillColor: color,
            fillOpacity: 0.2 + (zone.depth_cm / 80) * 0.15,
            weight: 1.5,
            opacity: 0.6,
            dashArray: "4 4",
          },
        })
          .bindTooltip(
            `<div style="font-family:monospace;font-size:11px;">
              <b style="color:${color}">${zone.severity} FLOOD ZONE</b><br/>
              Depth: ${zone.depth_cm} cm
            </div>`,
            { sticky: true, className: "hydro-tooltip" }
          )
          .addTo(group);
      } catch {
        // skip malformed
      }
    });
  }, [floodZones]);

  // Render SOS incident markers
  const renderSOS = useCallback(() => {
    if (!layerGroupsRef.current) return;
    const group = layerGroupsRef.current.sos;
    group.clearLayers();

    sosIncidents.forEach((sos) => {
      if (!sos.lat || !sos.lng) return;
      const color = STATUS_COLORS[sos.priority] || "#ef4444";
      const pulseSize = sos.priority === "CRITICAL" ? 28 : 22;
      const icon = L.divIcon({
        className: "sos-marker-icon",
        html: `<div style="position:relative;width:${pulseSize}px;height:${pulseSize}px;">
          <div style="
            position:absolute;inset:0;
            border-radius:50%;
            background:${color};
            opacity:0.3;
            animation: sosPulse 1.5s ease-out infinite;
          "></div>
          <div style="
            position:absolute;
            top:50%;left:50%;
            transform:translate(-50%,-50%);
            width:${pulseSize * 0.55}px;
            height:${pulseSize * 0.55}px;
            border-radius:50%;
            background:${color};
            border:2px solid white;
            box-shadow:0 0 12px ${color}88;
            display:flex;align-items:center;justify-content:center;
          ">
            <span style="color:white;font-size:8px;font-weight:900;">!</span>
          </div>
        </div>`,
        iconSize: [pulseSize, pulseSize],
        iconAnchor: [pulseSize / 2, pulseSize / 2],
      });

      L.marker([sos.lat, sos.lng], { icon })
        .bindTooltip(
          `<div style="font-family:monospace;font-size:11px;min-width:140px;">
            <div style="color:${color};font-weight:700;margin-bottom:3px;">${sos.priority} SOS ${sos.id}</div>
            <div style="color:#cbd5e1;">${sos.location}</div>
            <div style="color:#94a3b8;margin-top:2px;">${sos.people} people · ${sos.waterDepthM}m depth</div>
            <div style="color:#64748b;font-size:10px;margin-top:2px;">Status: ${sos.status}</div>
          </div>`,
          { className: "hydro-tooltip" }
        )
        .addTo(group);
    });
  }, [sosIncidents]);

  // Render shelter markers
  const renderShelters = useCallback(() => {
    if (!layerGroupsRef.current) return;
    const group = layerGroupsRef.current.shelters;
    group.clearLayers();

    shelters.forEach((sh) => {
      if (!sh.lat || !sh.lng) return;
      const utilPct = Math.round((sh.occupancy / sh.capacity) * 100);
      const statusColor =
        sh.status === "FULL"
          ? "#ef4444"
          : sh.status === "NEAR_FULL"
            ? "#f59e0b"
            : "#10b981";

      const icon = L.divIcon({
        className: "shelter-marker-icon",
        html: `<div style="
          background: rgba(5,10,20,0.85);
          border: 1.5px solid ${statusColor};
          border-radius: 8px;
          padding: 3px 7px;
          display:flex;align-items:center;gap:4px;
          backdrop-filter:blur(8px);
          box-shadow: 0 2px 12px rgba(0,0,0,0.5);
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${statusColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span style="font-size:9px;font-weight:700;color:${statusColor};font-family:monospace;">${utilPct}%</span>
        </div>`,
        iconSize: [0, 0],
        iconAnchor: [30, 12],
      });

      L.marker([sh.lat, sh.lng], { icon })
        .bindTooltip(
          `<div style="font-family:monospace;font-size:11px;min-width:160px;">
            <div style="color:#f0f4ff;font-weight:700;margin-bottom:3px;">${sh.name}</div>
            <div style="color:#94a3b8;">${sh.address}</div>
            <div style="color:${statusColor};margin-top:3px;">${sh.status} · ${sh.occupancy}/${sh.capacity} (${utilPct}%)</div>
            ${sh.recommended ? '<div style="color:#06b6d4;font-size:10px;margin-top:2px;">⭐ RECOMMENDED</div>' : ""}
          </div>`,
          { className: "hydro-tooltip" }
        )
        .addTo(group);
    });
  }, [shelters]);

  // Render drainage node markers
  const renderDrainage = useCallback(() => {
    if (!layerGroupsRef.current) return;
    const group = layerGroupsRef.current.drainage;
    group.clearLayers();

    drainageNodes.forEach((node) => {
      if (!node.lat && !node.lng) return;
      const lat = (node as any).lat || 0;
      const lng = (node as any).lng || 0;
      if (!lat || !lng) return;

      const color = STATUS_COLORS[node.status] || "#22c55e";

      const marker = L.circleMarker([lat, lng], {
        radius: 6,
        color: color,
        fillColor: color,
        fillOpacity: 0.4,
        weight: 2,
      });

      marker.bindTooltip(
        `<div style="font-family:monospace;font-size:11px;">
          <div style="color:${color};font-weight:700;">${node.name}</div>
          <div style="color:#94a3b8;">Utilization: ${node.utilizationPct}%</div>
          <div style="color:#64748b;">${node.flowLs}/${node.capacityLs} L/s</div>
          ${node.anomaly ? `<div style="color:#f59e0b;font-size:10px;margin-top:2px;">⚠ ${node.anomaly}</div>` : ""}
        </div>`,
        { className: "hydro-tooltip" }
      );

      marker.addTo(group);
    });
  }, [drainageNodes]);

  // Re-render layers when data or visibility changes
  useEffect(() => {
    if (!mapReady || !layerGroupsRef.current || !mapRef.current) return;

    if (layers.roads) {
      renderRoads();
      layerGroupsRef.current.roads.addTo(mapRef.current);
    } else {
      layerGroupsRef.current.roads.clearLayers();
      mapRef.current.removeLayer(layerGroupsRef.current.roads);
    }

    if (layers.floodZones) {
      renderFloodZones();
      layerGroupsRef.current.floodZones.addTo(mapRef.current);
    } else {
      layerGroupsRef.current.floodZones.clearLayers();
      mapRef.current.removeLayer(layerGroupsRef.current.floodZones);
    }

    if (layers.sos) {
      renderSOS();
      layerGroupsRef.current.sos.addTo(mapRef.current);
    } else {
      layerGroupsRef.current.sos.clearLayers();
      mapRef.current.removeLayer(layerGroupsRef.current.sos);
    }

    if (layers.shelters) {
      renderShelters();
      layerGroupsRef.current.shelters.addTo(mapRef.current);
    } else {
      layerGroupsRef.current.shelters.clearLayers();
      mapRef.current.removeLayer(layerGroupsRef.current.shelters);
    }

    if (layers.drainage) {
      renderDrainage();
      layerGroupsRef.current.drainage.addTo(mapRef.current);
    } else {
      layerGroupsRef.current.drainage.clearLayers();
      mapRef.current.removeLayer(layerGroupsRef.current.drainage);
    }
  }, [mapReady, layers, renderRoads, renderFloodZones, renderSOS, renderShelters, renderDrainage]);

  // Fly to selected road
  useEffect(() => {
    if (!mapRef.current || !selectedRoadId) return;
    const road = roads.find((r) => r.id === selectedRoadId);
    if (road && road.lat && road.lng) {
      mapRef.current.flyTo([road.lat, road.lng], 15, { duration: 0.8 });
    }
  }, [selectedRoadId, roads]);

  // Search
  useEffect(() => {
    if (!searchVal.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchVal.toLowerCase();
    setSearchResults(
      roads.filter(
        (r) => r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
      ).slice(0, 5)
    );
  }, [searchVal, roads]);

  const toggleLayer = (key: keyof LayerState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currentForecast = forecast[timelineIndex] || forecast[0];
  const isForecasting = timelineIndex > 0;
  const criticalCount = roads.filter((r) => r.risk === "SEVERE" || r.risk === "HIGH").length;
  const activeSOSCount = sosIncidents.filter((s) => s.status !== "CLOSED" && s.status !== "RESCUED").length;

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden" style={{ background: "#060a12" }}>
      {/* SOS Pulse Animation CSS */}
      <style>{`
        @keyframes sosPulse {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .hydro-tooltip {
          background: rgba(5,10,20,0.92) !important;
          border: 1px solid rgba(34,211,238,0.2) !important;
          border-radius: 8px !important;
          padding: 8px 10px !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.6) !important;
          color: #e2e8f0 !important;
        }
        .hydro-tooltip::before { display: none !important; }
        .leaflet-container { background: #060a12 !important; }
        .leaflet-tile-pane {
          filter: invert(1) hue-rotate(180deg) brightness(0.7) contrast(1.3) saturate(0.4);
        }
        .leaflet-control-attribution { 
          background: rgba(5,10,20,0.8) !important;
          color: #4a6080 !important;
          font-size: 9px !important;
          border-radius: 4px 0 0 0 !important;
          padding: 2px 6px !important;
        }
        .leaflet-control-attribution a { color: #22d3ee !important; }
      `}</style>

      {/* Forecast Mode Banner */}
      {isForecasting && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 px-5 py-2.5 rounded-xl"
          style={{
            background: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.4)",
            backdropFilter: "blur(12px)",
          }}
        >
          <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "#f59e0b" }} />
          <Clock size={13} style={{ color: "#f59e0b" }} />
          <span className="text-xs font-mono font-bold text-amber-300">
            FORECAST — {currentForecast?.time}
          </span>
          <span className="text-[10px] font-mono" style={{ color: "#d97706" }}>
            Peak: {currentForecast?.depthCm}cm · {currentForecast?.confidencePct}% confidence
          </span>
        </div>
      )}

      {/* Dynamic City Intelligence & Control Panel — top left */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2 max-w-sm">
        {/* Main Location & City Bar */}
        <div
          className="flex flex-col gap-1.5 p-2 rounded-xl"
          style={{
            background: "rgba(5,10,20,0.92)",
            border: "1px solid #1a2640",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: "#10b981" }} />
            
            {/* City Preset Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold hover:bg-white/10 transition-colors"
                style={{
                  background: "rgba(6,182,212,0.12)",
                  color: "#22d3ee",
                  border: "1px solid rgba(6,182,212,0.3)",
                }}
                title="Select from pre-configured disaster intelligence pilot zones"
              >
                <Globe size={11} />
                <span>{currentCity.name}</span>
                <ChevronDown size={10} />
              </button>

              {/* City Presets Dropdown Menu */}
              {cityDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-1.5 w-60 rounded-xl p-1.5 shadow-2xl z-50 animate-slide-down"
                  style={{
                    background: "rgba(8,13,28,0.98)",
                    border: "1px solid #22d3ee40",
                    backdropFilter: "blur(16px)",
                  }}
                >
                  <div className="px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider" style={{ color: "#4a6080" }}>
                    Pre-Configured Pilot Zones
                  </div>
                  <div className="space-y-0.5">
                    {PRESET_CITIES.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectPresetCity(c.id)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left hover:bg-white/10 transition-colors"
                        style={{
                          background: currentCity.id === c.id ? "rgba(6,182,212,0.15)" : "transparent",
                        }}
                      >
                        <div>
                          <div className="text-[11px] font-mono font-bold text-white flex items-center gap-1.5">
                            {c.name}
                            {c.id === "vizag" && (
                              <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal">
                                COASTAL
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] font-mono" style={{ color: "#4a6080" }}>
                            {c.state} · {c.regionType}
                          </div>
                        </div>
                        {currentCity.id === c.id && <Check size={12} style={{ color: "#22d3ee" }} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Custom Location Search Input */}
            <div className="flex-1 flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-[#1a2640] focus-within:border-[#22d3ee]">
              <Search size={10} style={{ color: "#4a6080" }} />
              <input
                type="text"
                className="bg-transparent text-[10px] font-mono outline-none w-full text-slate-200 placeholder:text-slate-600"
                placeholder="Search any city (e.g. Vizag, Mumbai)..."
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={handleLocationKeyDown}
                disabled={isSearchingLocation}
              />
              {isSearchingLocation ? (
                <Loader2 size={11} className="animate-spin text-cyan-400" />
              ) : (
                <button
                  onClick={() => searchLocation(locationInput)}
                  className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                >
                  GO
                </button>
              )}
            </div>
          </div>

          {/* Search Status Progress Message */}
          {isSearchingLocation && (
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 animate-pulse px-1">
              <Loader2 size={10} className="animate-spin" />
              <span>{searchStatusMsg || "Searching location..."}</span>
            </div>
          )}

          {/* Quick Pilot City Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
            {PRESET_CITIES.map((c) => (
              <button
                key={c.id}
                onClick={() => selectPresetCity(c.id)}
                className="text-[8px] font-mono px-2 py-0.5 rounded-md whitespace-nowrap transition-all"
                style={{
                  background: currentCity.id === c.id ? "rgba(6,182,212,0.25)" : "rgba(255,255,255,0.04)",
                  color: currentCity.id === c.id ? "#22d3ee" : "#8da0b8",
                  border: currentCity.id === c.id ? "1px solid rgba(6,182,212,0.5)" : "1px solid #1a2640",
                }}
              >
                {c.name.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Source Indicator & Waterbody info */}
          <div className="flex items-center justify-between pt-1 border-t border-[#1a2640]/60 text-[8px] font-mono">
            <span style={{ color: "#4a6080" }}>
              Waterbody: <span className="text-slate-300">{currentCity.waterBody}</span>
            </span>
            <span
              className="px-1.5 py-0.5 rounded font-bold"
              style={{
                background:
                  dataSource === "OSM_LIVE"
                    ? "rgba(16,185,129,0.15)"
                    : dataSource === "PRESET"
                    ? "rgba(6,182,212,0.15)"
                    : "rgba(245,158,11,0.15)",
                color:
                  dataSource === "OSM_LIVE"
                    ? "#34d399"
                    : dataSource === "PRESET"
                    ? "#22d3ee"
                    : "#fbbf24",
                border: `1px solid ${
                  dataSource === "OSM_LIVE"
                    ? "rgba(16,185,129,0.3)"
                    : dataSource === "PRESET"
                    ? "rgba(6,182,212,0.3)"
                    : "rgba(245,158,11,0.3)"
                }`,
              }}
            >
              {dataSource === "OSM_LIVE" ? "⚡ OSM LIVE" : dataSource === "PRESET" ? "🏢 PRESET DATASET" : "🌊 MULTI-ZONE SIM"}
            </span>
          </div>
        </div>

        {/* Hazard & Distress Badges */}
        <div className="flex gap-1.5">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <AlertTriangle size={10} style={{ color: "#ef4444" }} />
            <span className="text-[10px] font-mono font-bold text-red-400">{criticalCount}</span>
            <span className="text-[9px] font-mono" style={{ color: "#ef444488" }}>
              CRITICAL ROADS
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)" }}
          >
            <Zap size={10} style={{ color: "#eab308" }} />
            <span className="text-[10px] font-mono font-bold text-yellow-400">{activeSOSCount}</span>
            <span className="text-[9px] font-mono" style={{ color: "#eab30888" }}>
              SOS BEACONS
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}
          >
            <Building2 size={10} style={{ color: "#10b981" }} />
            <span className="text-[10px] font-mono font-bold text-emerald-400">{shelters.length}</span>
            <span className="text-[9px] font-mono" style={{ color: "#10b98188" }}>
              SHELTERS
            </span>
          </div>
        </div>
      </div>

      {/* Controls — top right */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2 items-end">
        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: "rgba(5,10,20,0.9)", border: "1px solid #1a2640", backdropFilter: "blur(10px)" }}
        >
          <Search size={13} style={{ color: "#4a6080" }} />
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search roads..."
            className="bg-transparent text-xs font-mono outline-none w-36"
            style={{ color: "#f0f4ff" }}
          />
          {searchVal && (
            <button onClick={() => setSearchVal("")}>
              <X size={11} style={{ color: "#4a6080" }} />
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div
            className="rounded-lg overflow-hidden w-52"
            style={{ background: "rgba(5,10,20,0.95)", border: "1px solid #1a2640" }}
          >
            {searchResults.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  onRoadSelect(r.id);
                  setSearchVal("");
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full" style={{ background: RISK_COLORS[r.risk] }} />
                <div>
                  <div className="text-[11px] font-mono font-bold text-white">{r.id}</div>
                  <div className="text-[9px] font-mono" style={{ color: "#4a6080" }}>
                    {r.name} · {r.depthCm}cm
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Layer Toggle */}
        <button
          onClick={() => setLayerPanelOpen(!layerPanelOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{ background: "rgba(5,10,20,0.9)", border: "1px solid #1a2640" }}
        >
          <Layers size={13} style={{ color: layerPanelOpen ? "#22d3ee" : "#4a6080" }} />
          <span className="text-[10px] font-mono" style={{ color: "#8899aa" }}>
            LAYERS
          </span>
        </button>

        {layerPanelOpen && (
          <div
            className="rounded-xl p-3 space-y-1.5 w-52"
            style={{ background: "rgba(5,10,20,0.95)", border: "1px solid #1a2640", backdropFilter: "blur(10px)" }}
          >
            <div className="text-[9px] font-mono font-bold mb-2" style={{ color: "#4a6080" }}>
              MAP LAYERS
            </div>
            {[
              { key: "roads" as const, label: "Road Segments", icon: MapPin, color: "#3b82f6" },
              { key: "floodZones" as const, label: "Flood Zones", icon: Droplets, color: "#ef4444" },
              { key: "sos" as const, label: "SOS Incidents", icon: Zap, color: "#f59e0b" },
              { key: "shelters" as const, label: "Shelters", icon: Building2, color: "#10b981" },
              { key: "drainage" as const, label: "Drainage Nodes", icon: Radio, color: "#8b5cf6" },
            ].map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => toggleLayer(key)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                {layers[key] ? (
                  <Eye size={12} style={{ color }} />
                ) : (
                  <EyeOff size={12} style={{ color: "#3a4f6a" }} />
                )}
                <Icon size={12} style={{ color: layers[key] ? color : "#3a4f6a" }} />
                <span
                  className="text-[10px] font-mono flex-1 text-left"
                  style={{ color: layers[key] ? "#e2e8f0" : "#3a4f6a" }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Center on Location */}
        <button
          onClick={() => mapRef.current?.flyTo(mapCenter, DEFAULT_ZOOM, { duration: 0.6 })}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{ background: "rgba(5,10,20,0.9)", border: "1px solid #1a2640" }}
        >
          <Crosshair size={13} style={{ color: "#4a6080" }} />
          <span className="text-[10px] font-mono" style={{ color: "#8899aa" }}>
            CENTER
          </span>
        </button>
      </div>

      {/* THE MAP */}
      <div ref={mapContainerRef} className="flex-1 w-full" style={{ minHeight: 0 }} />

      {/* FORECAST TIMELINE SCRUBBER — Bottom */}
      <div
        className="flex-shrink-0 flex items-center gap-0 px-3 py-2"
        style={{ background: "rgba(5,10,20,0.95)", borderTop: "1px solid #1a2640" }}
      >
        <button
          onClick={() => onTimelineChange(Math.max(0, timelineIndex - 1))}
          className="p-1 rounded hover:bg-white/5"
          disabled={timelineIndex === 0}
        >
          <ChevronLeft size={14} style={{ color: timelineIndex === 0 ? "#1a2640" : "#8899aa" }} />
        </button>

        <div className="flex-1 flex items-center gap-0.5 mx-2">
          {forecast.map((pt, i) => {
            const isActive = i === timelineIndex;
            const rColor = RISK_COLORS[pt.risk] || "#3b82f6";
            return (
              <button
                key={i}
                onClick={() => onTimelineChange(i)}
                className="flex-1 flex flex-col items-center py-1.5 rounded-lg transition-all relative group"
                style={{
                  background: isActive ? `${rColor}15` : "transparent",
                  border: isActive ? `1px solid ${rColor}40` : "1px solid transparent",
                }}
              >
                {/* Depth bar */}
                <div
                  className="w-full rounded-sm mb-1 transition-all"
                  style={{
                    height: `${Math.max(3, (pt.depthCm / 50) * 24)}px`,
                    background: isActive
                      ? `linear-gradient(to top, ${rColor}, ${rColor}88)`
                      : `${rColor}30`,
                  }}
                />
                <span
                  className="text-[8px] font-mono font-bold"
                  style={{ color: isActive ? rColor : "#4a6080" }}
                >
                  {pt.time}
                </span>
                <span
                  className="text-[7px] font-mono"
                  style={{ color: isActive ? "#8899aa" : "#2a3a55" }}
                >
                  {pt.depthCm}cm
                </span>

                {/* Active indicator */}
                {isActive && (
                  <div
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ background: rColor, boxShadow: `0 0 6px ${rColor}` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onTimelineChange(Math.min(forecast.length - 1, timelineIndex + 1))}
          className="p-1 rounded hover:bg-white/5"
          disabled={timelineIndex === forecast.length - 1}
        >
          <ChevronRight
            size={14}
            style={{ color: timelineIndex === forecast.length - 1 ? "#1a2640" : "#8899aa" }}
          />
        </button>

        {/* Legend */}
        <div
          className="flex items-center gap-3 ml-3 pl-3"
          style={{ borderLeft: "1px solid #1a2640" }}
        >
          {[
            { label: "LOW", color: RISK_COLORS.LOW },
            { label: "MOD", color: RISK_COLORS.MODERATE },
            { label: "HIGH", color: RISK_COLORS.HIGH },
            { label: "SEV", color: RISK_COLORS.SEVERE },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
              <span className="text-[8px] font-mono" style={{ color: "#4a6080" }}>
                {label}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1 ml-1">
            <Shield size={10} style={{ color: "#06b6d4" }} />
            <span className="text-[8px] font-mono" style={{ color: "#4a6080" }}>
              Shelter
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
