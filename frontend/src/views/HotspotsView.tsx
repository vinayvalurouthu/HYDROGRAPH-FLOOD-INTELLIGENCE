import { roads, confidenceFactors, roadForecast } from "../mockData";
import type { Road } from "../mockData";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { MapPin, X, Info } from "lucide-react";

const riskColors: Record<string, string> = {
  SEVERE: "#ef4444",
  HIGH: "#f97316",
  MODERATE: "#f59e0b",
  LOW: "#10b981",
};

function ConfidenceRing({ pct }: { pct: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const color = pct >= 80 ? "#10b981" : pct >= 65 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="absolute inset-0" viewBox="0 0 64 64" width="64" height="64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#1a2640" strokeWidth="4" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 32 32)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <span className="text-xs font-mono font-bold z-10" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

export default function HotspotsView({
  onNavigate,
}: {
  onNavigate: (view: string, roadId?: string) => void;
}) {
  const sorted = [...roads].sort(
    (a, b) => b.depthCm - a.depthCm || a.timeToFloodMin - b.timeToFloodMin
  );
  const [selected, setSelected] = useState<Road>(sorted[0]);
  const [showConfidence, setShowConfidence] = useState(false);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Hotspot list */}
      <div
        className="w-72 flex-shrink-0 border-r overflow-y-auto"
        style={{ borderColor: "#1a2640" }}
      >
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #1a2640" }}>
          <h2 className="text-sm font-bold text-white">TOP FLOOD HOTSPOTS</h2>
          <p className="text-[11px] mt-0.5" style={{ color: "#4a6080" }}>
            Ranked by current depth + urgency
          </p>
        </div>
        <div className="p-3 space-y-2">
          {sorted.map((road, i) => {
            const isSelected = selected.id === road.id;
            return (
              <button
                key={road.id}
                onClick={() => setSelected(road)}
                className="w-full text-left rounded-xl p-3 transition-all"
                style={{
                  background: isSelected
                    ? `${riskColors[road.risk]}10`
                    : "rgba(12,19,34,0.5)",
                  border: `1px solid ${isSelected ? riskColors[road.risk] + "50" : "#1a2640"}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-mono font-black w-6 text-center flex-shrink-0"
                    style={{ color: riskColors[road.risk] }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{road.id}</span>
                      {road.closed && (
                        <span
                          className="text-[9px] font-mono px-1.5 rounded"
                          style={{ background: "rgba(107,114,128,0.2)", color: "#9ca3af" }}
                        >
                          CLOSED
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] mt-0.5 truncate" style={{ color: "#4a6080" }}>
                      {road.name}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className="text-sm font-mono font-black"
                      style={{ color: riskColors[road.risk] }}
                    >
                      {road.depthCm} cm
                    </div>
                    <div className="text-[10px] font-mono" style={{ color: "#4a6080" }}>
                      {road.timeToFloodMin} min
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase"
                    style={{
                      background: `${riskColors[road.risk]}15`,
                      color: riskColors[road.risk],
                      border: `1px solid ${riskColors[road.risk]}40`,
                    }}
                  >
                    {road.risk}
                  </span>
                  <div className="flex-1 h-1 rounded-full" style={{ background: "#1a2640" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(road.depthCm / 70) * 100}%`,
                        background: riskColors[road.risk],
                      }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Header */}
        <div
          className="rounded-xl p-4 animate-slide-up"
          style={{
            background: `${riskColors[selected.risk]}08`,
            border: `1px solid ${riskColors[selected.risk]}40`,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-mono font-black text-white">{selected.id}</h2>
                <span
                  className="text-sm font-mono font-bold px-3 py-1 rounded-full"
                  style={{ background: riskColors[selected.risk], color: "white" }}
                >
                  {selected.risk}
                </span>
                {selected.closed && (
                  <span className="text-sm font-mono px-3 py-1 rounded-full" style={{ background: "#374151", color: "#9ca3af" }}>
                    CLOSED
                  </span>
                )}
              </div>
              <p className="text-sm" style={{ color: "#8da0b8" }}>
                {selected.name}
              </p>
            </div>
            <ConfidenceRing pct={selected.confidencePct} />
          </div>

          {/* Action intelligence */}
          <div
            className="mt-3 rounded-lg px-3 py-2"
            style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}
          >
            <span className="text-[10px] font-mono uppercase" style={{ color: "#4a6080" }}>
              ACTION INTELLIGENCE
            </span>
            <p className="text-sm font-semibold text-white mt-0.5">
              {selected.risk === "SEVERE"
                ? `CLOSE IMMEDIATELY — severe flooding in ${selected.timeToFloodMin} min`
                : selected.risk === "HIGH"
                  ? `AVOID after +${selected.timeToFloodMin} min — depth exceeding safe threshold soon`
                  : `MONITOR — moderate risk, safe for now`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Metrics */}
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
          >
            <h3 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#4a6080" }}>
              Current Conditions
            </h3>
            <div className="space-y-2.5">
              {[
                { l: "Current Depth", v: `${selected.depthCm} cm`, warn: selected.depthCm > 25 },
                { l: "Peak Forecast", v: `${selected.peakDepthCm} cm`, warn: true },
                { l: "Flow Velocity", v: `${selected.velocityMs} m/s`, warn: selected.velocityMs > 0.5 },
                { l: "Flood Duration", v: `${selected.durationMin} min`, warn: false },
                { l: "Time to Critical", v: `${selected.timeToFloodMin} min`, warn: selected.timeToFloodMin < 30 },
                { l: "Rainfall", v: `${selected.rainfallMmHr} mm/hr`, warn: selected.rainfallMmHr > 80 },
                { l: "Drain Utilization", v: `${selected.drainUtilPct}%`, warn: selected.drainUtilPct > 85 },
              ].map((row) => (
                <div key={row.l} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "#4a6080" }}>
                    {row.l}
                  </span>
                  <span
                    className="text-sm font-mono font-bold"
                    style={{ color: row.warn ? riskColors[selected.risk] : "#f0f4ff" }}
                  >
                    {row.v}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="mt-3 rounded-lg p-2"
              style={{ background: "rgba(20,30,58,0.5)", border: "1px solid #1a2640" }}
            >
              <div className="text-[10px] font-mono mb-1" style={{ color: "#4a6080" }}>
                POSSIBLE CAUSE
              </div>
              {selected.cause.map((c) => (
                <div key={c} className="text-xs text-white">
                  • {c}
                </div>
              ))}
            </div>
          </div>

          {/* Forecast chart */}
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: "#4a6080" }}>
                Time-to-Flood Chart
              </h3>
              <button
                onClick={() => setShowConfidence((p) => !p)}
                className="text-[10px] font-mono flex items-center gap-1 hover:text-cyan-400 transition-colors"
                style={{ color: "#4a6080" }}
              >
                <Info size={10} />
                {selected.confidencePct}% CONFIDENCE
              </button>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={roadForecast} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="hotspotGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={riskColors[selected.risk]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={riskColors[selected.risk]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#4a6080", fontSize: 9, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "#0c1322", border: "1px solid #1a2640", borderRadius: 8, color: "#f0f4ff", fontFamily: "JetBrains Mono", fontSize: 10 }}
                  formatter={(v) => [`${v} cm`, "Depth"]}
                />
                <ReferenceLine
                  y={30}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: "DANGER", fill: "#ef4444", fontSize: 8, fontFamily: "JetBrains Mono" }}
                />
                <Area
                  type="monotone"
                  dataKey="depth"
                  stroke={riskColors[selected.risk]}
                  strokeWidth={2}
                  fill="url(#hotspotGrad)"
                  dot={{ fill: riskColors[selected.risk], r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence breakdown */}
        {showConfidence && (
          <div
            className="rounded-xl p-4 animate-slide-up"
            style={{ background: "rgba(12,19,34,0.8)", border: "1px solid rgba(6,182,212,0.2)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: "#22d3ee" }}>
                Why {selected.confidencePct}% Confidence?
              </h3>
              <button onClick={() => setShowConfidence(false)}>
                <X size={14} style={{ color: "#4a6080" }} />
              </button>
            </div>
            <div className="space-y-2">
              {confidenceFactors.map((f) => (
                <div key={f.name} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "#8da0b8" }}>{f.name}</span>
                  <span className={f.pass ? "text-green-400" : "text-amber-400"} style={{ fontSize: 14 }}>
                    {f.pass ? "✓" : "—"}
                  </span>
                </div>
              ))}
            </div>
            <div
              className="mt-3 rounded-lg p-2 flex gap-4"
              style={{ background: "rgba(20,30,58,0.5)", border: "1px solid #1a2640" }}
            >
              <div>
                <div className="text-[10px]" style={{ color: "#4a6080" }}>Expected depth</div>
                <div className="text-sm font-mono font-bold text-white">{selected.peakDepthCm} cm</div>
              </div>
              <div>
                <div className="text-[10px]" style={{ color: "#4a6080" }}>Likely range</div>
                <div className="text-sm font-mono font-bold text-white">
                  {selected.peakDepthCm - 8}–{selected.peakDepthCm + 10} cm
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate("map", selected.id)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: "#06b6d4" }}
          >
            VIEW ON MAP
          </button>
          <button
            onClick={() => onNavigate("scenarios")}
            className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
            style={{ border: "1px solid #1a2640", color: "#8da0b8" }}
          >
            SIMULATE
          </button>
          <button className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors" style={{ border: "1px solid #1a2640", color: "#8da0b8" }}>
            REPORT ISSUE
          </button>
          <button
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
            style={{ border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", background: "rgba(239,68,68,0.08)" }}
          >
            CLOSE ROAD
          </button>
        </div>
      </div>
    </div>
  );
}
