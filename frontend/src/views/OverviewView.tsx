import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  AlertTriangle,
  Droplets,
  Navigation,
  Clock,
  Users,
  TrendingDown,
  TrendingUp,
  Shield,
  Zap,
  ChevronRight,
} from "lucide-react";
import {
  kpiData,
  roads,
  rainfallData,
  roadForecast,
  analyticsData,
  alerts,
  sosIncidents,
  shelters,
} from "../mockData";

interface Props {
  onNavigate: (view: string, roadId?: string) => void;
}

function KPICard({
  label,
  value,
  unit,
  sub,
  trend,
  color,
  icon: Icon,
  chart,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub: string;
  trend?: "up" | "down" | "neutral";
  color: "red" | "amber" | "teal" | "cyan" | "green" | "blue";
  icon: React.ElementType;
  chart?: React.ReactNode;
}) {
  const colorMap = {
    red: {
      accent: "#ef4444",
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.25)",
      text: "#fca5a5",
    },
    amber: {
      accent: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.25)",
      text: "#fde68a",
    },
    teal: {
      accent: "#14b8a6",
      bg: "rgba(20,184,166,0.08)",
      border: "rgba(20,184,166,0.25)",
      text: "#5eead4",
    },
    cyan: {
      accent: "#06b6d4",
      bg: "rgba(6,182,212,0.08)",
      border: "rgba(6,182,212,0.25)",
      text: "#67e8f9",
    },
    green: {
      accent: "#10b981",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.25)",
      text: "#6ee7b7",
    },
    blue: {
      accent: "#3b82f6",
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.25)",
      text: "#93c5fd",
    },
  };
  const c = colorMap[color];

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2 animate-slide-up"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        minWidth: 0,
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${c.accent}20` }}
        >
          <Icon size={16} style={{ color: c.accent }} />
        </div>
        <span
          className="text-[10px] font-mono uppercase tracking-widest"
          style={{ color: c.text }}
        >
          {label}
        </span>
      </div>

      <div className="flex items-end gap-1">
        <span
          className="data-value leading-none"
          style={{ fontSize: 28, color: "#f0f4ff" }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs mb-1" style={{ color: "#8da0b8" }}>
            {unit}
          </span>
        )}
      </div>

      {chart && <div className="h-10 w-full">{chart}</div>}

      <div className="flex items-center gap-1 mt-auto">
        {trend === "down" && <TrendingDown size={12} className="text-green-400" />}
        {trend === "up" && <TrendingUp size={12} className="text-red-400" />}
        <span className="text-[11px]" style={{ color: "#6b7fa0" }}>
          {sub}
        </span>
      </div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, string> = {
    SEVERE: "risk-severe",
    HIGH: "risk-high",
    MODERATE: "risk-moderate",
    LOW: "risk-low",
  };
  const bgMap: Record<string, string> = {
    SEVERE: "bg-risk-severe border",
    HIGH: "bg-risk-high border",
    MODERATE: "bg-risk-moderate border",
    LOW: "bg-risk-low border",
  };
  return (
    <span
      className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${bgMap[risk]} ${map[risk]}`}
    >
      {risk}
    </span>
  );
}

