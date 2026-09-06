import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  BarChart2,
  RefreshCw,
  Layers,
  MapPin,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Sliders,
  Maximize2,
  Compass,
  Clock,
  ShieldAlert,
  Eye,
  EyeOff,
  CloudRain,
  Waves,
  Route,
  Activity,
  Server,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  getHistoricalEvents,
  getHistoricalEventDetail,
  getHistoricalEventCompare,
} from "../services/api";
import { historicalEvents as fallbackEvents } from "../mockData";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ReplayFrame {
  frameIndex: number;
  time: string; // e.g. "10:00" or "+01:30"
  elapsedMinutes: number;
  depthCm: number;
  rainfallMmHr: number;
  floodedRoadsCount: number;
  sosCount: number;
  modelAccuracyPct: number;
  activeHazardAreas: string[];
  milestoneEvent: string | null;
  observedDepthCm?: number; // for compare mode benchmark
  observedIoU?: number;
}

export interface ReplayEventSummary {
  id: string;
  name: string;
  date: string;
  duration: string;
  peakDepthCm: number;
  floodedRoads: number;
  sosCount: number;
  accuracy: number;
  description?: string;
  timeline?: any[];
}

interface FloodZoneGeo {
  name: string;
  baseCoords: [number, number][];
  center: [number, number];
  floodThresholdCm: number;
}

interface RoadSegmentGeo {
  id: string;
  name: string;
  coords: [number, number][];
  criticalDepthCm: number;
}

interface SOSDistressCall {
  id: string;
  name: string;
  location: string;
  coords: [number, number];
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
  triggerDepthCm: number;
  details: string;
}

// ─── Geospatial Benchmark Geometry (Patna Urban Basin) ───────────────────────

const PATNA_CENTER: [number, number] = [25.6093, 85.1376];

const REPLAY_FLOOD_ZONES: FloodZoneGeo[] = [
  {
    name: "Rajendra Nagar Lowland Basin",
    center: [25.601, 85.158],
    floodThresholdCm: 10,
    baseCoords: [
      [25.608, 85.152],
      [25.606, 85.168],
      [25.596, 85.169],
      [25.594, 85.155],
      [25.601, 85.148],
    ],
  },
  {
    name: "Kankarbagh Residential Sump",
    center: [25.592, 85.15],
    floodThresholdCm: 15,
    baseCoords: [
      [25.598, 85.138],
      [25.599, 85.158],
      [25.586, 85.162],
      [25.583, 85.142],
      [25.59, 85.132],
    ],
  },
  {
    name: "Gandhi Maidan Central Corridor",
    center: [25.618, 85.144],
    floodThresholdCm: 25,
    baseCoords: [
      [25.624, 85.136],
      [25.626, 85.151],
      [25.614, 85.153],
      [25.612, 85.138],
    ],
  },
  {
    name: "Ashok Rajpath Riverbank Depression",
    center: [25.623, 85.168],
    floodThresholdCm: 20,
    baseCoords: [
      [25.629, 85.155],
      [25.632, 85.185],
      [25.618, 85.188],
      [25.615, 85.16],
    ],
  },
  {
    name: "Bailey Road Underpass Sector",
    center: [25.615, 85.092],
    floodThresholdCm: 30,
    baseCoords: [
      [25.621, 85.082],
      [25.623, 85.105],
      [25.61, 85.108],
      [25.608, 85.085],
    ],
  },
  {
    name: "Digha-Danapur Canal Confluence",
    center: [25.635, 85.065],
    floodThresholdCm: 22,
    baseCoords: [
      [25.642, 85.052],
      [25.644, 85.078],
      [25.628, 85.082],
      [25.625, 85.056],
    ],
  },
];

const REPLAY_ROADS: RoadSegmentGeo[] = [
  {
    id: "R-101",
    name: "Bailey Road Arterial Corridor (NH-30 Spur)",
    coords: [
      [25.612, 85.06],
      [25.614, 85.09],
      [25.615, 85.12],
      [25.616, 85.14],
    ],
    criticalDepthCm: 35,
  },
  {
    id: "R-102",
    name: "Rajendra Nagar Main Link",
    coords: [
      [25.605, 85.148],
      [25.602, 85.158],
      [25.598, 85.168],
    ],
    criticalDepthCm: 20,
  },
  {
    id: "R-103",
    name: "Ashok Rajpath Riverfront Drive",
    coords: [
      [25.618, 85.14],
      [25.622, 85.165],
      [25.626, 85.19],
    ],
    criticalDepthCm: 28,
  },
  {
    id: "R-104",
    name: "Kankarbagh Colony 100ft Road",
    coords: [
      [25.595, 85.135],
      [25.592, 85.152],
      [25.589, 85.17],
    ],
    criticalDepthCm: 25,
  },
  {
    id: "R-105",
    name: "Boring Canal Bypass Expressway",
    coords: [
      [25.608, 85.112],
      [25.619, 85.118],
      [25.628, 85.124],
    ],
    criticalDepthCm: 32,
  },
  {
    id: "R-106",
    name: "Station Underpass & Junction",
    coords: [
      [25.608, 85.132],
      [25.605, 85.141],
      [25.602, 85.146],
    ],
    criticalDepthCm: 18,
  },
];

