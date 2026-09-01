import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  BarChart2,
} from "lucide-react";
import { historicalEvents } from "../mockData";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const replayTimeline = [
  { time: "10:00", depth: 0, roads: 0, sos: 0, event: null },
  { time: "10:15", depth: 4, roads: 1, sos: 0, event: "Rainfall peak" },
  { time: "10:30", depth: 12, roads: 3, sos: 2, event: null },
  { time: "10:45", depth: 22, roads: 7, sos: 6, event: "Drainage surcharge" },
  { time: "11:00", depth: 36, roads: 12, sos: 14, event: "First road flood" },
  { time: "11:15", depth: 52, roads: 18, sos: 28, event: "Critical flood" },
  { time: "11:30", depth: 68, roads: 24, sos: 47, event: "Evacuation warning" },
  { time: "11:45", depth: 62, roads: 22, sos: 47, event: "SOS peak" },
  { time: "12:00", depth: 54, roads: 19, sos: 43, event: null },
  { time: "12:30", depth: 41, roads: 15, sos: 31, event: null },
  { time: "13:00", depth: 28, roads: 10, sos: 19, event: null },
  { time: "13:30", depth: 18, roads: 6, sos: 8, event: null },
];

export default function ReplayView() {
  const [selectedEvent, setSelectedEvent] = useState(historicalEvents[0]);
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [compareMode, setCompareMode] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setFrame((f) => {
          if (f >= replayTimeline.length - 1) {
            setPlaying(false);
            return f;
          }
          return f + 1;
        });
      }, 1200 / speed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed]);

  const currentFrame = replayTimeline[frame];
  const floodIntensity = currentFrame.depth / 68;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex-shrink-0 px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid #1a2640", background: "rgba(7,11,20,0.8)" }}
      >
        <div>
          <h2 className="text-sm font-bold text-white">HISTORICAL EVENT REPLAY</h2>
          <p className="text-[11px] mt-0.5" style={{ color: "#4a6080" }}>
            Model performance validation — no live risk implied
          </p>
        </div>
        <div className="flex items-center gap-2">
          {historicalEvents.map((e) => (
            <button
              key={e.id}
              onClick={() => {
                setSelectedEvent(e);
                setFrame(0);
                setPlaying(false);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
              style={{
                background:
                  selectedEvent.id === e.id
                    ? "rgba(6,182,212,0.15)"
                    : "rgba(12,19,34,0.5)",
                border: `1px solid ${selectedEvent.id === e.id ? "rgba(6,182,212,0.4)" : "#1a2640"}`,
                color: selectedEvent.id === e.id ? "#22d3ee" : "#4a6080",
              }}
            >
              {e.name}
            </button>
          ))}
          <button
            onClick={() => setCompareMode((p) => !p)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition-all"
            style={{
              background: compareMode ? "rgba(139,92,246,0.15)" : "rgba(12,19,34,0.5)",
              border: `1px solid ${compareMode ? "rgba(139,92,246,0.4)" : "#1a2640"}`,
              color: compareMode ? "#c4b5fd" : "#4a6080",
            }}
          >
            <BarChart2 size={12} />
            COMPARE
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Map replay area */}
        <div className="flex-1 relative overflow-hidden map-grid" style={{ background: "#07111e" }}>
          <svg viewBox="0 0 700 440" width="100%" height="100%">
            {/* City blocks */}
            {[
              [60, 60, 110, 100], [180, 60, 80, 100], [270, 60, 80, 100],
              [360, 60, 80, 100], [450, 60, 80, 100], [540, 60, 100, 100],
              [60, 180, 110, 80], [180, 180, 80, 80], [270, 180, 80, 80],
              [360, 180, 80, 80], [450, 180, 80, 80], [540, 180, 100, 80],
              [60, 280, 110, 80], [180, 280, 80, 80], [270, 280, 80, 80],
              [360, 280, 80, 80], [450, 280, 80, 80], [540, 280, 100, 80],
              [60, 380, 110, 60], [180, 380, 80, 60], [270, 380, 80, 60],
              [360, 380, 80, 60], [450, 380, 80, 60], [540, 380, 100, 60],
            ].map(([x, y, w, h], i) => (
              <rect key={i} x={x} y={y} width={w} height={h} fill="#0a1525" rx={2} />
            ))}

            {/* Roads */}
            <line x1="60" y1="170" x2="650" y2="170" stroke="#1e3050" strokeWidth="2" />
            <line x1="60" y1="270" x2="650" y2="270" stroke="#1e3050" strokeWidth="2" />
            <line x1="60" y1="370" x2="650" y2="370" stroke="#1e3050" strokeWidth="2" />
            <line x1="170" y1="60" x2="170" y2="440" stroke="#1e3050" strokeWidth="2" />
            <line x1="360" y1="60" x2="360" y2="440" stroke="#1e3050" strokeWidth="2" />
            <line x1="540" y1="60" x2="540" y2="440" stroke="#1e3050" strokeWidth="2" />

            {/* Flood zones — animated by frame */}
            <rect
              x={60}
              y={160}
              width={Math.min(600 * floodIntensity, 600)}
              height={100}
              fill="rgba(239,68,68,0.35)"
              rx={4}
              className="animate-flood-pulse"
            />
            <rect
              x={160}
              y={260}
              width={Math.min(460 * floodIntensity * 0.8, 460)}
              height={80}
              fill="rgba(249,115,22,0.3)"
              rx={4}
            />
            <rect
              x={60}
              y={360}
              width={Math.min(300 * floodIntensity * 0.6, 300)}
              height={60}
              fill="rgba(250,204,21,0.2)"
              rx={4}
            />
            {floodIntensity > 0.5 && (
              <rect
                x={400}
                y={160}
                width={Math.min(250 * (floodIntensity - 0.5) * 2, 250)}
                height={180}
                fill="rgba(185,28,28,0.45)"
                rx={4}
              />
            )}

            {/* SOS dots growing with frame */}
            {Array.from({ length: Math.min(currentFrame.sos, 12) }).map((_, i) => {
              const positions = [
                [360, 270], [170, 270], [540, 270], [360, 170], [170, 170], [540, 170],
                [270, 320], [450, 320], [130, 320], [270, 220], [450, 220], [130, 220],
              ];
              const pos = positions[i];
              return (
                <circle
                  key={i}
                  cx={pos[0]}
                  cy={pos[1]}
                  r={5}
                  fill="#dc2626"
                  stroke="white"
                  strokeWidth={1}
                  className="animate-flood-pulse"
                />
              );
            })}

            {/* Time & depth display */}
            <rect x={20} y={20} width={140} height={54} fill="rgba(7,17,30,0.85)" rx={6} />
            <text x={32} y={36} fill="#4a6080" fontSize={9} fontFamily="JetBrains Mono">
              REPLAY TIME
            </text>
            <text x={32} y={54} fill="#22d3ee" fontSize={16} fontFamily="JetBrains Mono" fontWeight="bold">
              {currentFrame.time}
            </text>
            <text x={32} y={68} fill="#ef4444" fontSize={10} fontFamily="JetBrains Mono">
              {currentFrame.depth} cm peak
            </text>
          </svg>

          {/* Event marker */}
          {currentFrame.event && (
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-mono font-bold animate-slide-up"
              style={{
                background: "rgba(245,158,11,0.2)",
                border: "1px solid rgba(245,158,11,0.6)",
                color: "#fde68a",
              }}
            >
              ⚡ {currentFrame.event}
            </div>
          )}

          {/* Stats overlay */}
          <div
            className="absolute bottom-4 right-4 rounded-xl p-3"
            style={{ background: "rgba(7,17,30,0.9)", border: "1px solid #1a2640" }}
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Depth", value: `${currentFrame.depth} cm`, color: "#ef4444" },
                { label: "Roads", value: currentFrame.roads, color: "#f97316" },
                { label: "SOS", value: currentFrame.sos, color: "#fca5a5" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-[9px] font-mono mb-0.5" style={{ color: "#4a6080" }}>
                    {s.label}
                  </div>
                  <div className="text-lg font-mono font-black" style={{ color: s.color }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compare overlay */}
          {compareMode && (
            <div
              className="absolute top-0 left-0 right-0 bottom-0 flex"
              style={{ background: "transparent" }}
            >
              <div
                className="flex-1 relative flex items-center justify-center"
                style={{ borderRight: "2px solid rgba(6,182,212,0.6)" }}
              >
                <span
                  className="absolute top-3 left-3 text-[10px] font-mono font-bold px-2 py-1 rounded"
                  style={{ background: "rgba(6,182,212,0.15)", color: "#22d3ee", border: "1px solid rgba(6,182,212,0.3)" }}
                >
                  PREDICTED
                </span>
              </div>
              <div className="flex-1 relative">
                <span
                  className="absolute top-3 left-3 text-[10px] font-mono font-bold px-2 py-1 rounded"
                  style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }}
                >
                  OBSERVED
                </span>
                <div className="absolute top-12 left-3 space-y-1">
                  {[
                    { label: "Flood IoU", value: "0.81", status: "MATCH" },
                    { label: "Depth MAE", value: "4.2 cm", status: "MATCH" },
                    { label: "TTF Error", value: "+3.1 min", status: "UNCERTAINTY" },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="flex items-center gap-2 px-2 py-1 rounded text-[10px] font-mono"
                      style={{ background: "rgba(7,17,30,0.8)", border: "1px solid #1a2640" }}
                    >
                      <span style={{ color: "#4a6080" }}>{m.label}</span>
                      <span className="text-white font-bold">{m.value}</span>
                      <span
                        style={{
                          color: m.status === "MATCH" ? "#10b981" : "#f59e0b",
                        }}
                      >
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side chart */}
        <div
          className="w-64 flex-shrink-0 border-l overflow-y-auto p-4 space-y-3"
          style={{ borderColor: "#1a2640", background: "rgba(7,11,20,0.8)" }}
        >
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "#4a6080" }}>
              Event: {selectedEvent.name}
            </h3>
            {[
              { label: "Date", value: selectedEvent.date },
              { label: "Duration", value: selectedEvent.duration },
              { label: "Peak Depth", value: `${selectedEvent.peakDepthCm} cm` },
              { label: "Flooded Roads", value: selectedEvent.floodedRoads },
              { label: "SOS Count", value: selectedEvent.sosCount },
              { label: "Model Accuracy", value: `${selectedEvent.accuracy}%` },
            ].map((r) => (
              <div key={r.label} className="flex justify-between py-1.5" style={{ borderBottom: "1px solid #1a2640" }}>
                <span className="text-[11px]" style={{ color: "#4a6080" }}>{r.label}</span>
                <span className="text-[11px] font-mono font-bold text-white">{r.value}</span>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "#4a6080" }}>
              Depth Over Time
            </h3>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={replayTimeline} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#4a6080", fontSize: 8, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "#0c1322", border: "1px solid #1a2640", borderRadius: 6, fontSize: 10, fontFamily: "JetBrains Mono", color: "#f0f4ff" }}
                />
                <ReferenceLine
                  x={currentFrame.time}
                  stroke="#06b6d4"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                />
                <Line type="monotone" dataKey="depth" stroke="#ef4444" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Playback controls */}
      <div
        className="flex-shrink-0 px-5 py-3"
        style={{ borderTop: "1px solid #1a2640", background: "rgba(7,11,20,0.95)" }}
      >
        <div className="flex items-center gap-4">
          {/* Event markers */}
          <div className="flex-1 relative h-6">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-full h-0.5 rounded-full"
              style={{ background: "#1a2640" }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full transition-all"
              style={{
                background: "linear-gradient(90deg, #06b6d4, #ef4444)",
                width: `${(frame / (replayTimeline.length - 1)) * 100}%`,
              }}
            />
            {replayTimeline.map((t, i) => (
              <button
                key={i}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${(i / (replayTimeline.length - 1)) * 100}%` }}
                onClick={() => setFrame(i)}
                title={t.time}
              >
                <div
                  className="w-2 h-2 rounded-full border transition-all"
                  style={{
                    background: t.event
                      ? "#f59e0b"
                      : i === frame
                        ? "#06b6d4"
                        : "#1a2640",
                    borderColor: i === frame ? "#22d3ee" : "transparent",
                    transform: i === frame ? "scale(1.5)" : "scale(1)",
                  }}
                />
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setFrame((f) => Math.max(0, f - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ border: "1px solid #1a2640" }}
            >
              <SkipBack size={14} style={{ color: "#4a6080" }} />
            </button>
            <button
              onClick={() => setPlaying((p) => !p)}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: "#06b6d4" }}
            >
              {playing ? (
                <Pause size={16} style={{ color: "white" }} />
              ) : (
                <Play size={16} style={{ color: "white" }} />
              )}
            </button>
            <button
              onClick={() => setFrame((f) => Math.min(replayTimeline.length - 1, f + 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ border: "1px solid #1a2640" }}
            >
              <SkipForward size={14} style={{ color: "#4a6080" }} />
            </button>
          </div>

          {/* Speed */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className="px-2 py-1 rounded text-[10px] font-mono transition-colors"
                style={{
                  background: speed === s ? "rgba(6,182,212,0.15)" : "transparent",
                  color: speed === s ? "#22d3ee" : "#4a6080",
                  border: `1px solid ${speed === s ? "rgba(6,182,212,0.3)" : "#1a2640"}`,
                }}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="text-xs font-mono flex-shrink-0" style={{ color: "#4a6080" }}>
            {currentFrame.time} / 13:30
          </div>
        </div>

        {/* Event timeline labels */}
        <div className="flex mt-2 relative" style={{ height: 20 }}>
          {replayTimeline.map((t, i) => t.event && (
            <div
              key={i}
              className="absolute text-[9px] font-mono -translate-x-1/2"
              style={{
                left: `${(i / (replayTimeline.length - 1)) * 100}%`,
                color: "#d97706",
                top: 0,
                whiteSpace: "nowrap",
              }}
            >
              {t.event}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
