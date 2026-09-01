import { useState, useEffect, useRef } from "react";
import {
  Layers,
  Search,
  Maximize2,
  RotateCcw,
  MapPin,
  X,
  ZoomIn,
  ZoomOut,
  Navigation2,
  Info,
} from "lucide-react";
import { roads, forecastTimeline, drainageNodes, sosIncidents, shelters } from "../mockData";
import type { Road } from "../mockData";

interface Props {
  selectedRoadId?: string;
  onRoadSelect: (roadId: string) => void;
  timelineIndex: number;
  onTimelineChange: (idx: number) => void;
  onCloseRoad: (roadId: string) => void;
}

const ACTIVE_LAYERS = ["flood", "rainfall", "roads", "sos"] as const;

// City map layout constants
const MAP_W = 800;
const MAP_H = 520;

// Road segment definitions for the SVG map
const roadSegments = [
  // Main horizontal roads
  {
    id: "R-102",
    d: "M 60 200 L 740 200",
    label: { x: 120, y: 190 },
    labelText: "R-102",
  },
  {
    id: "MR-01",
    d: "M 60 310 L 740 310",
    label: { x: 130, y: 300 },
    labelText: "Market Rd",
  },
  {
    id: "RD-23",
    d: "M 60 420 L 740 420",
    label: { x: 130, y: 410 },
    labelText: "Ring Rd E",
  },
  // Main vertical roads
  { id: "NH-48", d: "M 200 60 L 200 460", label: { x: 205, y: 80 }, labelText: "NH-48" },
  { id: "JN-14", d: "M 400 60 L 400 460", label: { x: 405, y: 80 }, labelText: "JN-14" },
  { id: "CR-07", d: "M 600 60 L 600 460", label: { x: 605, y: 80 }, labelText: "Canal Rd" },
  // Secondary roads
  { id: "s1", d: "M 200 200 L 400 200", label: null, labelText: "" },
  { id: "s2", d: "M 400 310 L 600 310", label: null, labelText: "" },
  { id: "s3", d: "M 100 260 L 700 260", label: null, labelText: "" },
  { id: "s4", d: "M 300 100 L 300 460", label: null, labelText: "" },
  { id: "s5", d: "M 500 100 L 500 460", label: null, labelText: "" },
  { id: "s6", d: "M 700 100 L 700 460", label: null, labelText: "" },
];

// Flood zones (polygons) per timeline index — intensity grows
function getFloodZone(timeIdx: number) {
  const intensity = timeIdx / 7;
  return {
    severe: `M 550 160 L ${600 + intensity * 60} 160 L ${620 + intensity * 80} ${220 + intensity * 80} L 540 ${200 + intensity * 60} Z`,
    high: `M 60 180 L ${220 + intensity * 80} 180 L ${240 + intensity * 100} ${280 + intensity * 60} L 60 260 Z`,
    moderate: `M 340 ${260 - intensity * 20} L ${460 + intensity * 40} ${260 - intensity * 20} L ${480 + intensity * 60} ${340 + intensity * 40} L 320 ${340 + intensity * 20} Z`,
    low: `M 160 ${360 - intensity * 10} L ${380 + intensity * 40} ${360 - intensity * 10} L ${400 + intensity * 40} ${440} L 140 440 Z`,
  };
}

const riskColor: Record<string, string> = {
  SEVERE: "#dc2626",
  HIGH: "#ea580c",
  MODERATE: "#ca8a04",
  LOW: "#15803d",
};

const riskStroke: Record<string, string> = {
  SEVERE: "rgba(220,38,38,0.9)",
  HIGH: "rgba(234,88,12,0.8)",
  MODERATE: "rgba(202,138,4,0.7)",
  LOW: "rgba(21,128,61,0.5)",
};