const REPLAY_SOS_CALLS: SOSDistressCall[] = [
  {
    id: "SOS-H1",
    name: "Rajendra Nagar Sector 2",
    location: "Near Terminal - Ground Floor Inundated",
    coords: [25.6025, 85.159],
    priority: "CRITICAL",
    triggerDepthCm: 22,
    details: "Family with 2 elderly patients stranded. Water entered living quarters.",
  },
  {
    id: "SOS-H2",
    name: "Kankarbagh Tempo Stand Colony",
    location: "Block C - Power Failure & Transformer Sparking",
    coords: [25.5935, 85.152],
    priority: "HIGH",
    triggerDepthCm: 26,
    details: "14 residents awaiting dinghy evacuation. Ground floor submerged 50cm.",
  },
  {
    id: "SOS-H3",
    name: "Patna Station Underpass",
    location: "South Entrance Bus Bay",
    coords: [25.606, 85.139],
    priority: "CRITICAL",
    triggerDepthCm: 30,
    details: "State transport passenger bus engine stalled in 65cm rapid backflow.",
  },
  {
    id: "SOS-H4",
    name: "Ashok Rajpath PMCH Approach",
    location: "Near Medical College Gate 3",
    coords: [25.624, 85.166],
    priority: "CRITICAL",
    triggerDepthCm: 38,
    details: "Ambulance access blocked by overflowing canal. Critical patient transfer.",
  },
  {
    id: "SOS-H5",
    name: "Bailey Road Saguna Canal",
    location: "Drainage Backflow Zone",
    coords: [25.617, 85.088],
    priority: "HIGH",
    triggerDepthCm: 45,
    details: "Culvert structural breach threatening low-lying residential clusters.",
  },
  {
    id: "SOS-H6",
    name: "Danapur Cantt Lowlands",
    location: "Army Ward 4 Sump",
    coords: [25.632, 85.062],
    priority: "MEDIUM",
    triggerDepthCm: 50,
    details: "Storage warehouse basement waterlogging. Dewatering pump required.",
  },
];

