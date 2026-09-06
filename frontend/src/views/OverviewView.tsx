import { useState, useEffect, useMemo } from "react";
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
  MapPin,
} from "lucide-react";
import {
  kpiData as fallbackKpiData,
  roads as fallbackRoads,
  rainfallData as fallbackRainfallData,
  alerts as fallbackAlerts,
  sosIncidents as fallbackSOSIncidents,
  shelters as fallbackShelters,
} from "../mockData";
import { PRESET_CITIES, generatePresetCityData } from "../services/cityDataGenerator";
import type { CityPreset, CityFloodDataset } from "../services/cityDataGenerator";

interface Props {
  onNavigate: (view: string, roadId?: string) => void;
  activeCity?: CityPreset;
  cityDataset?: CityFloodDataset | null;
  onCityChange?: (city: CityPreset) => void;
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
          className="data-value leading-none font-bold"
          style={{ fontSize: 28, color: "#f0f4ff" }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs mb-1 font-mono" style={{ color: "#8da0b8" }}>
            {unit}
          </span>
        )}
      </div>

      {chart && <div className="h-10 w-full">{chart}</div>}

      <div className="flex items-center gap-1 mt-auto">
        {trend === "down" && <TrendingDown size={12} className="text-green-400" />}
        {trend === "up" && <TrendingUp size={12} className="text-red-400" />}
        <span className="text-[11px] truncate" style={{ color: "#6b7fa0" }}>
          {sub}
        </span>
      </div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, string> = {
    SEVERE: "risk-severe text-red-400 border-red-500/40 bg-red-500/10",
    HIGH: "risk-high text-amber-400 border-amber-500/40 bg-amber-500/10",
    MODERATE: "risk-moderate text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
    LOW: "risk-low text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  };
  return (
    <span
      className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase border font-bold ${
        map[risk] || "text-slate-400 border-slate-700 bg-slate-800"
      }`}
    >
      {risk}
    </span>
  );
}

export default function OverviewView({
  onNavigate,
  activeCity,
  cityDataset,
  onCityChange,
}: Props) {
  // 1. Resolve Active City & Dataset
  const currentCity = activeCity || PRESET_CITIES[0];
  const dataset = useMemo(() => {
    if (cityDataset && cityDataset.city.id === currentCity.id) {
      return cityDataset;
    }
    return generatePresetCityData(currentCity);
  }, [cityDataset, currentCity]);

  // 2. Real-time Wall Clock
  const [liveTime, setLiveTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // 3. Interactive Hydrograph Timeline Filter
  const [timelineStep, setTimelineStep] = useState<string>("+3H");

  // 4. Dynamic Telemetry Data Sourced from Current City
  const currentRoads = dataset.roads && dataset.roads.length > 0 ? dataset.roads : fallbackRoads;
  const currentSOS = dataset.sosIncidents && dataset.sosIncidents.length > 0 ? dataset.sosIncidents : fallbackSOSIncidents;
  const currentShelters = dataset.shelters && dataset.shelters.length > 0 ? dataset.shelters : fallbackShelters;

  // 5. Dynamic Calculations
  const criticalRoads = useMemo(() => {
    return currentRoads.filter((r) => r.risk === "SEVERE" || r.risk === "HIGH" || r.closed);
  }, [currentRoads]);

  const criticalRoadsCount = criticalRoads.length;

  const sortedRoadsByDepth = useMemo(() => {
    return [...currentRoads].sort((a, b) => (b.peakDepthCm || b.depthCm) - (a.peakDepthCm || a.depthCm));
  }, [currentRoads]);

  const peakRoad = sortedRoadsByDepth[0] || currentRoads[0];
  const peakDepthCm = peakRoad ? (peakRoad.peakDepthCm || peakRoad.depthCm) : 42;
  const peakLocation = peakRoad
    ? `At ${peakRoad.name.replace(/Sector|Corridor|Road|Junction/gi, "").trim()} Rd`
    : "At Canal Rd";

  // Overall flood risk level
  const overallRisk =
    peakDepthCm >= 55 || criticalRoadsCount >= 7
      ? "SEVERE"
      : peakDepthCm >= 32 || criticalRoadsCount >= 3
      ? "HIGH"
      : "MODERATE";

  // Time to critical inundation
  const timeToCriticalMin = Math.min(...currentRoads.map((r) => r.timeToFloodMin || 25));

  // SOS triage metrics
  const totalSOS = currentSOS.length;
  const unassignedSOS =
    currentSOS.filter((s) => s.status === "RECEIVED" || s.status === "UNASSIGNED").length ||
    Math.max(1, Math.floor(totalSOS * 0.35));

  // Rescue teams availability
  const activeRescueTeams = Math.max(6, Math.min(18, Math.round(totalSOS * 0.7 + criticalRoadsCount * 0.45)));
  const availableRescueTeams = Math.max(2, Math.floor(activeRescueTeams * 0.35));

  // Rainfall intelligence metrics
  const baseRainfall = currentCity.rainfallMmHr || 76;
  const rain15 = Math.round(baseRainfall * 1.08);
  const rain60 = Math.round(baseRainfall * 1.2);
  const rainAccum = Math.round(baseRainfall * 1.85);

  const miniRainData = useMemo(() => {
    return [
      { time: "NOW", mm: baseRainfall },
      { time: "+15m", mm: rain15 },
      { time: "+30m", mm: Math.round(baseRainfall * 1.13) },
      { time: "+45m", mm: Math.round(baseRainfall * 1.17) },
      { time: "+60m", mm: rain60 },
    ];
  }, [baseRainfall, rain15, rain60]);

  const stormMovement =
    currentCity.regionType.toLowerCase().includes("coastal") ||
    currentCity.regionType.toLowerCase().includes("estuary")
      ? "→ SW · COASTAL SURGE"
      : currentCity.id === "guwahati"
      ? "→ NE · MONSOONAL TROUGH"
      : "→ NE · EXTREME CONVECTIVE";

  // 6. Dynamic Hydrograph Data
  const dangerLevelM =
    currentCity.id === "mumbai"
      ? 3.8
      : currentCity.id === "guwahati"
      ? 6.2
      : currentCity.id === "chennai"
      ? 4.2
      : 4.5;

  const baseElevationM = +(dangerLevelM * 0.7 + (peakDepthCm / 100) * 1.2).toFixed(1);

  const hydrographData = useMemo(() => {
    const mult =
      timelineStep === "NOW"
        ? 0.92
        : timelineStep === "+3H"
        ? 1.0
        : timelineStep === "+6H"
        ? 1.08
        : timelineStep === "+12H"
        ? 1.15
        : 1.22;

    const baseQ = baseRainfall * 18;
    return [
      { time: "00:00", levelM: +(baseElevationM * 0.68).toFixed(1), discharge: Math.round(baseQ * 0.65), danger: dangerLevelM },
      { time: "04:00", levelM: +(baseElevationM * 0.75).toFixed(1), discharge: Math.round(baseQ * 0.8), danger: dangerLevelM },
      { time: "08:00", levelM: +(baseElevationM * 0.87).toFixed(1), discharge: Math.round(baseQ * 1.1), danger: dangerLevelM },
      { time: "12:00 (NOW)", levelM: +(baseElevationM * mult).toFixed(1), discharge: Math.round(baseQ * 1.45 * mult), danger: dangerLevelM },
      { time: "16:00 (+4H)", levelM: +(baseElevationM * 1.17 * mult).toFixed(1), discharge: Math.round(baseQ * 1.9 * mult), danger: dangerLevelM },
      { time: "20:00 (+8H)", levelM: +(baseElevationM * 1.27 * mult).toFixed(1), discharge: Math.round(baseQ * 2.3 * mult), danger: dangerLevelM },
      { time: "00:00 (+12H)", levelM: +(baseElevationM * 1.12).toFixed(1), discharge: Math.round(baseQ * 1.7), danger: dangerLevelM },
      { time: "04:00 (+16H)", levelM: +(baseElevationM * 0.94).toFixed(1), discharge: Math.round(baseQ * 1.25), danger: dangerLevelM },
    ];
  }, [baseElevationM, baseRainfall, dangerLevelM, timelineStep]);

  // 7. Dynamic Hotspots, Alerts & SOS
  const displayHotspots = criticalRoads.length >= 4 ? criticalRoads.slice(0, 4) : sortedRoadsByDepth.slice(0, 4);

  const cityAlerts = useMemo(() => {
    const r1 = displayHotspots[0];
    const r2 = displayHotspots[1] || displayHotspots[0];
    return [
      {
        id: `alt-${currentCity.id}-1`,
        type: "CRITICAL",
        title: `${r1 ? r1.name : "Primary Corridor"} — Severe flood imminent`,
        time: "Just now",
        read: false,
      },
      {
        id: `alt-${currentCity.id}-2`,
        type: "WARNING",
        title: `${currentCity.waterBody.split("&")[0].trim()} Surge Warning (${baseRainfall} mm/hr)`,
        time: "5 min ago",
        read: false,
      },
      {
        id: `alt-${currentCity.id}-3`,
        type: "CRITICAL",
        title: `${r2 ? r2.name : "Low-lying corridor"} water level reached ${peakDepthCm} cm`,
        time: "14 min ago",
        read: false,
      },
      {
        id: `alt-${currentCity.id}-4`,
        type: "INFO",
        title: `Pumping stations mobilized across ${currentCity.name}`,
        time: "22 min ago",
        read: true,
      },
    ];
  }, [baseRainfall, currentCity, displayHotspots, peakDepthCm]);

  const urgentAlerts = cityAlerts.filter((a) => !a.read);
  const displaySOS = currentSOS.slice(0, 3);

  // 8. Hourly Flood Progression Curve
  const hourlyFloodData = useMemo(() => {
    return [
      { hour: "00:00", depth: Math.round(peakDepthCm * 0.35) },
      { hour: "03:00", depth: Math.round(peakDepthCm * 0.45) },
      { hour: "06:00", depth: Math.round(peakDepthCm * 0.6) },
      { hour: "09:00", depth: Math.round(peakDepthCm * 0.8) },
      { hour: "12:00", depth: Math.round(peakDepthCm * 0.95) },
      { hour: "15:00", depth: peakDepthCm },
      { hour: "18:00", depth: Math.round(peakDepthCm * 0.88) },
      { hour: "21:00", depth: Math.round(peakDepthCm * 0.7) },
    ];
  }, [peakDepthCm]);

  return (
    <div className="h-full overflow-y-auto px-6 py-5 space-y-6">
      {/* Location Bar & Quick City Switcher */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-1 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">
              Live Situational Awareness
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 font-bold flex items-center gap-1">
              <MapPin size={10} className="text-cyan-400" />
              {currentCity.name.toUpperCase()} COMMAND BASE
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            {currentCity.state} · {currentCity.regionType} · {currentCity.waterBody}
          </div>
        </div>

        {/* Quick City Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-mono text-slate-500 mr-1 flex-shrink-0">ZONE:</span>
          {PRESET_CITIES.map((c) => (
            <button
              key={c.id}
              onClick={() => onCityChange?.(c)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 cursor-pointer ${
                c.id === currentCity.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                  : "bg-slate-900/90 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  c.id === currentCity.id ? "bg-cyan-400 animate-pulse" : "bg-slate-600"
                }`}
              />
              {c.name}
            </button>
          ))}
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="animate-blink w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-mono text-slate-400">
            LIVE — {liveTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
      </div>

      {/* KPI Row (All 6 Cards Dynamically Bound to Selected City) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard
          label="Flood Risk"
          value={overallRisk}
          sub={`Elevated · ${currentCity.name}`}
          trend={overallRisk === "SEVERE" ? "up" : overallRisk === "HIGH" ? "up" : "neutral"}
          color={overallRisk === "SEVERE" ? "red" : overallRisk === "HIGH" ? "amber" : "teal"}
          icon={AlertTriangle}
        />
        <KPICard
          label="Critical Roads"
          value={criticalRoadsCount}
          sub={`↑ ${Math.max(1, Math.round(criticalRoadsCount * 0.25))} since last hour`}
          trend="up"
          color="amber"
          icon={Navigation}
          chart={
            <ResponsiveContainer width="100%" height={40}>
              <BarChart
                data={[
                  { v: Math.max(2, criticalRoadsCount - 3) },
                  { v: Math.max(3, criticalRoadsCount - 2) },
                  { v: Math.max(4, criticalRoadsCount - 1) },
                  { v: criticalRoadsCount },
                ]}
                margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
              >
                <Bar dataKey="v" fill="rgba(245,158,11,0.5)" radius={2} />
              </BarChart>
            </ResponsiveContainer>
          }
        />
        <KPICard
          label="SOS Incidents"
          value={totalSOS}
          sub={`${unassignedSOS} unassigned now`}
          trend="up"
          color="red"
          icon={Zap}
        />
        <KPICard
          label="Peak Depth"
          value={peakDepthCm}
          unit="cm"
          sub={peakLocation}
          trend="up"
          color="blue"
          icon={Droplets}
          chart={
            <ResponsiveContainer width="100%" height={40}>
              <AreaChart
                data={[
                  { d: Math.round(peakDepthCm * 0.4) },
                  { d: Math.round(peakDepthCm * 0.58) },
                  { d: Math.round(peakDepthCm * 0.75) },
                  { d: Math.round(peakDepthCm * 0.88) },
                  { d: peakDepthCm },
                ]}
                margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
              >
                <Area
                  type="monotone"
                  dataKey="d"
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
          value={timeToCriticalMin}
          unit="min"
          sub={`↓ ${Math.max(2, Math.round(timeToCriticalMin * 0.2))} min since update`}
          trend="down"
          color="amber"
          icon={Clock}
        />
        <KPICard
          label="Rescue Teams"
          value={activeRescueTeams}
          sub={`${availableRescueTeams} available now`}
          color="teal"
          icon={Users}
        />
      </div>

      {/* Main Grid: 24-Hour Hydrograph + Rainfall Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 24-Hour Hydrograph AI Predictive Rise & Discharge Chart */}
        <div
          className="lg:col-span-2 rounded-xl p-4 flex flex-col justify-between"
          style={{
            background: "rgba(12,19,34,0.85)",
            border: "1px solid #1a2640",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 flex-wrap">
                24-HOUR HYDROGRAPH AI PREDICTIVE RISE & DISCHARGE
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  AI CONFIDENCE 94%
                </span>
              </h3>
              <p className="text-xs mt-0.5 text-slate-400">
                {currentCity.waterBody} water level elevation vs. discharge (m³/s)
              </p>
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <span className="text-slate-400">TIMELINE:</span>
              {["NOW", "+3H", "+6H", "+12H", "+24H"].map((step) => (
                <button
                  key={step}
                  onClick={() => setTimelineStep(step)}
                  className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                    step === timelineStep
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  {step}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={hydrographData}
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
                domain={[0, Math.ceil(dangerLevelM * 1.5)]}
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
                y={dangerLevelM}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: `SECTOR DANGER LEVEL (${dangerLevelM}m)`,
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

        {/* Rainfall Intelligence Panel */}
        <div
          className="rounded-xl p-4 flex flex-col justify-between"
          style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Rainfall Intelligence</h3>
              <span className="text-[10px] font-mono text-cyan-400">
                {currentCity.name.toUpperCase()}
              </span>
            </div>
            <div className="space-y-2 mb-3">
              {[
                { label: "Current", value: `${baseRainfall} mm/hr`, color: "#f97316" },
                { label: "+15 min", value: `${rain15} mm/hr`, color: "#ef4444" },
                { label: "+60 min", value: `${rain60} mm/hr`, color: "#dc2626" },
                { label: "Accumulation", value: `${rainAccum} mm`, color: "#60a5fa" },
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
          </div>

          <div>
            <ResponsiveContainer width="100%" height={85}>
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
              <span className="text-xs font-bold text-white font-mono">{stormMovement}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Hotspots + Live Alerts + SOS Queue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Hotspots */}
        <div
          className="rounded-xl p-4 flex flex-col justify-between"
          style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Top Hotspots</h3>
              <button
                onClick={() => onNavigate("hotspots")}
                className="text-[10px] font-mono flex items-center gap-1 hover:text-cyan-400 transition-colors cursor-pointer"
                style={{ color: "#4a6080" }}
              >
                VIEW ALL <ChevronRight size={10} />
              </button>
            </div>
            <div className="space-y-2">
              {displayHotspots.map((road, i) => (
                <button
                  key={road.id}
                  onClick={() => onNavigate("map", road.id)}
                  className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-white/5 transition-colors text-left cursor-pointer"
                >
                  <span
                    className="text-xs font-mono font-bold w-5 text-right flex-shrink-0"
                    style={{ color: "#3b4f6e" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{road.name}</div>
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
        </div>

        {/* Live Alerts */}
        <div
          className="rounded-xl p-4 flex flex-col justify-between"
          style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Live Alerts</h3>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}
              >
                {urgentAlerts.length} UNREAD
              </span>
            </div>
            <div className="space-y-2">
              {cityAlerts.slice(0, 4).map((a) => (
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
                    <div className="text-[10px] font-mono mt-0.5" style={{ color: "#4a6080" }}>
                      {a.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SOS Queue */}
        <div
          className="rounded-xl p-4 flex flex-col justify-between"
          style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">SOS Queue</h3>
              <button
                onClick={() => onNavigate("sos")}
                className="text-[10px] font-mono flex items-center gap-1 hover:text-cyan-400 transition-colors cursor-pointer"
                style={{ color: "#4a6080" }}
              >
                MANAGE <ChevronRight size={10} />
              </button>
            </div>
            <div className="space-y-2">
              {displaySOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onNavigate("sos")}
                  className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-white/5 transition-colors text-left cursor-pointer"
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
                    <div className="text-[10px] truncate" style={{ color: "#8da0b8" }}>
                      {s.people}P · {s.location.split(",")[0]}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 font-bold"
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
          </div>

          <div
            className="mt-3 rounded-lg p-2 flex items-center justify-between"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <span className="text-[10px] font-mono" style={{ color: "#6ee7b7" }}>
              <Shield size={10} className="inline mr-1" />
              {availableRescueTeams} teams available
            </span>
            <button
              onClick={() => onNavigate("rescue")}
              className="text-[10px] font-mono font-bold flex items-center gap-1 hover:text-teal-300 transition-colors cursor-pointer"
              style={{ color: "#14b8a6" }}
            >
              DISPATCH <ChevronRight size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Strip: Flood Progress Today */}
      <div
        className="rounded-xl p-4"
        style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">
            Flood Progression — {currentCity.name} Today
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            Peak: <strong className="text-amber-400">{peakDepthCm} cm</strong> ({peakLocation})
          </span>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart
            data={hourlyFloodData}
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
              name="Depth (cm)"
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
