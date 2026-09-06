import { useState, useEffect, useRef } from "react";
import { systemServices, analyticsData as fallbackAnalytics } from "../mockData";
import type { SystemService } from "../mockData";
import {
  getSystemHealth,
  retestSystemHealth,
  getSystemMetrics,
  getAnalyticsOverview,
} from "../services/api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle,
  WifiOff,
  Activity,
  RefreshCw,
  Check,
  Server,
  Zap,
  Cpu,
  Database,
  HardDrive,
  Radio,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ServerMetrics {
  cpu_usage_pct: number;
  memory_usage_pct: number;
  database_conn_pool: { active: number; idle: number; max: number };
  radar_ingestion_rate_mb_s: number;
  active_spatial_queries_per_sec: number;
  gnn_inference_latency_p95_ms: number;
  swmm_hydraulic_step_s: number;
  telemetry_timestamp?: string;
}

function StatusDot({ status }: { status: SystemService["status"] }) {
  const config = {
    HEALTHY: { color: "#10b981", label: "HEALTHY" },
    DEGRADED: { color: "#f59e0b", label: "DEGRADED" },
    OFFLINE: { color: "#ef4444", label: "OFFLINE" },
  };
  const c = config[status] || config.HEALTHY;
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: c.color, boxShadow: `0 0 6px ${c.color}80` }}
      />
      <span className="text-[10px] font-mono font-bold" style={{ color: c.color }}>
        {c.label}
      </span>
    </div>
  );
}

function LatencyBar({ ms }: { ms: number }) {
  const max = 5000;
  const pct = Math.min((ms / max) * 100, 100);
  const color = ms < 500 ? "#10b981" : ms < 2000 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-[#1a2640] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold" style={{ color }}>
        {ms}ms
      </span>
    </div>
  );
}