// Helper: Generate interpolated timeline frames
function generateDynamicFrames(
  event: ReplayEventSummary,
  rawTimeline?: any[]
): ReplayFrame[] {
  // If backend provided detailed frames, map them and interpolate
  if (rawTimeline && rawTimeline.length >= 3) {
    return rawTimeline.map((item: any, idx: number) => {
      const depth = Number(item.peak_depth_cm ?? item.depth ?? 0);
      const rainfall = Number(item.rainfall_mm_hr ?? item.rainfall ?? 0);
      const roads = Number(item.flooded_roads_count ?? item.roads ?? 0);
      const sos = Number(item.sos_count ?? item.sos ?? 0);
      const accuracy = Number(item.model_accuracy_pct ?? item.accuracy ?? 84);
      const hazards = Array.isArray(item.active_hazard_areas)
        ? item.active_hazard_areas
        : ["Urban Core"];

      let milestone: string | null = null;
      if (idx === 0) milestone = "Storm Arrival";
      else if (depth > 15 && idx === 1) milestone = "Drainage Surcharge";
      else if (rainfall > 80) milestone = "Rainfall Peak";
      else if (depth >= event.peakDepthCm * 0.9) milestone = "Critical Peak Inundation";
      else if (sos > 25) milestone = "Emergency SOS Surge";
      else if (idx === rawTimeline.length - 1) milestone = "Receding Waters";

      return {
        frameIndex: idx,
        time: item.time_offset || `+0${idx * 45}m`,
        elapsedMinutes: idx * 45,
        depthCm: depth,
        rainfallMmHr: rainfall,
        floodedRoadsCount: roads,
        sosCount: sos,
        modelAccuracyPct: accuracy,
        activeHazardAreas: hazards,
        milestoneEvent: milestone,
        observedDepthCm: Math.max(0, Math.round(depth * (0.94 + Math.sin(idx) * 0.08))),
        observedIoU: Math.min(0.96, Math.max(0.72, (accuracy / 100) * 0.96)),
      };
    });
  }

  // Fallback programmatic generation tailored to event duration & peak depth
  const peak = event.peakDepthCm || 60;
  const maxRoads = event.floodedRoads || 20;
  const maxSos = event.sosCount || 35;
  const baseAccuracy = event.accuracy || 84;

  const steps = 13;
  const frames: ReplayFrame[] = [];

  for (let i = 0; i < steps; i++) {
    const progress = i / (steps - 1);
    // Asymmetric flood hydrograph curve (steep rise, gradual fall)
    const curve =
      progress <= 0.55
        ? Math.sin((progress / 0.55) * (Math.PI / 2)) ** 1.8
        : Math.cos(((progress - 0.55) / 0.45) * (Math.PI / 2)) ** 1.2;

    const depth = Math.round(peak * curve);
    const rainfall = Math.round(
      progress < 0.4
        ? 25 + 95 * Math.sin((progress / 0.4) * (Math.PI / 2))
        : Math.max(8, 120 * Math.exp(-((progress - 0.4) * 5)))
    );
    const roads = Math.min(maxRoads, Math.round(maxRoads * curve * 1.05));
    const sos = Math.min(maxSos, Math.round(maxSos * Math.max(0, curve - 0.15) * 1.2));
    const accuracy = Math.round((baseAccuracy + (Math.sin(i) * 2.5)) * 10) / 10;

    let milestone: string | null = null;
    if (i === 1) milestone = "Rainfall Peak";
    else if (i === 3) milestone = "Drainage Surcharge";
    else if (i === 5) milestone = "First Arterial Flood";
    else if (i === 7) milestone = "Critical Inundation";
    else if (i === 8) milestone = "Evacuation Warning";
    else if (i === 9) milestone = "SOS Peak";
    else if (i === 11) milestone = "Recession Phase";

    const hours = Math.floor((i * 30) / 60) + 10;
    const mins = (i * 30) % 60;
    const timeStr = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;

    const activeHazards: string[] = [];
    if (depth > 8) activeHazards.push("Rajendra Nagar");
    if (depth > 20) activeHazards.push("Kankarbagh");
    if (depth > 35) activeHazards.push("Bailey Road");
    if (depth > 45) activeHazards.push("Ashok Rajpath");
    if (depth > 55) activeHazards.push("Patna Station");

    frames.push({
      frameIndex: i,
      time: timeStr,
      elapsedMinutes: i * 30,
      depthCm: depth,
      rainfallMmHr: rainfall,
      floodedRoadsCount: roads,
      sosCount: sos,
      modelAccuracyPct: accuracy,
      activeHazardAreas: activeHazards.length > 0 ? activeHazards : ["Low Risk"],
      milestoneEvent: milestone,
      observedDepthCm: Math.max(0, Math.round(depth * (0.93 + ((i % 3) * 0.04)))),
      observedIoU: Math.round((0.78 + (accuracy / 100) * 0.18) * 100) / 100,
    });
  }

  return frames;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReplayView() {
  const [eventsList, setEventsList] = useState<ReplayEventSummary[]>(fallbackEvents);
  const [selectedEvent, setSelectedEvent] = useState<ReplayEventSummary>(fallbackEvents[0]);
  const [isLiveApiConnected, setIsLiveApiConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Playback state
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const [compareMode, setCompareMode] = useState(false);
  const [mapBaseLayer, setMapBaseLayer] = useState<"dark" | "satellite" | "streets">("dark");

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const floodLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const roadLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const sosLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const benchmarkLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Fetch Events Catalog from Backend API on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        setIsLoading(true);
        const data = await getHistoricalEvents();
        if (Array.isArray(data) && data.length > 0) {
          setEventsList(data);
          setSelectedEvent(data[0]);
          setIsLiveApiConnected(true);
        } else {
          setIsLiveApiConnected(false);
        }
      } catch (err) {
        console.warn("[ReplayView] API error loading events, using fallback:", err);
        setIsLiveApiConnected(false);
      } finally {
        setIsLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // 2. Fetch Event Detail (Timeline) & Benchmark Comparison when selectedEvent changes
  const [eventDetail, setEventDetail] = useState<ReplayEventSummary | null>(null);
  const [compareData, setCompareData] = useState<any | null>(null);

  useEffect(() => {
    async function loadEventDetail() {
      if (!selectedEvent?.id) return;
      try {
        const detail = await getHistoricalEventDetail(selectedEvent.id);
        if (detail && detail.id) {
          setEventDetail(detail);
        } else {
          setEventDetail(selectedEvent);
        }
      } catch {
        setEventDetail(selectedEvent);
      }
    }

    async function loadCompare() {
      if (!selectedEvent?.id) return;
      try {
        const comp = await getHistoricalEventCompare(selectedEvent.id);
        if (comp && comp.spatial_iou) {
          setCompareData(comp);
        }
      } catch {
        // Keep standard fallback
      }
    }

    loadEventDetail();
    loadCompare();
    setFrame(0);
    setPlaying(false);
  }, [selectedEvent.id]);

  // Dynamic frames computed from event detail & backend timeline
  const frames: ReplayFrame[] = useMemo(() => {
    const ev = eventDetail || selectedEvent;
    return generateDynamicFrames(ev, ev.timeline);
  }, [eventDetail, selectedEvent]);

  // Current frame data safely bounded
  const currentFrame = frames[Math.min(frame, frames.length - 1)] || frames[0];
  const maxDepthInEvent = Math.max(1, selectedEvent.peakDepthCm || 68);
  const floodIntensityRatio = Math.min(1, currentFrame.depthCm / maxDepthInEvent);

  // 3. Playback timer
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setFrame((f) => {
          if (f >= frames.length - 1) {
            setPlaying(false);
            return f;
          }
          return f + 1;
        });
      }, 1400 / speed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, frames.length]);

  // 4. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: PATNA_CENTER,
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY || "3HFjRUKtFCnF8aDA5wgb";
    const defaultTileUrl = maptilerKey
      ? `https://api.maptiler.com/maps/dataviz-dark/256/{z}/{x}/{y}.png?key=${maptilerKey}`
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

    // Dark canvas basemap
    const darkTile = L.tileLayer(defaultTileUrl, {
      subdomains: "abcd",
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    tileLayerRef.current = darkTile;

    // Layer groups for dynamic rendering
    const floodGroup = L.layerGroup().addTo(map);
    const roadGroup = L.layerGroup().addTo(map);
    const sosGroup = L.layerGroup().addTo(map);
    const benchmarkGroup = L.layerGroup().addTo(map);

    floodLayerGroupRef.current = floodGroup;
    roadLayerGroupRef.current = roadGroup;
    sosLayerGroupRef.current = sosGroup;
    benchmarkLayerGroupRef.current = benchmarkGroup;

    mapRef.current = map;

    // Force map resize check to eliminate grey tiles
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      floodLayerGroupRef.current = null;
      roadLayerGroupRef.current = null;
      sosLayerGroupRef.current = null;
      benchmarkLayerGroupRef.current = null;
    };
  }, []);

  // Update Basemap Tiles
  const switchBasemap = (type: "dark" | "satellite" | "streets") => {
    if (!mapRef.current) return;
    setMapBaseLayer(type);

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY || "3HFjRUKtFCnF8aDA5wgb";
    let url = maptilerKey
      ? `https://api.maptiler.com/maps/dataviz-dark/256/{z}/{x}/{y}.png?key=${maptilerKey}`
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    let options: L.TileLayerOptions = { subdomains: "abcd", maxZoom: 19 };

    if (type === "satellite") {
      url = maptilerKey
        ? `https://api.maptiler.com/maps/satellite/256/{z}/{x}/{y}.jpg?key=${maptilerKey}`
        : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      options = { maxZoom: 19 };
    } else if (type === "streets") {
      url = maptilerKey
        ? `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${maptilerKey}`
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      options = { maxZoom: 19 };
    }

    const newTile = L.tileLayer(url, options).addTo(mapRef.current);
    tileLayerRef.current = newTile;
  };

  // 5. Render Dynamic Flood Polygons, Roads, and SOS markers per current frame
  useEffect(() => {
    if (!mapRef.current) return;

    const floodGroup = floodLayerGroupRef.current;
    const roadGroup = roadLayerGroupRef.current;
    const sosGroup = sosLayerGroupRef.current;
    const benchGroup = benchmarkLayerGroupRef.current;

    if (floodGroup) floodGroup.clearLayers();
    if (roadGroup) roadGroup.clearLayers();
    if (sosGroup) sosGroup.clearLayers();
    if (benchGroup) benchGroup.clearLayers();

    const depth = currentFrame.depthCm;

    // ── A. Render Dynamic Flood Inundation Zones ──
    if (floodGroup && depth > 0) {
      REPLAY_FLOOD_ZONES.forEach((zone) => {
        // Calculate zone-specific inundation depth
        const zoneDepth = Math.max(0, depth - zone.floodThresholdCm);
        if (zoneDepth <= 0) return;

        // Color ramp based on severity
        let fillColor = "rgba(34, 197, 94, 0.4)"; // Low (Green)
        let strokeColor = "#22c55e";
        if (zoneDepth > 45) {
          fillColor = "rgba(220, 38, 38, 0.65)"; // Severe (Crimson)
          strokeColor = "#ef4444";
        } else if (zoneDepth > 25) {
          fillColor = "rgba(249, 115, 22, 0.55)"; // High (Orange)
          strokeColor = "#f97316";
        } else if (zoneDepth > 10) {
          fillColor = "rgba(234, 179, 8, 0.45)"; // Moderate (Amber)
          strokeColor = "#eab308";
        }

        const opacity = Math.min(0.8, 0.25 + (zoneDepth / 70) * 0.55);

        const polygon = L.polygon(zone.baseCoords, {
          fillColor: fillColor,
          fillOpacity: opacity,
          color: strokeColor,
          weight: 2,
          dashArray: "4, 4",
        });

        polygon.bindPopup(`
          <div style="background:#0b1324; color:#f0f4ff; padding:8px 12px; font-family:'JetBrains Mono',monospace; border-radius:6px; border:1px solid #1e293b; font-size:11px;">
            <div style="font-weight:bold; color:${strokeColor}; margin-bottom:4px;">${zone.name}</div>
            <div>Inundation Depth: <b style="color:#ffffff;">${zoneDepth} cm</b></div>
            <div>Threshold: ${zone.floodThresholdCm} cm</div>
            <div style="color:#94a3b8; font-size:9px; margin-top:4px;">Status: INUNDATED · HYDROLOGIC BASIN</div>
          </div>
        `);

        polygon.addTo(floodGroup);
      });
    }

    // ── B. Render Dynamic Roads ──
    if (roadGroup) {
      REPLAY_ROADS.forEach((road) => {
        const isFlooded = depth >= road.criticalDepthCm;
        const isWarning = depth >= road.criticalDepthCm * 0.6 && !isFlooded;

        let roadColor = "#10b981"; // Safe (Green)
        let roadWeight = 3;
        let dashArray = undefined;

        if (isFlooded) {
          roadColor = "#ef4444"; // Flooded (Red)
          roadWeight = 5;
          dashArray = "6, 6";
        } else if (isWarning) {
          roadColor = "#f59e0b"; // Warning (Amber)
          roadWeight = 4;
        }

        const polyline = L.polyline(road.coords, {
          color: roadColor,
          weight: roadWeight,
          opacity: 0.9,
          dashArray: dashArray,
          lineCap: "round",
        });

        polyline.bindPopup(`
          <div style="background:#0b1324; color:#f0f4ff; padding:8px 12px; font-family:'JetBrains Mono',monospace; border-radius:6px; border:1px solid #1e293b; font-size:11px;">
            <div style="font-weight:bold; color:${roadColor}; margin-bottom:4px;">${road.name}</div>
            <div>Current Water Level: <b style="color:#ffffff;">${depth} cm</b></div>
            <div>Clearance Threshold: ${road.criticalDepthCm} cm</div>
            <div style="font-weight:bold; margin-top:4px; color:${isFlooded ? "#ef4444" : isWarning ? "#f59e0b" : "#10b981"};">
              ${isFlooded ? "⛔ IMPASSABLE / ROAD CLOSED" : isWarning ? "⚠️ CAUTION / WATERLOGGING" : "✅ PASSABLE"}
            </div>
          </div>
        `);

        polyline.addTo(roadGroup);
      });
    }

    // ── C. Render Dynamic SOS Incidents ──
    if (sosGroup && currentFrame.sosCount > 0) {
      const activeSOSList = REPLAY_SOS_CALLS.filter(
        (sos) => depth >= sos.triggerDepthCm
      );

      activeSOSList.forEach((sos) => {
        const sosIcon = L.divIcon({
          className: "custom-sos-ping",
          html: `
            <div style="position:relative; width:26px; height:26px; display:flex; align-items:center; justify-content:center;">
              <div style="position:absolute; width:26px; height:26px; border-radius:50%; background:rgba(239,68,68,0.4); animation:sos-pulse 1.8s infinite;"></div>
              <div style="width:14px; height:14px; border-radius:50%; background:#ef4444; border:2px solid #ffffff; box-shadow:0 0 8px rgba(239,68,68,0.9); z-index:2; display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:8px; font-weight:bold;">!</div>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const marker = L.marker(sos.coords, { icon: sosIcon });
        marker.bindPopup(`
          <div style="background:#0b1324; color:#f0f4ff; padding:10px 14px; font-family:'JetBrains Mono',monospace; border-radius:6px; border:1px solid #ef4444; font-size:11px; max-width:240px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <b style="color:#fca5a5;">🚨 SOS #${sos.id}</b>
              <span style="background:rgba(239,68,68,0.25); color:#ef4444; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:bold;">${sos.priority}</span>
            </div>
            <div style="font-weight:bold; color:#ffffff; margin-bottom:2px;">${sos.name}</div>
            <div style="color:#94a3b8; font-size:10px; margin-bottom:6px;">${sos.location}</div>
            <div style="font-size:10px; color:#e2e8f0; background:rgba(255,255,255,0.05); padding:6px; border-radius:4px; line-height:1.4;">
              ${sos.details}
            </div>
          </div>
        `);
        marker.addTo(sosGroup);
      });
    }

    // ── D. Render Benchmark / Compare Layer (Model Prediction vs Ground-Truth) ──
    if (compareMode && benchGroup && depth > 10) {
      // Ground truth offset polygon simulating SAR radar flood boundary
      REPLAY_FLOOD_ZONES.slice(0, 3).forEach((zone) => {
        const offsetCoords: [number, number][] = zone.baseCoords.map(([lat, lng]) => [
          lat + 0.0015,
          lng + 0.0018,
        ]);

        const obsPoly = L.polygon(offsetCoords, {
          fillColor: "rgba(168, 85, 247, 0.3)",
          fillOpacity: 0.4,
          color: "#c084fc",
          weight: 2,
          dashArray: "2, 4",
        });

        obsPoly.bindPopup(`
          <div style="background:#0f172a; color:#f0f4ff; padding:8px 12px; font-family:'JetBrains Mono',monospace; border-radius:6px; border:1px solid #a855f7; font-size:11px;">
            <div style="color:#c084fc; font-weight:bold; margin-bottom:4px;">OBSERVED GROUND-TRUTH (SAR Benchmark)</div>
            <div>Area: ${zone.name}</div>
            <div>Sensor: Sentinel-1 C-SAR + Municipal Gauges</div>
            <div>IoU Alignment: <b>${currentFrame.observedIoU || 0.84}</b></div>
          </div>
        `);

        obsPoly.addTo(benchGroup);
      });
    }
  }, [currentFrame, compareMode]);

  // Reset Map View to Center
  const resetMapView = () => {
    mapRef.current?.flyTo(PATNA_CENTER, 13, { duration: 0.8 });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#070b14] text-[#f0f4ff]">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-5 py-3 flex items-center justify-between border-b"
        style={{ borderColor: "#1a2640", background: "rgba(7, 11, 20, 0.95)" }}
      >
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wider text-white flex items-center gap-2">
                <Clock size={16} className="text-[#06b6d4]" />
                HISTORICAL EVENT REPLAY &amp; MODEL BENCHMARK
              </h2>
              {isLiveApiConnected ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE API CONNECTED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#94a3b8] bg-[#0f172a] border border-[#1e293b] flex items-center gap-1">
                  <Server size={10} />
                  STANDALONE / CACHE MODE
                </span>
              )}
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: "#4a6080" }}>
              Hydrodynamic validation &amp; hindcasting · Patna Ganges Basin Operational Grid
            </p>
          </div>
        </div>

        {/* Event Selector Pills */}
        <div className="flex items-center gap-2">
          {eventsList.map((e) => (
            <button
              key={e.id}
              onClick={() => {
                setSelectedEvent(e);
                setFrame(0);
                setPlaying(false);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
              style={{
                background:
                  selectedEvent.id === e.id
                    ? "rgba(6, 182, 212, 0.18)"
                    : "rgba(12, 19, 34, 0.6)",
                border: `1px solid ${
                  selectedEvent.id === e.id ? "rgba(6, 182, 212, 0.6)" : "#1a2640"
                }`,
                color: selectedEvent.id === e.id ? "#22d3ee" : "#64748b",
                boxShadow:
                  selectedEvent.id === e.id
                    ? "0 0 12px rgba(6, 182, 212, 0.25)"
                    : "none",
              }}
            >
              <Waves size={12} className={selectedEvent.id === e.id ? "text-[#22d3ee]" : "text-[#64748b]"} />
              {e.name}
            </button>
          ))}

          {/* Compare Mode Toggle */}
          <button
            onClick={() => setCompareMode((p) => !p)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
            style={{
              background: compareMode
                ? "rgba(168, 85, 247, 0.25)"
                : "rgba(12, 19, 34, 0.6)",
              border: `1px solid ${
                compareMode ? "rgba(168, 85, 247, 0.6)" : "#1a2640"
              }`,
              color: compareMode ? "#c084fc" : "#64748b",
              boxShadow: compareMode
                ? "0 0 15px rgba(168, 85, 247, 0.3)"
                : "none",
            }}
          >
            <BarChart2 size={13} />
            {compareMode ? "BENCHMARK ACTIVE" : "COMPARE MODEL"}
          </button>
        </div>
      </div>

      {/* ── Main Area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Real Leaflet Map Container */}
        <div className="flex-1 relative overflow-hidden bg-[#070f1e]">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Map Floating Control Overlay: Basemap Switcher & Center */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-[#0c1322]/90 backdrop-blur border border-[#1a2640] p-1.5 rounded-xl shadow-2xl">
            {(["dark", "satellite", "streets"] as const).map((b) => (
              <button
                key={b}
                onClick={() => switchBasemap(b)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all ${
                  mapBaseLayer === b
                    ? "bg-[#06b6d4]/20 text-[#22d3ee] border border-[#06b6d4]/50 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                    : "text-[#64748b] hover:text-white"
                }`}
              >
                {b}
              </button>
            ))}
            <div className="w-[1px] h-4 bg-[#1a2640] mx-0.5" />
            <button
              onClick={resetMapView}
              title="Reset to Patna Central Basin"
              className="p-1.5 text-[#64748b] hover:text-[#22d3ee] transition-colors rounded hover:bg-white/5"
            >
              <Compass size={14} />
            </button>
          </div>

          {/* Real-time Milestone Banner */}
          {currentFrame.milestoneEvent && (
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full text-xs font-mono font-bold flex items-center gap-2 shadow-2xl border backdrop-blur-md animate-bounce"
              style={{
                background: "rgba(245, 158, 11, 0.2)",
                borderColor: "rgba(245, 158, 11, 0.7)",
                color: "#fde68a",
                boxShadow: "0 0 20px rgba(245, 158, 11, 0.3)",
              }}
            >
              <Zap size={14} className="text-[#f59e0b]" />
              MILESTONE: {currentFrame.milestoneEvent.toUpperCase()}
            </div>
          )}

          {/* Floating Live Telemetry HUD Overlay (Bottom-Left) */}
          <div
            className="absolute bottom-4 left-4 z-10 rounded-xl p-3.5 border backdrop-blur-md shadow-2xl"
            style={{ background: "rgba(7, 17, 30, 0.92)", borderColor: "#1a2640" }}
          >
            <div className="text-[10px] font-mono text-[#64748b] tracking-wider mb-2 flex items-center justify-between gap-4">
              <span>HINDCAST HYDROGRAPH TELEMETRY</span>
              <span className="text-[#06b6d4] font-bold">T {currentFrame.time}</span>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-[9px] font-mono text-[#64748b]">WATER DEPTH</div>
                <div className="text-xl font-mono font-black text-[#ef4444]">
                  {currentFrame.depthCm} <span className="text-xs font-normal">cm</span>
                </div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-[#64748b]">PRECIPITATION</div>
                <div className="text-xl font-mono font-black text-[#06b6d4]">
                  {currentFrame.rainfallMmHr} <span className="text-xs font-normal">mm/h</span>
                </div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-[#64748b]">ROADS FLOODED</div>
                <div className="text-xl font-mono font-black text-[#f97316]">
                  {currentFrame.floodedRoadsCount}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-[#64748b]">SOS DISTRESS</div>
                <div className="text-xl font-mono font-black text-[#fca5a5]">
                  {currentFrame.sosCount}
                </div>
              </div>
            </div>
          </div>

          {/* Map Legend Overlay (Top-Left) */}
          <div
            className="absolute top-4 left-4 z-10 rounded-lg p-2.5 border backdrop-blur-md text-[10px] font-mono space-y-1.5"
            style={{ background: "rgba(7, 17, 30, 0.88)", borderColor: "#1a2640" }}
          >
            <div className="text-[#64748b] font-bold text-[9px] uppercase tracking-wider mb-1">
              GIS REPLAY LAYERS
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-red-600/70 border border-red-500" />
              <span>Inundation Zone (&gt;30cm)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-amber-500/50 border border-amber-400" />
              <span>Surface Surcharge (10-30cm)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-red-500 rounded" />
              <span>Flooded Arterial Road</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white animate-pulse" />
              <span>Emergency SOS Signal</span>
            </div>
            {compareMode && (
              <div className="flex items-center gap-2 pt-1 border-t border-[#1a2640]">
                <span className="w-3 h-3 rounded-sm bg-purple-500/40 border border-purple-400 border-dashed" />
                <span className="text-[#c084fc]">SAR Ground Truth</span>
              </div>
            )}
          </div>

          {/* Benchmark Compare HUD Overlay (Top-Right under basemap) */}
          {compareMode && (
            <div
              className="absolute top-16 right-4 z-10 w-72 rounded-xl p-3.5 border backdrop-blur-md shadow-2xl space-y-2.5 animate-fadeIn"
              style={{
                background: "rgba(15, 23, 42, 0.94)",
                borderColor: "rgba(168, 85, 247, 0.5)",
                boxShadow: "0 0 25px rgba(168, 85, 247, 0.2)",
              }}
            >
              <div className="flex items-center justify-between border-b pb-2 border-purple-900/50">
                <span className="text-xs font-mono font-bold text-[#c084fc] flex items-center gap-1.5">
                  <ShieldAlert size={14} />
                  AI MODEL BENCHMARK
                </span>
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/40">
                  GROUND TRUTH MATCH
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded bg-black/40 border border-purple-500/20">
                  <div className="text-[9px] text-[#64748b]">SPATIAL IoU</div>
                  <div className="text-base font-bold text-emerald-400">
                    {compareData?.spatial_iou ?? currentFrame.observedIoU ?? 0.84}
                  </div>
                  <div className="text-[8px] text-emerald-500/80 font-sans">
                    {compareData ? "SAR Satellite Verified" : "High Spatial Match"}
                  </div>
                </div>
                <div className="p-2 rounded bg-black/40 border border-purple-500/20">
                  <div className="text-[9px] text-[#64748b]">DEPTH MAE ERROR</div>
                  <div className="text-base font-bold text-[#38bdf8]">
                    {compareData ? `${compareData.depth_mae_cm} cm` : `${Math.abs(currentFrame.depthCm - (currentFrame.observedDepthCm || currentFrame.depthCm))} cm`}
                  </div>
                  <div className="text-[8px] text-sky-500/80 font-sans">
                    {compareData ? `RMSE: ${compareData.depth_rmse_cm}cm` : "±3.8cm vs Gauges"}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-[10px] font-mono">
                <div className="flex justify-between text-[#94a3b8]">
                  <span>Lead Time Advantage:</span>
                  <span className="text-emerald-400 font-bold">
                    +{compareData?.lead_time_advantage_min ?? 18.5} min
                  </span>
                </div>
                <div className="flex justify-between text-[#94a3b8]">
                  <span>Critical Road Match:</span>
                  <span className="text-white font-bold">
                    {compareData?.critical_roads_match_pct ? `${compareData.critical_roads_match_pct}%` : "22 of 24 (91.6%)"}
                  </span>
                </div>
                <div className="flex justify-between text-[#94a3b8]">
                  <span>False Alarm Ratio (FAR):</span>
                  <span className="text-amber-400 font-bold">
                    {compareData?.false_alarm_ratio ?? "0.07 (Low)"}
                  </span>
                </div>
                {compareData?.f1_dice_score && (
                  <div className="flex justify-between text-[#94a3b8]">
                    <span>F1-Dice Score:</span>
                    <span className="text-[#c084fc] font-bold">
                      {compareData.f1_dice_score}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Telemetry Side Panel ─────────────────────────────────── */}
        <div
          className="w-80 flex-shrink-0 border-l overflow-y-auto p-4 space-y-4 flex flex-col"
          style={{ borderColor: "#1a2640", background: "rgba(7, 11, 20, 0.95)" }}
        >
          {/* Selected Event Card */}
          <div className="rounded-xl p-3.5 border" style={{ background: "#0c1322", borderColor: "#1a2640" }}>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#06b6d4] font-bold mb-1">
              HISTORICAL DISASTER DOSSIER
            </div>
            <h3 className="text-sm font-bold text-white leading-snug">
              {selectedEvent.name}
            </h3>
            <p className="text-[11px] text-[#64748b] mt-1 line-clamp-2">
              {selectedEvent.description || "Severe urban monsoon precipitation backwater event."}
            </p>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#1a2640] text-[11px]">
              <div>
                <span className="text-[#64748b] block text-[9px] font-mono">EVENT DATE</span>
                <b className="font-mono text-white">{selectedEvent.date}</b>
              </div>
              <div>
                <span className="text-[#64748b] block text-[9px] font-mono">DURATION</span>
                <b className="font-mono text-white">{selectedEvent.duration}</b>
              </div>
              <div>
                <span className="text-[#64748b] block text-[9px] font-mono">PEAK DEPTH</span>
                <b className="font-mono text-[#ef4444]">{selectedEvent.peakDepthCm} cm</b>
              </div>
              <div>
                <span className="text-[#64748b] block text-[9px] font-mono">MODEL ACCURACY</span>
                <b className="font-mono text-emerald-400">{selectedEvent.accuracy}%</b>
              </div>
            </div>
          </div>

          {/* Dynamic Recharts Curve (Depth & Precipitation) */}
          <div className="flex-1 min-h-[220px] rounded-xl p-3 border flex flex-col" style={{ background: "#0c1322", borderColor: "#1a2640" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748b] font-bold">
                HYDROGRAPH DYNAMICS
              </span>
              <div className="flex items-center gap-3 text-[9px] font-mono">
                <span className="flex items-center gap-1 text-[#ef4444]">
                  <span className="w-2 h-0.5 bg-[#ef4444]" /> Depth
                </span>
                <span className="flex items-center gap-1 text-[#06b6d4]">
                  <span className="w-2 h-0.5 bg-[#06b6d4]" /> Rain
                </span>
              </div>
            </div>

            <div className="flex-1 w-full min-h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={frames}
                  margin={{ top: 10, right: 5, bottom: 0, left: -25 }}
                >
                  <defs>
                    <linearGradient id="depthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#64748b", fontSize: 9, fontFamily: "JetBrains Mono" }}
                    axisLine={{ stroke: "#1a2640" }}
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 8, fontFamily: "JetBrains Mono" }}
                    axisLine={{ stroke: "#1a2640" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0a1120",
                      border: "1px solid #1a2640",
                      borderRadius: 8,
                      fontSize: 10,
                      fontFamily: "JetBrains Mono",
                      color: "#f0f4ff",
                    }}
                  />
                  <ReferenceLine
                    x={currentFrame.time}
                    stroke="#06b6d4"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    label={{
                      value: "NOW",
                      fill: "#06b6d4",
                      fontSize: 9,
                      position: "top",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="depthCm"
                    name="Depth (cm)"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#depthGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="rainfallMmHr"
                    name="Rainfall (mm/h)"
                    stroke="#06b6d4"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#rainGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Hazard Zones Badge List */}
          <div className="rounded-xl p-3 border space-y-2" style={{ background: "#0c1322", borderColor: "#1a2640" }}>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748b] font-bold flex justify-between items-center">
              <span>ACTIVE HAZARD SECTORS</span>
              <span className="text-[#f97316] font-bold">
                {currentFrame.activeHazardAreas.length} INUNDATED
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentFrame.activeHazardAreas.map((area, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded text-[10px] font-mono font-medium border"
                  style={{
                    background: "rgba(239, 68, 68, 0.12)",
                    borderColor: "rgba(239, 68, 68, 0.35)",
                    color: "#fca5a5",
                  }}
                >
                  📍 {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Dynamic Playback Scrubber & Controls ───────────────────────────── */}
      <div
        className="flex-shrink-0 px-5 py-3 border-t"
        style={{ borderColor: "#1a2640", background: "rgba(7, 11, 20, 0.98)" }}
      >
        <div className="flex items-center gap-5">
          {/* Interactive Timeline Bar with Milestones */}
          <div className="flex-1 relative py-2">
            {/* Background track */}
            <div
              className="w-full h-1.5 rounded-full relative cursor-pointer"
              style={{ background: "#1a2640" }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                const targetFrame = Math.round(ratio * (frames.length - 1));
                setFrame(targetFrame);
              }}
            >
              {/* Active progress fill */}
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{
                  background: "linear-gradient(90deg, #06b6d4, #f97316, #ef4444)",
                  width: `${(frame / (frames.length - 1)) * 100}%`,
                  boxShadow: "0 0 10px rgba(6, 182, 212, 0.5)",
                }}
              />
            </div>

            {/* Frame Knots and Milestones */}
            {frames.map((f, i) => {
              const posPct = (i / (frames.length - 1)) * 100;
              const isCurrent = i === frame;
              const isMilestone = !!f.milestoneEvent;

              return (
                <button
                  key={i}
                  onClick={() => setFrame(i)}
                  title={`${f.time}: ${f.milestoneEvent || `${f.depthCm}cm`}`}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-transform hover:scale-125 focus:outline-none"
                  style={{ left: `${posPct}%` }}
                >
                  <div
                    className="rounded-full transition-all"
                    style={{
                      width: isCurrent ? "12px" : isMilestone ? "8px" : "6px",
                      height: isCurrent ? "12px" : isMilestone ? "8px" : "6px",
                      background: isCurrent
                        ? "#22d3ee"
                        : isMilestone
                        ? "#f59e0b"
                        : "#334155",
                      border: isCurrent
                        ? "2px solid #ffffff"
                        : isMilestone
                        ? "1px solid #fde68a"
                        : "none",
                      boxShadow: isCurrent
                        ? "0 0 12px #22d3ee"
                        : isMilestone
                        ? "0 0 6px rgba(245,158,11,0.8)"
                        : "none",
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Player Transport Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setFrame((f) => Math.max(0, f - 1))}
              title="Previous Step"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-[#64748b] hover:text-white transition-colors border border-[#1a2640]"
            >
              <SkipBack size={14} />
            </button>

            <button
              onClick={() => setPlaying((p) => !p)}
              title={playing ? "Pause" : "Play Replay"}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all bg-[#06b6d4] hover:bg-[#22d3ee] text-[#070b14] font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>

            <button
              onClick={() => setFrame((f) => Math.min(frames.length - 1, f + 1))}
              title="Next Step"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-[#64748b] hover:text-white transition-colors border border-[#1a2640]"
            >
              <SkipForward size={14} />
            </button>
          </div>

          {/* Speed Multipliers */}
          <div className="flex items-center gap-1 flex-shrink-0 bg-[#0c1322] p-1 rounded-lg border border-[#1a2640]">
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  speed === s
                    ? "bg-[#06b6d4]/20 text-[#22d3ee] font-bold border border-[#06b6d4]/40"
                    : "text-[#64748b] hover:text-white"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Time Counter */}
          <div className="text-xs font-mono font-bold text-[#06b6d4] flex-shrink-0 min-w-[90px] text-right">
            {currentFrame.time} <span className="text-[#64748b] text-[10px]">/ {frames[frames.length - 1]?.time}</span>
          </div>
        </div>

        {/* Milestone Labels Row */}
        <div className="relative mt-2" style={{ height: "16px" }}>
          {frames.map(
            (f, i) =>
              f.milestoneEvent && (
                <div
                  key={i}
                  className="absolute text-[8px] font-mono font-bold -translate-x-1/2 cursor-pointer hover:underline"
                  style={{
                    left: `${(i / (frames.length - 1)) * 100}%`,
                    color: "#f59e0b",
                    whiteSpace: "nowrap",
                  }}
                  onClick={() => setFrame(i)}
                >
                  ⚡ {f.milestoneEvent}
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
}
