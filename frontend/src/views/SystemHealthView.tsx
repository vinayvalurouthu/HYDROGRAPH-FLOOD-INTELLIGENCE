import { useState } from "react";
import { systemServices, analyticsData } from "../mockData";
import type { SystemService } from "../mockData";
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
import { AlertTriangle, CheckCircle, WifiOff, Activity, RefreshCw, Check } from "lucide-react";

function StatusDot({ status }: { status: SystemService["status"] }) {
  const config = {
    HEALTHY: { color: "#10b981", label: "HEALTHY" },
    DEGRADED: { color: "#f59e0b", label: "DEGRADED" },
    OFFLINE: { color: "#ef4444", label: "OFFLINE" },
  };
  const c = config[status];
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: c.color, boxShadow: `0 0 6px ${c.color}80` }}
      />
      <span className="text-[10px] font-mono" style={{ color: c.color }}>
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
      <div className="w-20 h-1 rounded-full" style={{ background: "#1a2640" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>
        {ms}ms
      </span>
    </div>
  );
}

export default function SystemHealthView() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanToast, setScanToast] = useState(false);
  const [serviceList, setServiceList] = useState<SystemService[]>(systemServices);

  const healthyCount = serviceList.filter((s) => s.status === "HEALTHY").length;
  const degradedCount = serviceList.filter((s) => s.status === "DEGRADED").length;
  const offlineCount = serviceList.filter((s) => s.status === "OFFLINE").length;

  const handleRunDiagnostics = () => {
    setIsScanning(true);
    setScanToast(false);
    setTimeout(() => {
      // Simulate live ping updates
      setServiceList((prev) =>
        prev.map((s) => ({
          ...s,
          latencyMs: Math.max(12, Math.round(s.latencyMs * (0.8 + Math.random() * 0.4))),
          lastUpdate: "Just now",
        }))
      );
      setIsScanning(false);
      setScanToast(true);
      setTimeout(() => setScanToast(false), 3000);
    }, 1200);
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-5 space-y-5 relative">
      {scanToast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-white flex items-center gap-2 shadow-2xl animate-slide-down"
          style={{ background: "#10b981", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <Check size={14} /> Diagnostic scan complete. All endpoints verified.
        </div>
      )}

      {/* Header summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Overall Status",
            value: degradedCount > 0 ? "DEGRADED" : "OPERATIONAL",
            sub: `${healthyCount}/${serviceList.length} services healthy`,
            color: degradedCount > 0 ? "#f59e0b" : "#10b981",
            icon: degradedCount > 0 ? AlertTriangle : CheckCircle,
          },
          {
            label: "Healthy Services",
            value: healthyCount,
            sub: "Fully operational",
            color: "#10b981",
            icon: CheckCircle,
          },
          {
            label: "Degraded",
            value: degradedCount,
            sub: "Reduced performance",
            color: "#f59e0b",
            icon: AlertTriangle,
          },
          {
            label: "Offline",
            value: offlineCount,
            sub: "No response",
            color: "#ef4444",
            icon: WifiOff,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-4"
            style={{
              background: `${card.color}10`,
              border: `1px solid ${card.color}30`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={14} style={{ color: card.color }} />
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: card.color }}>
                {card.label}
              </span>
            </div>
            <div className="text-2xl font-mono font-black" style={{ color: card.color }}>
              {card.value}
            </div>
            <div className="text-[10px] mt-1" style={{ color: "#4a6080" }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Degraded banner */}
      {degradedCount > 0 && (
        <div
          className="rounded-xl p-3 flex items-center gap-3"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.35)" }}
        >
          <AlertTriangle size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
          <div className="flex-1">
            <span className="text-sm font-bold" style={{ color: "#fde68a" }}>
              RADAR DATA DELAYED
            </span>
            <span className="text-xs ml-3" style={{ color: "#d97706" }}>
              2D Flood Model latency elevated (4.2s). Forecast uncertainty increased. Last update: 8 min ago.
            </span>
          </div>
        </div>
      )}

      {/* Services table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid #1a2640" }}
      >
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ background: "rgba(12,19,34,0.9)", borderBottom: "1px solid #1a2640" }}
        >
          <div className="flex items-center gap-2">
            <Activity size={14} style={{ color: "#4a6080" }} />
            <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: "#4a6080" }}>
              Service Status & Health Monitor
            </h3>
          </div>
          <button
            onClick={handleRunDiagnostics}
            disabled={isScanning}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-white flex items-center gap-1.5 transition-all hover:opacity-90 cursor-pointer disabled:opacity-50"
            style={{ background: "rgba(6,182,212,0.2)", border: "1px solid #06b6d4", color: "#22d3ee" }}
          >
            <RefreshCw size={12} className={isScanning ? "animate-spin text-cyan-400" : ""} />
            {isScanning ? "RUNNING DIAGNOSTICS…" : "RE-TEST ALL SERVICES"}
          </button>
        </div>
        <div style={{ background: "rgba(10,16,28,0.8)" }}>
          {/* Header row */}
          <div
            className="grid text-[10px] font-mono uppercase tracking-wider px-4 py-2"
            style={{
              color: "#2a3a55",
              gridTemplateColumns: "1fr auto auto auto auto",
              borderBottom: "1px solid #1a2640",
            }}
          >
            <span>Service</span>
            <span className="w-28">Status</span>
            <span className="w-32">Latency</span>
            <span className="w-20 text-right">Error Rate</span>
            <span className="w-28 text-right">Last Update</span>
          </div>
          {serviceList.map((svc, i) => (
            <div
              key={svc.name}
              className="grid items-center px-4 py-3 hover:bg-white/[0.02] transition-colors"
              style={{
                gridTemplateColumns: "1fr auto auto auto auto",
                borderBottom: i < serviceList.length - 1 ? "1px solid #1a2640" : "none",
              }}
            >
              <span className="text-sm font-medium text-white">{svc.name}</span>
              <div className="w-28">
                <StatusDot status={svc.status} />
              </div>
              <div className="w-32">
                <LatencyBar ms={svc.latencyMs} />
              </div>
              <span
                className="text-[10px] font-mono w-20 text-right"
                style={{
                  color: svc.errorRate > 1 ? "#ef4444" : svc.errorRate > 0 ? "#f59e0b" : "#10b981",
                }}
              >
                {svc.errorRate.toFixed(1)}%
              </span>
              <span className="text-[10px] font-mono w-28 text-right" style={{ color: "#4a6080" }}>
                {svc.lastUpdate}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
        >
          <h3 className="text-sm font-semibold text-white mb-3">Flood Progression Today</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart
              data={analyticsData.hourlyFlood}
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
                tick={{ fill: "#4a6080", fontSize: 9, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "#0c1322", border: "1px solid #1a2640", borderRadius: 8, fontSize: 10, fontFamily: "JetBrains Mono", color: "#f0f4ff" }}
              />
              <Area type="monotone" dataKey="depth" stroke="#ef4444" strokeWidth={2} fill="url(#sysDepthGrad)" name="Depth (cm)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
        >
          <h3 className="text-sm font-semibold text-white mb-3">Flooded Roads Over Time</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={analyticsData.hourlyFlood} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <XAxis
                dataKey="hour"
                tick={{ fill: "#4a6080", fontSize: 9, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "#0c1322", border: "1px solid #1a2640", borderRadius: 8, fontSize: 10, fontFamily: "JetBrains Mono", color: "#f0f4ff" }}
              />
              <Bar dataKey="roads" fill="rgba(249,115,22,0.6)" radius={[3, 3, 0, 0]} name="Roads" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytics metrics */}
      <div
        className="rounded-xl p-4"
        style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
      >
        <h3 className="text-sm font-semibold text-white mb-3">Current Event Analytics</h3>
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Flooded Roads", value: analyticsData.floodedRoads, unit: "" },
            { label: "Peak Depth", value: `${analyticsData.peakDepthCm} cm`, unit: "" },
            { label: "Max Velocity", value: `${analyticsData.maxVelocityMs} m/s`, unit: "" },
            { label: "Affected Pop.", value: analyticsData.affectedPopulation.toLocaleString(), unit: "" },
            { label: "Response Time", value: `${analyticsData.rescueResponseMin} min`, unit: "avg" },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-lg p-3 text-center"
              style={{ background: "rgba(20,30,58,0.5)", border: "1px solid #1a2640" }}
            >
              <div className="text-[10px] font-mono mb-1" style={{ color: "#4a6080" }}>
                {m.label}
              </div>
              <div className="text-lg font-mono font-black text-white">{m.value}</div>
              {m.unit && (
                <div className="text-[9px]" style={{ color: "#2a3a55" }}>{m.unit}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