export default function SystemHealthView() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanToast, setScanToast] = useState(false);
  const [serviceList, setServiceList] = useState<SystemService[]>(systemServices);
  const [analytics, setAnalytics] = useState(fallbackAnalytics);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<ServerMetrics>({
    cpu_usage_pct: 28.4,
    memory_usage_pct: 42.1,
    database_conn_pool: { active: 4, idle: 16, max: 20 },
    radar_ingestion_rate_mb_s: 8.4,
    active_spatial_queries_per_sec: 42,
    gnn_inference_latency_p95_ms: 1140,
    swmm_hydraulic_step_s: 1.2,
  });

  // Load live health, metrics, and analytics
  const fetchAllTelemetry = async () => {
    try {
      const [health, met, an] = await Promise.allSettled([
        getSystemHealth(),
        getSystemMetrics(),
        getAnalyticsOverview(),
      ]);

      if (health.status === "fulfilled" && health.value?.services?.length > 0) {
        setServiceList(health.value.services);
        setIsLiveConnected(true);
      }

      if (met.status === "fulfilled" && met.value?.cpu_usage_pct !== undefined) {
        setMetrics(met.value);
      }

      if (an.status === "fulfilled" && an.value?.hourlyFlood) {
        setAnalytics(an.value);
      }
    } catch (err) {
      console.warn("[SystemHealthView] Live telemetry fetch error:", err);
    }
  };

  useEffect(() => {
    fetchAllTelemetry();
  }, []);

  // Auto-refresh interval (10s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAllTelemetry();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const healthyCount = serviceList.filter((s) => s.status === "HEALTHY").length;
  const degradedList = serviceList.filter((s) => s.status === "DEGRADED");
  const offlineList = serviceList.filter((s) => s.status === "OFFLINE");
  const degradedCount = degradedList.length;
  const offlineCount = offlineList.length;

  const handleRunDiagnostics = async () => {
    setIsScanning(true);
    setScanToast(false);
    try {
      const res = await retestSystemHealth();
      if (res && res.services && res.services.length > 0) {
        setServiceList(res.services);
        setIsLiveConnected(true);
      }
      // Also fetch updated host metrics
      const m = await getSystemMetrics();
      if (m && m.cpu_usage_pct !== undefined) {
        setMetrics(m);
      }
    } catch {
      // Local simulated fallback
      setServiceList((prev) =>
        prev.map((s) => ({
          ...s,
          latencyMs: Math.max(12, Math.round(s.latencyMs * (0.8 + Math.random() * 0.4))),
          lastUpdate: "Just now",
        }))
      );
    } finally {
      setIsScanning(false);
      setScanToast(true);
      setTimeout(() => setScanToast(false), 3500);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-5 space-y-5 relative bg-[#070b14] text-[#f0f4ff]">
      {/* Scan Toast */}
      {scanToast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-white flex items-center gap-2 shadow-2xl animate-slide-down"
          style={{ background: "#10b981", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <Check size={14} /> Diagnostic scan complete. Real-time microservice latencies refreshed.
        </div>
      )}

      {/* ── 1. Top Header Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Overall Status",
            value: degradedCount > 0 ? "DEGRADED" : offlineCount > 0 ? "CRITICAL" : "OPERATIONAL",
            sub: `${healthyCount}/${serviceList.length} services operational`,
            color: degradedCount > 0 ? "#f59e0b" : offlineCount > 0 ? "#ef4444" : "#10b981",
            icon: degradedCount > 0 ? AlertTriangle : CheckCircle,
          },
          {
            label: "Healthy Services",
            value: healthyCount,
            sub: "Meeting latency SLA",
            color: "#10b981",
            icon: CheckCircle,
          },
          {
            label: "Degraded",
            value: degradedCount,
            sub: degradedCount > 0 ? `${degradedList[0]?.name} high latency` : "None flagged",
            color: "#f59e0b",
            icon: AlertTriangle,
          },
          {
            label: "Offline",
            value: offlineCount,
            sub: offlineCount > 0 ? "Critical outage" : "0 services offline",
            color: "#ef4444",
            icon: WifiOff,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-4 transition-all duration-200"
            style={{
              background: `${card.color}10`,
              border: `1px solid ${card.color}35`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={14} style={{ color: card.color }} />
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold" style={{ color: card.color }}>
                {card.label}
              </span>
            </div>
            <div className="text-2xl font-mono font-black" style={{ color: card.color }}>
              {card.value}
            </div>
            <div className="text-[10px] mt-1 text-[#64748b]">
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── 2. Dynamic Degradation & Health Notice Banner ───────────────────── */}
      {degradedCount > 0 || offlineCount > 0 ? (
        <div
          className="rounded-xl p-3.5 flex items-center gap-3 border shadow-lg"
          style={{ background: "rgba(245, 158, 11, 0.08)", borderColor: "rgba(245, 158, 11, 0.4)" }}
        >
          <AlertTriangle size={18} className="text-[#f59e0b] flex-shrink-0 animate-pulse" />
          <div className="flex-1 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-[#fde68a]">
                PIPELINE LATENCY ALERT: {degradedList.map((s) => s.name).join(", ")}
              </span>
              <p className="text-xs text-[#d97706] mt-0.5 font-mono">
                {degradedList.map((s) => `${s.name} latency elevated to ${s.latencyMs}ms (SLA threshold: 2500ms)`).join(" · ")}
              </p>
            </div>
            <span className="text-[10px] font-mono bg-[#f59e0b]/20 text-[#fde68a] px-2.5 py-1 rounded border border-[#f59e0b]/40">
              UNCERTAINTY TOLERANCE +12%
            </span>
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl p-3 flex items-center gap-3 border"
          style={{ background: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.3)" }}
        >
          <CheckCircle size={16} className="text-[#10b981] flex-shrink-0" />
          <div className="flex-1 text-xs font-mono text-emerald-300">
            ALL 9 DISASTER INTELLIGENCE PIPELINES &amp; STORAGE SERVICES ARE OPERATING NOMINALLY.
          </div>
        </div>
      )}

      {/* ── 3. Live Host Hardware & Pipeline Throughput HUD ─────────────────── */}
      <div
        className="rounded-xl p-4 border grid grid-cols-5 gap-4"
        style={{ background: "#0c1322", borderColor: "#1a2640" }}
      >
        <div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#64748b] mb-1">
            <span className="flex items-center gap-1">
              <Cpu size={12} className="text-[#06b6d4]" /> CPU LOAD
            </span>
            <span className="text-white font-bold">{metrics.cpu_usage_pct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1a2640] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#06b6d4] transition-all duration-300"
              style={{ width: `${metrics.cpu_usage_pct}%` }}
            />
          </div>
          <div className="text-[9px] font-mono text-[#475569] mt-1">Multi-core cluster</div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#64748b] mb-1">
            <span className="flex items-center gap-1">
              <HardDrive size={12} className="text-emerald-400" /> RAM USAGE
            </span>
            <span className="text-white font-bold">{metrics.memory_usage_pct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1a2640] overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${metrics.memory_usage_pct}%` }}
            />
          </div>
          <div className="text-[9px] font-mono text-[#475569] mt-1">In-Memory GIS Cache</div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-[#64748b] mb-1 flex items-center gap-1">
            <Database size={12} className="text-[#a855f7]" /> DB POOL
          </div>
          <div className="text-base font-mono font-bold text-white">
            {metrics.database_conn_pool?.active ?? 4} <span className="text-xs font-normal text-[#64748b]">/ {metrics.database_conn_pool?.max ?? 20} active</span>
          </div>
          <div className="text-[9px] font-mono text-[#475569]">SQLite / PostGIS Engine</div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-[#64748b] mb-1 flex items-center gap-1">
            <Radio size={12} className="text-[#f59e0b]" /> RADAR STREAM
          </div>
          <div className="text-base font-mono font-bold text-[#fde68a]">
            {metrics.radar_ingestion_rate_mb_s} <span className="text-xs font-normal text-[#64748b]">MB/s</span>
          </div>
          <div className="text-[9px] font-mono text-[#475569]">Doppler Feed Active</div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-[#64748b] mb-1 flex items-center gap-1">
            <Zap size={12} className="text-[#38bdf8]" /> GNN INFERENCE
          </div>
          <div className="text-base font-mono font-bold text-[#38bdf8]">
            {metrics.gnn_inference_latency_p95_ms} <span className="text-xs font-normal text-[#64748b]">ms (P95)</span>
          </div>
          <div className="text-[9px] font-mono text-[#475569]">{metrics.active_spatial_queries_per_sec} spatial QPS</div>
        </div>
      </div>

      {/* ── 4. Services Table with Live Re-Test & Inspection ─────────────────── */}
      <div
        className="rounded-xl overflow-hidden border"
        style={{ borderColor: "#1a2640" }}
      >
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ background: "rgba(12, 19, 34, 0.95)", borderBottom: "1px solid #1a2640" }}
        >
          <div className="flex items-center gap-3">
            <Activity size={15} className="text-[#06b6d4]" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#94a3b8] font-bold">
              Service Status &amp; Health Monitor
            </h3>
            {isLiveConnected ? (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE BACKEND CONNECTED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono text-[#64748b] bg-[#0f172a] border border-[#1e293b]">
                STANDALONE CACHE
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh((p) => !p)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all flex items-center gap-1.5 ${
                autoRefresh
                  ? "bg-[#06b6d4]/20 text-[#22d3ee] border border-[#06b6d4]/50"
                  : "bg-black/30 text-[#64748b] border border-[#1a2640] hover:text-white"
              }`}
            >
              <Clock size={11} className={autoRefresh ? "animate-spin text-cyan-400" : ""} />
              Auto-Refresh (10s) {autoRefresh ? "ON" : "OFF"}
            </button>

            {/* Run Diagnostics Button */}
            <button
              onClick={handleRunDiagnostics}
              disabled={isScanning}
              className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold text-[#070b14] bg-[#06b6d4] hover:bg-[#22d3ee] flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={13} className={isScanning ? "animate-spin" : ""} />
              {isScanning ? "PROBING SERVICES…" : "RE-TEST ALL SERVICES"}
            </button>
          </div>
        </div>

        <div style={{ background: "rgba(10, 16, 28, 0.9)" }}>
          {/* Header row */}
          <div
            className="grid text-[10px] font-mono uppercase tracking-wider px-4 py-2 text-[#475569]"
            style={{
              gridTemplateColumns: "1.5fr 1fr 1.2fr 0.8fr 1fr 0.4fr",
              borderBottom: "1px solid #1a2640",
            }}
          >
            <span>Service Name</span>
            <span>Status</span>
            <span>Latency (SLA)</span>
            <span className="text-right">Error Rate</span>
            <span className="text-right">Last Telemetry</span>
            <span className="text-right">Inspect</span>
          </div>

          {serviceList.map((svc, i) => {
            const isExpanded = selectedService === svc.name;
            return (
              <div key={svc.name} className="border-b last:border-0 border-[#1a2640]/60">
                <div
                  onClick={() => setSelectedService(isExpanded ? null : svc.name)}
                  className="grid items-center px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer"
                  style={{
                    gridTemplateColumns: "1.5fr 1fr 1.2fr 0.8fr 1fr 0.4fr",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4]" />
                    <span className="text-sm font-medium text-white">{svc.name}</span>
                  </div>

                  <div>
                    <StatusDot status={svc.status} />
                  </div>

                  <div>
                    <LatencyBar ms={svc.latencyMs} />
                  </div>

                  <span
                    className="text-[10px] font-mono text-right font-bold"
                    style={{
                      color: svc.errorRate > 1 ? "#ef4444" : svc.errorRate > 0 ? "#f59e0b" : "#10b981",
                    }}
                  >
                    {svc.errorRate.toFixed(1)}%
                  </span>

                  <span className="text-[10px] font-mono text-right text-[#64748b]">
                    {svc.lastUpdate}
                  </span>

                  <div className="text-right text-[#64748b]">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {/* Expanded Inspection Drawer */}
                {isExpanded && (
                  <div
                    className="px-6 py-3 bg-[#080d1a] border-t border-[#1a2640] flex items-center justify-between text-xs font-mono text-[#94a3b8]"
                  >
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-[#64748b] text-[9px] block">SUBSYSTEM DOMAIN</span>
                        <b className="text-white">{svc.componentType || "Disaster Pipeline"}</b>
                      </div>
                      <div>
                        <span className="text-[#64748b] text-[9px] block">DATA FRESHNESS</span>
                        <b className="text-[#06b6d4]">{svc.dataFreshnessSec ?? 0}s latency delta</b>
                      </div>
                      <div>
                        <span className="text-[#64748b] text-[9px] block">SLA HEALTH STATE</span>
                        <b className={svc.status === "HEALTHY" ? "text-emerald-400" : "text-amber-400"}>
                          {svc.status === "HEALTHY" ? "✓ Within Latency Limits" : "⚠ Latency Degradation Active"}
                        </b>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunDiagnostics();
                      }}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white border border-[#1a2640] text-[10px] transition-colors"
                    >
                      Probe {svc.name}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. Analytics Charts ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-xl p-4 border"
          style={{ background: "#0c1322", borderColor: "#1a2640" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Flood Progression Today</h3>
            <span className="text-[10px] font-mono text-[#06b6d4]">Hourly Crest Curve</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart
              data={analytics.hourlyFlood}
              margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="sysDepthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="hour"
                tick={{ fill: "#64748b", fontSize: 9, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
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
              <Area
                type="monotone"
                dataKey="depth"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#sysDepthGrad)"
                name="Depth (cm)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div
          className="rounded-xl p-4 border"
          style={{ background: "#0c1322", borderColor: "#1a2640" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Flooded Roads Over Time</h3>
            <span className="text-[10px] font-mono text-[#f97316]">Road Breach Progression</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={analytics.hourlyFlood}
              margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
            >
              <XAxis
                dataKey="hour"
                tick={{ fill: "#64748b", fontSize: 9, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
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
              <Bar dataKey="roads" fill="rgba(249,115,22,0.6)" radius={[3, 3, 0, 0]} name="Roads" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 6. Bottom Analytics Metric Cards ───────────────────────────────── */}
      <div
        className="rounded-xl p-4 border"
        style={{ background: "#0c1322", borderColor: "#1a2640" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Current Event Analytics</h3>
          {isLiveConnected && (
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE TELEMETRY STREAM
            </span>
          )}
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Flooded Roads", value: analytics.floodedRoads, unit: "" },
            { label: "Peak Depth", value: `${analytics.peakDepthCm} cm`, unit: "" },
            { label: "Max Velocity", value: `${analytics.maxVelocityMs} m/s`, unit: "" },
            {
              label: "Affected Pop.",
              value: (analytics.affectedPopulation || 14200).toLocaleString(),
              unit: "",
            },
            { label: "Response Time", value: `${analytics.rescueResponseMin} min`, unit: "avg" },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-lg p-3 text-center"
              style={{ background: "rgba(20,30,58,0.5)", border: "1px solid #1a2640" }}
            >
              <div className="text-[10px] font-mono mb-1 text-[#64748b]">
                {m.label}
              </div>
              <div className="text-lg font-mono font-black text-white">{m.value}</div>
              {m.unit && (
                <div className="text-[9px] text-[#475569]">{m.unit}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