export default function FloodMapView({
  selectedRoadId,
  onRoadSelect,
  timelineIndex,
  onTimelineChange,
  onCloseRoad,
}: Props) {
  const [layerOpen, setLayerOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(
    new Set(["flood", "rainfall", "roads", "sos"])
  );
  const [tooltip, setTooltip] = useState<{
    road: Road;
    x: number;
    y: number;
  } | null>(null);
  const [searchVal, setSearchVal] = useState("");
  const [zoom, setZoom] = useState(1);
  const [showRoadCloseModal, setShowRoadCloseModal] = useState<string | null>(null);
  const [closedRoads, setClosedRoads] = useState<Set<string>>(
    new Set(roads.filter((r) => r.closed).map((r) => r.id))
  );
  const svgRef = useRef<SVGSVGElement>(null);

  const floodZones = getFloodZone(timelineIndex);
  const forecast = forecastTimeline[timelineIndex];
  const isForecasting = timelineIndex > 0;

  const toggleLayer = (l: string) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  };

  const getRoadForSegment = (segId: string) =>
    roads.find((r) => r.id === segId) ?? null;

  const handleRoadClick = (segId: string) => {
    const road = getRoadForSegment(segId);
    if (road) onRoadSelect(road.id);
  };

  const handleRoadHover = (e: React.MouseEvent, segId: string) => {
    const road = getRoadForSegment(segId);
    if (road) {
      const rect = (e.currentTarget as SVGElement)
        .closest("svg")
        ?.getBoundingClientRect();
      if (rect) {
        setTooltip({ road, x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    }
  };

  const handleConfirmClose = (roadId: string) => {
    setClosedRoads((p) => new Set(p).add(roadId));
    setShowRoadCloseModal(null);
    onCloseRoad(roadId);
  };

  // Road stroke color based on risk + closed state
  const getRoadStroke = (segId: string) => {
    if (closedRoads.has(segId)) return "#6b7280";
    const road = getRoadForSegment(segId);
    if (!road) return "#1e3050";
    if (selectedRoadId === segId) return "#06b6d4";
    return riskStroke[road.risk] ?? "#1e3050";
  };

  const getRoadWidth = (segId: string) => {
    const road = getRoadForSegment(segId);
    if (!road) return 1.5;
    if (selectedRoadId === segId) return 5;
    return road.risk === "SEVERE" || road.risk === "HIGH" ? 3 : 2;
  };

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      {/* Forecast mode badge */}
      {isForecasting && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full animate-slide-up"
          style={{
            background: "rgba(245,158,11,0.15)",
            border: "1px solid rgba(245,158,11,0.5)",
          }}
        >
          <span className="w-2 h-2 rounded-full animate-blink" style={{ background: "#f59e0b" }} />
          <span className="text-xs font-mono font-bold text-amber-300">
            FORECAST MODE — {forecast.time}
          </span>
          <span className="text-xs font-mono" style={{ color: "#d97706" }}>
            Peak: {forecast.depthCm} cm · {forecast.confidencePct}% confidence
          </span>
        </div>
      )}

      {/* Map controls — top right */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: "rgba(12,19,34,0.9)", border: "1px solid #1a2640" }}
        >
          <Search size={13} style={{ color: "#4a6080" }} />
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search road / area…"
            className="bg-transparent text-xs outline-none w-36 placeholder:text-[#2a3a55]"
            style={{ color: "#f0f4ff", fontFamily: "JetBrains Mono" }}
          />
        </div>

        {/* Icon buttons */}
        <div
          className="flex flex-col rounded-lg overflow-hidden"
          style={{ border: "1px solid #1a2640" }}
        >
          {[
            {
              icon: ZoomIn,
              action: () => setZoom((z) => Math.min(z + 0.2, 2.5)),
              title: "Zoom in",
            },
            {
              icon: ZoomOut,
              action: () => setZoom((z) => Math.max(z - 0.2, 0.5)),
              title: "Zoom out",
            },
            {
              icon: RotateCcw,
              action: () => setZoom(1),
              title: "Reset view",
            },
            {
              icon: Navigation2,
              action: () => {},
              title: "Locate me",
            },
            {
              icon: Maximize2,
              action: () => {},
              title: "Fullscreen",
            },
          ].map(({ icon: Icon, action, title }) => (
            <button
              key={title}
              title={title}
              onClick={action}
              className="w-9 h-9 flex items-center justify-center hover:bg-white/5 transition-colors"
              style={{ background: "rgba(12,19,34,0.9)" }}
            >
              <Icon size={14} style={{ color: "#4a6080" }} />
            </button>
          ))}
        </div>

        {/* Layer toggle */}
        <button
          onClick={() => setLayerOpen((p) => !p)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors relative"
          style={{
            background: layerOpen ? "rgba(6,182,212,0.15)" : "rgba(12,19,34,0.9)",
            border: "1px solid #1a2640",
          }}
        >
          <Layers size={14} style={{ color: layerOpen ? "#22d3ee" : "#4a6080" }} />
        </button>

        {/* Layer panel */}
        {layerOpen && (
          <div
            className="absolute top-0 right-10 rounded-xl p-3 w-48 animate-slide-right"
            style={{ background: "rgba(12,19,34,0.95)", border: "1px solid #1a2640" }}
          >
            <p className="text-[10px] font-mono text-center mb-2" style={{ color: "#4a6080" }}>
              MAP LAYERS
            </p>
            {[
              { id: "flood", label: "Flood Depth", color: "#ef4444" },
              { id: "rainfall", label: "Rainfall", color: "#3b82f6" },
              { id: "roads", label: "Road Risk", color: "#f97316" },
              { id: "sos", label: "SOS Incidents", color: "#ef4444" },
              { id: "rescue", label: "Rescue Teams", color: "#14b8a6" },
              { id: "shelters", label: "Shelters", color: "#10b981" },
              { id: "drainage", label: "Drainage", color: "#8b5cf6" },
              { id: "boundaries", label: "Admin Boundaries", color: "#4a6080" },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => toggleLayer(l.id)}
                className="w-full flex items-center gap-2 py-1.5 hover:bg-white/5 rounded transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{
                    background: activeLayers.has(l.id) ? l.color : "#1a2640",
                    opacity: activeLayers.has(l.id) ? 1 : 0.4,
                  }}
                />
                <span
                  className="text-[11px] text-left"
                  style={{ color: activeLayers.has(l.id) ? "#d0dff5" : "#4a6080" }}
                >
                  {l.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main map SVG */}
      <div
        className="flex-1 relative overflow-hidden map-grid"
        style={{ background: "#07111e" }}
        onMouseLeave={() => setTooltip(null)}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          width="100%"
          height="100%"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
            transition: "transform 0.3s ease",
          }}
        >
          {/* City block fills */}
          {[
            [60, 60, 130, 130],
            [210, 60, 80, 130],
            [310, 60, 80, 130],
            [410, 60, 80, 130],
            [510, 60, 80, 130],
            [610, 60, 80, 130],
            [60, 210, 130, 90],
            [210, 210, 80, 90],
            [310, 210, 80, 90],
            [410, 210, 80, 90],
            [510, 210, 80, 90],
            [610, 210, 80, 90],
            [60, 320, 130, 90],
            [210, 320, 80, 90],
            [310, 320, 80, 90],
            [410, 320, 80, 90],
            [510, 320, 80, 90],
            [610, 320, 80, 90],
            [60, 430, 130, 70],
            [210, 430, 80, 70],
            [310, 430, 80, 70],
            [410, 430, 80, 70],
            [510, 430, 80, 70],
            [610, 430, 80, 70],
          ].map(([x, y, w, h], i) => (
            <rect
              key={i}
              x={x}
              y={y}
              width={w}
              height={h}
              fill="#0a1525"
              rx={2}
            />
          ))}

          {/* River */}
          <rect x={0} y={148} width={MAP_W} height={44} fill="#091828" rx={0} />
          <rect x={0} y={152} width={MAP_W} height={36} fill="#0a2040" opacity={0.7} rx={0} />
          <text x={640} y={174} fill="#0e3060" fontSize={9} fontFamily="JetBrains Mono">
            RIVERSIDE CANAL
          </text>

          {/* Flood zones */}
          {activeLayers.has("flood") && (
            <g className="animate-flood-pulse">
              <path d={floodZones.severe} fill="rgba(185,28,28,0.5)" />
              <path d={floodZones.high} fill="rgba(239,68,68,0.35)" />
              <path d={floodZones.moderate} fill="rgba(251,146,60,0.3)" />
              <path d={floodZones.low} fill="rgba(250,204,21,0.2)" />
            </g>
          )}

          {/* Road segments */}
          {activeLayers.has("roads") &&
            roadSegments.map((seg) => {
              const isMain = getRoadForSegment(seg.id) !== null;
              const isClosed = closedRoads.has(seg.id);
              return (
                <g key={seg.id}>
                  <path
                    d={seg.d}
                    stroke={getRoadStroke(seg.id)}
                    strokeWidth={getRoadWidth(seg.id)}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={isClosed ? "8 6" : undefined}
                    className={isMain ? "map-road" : undefined}
                    style={isMain ? { cursor: "pointer" } : undefined}
                    onClick={isMain ? () => handleRoadClick(seg.id) : undefined}
                    onMouseMove={isMain ? (e) => handleRoadHover(e, seg.id) : undefined}
                    onMouseLeave={() => setTooltip(null)}
                  />
                  {seg.label && (
                    <text
                      x={seg.label.x}
                      y={seg.label.y}
                      fill={selectedRoadId === seg.id ? "#22d3ee" : "#2a3a55"}
                      fontSize={9}
                      fontFamily="JetBrains Mono"
                      pointerEvents="none"
                    >
                      {seg.labelText}
                    </text>
                  )}
                </g>
              );
            })}

          {/* Rainfall dots */}
          {activeLayers.has("rainfall") && (
            <g opacity={0.4}>
              {Array.from({ length: 60 }).map((_, i) => (
                <circle
                  key={i}
                  cx={(i % 10) * 80 + 30}
                  cy={Math.floor(i / 10) * 90 + 50}
                  r={1.5}
                  fill="#3b82f6"
                />
              ))}
            </g>
          )}

          {/* Drainage nodes */}
          {activeLayers.has("drainage") &&
            drainageNodes.map((node) => (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={6}
                  fill={
                    node.status === "CRITICAL"
                      ? "rgba(239,68,68,0.6)"
                      : node.status === "STRESSED"
                        ? "rgba(245,158,11,0.5)"
                        : "rgba(139,92,246,0.5)"
                  }
                  stroke={
                    node.status === "CRITICAL"
                      ? "#ef4444"
                      : node.status === "STRESSED"
                        ? "#f59e0b"
                        : "#8b5cf6"
                  }
                  strokeWidth={1.5}
                />
                <text
                  x={node.x}
                  y={node.y + 3}
                  textAnchor="middle"
                  fill="white"
                  fontSize={6}
                  fontFamily="JetBrains Mono"
                  pointerEvents="none"
                >
                  D
                </text>
              </g>
            ))}

          {/* Shelter markers */}
          {activeLayers.has("shelters") &&
            shelters.map((s, i) => {
              const positions = [
                { x: 155, y: 340 },
                { x: 345, y: 80 },
                { x: 545, y: 380 },
                { x: 670, y: 80 },
              ];
              const pos = positions[i] || { x: 100, y: 100 };
              return (
                <g key={s.id}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={8}
                    fill={
                      s.floodRisk === "LOW"
                        ? "rgba(16,185,129,0.3)"
                        : "rgba(245,158,11,0.3)"
                    }
                    stroke={s.floodRisk === "LOW" ? "#10b981" : "#f59e0b"}
                    strokeWidth={1.5}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize={8}
                    fontFamily="sans-serif"
                    pointerEvents="none"
                  >
                    ⛺
                  </text>
                </g>
              );
            })}

          {/* SOS markers */}
          {activeLayers.has("sos") &&
            sosIncidents.map((s, i) => {
              const positions = [
                { x: 400, y: 310 },
                { x: 600, y: 200 },
                { x: 400, y: 200 },
                { x: 200, y: 260 },
              ];
              const pos = positions[i] || { x: 300, y: 300 };
              const isSelected = s.priority === "CRITICAL";
              return (
                <g key={s.id}>
                  {isSelected && (
                    <>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={16}
                        fill="none"
                        stroke="rgba(239,68,68,0.4)"
                        strokeWidth={1}
                        className="animate-flood-pulse"
                      />
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={24}
                        fill="none"
                        stroke="rgba(239,68,68,0.2)"
                        strokeWidth={1}
                        className="animate-flood-pulse"
                      />
                    </>
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={8}
                    fill={
                      s.priority === "CRITICAL"
                        ? "#dc2626"
                        : s.priority === "HIGH"
                          ? "#ea580c"
                          : "#ca8a04"
                    }
                    stroke="white"
                    strokeWidth={1.5}
                    style={{ cursor: "pointer" }}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize={8}
                    fontFamily="sans-serif"
                    pointerEvents="none"
                    fontWeight="bold"
                  >
                    !
                  </text>
                  <text
                    x={pos.x + 12}
                    y={pos.y - 10}
                    fill="#fca5a5"
                    fontSize={8}
                    fontFamily="JetBrains Mono"
                    pointerEvents="none"
                  >
                    {s.id}
                  </text>
                </g>
              );
            })}

          {/* Rescue team markers */}
          {activeLayers.has("rescue") && (
            <g>
              {[
                { x: 280, y: 340, status: "EN_ROUTE", id: "R-04" },
                { x: 490, y: 240, status: "EN_ROUTE", id: "R-07" },
                { x: 120, y: 180, status: "AVAILABLE", id: "R-12" },
              ].map((team) => (
                <g key={team.id}>
                  <circle
                    cx={team.x}
                    cy={team.y}
                    r={8}
                    fill="rgba(20,184,166,0.3)"
                    stroke="#14b8a6"
                    strokeWidth={1.5}
                  />
                  <text
                    x={team.x}
                    y={team.y + 3}
                    textAnchor="middle"
                    fill="#14b8a6"
                    fontSize={7}
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                    pointerEvents="none"
                  >
                    R
                  </text>
                  <text
                    x={team.x + 12}
                    y={team.y - 8}
                    fill="#5eead4"
                    fontSize={7}
                    fontFamily="JetBrains Mono"
                    pointerEvents="none"
                  >
                    {team.id}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* Legend */}
          <g transform={`translate(20, ${MAP_H - 100})`}>
            <rect x={0} y={0} width={160} height={95} fill="rgba(7,17,30,0.85)" rx={6} />
            <text x={8} y={14} fill="#4a6080" fontSize={8} fontFamily="JetBrains Mono">
              FLOOD DEPTH LEGEND
            </text>
            {[
              { label: "LOW (0–15 cm)", color: "rgba(250,204,21,0.5)" },
              { label: "MODERATE (15–30 cm)", color: "rgba(249,115,22,0.5)" },
              { label: "HIGH (30–50 cm)", color: "rgba(239,68,68,0.5)" },
              { label: "SEVERE (>50 cm)", color: "rgba(185,28,28,0.7)" },
            ].map((item, i) => (
              <g key={i} transform={`translate(8, ${24 + i * 17})`}>
                <rect width={12} height={10} fill={item.color} rx={2} />
                <text x={17} y={9} fill="#6b7fa0" fontSize={8} fontFamily="JetBrains Mono">
                  {item.label}
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* Hover tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none rounded-xl p-3 w-52 animate-fade-in"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y + 12,
              background: "rgba(7,17,30,0.95)",
              border: `1px solid ${riskColor[tooltip.road.risk]}`,
              zIndex: 30,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-white">
                {tooltip.road.id}
              </span>
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase"
                style={{
                  background: `${riskColor[tooltip.road.risk]}20`,
                  color: riskColor[tooltip.road.risk],
                  border: `1px solid ${riskColor[tooltip.road.risk]}50`,
                }}
              >
                {tooltip.road.risk}
              </span>
            </div>
            <div className="space-y-1">
              {[
                { l: "Current Depth", v: `${tooltip.road.depthCm} cm` },
                { l: "Peak Forecast", v: `${tooltip.road.peakDepthCm} cm` },
                { l: "Time to Critical", v: `${tooltip.road.timeToFloodMin} min` },
                { l: "Confidence", v: `${tooltip.road.confidencePct}%` },
              ].map((r) => (
                <div key={r.l} className="flex justify-between">
                  <span className="text-[10px]" style={{ color: "#4a6080" }}>
                    {r.l}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-white">
                    {r.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Forecast Timeline bar */}
      <div
        className="flex-shrink-0 px-6 py-3"
        style={{ background: "rgba(7,11,20,0.95)", borderTop: "1px solid #1a2640" }}
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: "#2a3a55" }}>
              FORECAST TIMELINE
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono" style={{ color: "#4a6080" }}>NOW</span>
              <span className="animate-blink w-1.5 h-1.5 rounded-full ml-1" style={{ background: "#10b981" }} />
            </div>
          </div>

          <div className="flex-1 relative">
            <input
              type="range"
              min={0}
              max={7}
              value={timelineIndex}
              onChange={(e) => onTimelineChange(Number(e.target.value))}
              className="w-full timeline-thumb appearance-none h-1 rounded-full"
              style={{ background: `linear-gradient(to right, #06b6d4 ${(timelineIndex / 7) * 100}%, #1a2640 ${(timelineIndex / 7) * 100}%)` }}
            />
            <div className="flex justify-between mt-1.5">
              {forecastTimeline.map((f, i) => (
                <button
                  key={f.time}
                  onClick={() => onTimelineChange(i)}
                  className="flex flex-col items-center gap-0.5"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: i === timelineIndex ? "#06b6d4" : "#1a2640",
                    }}
                  />
                  <span
                    className="text-[9px] font-mono"
                    style={{ color: i === timelineIndex ? "#22d3ee" : "#2a3a55" }}
                  >
                    {f.time}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Decision strip */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {forecastTimeline.filter((_, i) => i % 2 === 0).map((f, i) => (
              <div
                key={f.time}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded"
                style={{
                  background:
                    f.risk === "SEVERE"
                      ? "rgba(220,38,38,0.12)"
                      : f.risk === "HIGH"
                        ? "rgba(234,88,12,0.12)"
                        : f.risk === "MODERATE"
                          ? "rgba(202,138,4,0.12)"
                          : "rgba(16,185,129,0.12)",
                }}
              >
                <span className="text-[9px] font-mono" style={{ color: "#2a3a55" }}>
                  {f.time}
                </span>
                <span
                  className="text-[9px] font-mono font-bold"
                  style={{
                    color:
                      f.risk === "SEVERE"
                        ? "#ef4444"
                        : f.risk === "HIGH"
                          ? "#f97316"
                          : f.risk === "MODERATE"
                            ? "#f59e0b"
                            : "#10b981",
                  }}
                >
                  {f.risk}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Road close modal */}
      {showRoadCloseModal && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(3,6,15,0.7)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="rounded-2xl p-6 w-80 animate-slide-up"
            style={{ background: "#0c1322", border: "1px solid rgba(239,68,68,0.4)" }}
          >
            <h3 className="text-base font-bold text-white mb-1">
              CLOSE ROAD {showRoadCloseModal}?
            </h3>
            <p className="text-xs mb-4" style={{ color: "#4a6080" }}>
              Reason: Flood depth above safe threshold
            </p>
            <div className="space-y-2 mb-4 text-xs">
              <div className="flex justify-between">
                <span style={{ color: "#4a6080" }}>Duration</span>
                <span className="font-mono text-white">Until manually reopened</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#4a6080" }}>Affected routes</span>
                <span className="font-mono text-amber-400">7</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleConfirmClose(showRoadCloseModal)}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white transition-colors"
                style={{ background: "#dc2626" }}
              >
                CONFIRM CLOSURE
              </button>
              <button
                onClick={() => setShowRoadCloseModal(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
                style={{ border: "1px solid #1a2640", color: "#8da0b8" }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