export default function OverviewView({ onNavigate }: Props) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((p) => p + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const urgentAlerts = alerts.filter((a) => !a.read);
  const criticalRoads = roads.filter((r) => r.risk === "SEVERE" || r.risk === "HIGH");

  const miniRainData = rainfallData.slice(-5);

  return (
    <div className="h-full overflow-y-auto px-6 py-5 space-y-6">
      {/* KPI Row */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono uppercase tracking-widest" style={{ color: "#4a6080" }}>
            Live Situational Awareness
          </h2>
          <div className="flex items-center gap-2">
            <span
              className="animate-blink w-2 h-2 rounded-full"
              style={{ background: "#10b981" }}
            />
            <span className="text-xs font-mono" style={{ color: "#4a6080" }}>
              LIVE — 14:32:08
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
          <KPICard
            label="Flood Risk"
            value="HIGH"
            sub="↑ Elevated 2h ago"
            trend="up"
            color="red"
            icon={AlertTriangle}
          />
          <KPICard
            label="Critical Roads"
            value={kpiData.criticalRoads}
            sub="↑ 3 since last hour"
            trend="up"
            color="amber"
            icon={Navigation}
            chart={
              <ResponsiveContainer width="100%" height={40}>
                <BarChart data={[{v:8},{v:9},{v:10},{v:12}]} margin={{top:0,bottom:0,left:0,right:0}}>
                  <Bar dataKey="v" fill="rgba(245,158,11,0.5)" radius={2} />
                </BarChart>
              </ResponsiveContainer>
            }
          />
          <KPICard
            label="SOS Incidents"
            value={kpiData.sosIncidents}
            sub="4 unassigned now"
            trend="up"
            color="red"
            icon={Zap}
          />
          <KPICard
            label="Peak Depth"
            value={kpiData.peakDepthCm}
            unit="cm"
            sub="At Canal Road"
            trend="up"
            color="blue"
            icon={Droplets}
            chart={
              <ResponsiveContainer width="100%" height={40}>
                <AreaChart data={roadForecast.slice(0, 5)} margin={{top:0,bottom:0,left:0,right:0}}>
                  <Area
                    type="monotone"
                    dataKey="depth"
                    stroke="#3b82f6"
                    fill="rgba(59,130,246,0.2)"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            }
          />
          <KPICard
            label="Time to Critical"
            value={kpiData.timeToCriticalMin}
            unit="min"
            sub="↓ 8 min since update"
            trend="down"
            color="amber"
            icon={Clock}
          />
          <KPICard
            label="Rescue Teams"
            value={kpiData.activeRescueTeams}
            sub="3 available now"
            color="teal"
            icon={Users}
          />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* 24-Hour Hydrograph AI Predictive Rise & Discharge Chart */}
        <div
          className="col-span-2 rounded-xl p-4"
          style={{
            background: "rgba(12,19,34,0.85)",
            border: "1px solid #1a2640",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                24-HOUR HYDROGRAPH AI PREDICTIVE RISE & DISCHARGE
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  AI CONFIDENCE 94%
                </span>
              </h3>
              <p className="text-xs mt-0.5 text-slate-400">
                Ganges-Sone Confluence water level elevation vs. dam spillway discharge ($m^3/s$)
              </p>
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <span className="text-slate-400">TIMELINE:</span>
              {["NOW", "+3H", "+6H", "+12H", "+24H"].map((step, idx) => (
                <button
                  key={step}
                  className={`px-2 py-0.5 rounded border transition-all ${
                    idx === 1
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  {step}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={210}>
            <AreaChart
              data={[
                { time: "00:00", levelM: 2.8, discharge: 1200, danger: 4.5 },
                { time: "04:00", levelM: 3.1, discharge: 1450, danger: 4.5 },
                { time: "08:00", levelM: 3.6, discharge: 1800, danger: 4.5 },
                { time: "12:00 (NOW)", levelM: 4.1, discharge: 2400, danger: 4.5 },
                { time: "16:00 (+4H)", levelM: 4.8, discharge: 3100, danger: 4.5 },
                { time: "20:00 (+8H)", levelM: 5.2, discharge: 3800, danger: 4.5 },
                { time: "00:00 (+12H)", levelM: 4.6, discharge: 2900, danger: 4.5 },
                { time: "04:00 (+16H)", levelM: 3.9, discharge: 2100, danger: 4.5 },
              ]}
              margin={{ top: 10, right: 10, bottom: 0, left: -10 }}
            >
              <defs>
                <linearGradient id="hydroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fill: "#4a6080", fontSize: 10, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#4a6080", fontSize: 10, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
                unit="m"
              />
              <Tooltip
                contentStyle={{
                  background: "#0c1322",
                  border: "1px solid #1a2640",
                  borderRadius: 8,
                  color: "#f0f4ff",
                  fontFamily: "JetBrains Mono",
                  fontSize: 11,
                }}
                labelStyle={{ color: "#67e8f9" }}
              />
              <ReferenceLine
                y={4.5}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: "SECTOR DANGER LEVEL (4.5m)",
                  fill: "#ef4444",
                  fontSize: 9,
                  fontFamily: "JetBrains Mono",
                  fontWeight: "bold",
                }}
              />
              <Area
                type="monotone"
                dataKey="levelM"
                name="Water Level (m)"
                stroke="#ef4444"
                strokeWidth={2.5}
                fill="url(#hydroGrad)"
                dot={{ fill: "#ef4444", r: 4 }}
                activeDot={{ r: 6, fill: "#38bdf8" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Rainfall panel */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
        >
          <h3 className="text-sm font-semibold text-white mb-1">Rainfall Intelligence</h3>
          <div className="space-y-2 mb-3">
            {[
              { label: "Current", value: "76 mm/hr", color: "#f97316" },
              { label: "+15 min", value: "82 mm/hr", color: "#ef4444" },
              { label: "+60 min", value: "91 mm/hr", color: "#dc2626" },
              { label: "Accumulation", value: "142 mm", color: "#60a5fa" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: "#4a6080" }}>
                  {row.label}
                </span>
                <span
                  className="text-sm font-mono font-bold"
                  style={{ color: row.color }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={miniRainData} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
              <Bar dataKey="mm" fill="rgba(6,182,212,0.5)" radius={[2, 2, 0, 0]} />
              <XAxis
                dataKey="time"
                tick={{ fill: "#4a6080", fontSize: 9, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
              />
            </BarChart>
          </ResponsiveContainer>
          <div
            className="mt-2 rounded-lg px-3 py-2 flex items-center justify-between"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <span className="text-[10px] font-mono" style={{ color: "#f87171" }}>
              STORM MOVEMENT
            </span>
            <span className="text-xs font-bold text-white">→ NE · EXTREME</span>
          </div>
        </div>
      </div>

      {/* Bottom grid: hotspots + alerts + SOS queue */}
      <div className="grid grid-cols-3 gap-4">
        {/* Top hotspots */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Top Hotspots</h3>
            <button
              onClick={() => onNavigate("hotspots")}
              className="text-[10px] font-mono flex items-center gap-1 hover:text-cyan-400 transition-colors"
              style={{ color: "#4a6080" }}
            >
              VIEW ALL <ChevronRight size={10} />
            </button>
          </div>
          <div className="space-y-2">
            {criticalRoads.slice(0, 4).map((road, i) => (
              <button
                key={road.id}
                onClick={() => onNavigate("map", road.id)}
                className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-white/5 transition-colors text-left"
              >
                <span
                  className="text-xs font-mono font-bold w-5 text-right flex-shrink-0"
                  style={{ color: "#2a3a55" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{road.id}</div>
                  <div
                    className="text-[10px] font-mono mt-0.5"
                    style={{ color: "#4a6080" }}
                  >
                    {road.depthCm} cm · {road.timeToFloodMin} min
                  </div>
                </div>
                <RiskBadge risk={road.risk} />
              </button>
            ))}
          </div>
        </div>

        {/* Live alerts */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Live Alerts</h3>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded"
              style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}
            >
              {urgentAlerts.length} UNREAD
            </span>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 4).map((a) => (
              <div
                key={a.id}
                className="rounded-lg p-2 flex gap-2"
                style={{
                  background:
                    a.type === "CRITICAL"
                      ? "rgba(239,68,68,0.06)"
                      : a.type === "WARNING"
                        ? "rgba(245,158,11,0.06)"
                        : "rgba(59,130,246,0.06)",
                  border: `1px solid ${
                    a.type === "CRITICAL"
                      ? "rgba(239,68,68,0.2)"
                      : a.type === "WARNING"
                        ? "rgba(245,158,11,0.2)"
                        : "rgba(59,130,246,0.2)"
                  }`,
                  opacity: a.read ? 0.6 : 1,
                }}
              >
                <div
                  className="w-1 rounded-full flex-shrink-0 mt-0.5"
                  style={{
                    background:
                      a.type === "CRITICAL"
                        ? "#ef4444"
                        : a.type === "WARNING"
                          ? "#f59e0b"
                          : "#3b82f6",
                    minHeight: 32,
                  }}
                />
                <div>
                  <div className="text-[11px] font-medium text-white leading-tight">{a.title}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "#4a6080" }}>
                    {a.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SOS queue */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">SOS Queue</h3>
            <button
              onClick={() => onNavigate("sos")}
              className="text-[10px] font-mono flex items-center gap-1 hover:text-cyan-400 transition-colors"
              style={{ color: "#4a6080" }}
            >
              MANAGE <ChevronRight size={10} />
            </button>
          </div>
          <div className="space-y-2">
            {sosIncidents.slice(0, 3).map((s) => (
              <button
                key={s.id}
                onClick={() => onNavigate("sos")}
                className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-white/5 transition-colors text-left"
                style={{
                  border:
                    s.priority === "CRITICAL"
                      ? "1px solid rgba(239,68,68,0.25)"
                      : "1px solid rgba(26,38,64,0.5)",
                  background:
                    s.priority === "CRITICAL" ? "rgba(239,68,68,0.05)" : "transparent",
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold"
                  style={{
                    background:
                      s.priority === "CRITICAL"
                        ? "#ef4444"
                        : s.priority === "HIGH"
                          ? "#f97316"
                          : "#f59e0b",
                    color: "white",
                  }}
                >
                  {s.priority === "CRITICAL" ? "!" : s.priority === "HIGH" ? "H" : "M"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-medium text-white">{s.id}</div>
                  <div className="text-[10px] truncate" style={{ color: "#4a6080" }}>
                    {s.people}P · {s.location.split(",")[0]}
                  </div>
                </div>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{
                    background:
                      s.status === "EN_ROUTE"
                        ? "rgba(6,182,212,0.15)"
                        : s.status === "RECEIVED"
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(245,158,11,0.15)",
                    color:
                      s.status === "EN_ROUTE"
                        ? "#22d3ee"
                        : s.status === "RECEIVED"
                          ? "#fca5a5"
                          : "#fde68a",
                  }}
                >
                  {s.status.replace("_", " ")}
                </span>
              </button>
            ))}
          </div>

          <div
            className="mt-3 rounded-lg p-2 flex items-center justify-between"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <span className="text-[10px]" style={{ color: "#6ee7b7" }}>
              <Shield size={10} className="inline mr-1" />3 teams available
            </span>
            <button
              onClick={() => onNavigate("rescue")}
              className="text-[10px] font-mono font-bold flex items-center gap-1 hover:text-teal-300 transition-colors"
              style={{ color: "#14b8a6" }}
            >
              DISPATCH <ChevronRight size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics strip */}
      <div
        className="rounded-xl p-4"
        style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
      >
        <h3 className="text-sm font-semibold text-white mb-3">Flood Progress — Today</h3>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart
            data={analyticsData.hourlyFlood}
            margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
          >
            <defs>
              <linearGradient id="roadsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
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
              contentStyle={{
                background: "#0c1322",
                border: "1px solid #1a2640",
                borderRadius: 8,
                color: "#f0f4ff",
                fontFamily: "JetBrains Mono",
                fontSize: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey="depth"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#roadsGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
