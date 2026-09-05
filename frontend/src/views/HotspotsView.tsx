import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  X,
  Info,
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Shield,
  Droplets,
  Users,
  Navigation,
} from "lucide-react";
import {
  getHotspots,
  getHotspotSummary,
  closeHotspotRoad,
  reopenHotspotRoad,
  getForecastTimeline,
} from "../services/api";
import type {
  HotspotDetail,
  HotspotListResponse,
  HotspotSummary,
  NearbyEntity,
} from "../services/api";
import type { ForecastPoint } from "../mockData";
import type { CityFloodDataset } from "../services/cityDataGenerator";

const riskColors: Record<string, string> = {
  CRITICAL: "#dc2626",
  SEVERE: "#ef4444",
  HIGH: "#f97316",
  MODERATE: "#f59e0b",
  LOW: "#10b981",
};

const trendIcons: Record<string, typeof TrendingUp> = {
  WORSENING: TrendingUp,
  STABLE: Minus,
  IMPROVING: TrendingDown,
};

const trendColors: Record<string, string> = {
  WORSENING: "#ef4444",
  STABLE: "#f59e0b",
  IMPROVING: "#10b981",
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

function UrgencyScoreRing({ score, tier }: { score: number; tier: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = riskColors[tier] || "#4a6080";
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="absolute inset-0" viewBox="0 0 52 52" width="52" height="52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#1a2640" strokeWidth="3" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <span className="text-[10px] font-mono font-black z-10" style={{ color }}>
        {Math.round(score)}
      </span>
    </div>
  );
}

function NearbyEntityBadge({ entity }: { entity: NearbyEntity }) {
  const colors: Record<string, string> = {
    SOS: "#ef4444",
    SHELTER: "#10b981",
    DRAINAGE: "#3b82f6",
  };
  const color = colors[entity.entity_type] || "#4a6080";
  return (
    <div
      className="rounded-lg px-2.5 py-1.5 flex items-center gap-2"
      style={{ background: `${color}10`, border: `1px solid ${color}30` }}
    >
      <div className="flex-shrink-0">
        {entity.entity_type === "SOS" && <AlertTriangle size={12} style={{ color }} />}
        {entity.entity_type === "SHELTER" && <Shield size={12} style={{ color }} />}
        {entity.entity_type === "DRAINAGE" && <Droplets size={12} style={{ color }} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono font-bold truncate" style={{ color }}>
          {entity.id}
        </div>
        <div className="text-[9px] truncate" style={{ color: "#8da0b8" }}>
          {entity.detail}
        </div>
      </div>
      <span className="text-[9px] font-mono flex-shrink-0" style={{ color: "#4a6080" }}>
        {entity.distance_km} km
      </span>
    </div>
  );
}

const AUTO_REFRESH_MS = 30000; // 30s auto-refresh

export default function HotspotsView({
  onNavigate,
  cityDataset,
}: {
  onNavigate: (view: string, roadId?: string) => void;
  cityDataset: CityFloodDataset | null;
}) {
  const [data, setData] = useState<HotspotListResponse | null>(null);
  const [summary, setSummary] = useState<HotspotSummary | null>(null);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [selected, setSelected] = useState<HotspotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [closingRoad, setClosingRoad] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      if (cityDataset) {
        // Compute hotspots locally based on the generated dataset
        const computedHotspots = cityDataset.roads.map((r) => ({
          ...r,
          is_closed: r.closed || false,
          score: {
            composite: 0,
            depth_factor: 0,
            velocity_factor: 0,
            drainage_factor: 0,
            urgency_factor: 0,
            rainfall_factor: 0,
            confidence_factor: 0,
            risk_tier: r.risk,
          },
          actionRecommendation: r.risk === "SEVERE" ? "CLOSE IMMEDIATELY" : r.risk === "HIGH" ? "MONITOR" : "OBSERVE",
          actionPriority: r.risk === "SEVERE" ? "CRITICAL" : "MODERATE",
          trend: "STABLE",
          nearbySOS: [],
          nearbyShelters: [],
          nearbyDrainage: [],
          affectedPopulation: 0,
        }));
        
        computedHotspots.sort((a, b) => {
          const riskWeight: Record<string, number> = { SEVERE: 4, HIGH: 3, MODERATE: 2, LOW: 1 };
          return (riskWeight[b.risk] || 0) - (riskWeight[a.risk] || 0) || b.depthCm - a.depthCm;
        });

        const criticalCount = computedHotspots.filter((h) => h.risk === "SEVERE").length;
        const severeCount = computedHotspots.filter((h) => h.risk === "SEVERE").length;
        const highCount = computedHotspots.filter((h) => h.risk === "HIGH").length;
        const moderateCount = computedHotspots.filter((h) => h.risk === "MODERATE").length;
        const lowCount = computedHotspots.filter((h) => h.risk === "LOW").length;

        const resData: HotspotListResponse = {
          count: computedHotspots.length,
          critical_count: criticalCount,
          severe_count: severeCount,
          high_count: highCount,
          total_affected_population: 0,
          avg_urgency_score: 0,
          worst_hotspot_id: computedHotspots.length > 0 ? computedHotspots[0].id : null,
          hotspots: computedHotspots,
        };

        const resSummary: HotspotSummary = {
          total_hotspots: computedHotspots.length,
          critical_hotspots: criticalCount,
          severe_hotspots: severeCount,
          high_hotspots: highCount,
          moderate_hotspots: moderateCount,
          low_hotspots: lowCount,
          closed_roads: computedHotspots.filter((h) => h.is_closed).length,
          avg_depth_cm: computedHotspots.length ? computedHotspots.reduce((sum, h) => sum + h.depthCm, 0) / computedHotspots.length : 0,
          max_depth_cm: computedHotspots.length ? Math.max(...computedHotspots.map(h => h.depthCm)) : 0,
          avg_urgency_score: 0,
          total_affected_population: 0,
          worsening_count: 0,
          stable_count: computedHotspots.length,
          improving_count: 0,
          risk_distribution: {
            SEVERE: severeCount,
            HIGH: highCount,
            MODERATE: moderateCount,
            LOW: lowCount,
          },
        };

        setData(resData);
        setSummary(resSummary);
        setForecast(cityDataset.forecast || []);
        setLastUpdated(new Date());

        if (resData.hotspots.length > 0) {
          setSelected((prev) => {
            if (!prev) return resData.hotspots[0];
            const found = resData.hotspots.find((h) => h.id === prev.id);
            return found || resData.hotspots[0];
          });
        }
      } else {
        const [hotspotsRes, summaryRes, forecastRes] = await Promise.all([
          getHotspots(),
          getHotspotSummary(),
          getForecastTimeline(),
        ]);
        setData(hotspotsRes);
        setSummary(summaryRes);
        setForecast(forecastRes);
        setLastUpdated(new Date());
        
        if (hotspotsRes.hotspots.length > 0) {
          setSelected((prev) => {
            if (!prev) return hotspotsRes.hotspots[0];
            const found = hotspotsRes.hotspots.find((h) => h.id === prev.id);
            return found || hotspotsRes.hotspots[0];
          });
        }
      }
    } catch (err) {
      console.error("[HotspotsView] Failed to fetch data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cityDataset]);

  // Initial fetch + auto-refresh every 30s
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCloseRoad = async () => {
    if (!selected) return;
    setClosingRoad(true);

    const newClosedStatus = !selected.is_closed;

    // Optimistic UI updates
    setSelected(prev => prev ? { ...prev, is_closed: newClosedStatus } : null);
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        hotspots: prev.hotspots.map(h => h.id === selected.id ? { ...h, is_closed: newClosedStatus } : h)
      };
    });
    
    // Update local dataset if present so subsequent fetches use new state
    if (cityDataset) {
      const road = cityDataset.roads.find(r => r.id === selected.id);
      if (road) road.closed = newClosedStatus;
    }

    // Auto-navigate to map to view the newly blocked road
    if (newClosedStatus) {
      onNavigate("map", selected.id);
    }

    try {
      if (!newClosedStatus) {
        await reopenHotspotRoad(selected.id);
      } else {
        await closeHotspotRoad(selected.id);
      }
      await fetchData(true);
    } catch (err) {
      console.error("[HotspotsView] Road closure failed:", err);
      // Revert optimistic updates
      setSelected(prev => prev ? { ...prev, is_closed: !newClosedStatus } : null);
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          hotspots: prev.hotspots.map(h => h.id === selected.id ? { ...h, is_closed: !newClosedStatus } : h)
        };
      });
      if (cityDataset) {
        const road = cityDataset.roads.find(r => r.id === selected.id);
        if (road) road.closed = !newClosedStatus;
      }
    } finally {
      setClosingRoad(false);
    }
  };

  // Loading state
  if (loading || !data || !selected) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin" style={{ color: "#06b6d4" }} />
          <span className="text-sm font-mono" style={{ color: "#4a6080" }}>
            Loading hotspot intelligence...
          </span>
        </div>
      </div>
    );
  }

  const hotspots = data.hotspots;
  const riskColor = riskColors[selected.score.risk_tier] || riskColors[selected.risk] || "#4a6080";
  const TrendIcon = trendIcons[selected.trend] || Minus;
  const trendColor = trendColors[selected.trend] || "#4a6080";

  // Build forecast chart data from timeline
  const chartData = forecast.map((fp) => ({
    time: fp.time,
    depth: fp.depthCm,
    threshold: 30,
  }));

  return (
    <div className="h-full flex overflow-hidden">
      {/* Hotspot sidebar list */}
      <div
        className="w-72 flex-shrink-0 border-r overflow-y-auto"
        style={{ borderColor: "#1a2640" }}
      >
        {/* Header with live stats */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #1a2640" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">TOP FLOOD HOTSPOTS</h2>
            <button
              onClick={() => fetchData(true)}
              className="p-1 rounded hover:bg-white/5 transition-colors"
              title="Refresh data"
            >
              <RefreshCw
                size={12}
                className={refreshing ? "animate-spin" : ""}
                style={{ color: "#4a6080" }}
              />
            </button>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "#4a6080" }}>
            Ranked by AI urgency score
          </p>
          {/* Live summary badges */}
          {summary && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {summary.critical_hotspots > 0 && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(220,38,38,0.15)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.3)" }}
                >
                  {summary.critical_hotspots} CRITICAL
                </span>
              )}
              {summary.severe_hotspots > 0 && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
                >
                  {summary.severe_hotspots} SEVERE
                </span>
              )}
              {summary.worsening_count > 0 && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  {summary.worsening_count} WORSENING
                </span>
              )}
            </div>
          )}
          {lastUpdated && (
            <div className="text-[9px] font-mono mt-1.5" style={{ color: "#374151" }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Hotspot cards */}
        <div className="p-3 space-y-2">
          {hotspots.map((hotspot, i) => {
            const isSelected = selected.id === hotspot.id;
            const color = riskColors[hotspot.score.risk_tier] || riskColors[hotspot.risk] || "#4a6080";
            const HTrendIcon = trendIcons[hotspot.trend] || Minus;
            return (
              <button
                key={hotspot.id}
                onClick={() => {
                  setSelected(hotspot);
                  setShowConfidence(false);
                  setShowScoreBreakdown(false);
                }}
                className="w-full text-left rounded-xl p-3 transition-all"
                style={{
                  background: isSelected
                    ? `${color}10`
                    : "rgba(12,19,34,0.5)",
                  border: `1px solid ${isSelected ? color + "50" : "#1a2640"}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-mono font-black w-6 text-center flex-shrink-0"
                    style={{ color }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate max-w-[140px]" title={hotspot.name}>{hotspot.name}</span>
                      {hotspot.is_closed && (
                        <span
                          className="text-[9px] font-mono px-1.5 rounded"
                          style={{ background: "rgba(107,114,128,0.2)", color: "#9ca3af" }}
                        >
                          CLOSED
                        </span>
                      )}
                      <HTrendIcon
                        size={10}
                        style={{ color: trendColors[hotspot.trend] || "#4a6080" }}
                      />
                    </div>
                    <div className="text-[10px] mt-0.5 font-mono truncate" style={{ color: "#4a6080" }}>
                      {hotspot.id}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className="text-sm font-mono font-black"
                      style={{ color }}
                    >
                      {hotspot.depthCm} cm
                    </div>
                    <div className="text-[10px] font-mono" style={{ color: "#4a6080" }}>
                      {hotspot.timeToFloodMin} min
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase"
                    style={{
                      background: `${color}15`,
                      color,
                      border: `1px solid ${color}40`,
                    }}
                  >
                    {hotspot.score.risk_tier}
                  </span>
                  <div className="flex-1 h-1 rounded-full" style={{ background: "#1a2640" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${hotspot.score.composite}%`,
                        background: color,
                      }}
                    />
                  </div>
                  <span className="text-[9px] font-mono" style={{ color: "#4a6080" }}>
                    {Math.round(hotspot.score.composite)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Header card */}
        <div
          className="rounded-xl p-4 animate-slide-up"
          key={selected.id}
          style={{
            background: `${riskColor}08`,
            border: `1px solid ${riskColor}40`,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                <span
                  className="text-sm font-mono font-bold px-3 py-1 rounded-full"
                  style={{ background: riskColor, color: "white" }}
                >
                  {selected.score.risk_tier}
                </span>
                {selected.is_closed && (
                  <span className="text-sm font-mono px-3 py-1 rounded-full" style={{ background: "#374151", color: "#9ca3af" }}>
                    CLOSED
                  </span>
                )}
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: `${trendColor}15`, border: `1px solid ${trendColor}30` }}>
                  <TrendIcon size={12} style={{ color: trendColor }} />
                  <span className="text-[10px] font-mono font-bold" style={{ color: trendColor }}>
                    {selected.trend}
                  </span>
                </div>
              </div>
              <p className="text-xs font-mono" style={{ color: "#8da0b8" }}>
                {selected.id}
              </p>
              {/* Priority badge */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono" style={{ color: "#4a6080" }}>
                  {selected.actionPriority}
                </span>
                {selected.affectedPopulation > 0 && (
                  <span className="text-[10px] font-mono flex items-center gap-1" style={{ color: "#f59e0b" }}>
                    <Users size={10} />
                    {selected.affectedPopulation} affected
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UrgencyScoreRing score={selected.score.composite} tier={selected.score.risk_tier} />
              <ConfidenceRing pct={selected.confidencePct} />
            </div>
          </div>

          {/* Live AI action recommendation */}
          <div
            className="mt-3 rounded-lg px-3 py-2"
            style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}
          >
            <span className="text-[10px] font-mono uppercase" style={{ color: "#4a6080" }}>
              AI ACTION INTELLIGENCE
            </span>
            <p className="text-sm font-semibold text-white mt-0.5">
              {selected.actionRecommendation}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Current Conditions */}
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
                    style={{ color: row.warn ? riskColor : "#f0f4ff" }}
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
                  &#8226; {c}
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
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="hotspotGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={riskColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={riskColor} stopOpacity={0} />
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
                  formatter={(value: any) => [`${value ?? 0} cm`, "Depth"]}
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
                  stroke={riskColor}
                  strokeWidth={2}
                  fill="url(#hotspotGrad)"
                  dot={{ fill: riskColor, r: 3 }}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score breakdown */}
        <button
          onClick={() => setShowScoreBreakdown((p) => !p)}
          className="w-full text-left rounded-xl p-3 transition-all hover:bg-white/[0.02]"
          style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: "#4a6080" }}>
              Urgency Score Breakdown
            </h3>
            <span className="text-sm font-mono font-black" style={{ color: riskColor }}>
              {selected.score.composite} / 100
            </span>
          </div>
          {showScoreBreakdown && (
            <div className="mt-3 space-y-2 animate-slide-up">
              {[
                { label: "Depth Factor (35%)", value: selected.score.depth_factor, max: 200 },
                { label: "Velocity Factor (20%)", value: selected.score.velocity_factor, max: 200 },
                { label: "Drainage Stress (15%)", value: selected.score.drainage_factor, max: 100 },
                { label: "Urgency Factor (15%)", value: selected.score.urgency_factor, max: 100 },
                { label: "Rainfall Intensity (10%)", value: selected.score.rainfall_factor, max: 100 },
                { label: "Confidence (5%)", value: selected.score.confidence_factor, max: 100 },
              ].map((f) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px]" style={{ color: "#8da0b8" }}>{f.label}</span>
                    <span className="text-[10px] font-mono font-bold" style={{ color: "#f0f4ff" }}>
                      {f.value}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "#1a2640" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (f.value / f.max) * 100)}%`,
                        background: f.value >= f.max * 0.8 ? "#ef4444" : f.value >= f.max * 0.5 ? "#f59e0b" : "#10b981",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </button>

        {/* Nearby entities */}
        {(selected.nearbySOS.length > 0 || selected.nearbyShelters.length > 0 || selected.nearbyDrainage.length > 0) && (
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
          >
            <h3 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#4a6080" }}>
              Nearby Intelligence (2 km)
            </h3>
            <div className="space-y-2">
              {selected.nearbySOS.map((e) => (
                <NearbyEntityBadge key={e.id} entity={e} />
              ))}
              {selected.nearbyShelters.map((e) => (
                <NearbyEntityBadge key={e.id} entity={e} />
              ))}
              {selected.nearbyDrainage.map((e) => (
                <NearbyEntityBadge key={e.id} entity={e} />
              ))}
            </div>
          </div>
        )}

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
              {[
                { name: "Radar freshness", pass: selected.confidencePct >= 70 },
                { name: "DEM quality", pass: true },
                { name: "Drainage coverage", pass: selected.drainUtilPct < 100 },
                { name: "Model agreement", pass: selected.confidencePct >= 75 },
                { name: "Historical validation", pass: selected.confidencePct >= 65 },
                { name: "Forecast lead time", pass: selected.timeToFloodMin > 15 },
              ].map((f) => (
                <div key={f.name} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "#8da0b8" }}>{f.name}</span>
                  <span className={f.pass ? "text-green-400" : "text-amber-400"} style={{ fontSize: 14 }}>
                    {f.pass ? "\u2713" : "\u2014"}
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
                  {selected.peakDepthCm - 8}&ndash;{selected.peakDepthCm + 10} cm
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate("map", selected.id)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 flex items-center gap-2"
            style={{ background: "#06b6d4" }}
          >
            <Navigation size={14} />
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
            onClick={handleCloseRoad}
            disabled={closingRoad}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
            style={{
              border: `1px solid ${selected.is_closed ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
              color: selected.is_closed ? "#6ee7b7" : "#fca5a5",
              background: selected.is_closed ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
            }}
          >
            {closingRoad && <Loader2 size={14} className="animate-spin" />}
            {selected.is_closed ? "REOPEN ROAD" : "CLOSE ROAD"}
          </button>
        </div>
      </div>
    </div>
  );
}
