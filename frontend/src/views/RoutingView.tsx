import { useState, useEffect, useRef } from "react";
import {
  Navigation,
  MapPin,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Compass,
  CornerUpRight,
  ArrowRight,
  Play,
  Pause,
  X,
  Volume2,
  ShieldCheck,
  Gauge,
  Radio,
} from "lucide-react";
import {
  calculateDynamicRoute,
  getAreaMapLayout,
  type CalculationResult,
  type RouteOption,
  type AreaMapLayout,
} from "../services/routingEngine";
import type { CityPreset, CityFloodDataset } from "../services/cityDataGenerator";

interface RoutingViewProps {
  activeCity?: CityPreset;
  cityDataset?: CityFloodDataset | null;
}

const exposureColor = {
  LOW: "#10b981",
  MODERATE: "#f59e0b",
  HIGH: "#f97316",
  SEVERE: "#ef4444",
};

export default function RoutingView({ activeCity }: RoutingViewProps) {
  const [from, setFrom] = useState("Current Location");
  const [to, setTo] = useState("rajam");
  const [calculating, setCalculating] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [routeResult, setRouteResult] = useState<CalculationResult | null>(null);
  const [mapLayout, setMapLayout] = useState<AreaMapLayout | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("R1");
  const [showWhy, setShowWhy] = useState<string | null>(null);
  const [routeAlert, setRouteAlert] = useState(false);
  const [routeChanged, setRouteChanged] = useState(false);

  // ─── Live Navigation Mode State (Google Maps Style) ──────────────────────────
  const [isNavigating, setIsNavigating] = useState(false);
  const [navProgress, setNavProgress] = useState(0); // 0.0 to 1.0
  const [isPaused, setIsPaused] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [voiceAnnouncement, setVoiceAnnouncement] = useState<string | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Compute default initial route and area map background layout on mount or activeCity change
  useEffect(() => {
    const cityName = activeCity?.name || "Patna";
    const res = calculateDynamicRoute("Current Location", to);
    const layout = getAreaMapLayout(to, cityName);
    setRouteResult(res);
    setMapLayout(layout);
    setCalculated(true);
  }, [activeCity?.name]);

  const handleCalculate = async (fromVal?: string, toVal?: string) => {
    const activeFrom = fromVal !== undefined ? fromVal : from;
    const activeTo = toVal !== undefined ? toVal : to;
    if (!activeTo.trim()) return;

    setCalculating(true);
    setRouteAlert(false);

    // Simulate real-time routing algorithm dispatch & map background shift
    await new Promise((r) => setTimeout(r, 400));
    const cityName = activeCity?.name || "Patna";
    const result = calculateDynamicRoute(activeFrom, activeTo);
    const layout = getAreaMapLayout(activeTo, cityName);

    setRouteResult(result);
    setMapLayout(layout);
    setCalculated(true);
    setCalculating(false);
    setRouteChanged(true);
    setTimeout(() => setRouteChanged(false), 3000);
  };

  const handleRecalculate = () => {
    setRouteAlert(false);
    handleCalculate();
  };

  const currentOptions: RouteOption[] = routeResult
    ? [routeResult.recommended, routeResult.alternative]
    : [];

  const activeOption = currentOptions.find((r) => r.id === selectedRouteId) || currentOptions[0];

  // ─── Start / Stop Live Navigation ─────────────────────────────────────────
  const startNavigation = () => {
    setIsNavigating(true);
    setNavProgress(0);
    setIsPaused(false);
    setVoiceAnnouncement(`GPS Navigation Started. Head towards ${activeOption?.steps[0]?.roadName || "destination"}.`);
    setTimeout(() => setVoiceAnnouncement(null), 5000);
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setNavProgress(0);
    setIsPaused(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  // Live Navigation Animation Loop
  useEffect(() => {
    if (!isNavigating || isPaused) return;

    const interval = setInterval(() => {
      setNavProgress((prev) => {
        if (prev >= 1) {
          setIsPaused(true);
          setVoiceAnnouncement("You have safely arrived at your destination!");
          return 1;
        }
        return prev + 0.015; // smooth progress step
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isNavigating, isPaused]);

  // Compute interpolated vehicle position along path points
  const points = activeOption?.pathPoints || [];
  const totalSegments = Math.max(1, points.length - 1);
  const currentSegmentIndex = Math.min(totalSegments - 1, Math.floor(navProgress * totalSegments));
  const segmentFraction = (navProgress * totalSegments) - currentSegmentIndex;

  const ptA = points[currentSegmentIndex] || { x: 80, y: 400 };
  const ptB = points[currentSegmentIndex + 1] || ptA;

  const currentVehicleX = ptA.x + (ptB.x - ptA.x) * segmentFraction;
  const currentVehicleY = ptA.y + (ptB.y - ptA.y) * segmentFraction;

  // Active maneuver step calculation
  const totalSteps = activeOption?.steps?.length || 1;
  const activeStepIdx = Math.min(totalSteps - 1, Math.floor(navProgress * totalSteps));
  const currentStep = activeOption?.steps[activeStepIdx];

  // Compute traveled polyline path string
  const traveledPoints = points.slice(0, currentSegmentIndex + 1);
  traveledPoints.push({ x: currentVehicleX, y: currentVehicleY, lat: 0, lng: 0 });
  let traveledPathD = "";
  if (traveledPoints.length > 0) {
    traveledPathD = `M ${traveledPoints[0].x} ${traveledPoints[0].y}`;
    for (let i = 1; i < traveledPoints.length; i++) {
      traveledPathD += ` L ${traveledPoints[i].x} ${traveledPoints[i].y}`;
    }
  }

  // Dynamic ETA & Distance Remaining during navigation
  const remainingKm = Math.max(0.1, Number((activeOption?.distanceKm * (1 - navProgress)).toFixed(1)));
  const remainingEtaMin = Math.max(1, Math.round(activeOption?.eta * (1 - navProgress)));

  return (
    <div className="h-full flex overflow-hidden relative">
      {/* Side Panel Controls (Hidden during full-screen Navigation Mode) */}
      {!isNavigating && (
        <div
          className="w-80 flex-shrink-0 border-r flex flex-col overflow-y-auto"
          style={{ borderColor: "#1a2640" }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "1px solid #1a2640" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">FIND SAFE ROUTE</h2>
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60 flex items-center gap-1">
                <Compass size={10} />
                {activeCity?.name || "Patna"}
              </span>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: "#4a6080" }}>
              Flood-aware A* pathfinding & dynamic GIS map
            </p>
          </div>

          <div className="p-4 space-y-3 flex-1">
            {/* FROM INPUT */}
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider mb-1 block" style={{ color: "#4a6080" }}>
                FROM
              </label>
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
              >
                <MapPin size={13} style={{ color: "#10b981" }} />
                <input
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    handleCalculate(e.target.value, to);
                  }}
                  placeholder="Enter origin location..."
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-[#2a3a55]"
                  style={{ color: "#f0f4ff", fontFamily: "Inter" }}
                />
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  GPS
                </span>
              </div>
            </div>

            {/* TO INPUT */}
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider mb-1 block" style={{ color: "#4a6080" }}>
                TO
              </label>
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
              >
                <MapPin size={13} style={{ color: "#06b6d4" }} />
                <input
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    handleCalculate(from, e.target.value);
                  }}
                  placeholder="Enter destination (e.g. Rajam)..."
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-[#2a3a55]"
                  style={{ color: "#f0f4ff", fontFamily: "Inter" }}
                />
              </div>
            </div>

            {/* PRESET AREA CHIPS */}
            <div>
              <label className="text-[9px] font-mono uppercase tracking-wider mb-1 block text-slate-400">
                SELECT AREA / DESTINATION
              </label>
              <div className="flex flex-wrap gap-1.5">
                {["Rajam", "Danapur Station", "PMCH Hospital", "Gandhi Maidan", "Boring Road", "Shelter SH-03"].map((place) => {
                  const isActive = to.toLowerCase().includes(place.toLowerCase().split(" ")[0]);
                  return (
                    <button
                      key={place}
                      onClick={() => {
                        setTo(place);
                        handleCalculate(from, place);
                      }}
                      className="text-[10px] font-mono px-2 py-1 rounded border transition-all hover:border-cyan-500 flex items-center gap-1"
                      style={{
                        background: isActive ? "rgba(6,182,212,0.2)" : "rgba(15,23,42,0.6)",
                        borderColor: isActive ? "#06b6d4" : "#1a2640",
                        color: isActive ? "#38bdf8" : "#8da0b8",
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? "#06b6d4" : "#4a6080" }} />
                      {place}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CALCULATE BUTTON */}
            <button
              onClick={() => handleCalculate()}
              disabled={calculating || !to.trim()}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 shadow-lg"
              style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}
            >
              {calculating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  RECALCULATING MAP & PATH…
                </>
              ) : (
                <>
                  <Navigation size={14} />
                  FIND SAFEST ROUTE
                </>
              )}
            </button>

            {/* ROUTE RESULTS CARDS */}
            {calculated && currentOptions.length > 0 && (
              <div className="space-y-2.5 animate-slide-up pt-1">
                {currentOptions.map((r) => {
                  const isSelected = selectedRouteId === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRouteId(r.id)}
                      className="w-full text-left rounded-xl p-3 transition-all relative overflow-hidden"
                      style={{
                        background: isSelected ? `${r.color}15` : "rgba(12,19,34,0.6)",
                        border: `1px solid ${isSelected ? r.color : "#1a2640"}`,
                        boxShadow: isSelected ? `0 0 12px ${r.color}25` : "none",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                          style={{ background: `${r.color}25`, color: r.color, border: `1px solid ${r.color}40` }}
                        >
                          {r.label}
                        </span>
                        <span className="text-[10px] font-mono font-semibold" style={{ color: "#8da0b8" }}>
                          {r.type}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xl font-mono font-black text-white flex items-baseline gap-1">
                            {r.eta} <span className="text-xs font-normal text-slate-400">min</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {r.distanceKm} km
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className="text-xs font-mono font-bold"
                            style={{ color: exposureColor[r.floodExposure] }}
                          >
                            Exposure: {r.floodExposure}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Avoided {r.avoidedRoads} risk roads
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowWhy(showWhy === r.id ? null : r.id);
                        }}
                        className="mt-2 text-[10px] font-mono flex items-center gap-1 hover:text-cyan-400 transition-colors"
                        style={{ color: "#4a6080" }}
                      >
                        WHY THIS ROUTE?{" "}
                        <ChevronRight
                          size={10}
                          style={{
                            transform: showWhy === r.id ? "rotate(90deg)" : undefined,
                            transition: "transform 0.2s",
                          }}
                        />
                      </button>

                      {showWhy === r.id && (
                        <div className="mt-2 space-y-1.5 border-t pt-2 border-slate-800 animate-slide-up">
                          {r.why.map((w) => (
                            <div key={w} className="flex items-start gap-1.5">
                              <CheckCircle size={11} style={{ color: r.color, flexShrink: 0, marginTop: 2 }} />
                              <span className="text-[11px] text-slate-200">{w}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}

                {routeChanged && (
                  <div
                    className="rounded-lg px-3 py-2 flex items-center gap-2 animate-slide-up"
                    style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)" }}
                  >
                    <CheckCircle size={12} style={{ color: "#10b981" }} />
                    <span className="text-xs font-mono text-emerald-400">
                      Map background & route updated!
                    </span>
                  </div>
                )}

                {/* START NAVIGATION BUTTON */}
                <button
                  onClick={startNavigation}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-xl mt-1 animate-pulse"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 0 16px rgba(16,185,129,0.4)" }}
                >
                  <Navigation size={16} className="fill-white" />
                  START NAVIGATION ({activeOption?.eta ?? 18} MIN)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map Viewport — Dynamic Map Background + Google Maps Style Live Navigation */}
      <div className="flex-1 relative overflow-hidden map-grid" style={{ background: "#07111e" }}>
        
        {/* ─── GOOGLE MAPS STYLE TOP NAVIGATION BANNER (When Navigating) ──────────────── */}
        {isNavigating && (
          <div className="absolute top-4 left-4 right-4 z-40 flex flex-col items-center">
            <div
              className="w-full max-w-2xl rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 border animate-slide-down"
              style={{
                background: "linear-gradient(135deg, #059669, #047857)",
                borderColor: "rgba(52,211,153,0.5)",
                boxShadow: "0 10px 30px rgba(5,150,105,0.4)",
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center border border-white/30 flex-shrink-0">
                  <CornerUpRight size={28} className="text-white" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-emerald-200 uppercase tracking-widest flex items-center gap-2">
                    <span>IN {Math.round(350 * (1 - (navProgress % 0.25)))} METERS</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                  </div>
                  <div className="text-lg font-bold text-white leading-tight">
                    {currentStep?.instruction || "Proceed along safe transit route"}
                  </div>
                  <div className="text-xs text-emerald-100 mt-0.5 flex items-center gap-1.5">
                    <ArrowRight size={12} />
                    Then head towards {routeResult?.toLocation.name || "destination"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setAudioMuted(!audioMuted)}
                  className="w-10 h-10 rounded-xl bg-black/20 hover:bg-black/30 flex items-center justify-center text-white border border-white/20 transition-colors"
                >
                  <Volume2 size={18} className={audioMuted ? "opacity-40" : "opacity-100"} />
                </button>
                <button
                  onClick={stopNavigation}
                  className="w-10 h-10 rounded-xl bg-red-600/80 hover:bg-red-600 flex items-center justify-center text-white border border-red-400/30 transition-colors shadow-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Voice Announcement Pill */}
            {voiceAnnouncement && (
              <div className="mt-2 bg-slate-900/90 text-cyan-300 border border-cyan-500/40 text-xs px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
                <Radio size={12} className="animate-spin text-cyan-400" />
                <span>{voiceAnnouncement}</span>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Area Header Indicator Overlay (Non-Navigating mode) */}
        {!isNavigating && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md shadow-lg"
               style={{ background: "rgba(8,13,28,0.85)", borderColor: "#1a2640" }}>
            <span className="w-2 h-2 rounded-full animate-ping" style={{ background: "#06b6d4" }} />
            <span className="text-[11px] font-mono font-bold text-cyan-400 tracking-wider">
              {mapLayout?.regionHeader || "RAJAM FLOOD BASIN"}
            </span>
          </div>
        )}

        {/* Route recalculate notification */}
        {routeAlert && !isNavigating && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-3 rounded-xl animate-slide-up shadow-2xl"
            style={{
              background: "rgba(245,158,11,0.2)",
              border: "1px solid rgba(245,158,11,0.6)",
              minWidth: 340,
            }}
          >
            <AlertTriangle size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
            <div className="flex-1">
              <div className="text-xs font-bold text-white">FLOOD RISKS DETECTED ON CORRIDOR</div>
              <div className="text-[11px]" style={{ color: "#fbbf24" }}>
                Water level rising. Recalculate safest path.
              </div>
            </div>
            <button
              onClick={handleRecalculate}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white flex-shrink-0"
              style={{ background: "#06b6d4" }}
            >
              RECALCULATE
            </button>
          </div>
        )}

        {/* SVG MAP CANVAS */}
        <svg viewBox="0 0 700 500" width="100%" height="100%" className="w-full h-full transition-all duration-500">
          {/* Dynamic Water Body Background */}
          {mapLayout?.waterBodyPath && (
            <g>
              <path
                d={mapLayout.waterBodyPath}
                fill="rgba(6,182,212,0.12)"
                stroke="rgba(6,182,212,0.4)"
                strokeWidth="1.5"
              />
              <text
                x="350"
                y="40"
                fill="rgba(6,182,212,0.6)"
                fontSize="10"
                fontFamily="JetBrains Mono"
                fontWeight="bold"
                textAnchor="middle"
                letterSpacing="0.1em"
              >
                🌊 {mapLayout.waterBodyName.toUpperCase()}
              </text>
            </g>
          )}

          {/* Dynamic Area City Street Network Grid */}
          {mapLayout?.streets.map((st, i) => (
            <g key={i}>
              <line
                x1={st.x1}
                y1={st.y1}
                x2={st.x2}
                y2={st.y2}
                stroke={st.isMain ? "#1e3050" : "#142238"}
                strokeWidth={st.isMain ? "2.5" : "1"}
              />
              {st.label && st.isMain && (
                <text
                  x={(st.x1 + st.x2) / 2}
                  y={st.y1 + 12}
                  fill="#2a3a55"
                  fontSize="8"
                  fontFamily="JetBrains Mono"
                >
                  {st.label}
                </text>
              )}
            </g>
          ))}

          {/* Dynamic Area Flood Hazard Risk Polygons */}
          {mapLayout?.floodZones.map((zone, idx) => (
            <g key={idx}>
              <rect
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                fill={zone.severity === "HIGH" ? "rgba(239,68,68,0.28)" : "rgba(249,115,22,0.22)"}
                stroke={zone.severity === "HIGH" ? "rgba(239,68,68,0.6)" : "rgba(249,115,22,0.5)"}
                strokeDasharray="4 4"
                rx="6"
              />
              <text
                x={zone.x + zone.width / 2}
                y={zone.y + 20}
                fill={zone.severity === "HIGH" ? "#ef4444" : "#f97316"}
                fontSize="9"
                fontFamily="JetBrains Mono"
                fontWeight="bold"
                textAnchor="middle"
              >
                {zone.label}
              </text>
            </g>
          ))}

          {/* Dynamic Landmark Nodes */}
          {mapLayout?.landmarks.map((lm, idx) => (
            <g key={idx} transform={`translate(${lm.x}, ${lm.y})`}>
              <circle r="7" fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" fill="#10b981" fontSize="9">
                {lm.icon}
              </text>
              <text y="18" textAnchor="middle" fill="#6ee7b7" fontSize="8" fontFamily="JetBrains Mono">
                {lm.label}
              </text>
            </g>
          ))}

          {/* Dynamic Polylines */}
          {routeResult && (
            <>
              {/* Alternative Route (Amber) */}
              {!isNavigating && routeResult.alternative && (
                <path
                  d={routeResult.alternative.svgPathD}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={selectedRouteId === "R2" ? "5" : "3"}
                  strokeDasharray="8 4"
                  strokeLinecap="round"
                  opacity={selectedRouteId === "R2" ? 1 : 0.4}
                  style={{ transition: "all 0.3s ease" }}
                />
              )}

              {/* Recommended Route (Green) */}
              {routeResult.recommended && (
                <g>
                  <path
                    d={routeResult.recommended.svgPathD}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={isNavigating ? "6" : selectedRouteId === "R1" ? "5" : "3"}
                    strokeDasharray="10 5"
                    strokeLinecap="round"
                    opacity={isNavigating ? 0.4 : selectedRouteId === "R1" ? 1 : 0.5}
                    style={{ transition: "all 0.3s ease" }}
                  />
                  {!isNavigating && (
                    <text
                      x={(routeResult.fromLocation.svgX + routeResult.toLocation.svgX) / 2}
                      y={245}
                      fill="#10b981"
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      SAFE ROUTE ({routeResult.recommended.distanceKm} KM)
                    </text>
                  )}
                </g>
              )}

              {/* ─── LIVE TRAVELED PATH POLYLINE (In Navigation Mode) ─────────────── */}
              {isNavigating && traveledPathD && (
                <path
                  d={traveledPathD}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: "drop-shadow(0 0 8px rgba(6,182,212,0.8))" }}
                />
              )}

              {/* Origin Marker ("YOU") */}
              {!isNavigating && (
                <g transform={`translate(${routeResult.fromLocation.svgX}, ${routeResult.fromLocation.svgY})`}>
                  <circle r="12" fill="rgba(6,182,212,0.25)" stroke="#06b6d4" strokeWidth="2" className="animate-ping opacity-75" />
                  <circle r="8" fill="rgba(6,182,212,0.4)" stroke="#06b6d4" strokeWidth="2" />
                  <circle r="4" fill="#06b6d4" />
                  <text y="22" textAnchor="middle" fill="#22d3ee" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                    {routeResult.fromLocation.name.toUpperCase()}
                  </text>
                </g>
              )}

              {/* Destination Marker ("DEST") */}
              <g transform={`translate(${routeResult.toLocation.svgX}, ${routeResult.toLocation.svgY})`}>
                <circle r="14" fill="rgba(16,185,129,0.25)" stroke="#10b981" strokeWidth="2" />
                <circle r="8" fill="#10b981" />
                <text y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                  ★
                </text>
                <text y="22" textAnchor="middle" fill="#6ee7b7" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                  {routeResult.toLocation.name.toUpperCase()}
                </text>
              </g>

              {/* ─── LIVE ANIMATED VEHICLE BEACON (In Navigation Mode) ───────────── */}
              {isNavigating && (
                <g transform={`translate(${currentVehicleX}, ${currentVehicleY})`} className="transition-all duration-300">
                  {/* Glowing Radar Pulse */}
                  <circle r="24" fill="rgba(6,182,212,0.2)" stroke="#06b6d4" strokeWidth="1.5" className="animate-ping opacity-75" />
                  <circle r="16" fill="rgba(6,182,212,0.4)" stroke="#38bdf8" strokeWidth="2" />
                  <circle r="8" fill="#06b6d4" />
                  
                  {/* Direction Arrow */}
                  <polygon points="0,-6 5,5 -5,5" fill="#ffffff" />

                  {/* Live Speed Tag Floating Above Vehicle */}
                  <g transform="translate(0, -28)">
                    <rect x="-26" y="-12" width="52" height="16" rx="4" fill="rgba(8,13,28,0.9)" stroke="#06b6d4" strokeWidth="1" />
                    <text textAnchor="middle" y="-1" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono" fontWeight="bold">
                      38 KM/H
                    </text>
                  </g>
                </g>
              )}
            </>
          )}

          {!calculated && (
            <text x="350" y="250" textAnchor="middle" fill="#2a3a55" fontSize="14" fontFamily="JetBrains Mono">
              Enter destination to calculate safe route
            </text>
          )}
        </svg>

        {/* ─── GOOGLE MAPS STYLE BOTTOM FLOATING DOCK (When Navigating) ─────────────── */}
        {isNavigating && (
          <div className="absolute bottom-6 left-6 right-6 z-40 flex justify-center">
            <div
              className="w-full max-w-2xl rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 border backdrop-blur-xl animate-slide-up"
              style={{
                background: "rgba(8,13,28,0.92)",
                borderColor: "#1a2640",
                boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
              }}
            >
              {/* ETA & Distance Left */}
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-2xl font-mono font-black text-emerald-400 leading-none">
                    {remainingEtaMin} <span className="text-sm font-normal text-emerald-200">MIN</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-2">
                    <span>{remainingKm} km left</span>
                    <span>•</span>
                    <span className="text-slate-300 font-bold">ETA {new Date(Date.now() + remainingEtaMin * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* Live Safety Status Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60">
                <ShieldCheck size={16} className="text-emerald-400" />
                <div>
                  <div className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
                    FLOOD AVOIDANCE ACTIVE
                  </div>
                  <div className="text-[9px] text-emerald-400/80">Antigravity Route Clear</div>
                </div>
              </div>

              {/* Navigation Play / Pause / Exit Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="px-3 py-2 rounded-xl text-xs font-mono font-bold text-white flex items-center gap-1.5 transition-all hover:bg-white/10 border border-white/20"
                  style={{ background: isPaused ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.05)" }}
                >
                  {isPaused ? <Play size={14} className="fill-white" /> : <Pause size={14} className="fill-white" />}
                  <span>{isPaused ? "RESUME" : "PAUSE"}</span>
                </button>

                <button
                  onClick={stopNavigation}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-white flex items-center gap-1.5 transition-all hover:bg-red-700 shadow-lg"
                  style={{ background: "#ef4444" }}
                >
                  <X size={14} />
                  <span>EXIT</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Route Legend (Non-Navigating mode) */}
        {calculated && !isNavigating && (
          <div
            className="absolute bottom-4 left-4 rounded-xl p-3 animate-fade-in shadow-2xl backdrop-blur-md"
            style={{ background: "rgba(7,17,30,0.9)", border: "1px solid #1a2640" }}
          >
            <div className="space-y-1.5">
              {[
                { color: "#10b981", dash: true, label: "Safe Route (Antigravity Path)" },
                { color: "#ef4444", dash: true, label: `${mapLayout?.areaName} Flood Hazard` },
                { color: "#06b6d4", dash: false, label: `Origin: ${routeResult?.fromLocation.name}` },
                { color: "#f59e0b", dash: false, label: "Alternative Route" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <div
                    className="w-6 h-0.5 rounded"
                    style={{
                      background: l.color,
                      borderTop: l.dash ? `2px dashed ${l.color}` : undefined,
                      height: l.dash ? 0 : undefined,
                    }}
                  />
                  <span className="text-[10px] font-mono" style={{ color: "#8da0b8" }}>
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
