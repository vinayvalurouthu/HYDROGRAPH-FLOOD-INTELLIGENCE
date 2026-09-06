import { useState, useEffect } from "react";
import type { RescueTeam, SOSIncident } from "../mockData";
import {
  MapPin,
  Clock,
  Navigation,
  AlertTriangle,
  CheckCircle,
  Shield,
  Truck,
  Cpu,
  Radio,
  Eye,
  Zap,
  Activity,
  Wifi,
  WifiOff,
  Users,
  RefreshCw,
  X,
  Play,
  RotateCcw,
} from "lucide-react";
import { useDispatch } from "../context/DispatchContext";

const statusConfig = {
  AVAILABLE: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "AVAILABLE" },
  EN_ROUTE: { color: "#06b6d4", bg: "rgba(6,182,212,0.1)", label: "EN ROUTE" },
  ON_SCENE: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "ON SCENE" },
  RETURNING: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", label: "RETURNING" },
};

function getStatusConfig(status?: string) {
  const normalized = (status || "AVAILABLE").toUpperCase() as keyof typeof statusConfig;
  return statusConfig[normalized] || statusConfig.AVAILABLE;
}

export default function RescueView() {
  const { rescueTeams: teams, sosIncidents: incidents, latestDispatchAlert, selectedTeamId, setSelectedTeamId } = useDispatch();
  const [selected, setSelected] = useState<RescueTeam>(teams[0]);
  const [routeCompromised, setRouteCompromised] = useState(false);
  const [showThermalFeed, setShowThermalFeed] = useState(true);
  const [networkMode, setNetworkMode] = useState<"CELLULAR" | "MESH">("CELLULAR");
  const [preemptiveDone, setPreemptiveDone] = useState(false);
  const [fatigueRotated, setFatigueRotated] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTeamId) {
      const teamToSelect = teams.find((t) => t.id === selectedTeamId);
      if (teamToSelect) {
        setSelected(teamToSelect);
      }
    }
  }, [selectedTeamId, teams]);

  const activeSelected = (selectedTeamId ? teams.find((t) => t.id === selectedTeamId) : selected) || selected || teams[0];
  const activeCfg = getStatusConfig(activeSelected?.status);

  const assignedSOS = activeSelected?.assignedSOS
    ? incidents.find((s) => s.id === activeSelected.assignedSOS)
    : incidents[0];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePreemptiveReposition = () => {
    setPreemptiveDone(true);
    triggerToast(`AI Dispatch: ${activeSelected.name} pre-emptively repositioned +2.1km North!`);
  };

  const handleRotateCrew = () => {
    setFatigueRotated(true);
    triggerToast(`Crew rotation requested for ${activeSelected.name}. Standby unit dispatched.`);
  };

  const toggleNetworkMode = () => {
    const nextMode = networkMode === "CELLULAR" ? "MESH" : "CELLULAR";
    setNetworkMode(nextMode);
    triggerToast(
      nextMode === "MESH"
        ? "Network Fallback: Switched to V2X Ad-Hoc Mesh Network!"
        : "Network Restored: Switched to Primary 5G Cellular Connection!"
    );
  };

  // Biometric & fatigue mock metrics
  const fatiguePct = fatigueRotated ? 12 : activeSelected.status === "EN_ROUTE" ? 42 : 24;

  return (
    <div className="h-full flex overflow-hidden relative font-sans select-none">
      {/* Toast notification overlay */}
      {toastMessage && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-white flex items-center gap-2 shadow-2xl animate-slide-down"
          style={{ background: "#06b6d4", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <Zap size={14} className="text-amber-300 animate-pulse" /> {toastMessage}
        </div>
      )}

      {/* ─── LEFT PANEL: FLEET LIST & NETWORK STATUS ─────────────────────────── */}
      <div
        className="w-80 flex-shrink-0 border-r flex flex-col overflow-y-auto"
        style={{ borderColor: "#1a2640" }}
      >
        {/* Header with Mesh Network Fallback Indicator */}
        <div className="px-4 py-3 border-b flex flex-col gap-2" style={{ borderColor: "#1a2640" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">RESCUE TEAMS</h2>
            {/* Mesh Network Fallback Toggle Button */}
            <button
              onClick={toggleNetworkMode}
              className="px-2 py-1 rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer hover:opacity-90"
              style={{
                background: networkMode === "MESH" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
                border: `1px solid ${networkMode === "MESH" ? "rgba(245,158,11,0.4)" : "rgba(16,185,129,0.4)"}`,
                color: networkMode === "MESH" ? "#fde68a" : "#6ee7b7",
              }}
              title="Click to simulate infrastructure network failover"
            >
              {networkMode === "MESH" ? (
                <>
                  <WifiOff size={10} className="text-amber-400 animate-pulse" />
                  MESH (V2X ACTIVE)
                </>
              ) : (
                <>
                  <Wifi size={10} className="text-emerald-400" />
                  CELLULAR 5G
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} />
              <span className="text-[10px] font-mono" style={{ color: "#4a6080" }}>
                {teams.filter((t) => (t.status || "").toUpperCase() === "AVAILABLE").length} available
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full animate-blink" style={{ background: "#06b6d4" }} />
              <span className="text-[10px] font-mono" style={{ color: "#4a6080" }}>
                {teams.filter((t) => (t.status || "").toUpperCase() === "EN_ROUTE").length} en route
              </span>
            </div>
          </div>
        </div>

        {/* Team list */}
        <div className="p-3 space-y-2 flex-1">
          {teams.map((team) => {
            const cfg = getStatusConfig(team.status);
            const isSelected = activeSelected?.id === team.id;
            const isDrainageDispatch =
              team.id.startsWith("RT-") || team.name.includes("Drainage Clearance");
            return (
              <button
                key={team.id}
                onClick={() => {
                  setSelected(team);
                  setSelectedTeamId(team.id);
                }}
                className="w-full text-left rounded-xl p-3 transition-all cursor-pointer"
                style={{
                  background: isSelected
                    ? cfg.bg
                    : isDrainageDispatch
                      ? "rgba(6,182,212,0.08)"
                      : "rgba(12,19,34,0.5)",
                  border: `1px solid ${
                    isSelected
                      ? cfg.color + "50"
                      : isDrainageDispatch
                        ? "rgba(6,182,212,0.4)"
                        : "#1a2640"
                  }`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isDrainageDispatch ? "rgba(6,182,212,0.2)" : cfg.bg,
                        border: `1px solid ${isDrainageDispatch ? "#06b6d4" : cfg.color + "40"}`,
                      }}
                    >
                      <Truck size={12} style={{ color: isDrainageDispatch ? "#06b6d4" : cfg.color }} />
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold text-white block">{team.name}</span>
                      {isDrainageDispatch && (
                        <span className="text-[9px] font-mono font-bold text-cyan-400">
                          NEW DISPATCH
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <div className="text-[10px] ml-9" style={{ color: "#4a6080" }}>
                  {team.vehicle} · Cap: {team.capacity}
                </div>
                {(team.status || "").toUpperCase() === "EN_ROUTE" && (
                  <div className="flex items-center gap-3 mt-1.5 ml-9 text-[10px] font-mono">
                    <span style={{ color: "#22d3ee" }}>ETA {team.etaMin}min</span>
                    <span style={{ color: "#4a6080" }}>{team.distanceKm}km</span>
                    {team.assignedSOS && (
                      <span style={{ color: "#fca5a5" }}>→ {team.assignedSOS}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── CENTER & RIGHT DETAILS PANEL ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 relative">
        {/* Route compromised warning banner */}
        {routeCompromised && (activeSelected?.status || "").toUpperCase() === "EN_ROUTE" && (
          <div
            className="rounded-xl p-4 flex items-start gap-3 animate-slide-up"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.4)" }}
          >
            <AlertTriangle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />
            <div className="flex-1">
              <div className="text-sm font-bold text-white">CURRENT ROUTE COMPROMISED</div>
              <div className="text-xs mt-0.5" style={{ color: "#fca5a5" }}>
                Sudden breach on Road R-102 predicted severe flooding in 8 min. Alternative safe route calculated via North Corridor.
              </div>
            </div>
            <button
              onClick={() => {
                setRouteCompromised(false);
                triggerToast("Route updated! Avoiding flooded breach zone.");
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: "#06b6d4" }}
            >
              REROUTE NOW
            </button>
          </div>
        )}

        {/* ─── TEAM HEADER & BIOMETRIC EXHAUSTION TRACKER ────────────────────── */}
        <div
          className="rounded-xl p-4 animate-slide-up"
          style={{
            background: activeCfg.bg,
            border: `1px solid ${activeCfg.color}50`,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-mono font-black text-white">{activeSelected.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-sm font-mono font-bold px-3 py-1 rounded-full"
                  style={{ background: activeCfg.color, color: "white" }}
                >
                  {activeCfg.label}
                </span>
                <span className="text-xs" style={{ color: "#8da0b8" }}>
                  {activeSelected.vehicle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* UAV Thermal Feed Toggle Button */}
              <button
                onClick={() => setShowThermalFeed(!showThermalFeed)}
                className="px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer hover:bg-white/10"
                style={{
                  background: showThermalFeed ? "rgba(6,182,212,0.2)" : "rgba(15,23,42,0.6)",
                  border: `1px solid ${showThermalFeed ? "#06b6d4" : "#1a2640"}`,
                  color: showThermalFeed ? "#22d3ee" : "#8da0b8",
                }}
              >
                <Eye size={14} className={showThermalFeed ? "text-cyan-400 animate-pulse" : ""} />
                {showThermalFeed ? "UAV FEED ACTIVE" : "TOGGLE UAV FEED"}
              </button>

              <div className="text-right">
                <div className="text-[10px] font-mono" style={{ color: "#4a6080" }}>CAPACITY</div>
                <div className="text-3xl font-mono font-black" style={{ color: activeCfg.color }}>
                  {activeSelected.capacity}
                </div>
                <div className="text-[10px]" style={{ color: "#4a6080" }}>persons</div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          {(activeSelected.status || "").toUpperCase() === "EN_ROUTE" && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { label: "Distance", value: `${activeSelected.distanceKm} km`, icon: MapPin },
                { label: "ETA", value: `${activeSelected.etaMin} min`, icon: Clock },
                { label: "Route Safety", value: activeSelected.routeSafety, icon: Shield },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg p-2 flex items-center gap-2"
                  style={{ background: "rgba(12,19,34,0.5)", border: "1px solid #1a2640" }}
                >
                  <s.icon size={12} style={{ color: "#4a6080" }} />
                  <div>
                    <div className="text-[9px]" style={{ color: "#4a6080" }}>{s.label}</div>
                    <div
                      className="text-xs font-mono font-bold"
                      style={{
                        color:
                          s.label === "Route Safety"
                            ? activeSelected.routeSafety === "SAFE"
                              ? "#10b981"
                              : activeSelected.routeSafety === "HIGH"
                                ? "#f59e0b"
                                : "#ef4444"
                            : "#f0f4ff",
                      }}
                    >
                      {s.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── BIOMETRIC CREW FATIGUE TRACKER ────────────────────────────── */}
          <div className="mt-4 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-mono flex items-center gap-1.5" style={{ color: "#8da0b8" }}>
                <Activity size={12} className="text-cyan-400" />
                Crew Fatigue & Biometric Vitals
              </span>
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-[11px] font-bold"
                  style={{ color: fatiguePct > 60 ? "#ef4444" : fatiguePct > 35 ? "#f59e0b" : "#10b981" }}
                >
                  {fatiguePct}% - {fatiguePct > 60 ? "HIGH EXHAUSTION" : fatiguePct > 35 ? "MODERATE" : "OPTIMAL"}
                </span>
                <button
                  onClick={handleRotateCrew}
                  className="text-[9px] font-mono px-2 py-0.5 rounded border hover:bg-white/10 transition-colors cursor-pointer"
                  style={{ background: "rgba(15,23,42,0.6)", borderColor: "#1a2640", color: "#38bdf8" }}
                >
                  ROTATE CREW
                </button>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(12,19,34,0.8)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${fatiguePct}%`,
                  background:
                    fatiguePct > 60
                      ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                      : "linear-gradient(90deg, #10b981, #06b6d4)",
                }}
              />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2 text-[10px] font-mono" style={{ color: "#4a6080" }}>
              <div>HR: <span className="text-slate-200 font-bold">84 BPM</span></div>
              <div>SpO2: <span className="text-emerald-400 font-bold">99%</span></div>
              <div>Temp: <span className="text-slate-200 font-bold">37.0°C</span></div>
              <div>Shift: <span className="text-slate-200 font-bold">4h 12m</span></div>
            </div>
          </div>
        </div>

        {/* ─── PREDICTIVE AI DISPATCH SUGGESTION ─────────────────────────────── */}
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.25)" }}
        >
          <Cpu size={20} className="text-cyan-400 flex-shrink-0 animate-pulse mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                PREDICTIVE AI DISPATCH RECOMMENDATION
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                AI CONFIDENCE 94%
              </span>
            </div>
            <div className="text-xs text-slate-200 mt-1">
              Flood nowcasting predicts +30m inundation rise near Sector 4 Corridor. Recommend pre-emptive repositioning of {activeSelected.name}.
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <button
                onClick={handlePreemptiveReposition}
                disabled={preemptiveDone}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer hover:opacity-90 disabled:opacity-50"
                style={{ background: preemptiveDone ? "#10b981" : "#06b6d4" }}
              >
                {preemptiveDone ? (
                  <>
                    <CheckCircle size={12} /> REPOSITIONED (+2.1km N)
                  </>
                ) : (
                  <>
                    <Zap size={12} /> REPOSITION PRE-EMPTIVELY
                  </>
                )}
              </button>
              <span className="text-[10px] font-mono text-slate-400">
                Lead Time: +25 mins before peak flood surge
              </span>
            </div>
          </div>
        </div>

        {/* ─── ASSIGNED INCIDENT & PIP UAV THERMAL FEED ────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          {/* Assigned Incident Details */}
          {assignedSOS && (
            <div
              className="rounded-xl p-4 flex flex-col justify-between"
              style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-red-300">
                    Assigned SOS Incident
                  </h3>
                  <span
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                    style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5" }}
                  >
                    {assignedSOS.priority}
                  </span>
                </div>
                <div className="text-xl font-mono font-black text-white">{assignedSOS.id}</div>
                <div className="text-xs mt-0.5 text-slate-400">{assignedSOS.location}</div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-xs font-mono">
                  <div className="rounded p-2 bg-black/40 border border-slate-800">
                    <div className="text-[10px] text-slate-500">PEOPLE</div>
                    <div className="text-sm font-bold text-white">{assignedSOS.people}</div>
                  </div>
                  <div className="rounded p-2 bg-black/40 border border-slate-800">
                    <div className="text-[10px] text-slate-500">MEDICAL</div>
                    <div className={`text-sm font-bold ${assignedSOS.medical ? "text-red-400" : "text-slate-400"}`}>
                      {assignedSOS.medical ? "YES" : "NO"}
                    </div>
                  </div>
                  <div className="rounded p-2 bg-black/40 border border-slate-800">
                    <div className="text-[10px] text-slate-500">WATER</div>
                    <div className="text-sm font-bold text-amber-300">~{assignedSOS.waterDepthM}m</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Picture-in-Picture (PiP) UAV Thermal Feed Component */}
          {showThermalFeed && (
            <div
              className="rounded-xl overflow-hidden relative border animate-slide-up flex flex-col justify-between"
              style={{ background: "#050b14", borderColor: "rgba(6,182,212,0.4)" }}
            >
              {/* Header bar */}
              <div className="px-3 py-1.5 bg-black/80 flex items-center justify-between border-b border-cyan-900/50 text-[10px] font-mono">
                <span className="text-cyan-400 flex items-center gap-1.5">
                  <Radio size={10} className="animate-pulse text-red-500" />
                  DRONE-04 THERMAL IR FEED
                </span>
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> REC
                </span>
              </div>

              {/* Thermal Feed Canvas Visual */}
              <div className="relative h-36 bg-slate-950 overflow-hidden flex items-center justify-center">
                {/* Simulated thermal heat signature blobs */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-950 via-slate-900 to-indigo-950 opacity-90" />
                <div className="absolute top-8 left-16 w-20 h-16 rounded-full bg-orange-600/30 blur-md" />
                <div className="absolute top-12 left-20 w-10 h-10 rounded-full bg-yellow-400/50 blur-sm animate-pulse" />
                <div className="absolute bottom-6 right-20 w-24 h-12 rounded-full bg-red-600/40 blur-md" />

                {/* Target reticle */}
                <div className="absolute border border-cyan-400/60 w-16 h-16 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                  <span className="absolute -bottom-4 text-[8px] font-mono text-cyan-300 font-bold whitespace-nowrap">
                    2 VICTIMS (37.1°C)
                  </span>
                </div>
              </div>

              {/* Telemetry Footer */}
              <div className="px-3 py-1 bg-black/90 flex justify-between text-[9px] font-mono text-slate-400 border-t border-slate-800">
                <span>ALT: 120m</span>
                <span>WIND: 8.2m/s</span>
                <span>BATTERY: 84%</span>
                <span className="text-cyan-400">FLIR BOSON 640</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── HAZARD-AWARE ROUTE MAP (A* Dynamic Pathfinding Canvas) ──────────── */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid #1a2640" }}
        >
          <div
            className="px-4 py-2.5 flex items-center justify-between"
            style={{ borderBottom: "1px solid #1a2640", background: "rgba(12,19,34,0.6)" }}
          >
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "#4a6080" }}>
              HAZARD-AWARE LIVE ROUTE (A* PATHFINDING)
            </span>
            <button
              onClick={() => {
                setRouteCompromised(true);
                triggerToast("Simulated flood breach alert dispatched to route canvas!");
              }}
              className="text-[10px] font-mono px-3 py-1 rounded transition-colors cursor-pointer hover:bg-red-500/20 active:scale-95"
              style={{ color: "#fca5a5", border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.1)" }}
            >
              ⚡ SIM: ROUTE ALERT
            </button>
          </div>
          <div className="relative h-44 map-grid" style={{ background: "#07111e" }}>
            <svg viewBox="0 0 500 176" width="100%" height="100%">
              {/* Map grid lines */}
              <line x1="0" y1="88" x2="500" y2="88" stroke="#1e3050" strokeWidth="2" />
              <line x1="0" y1="44" x2="500" y2="44" stroke="#1e3050" strokeWidth="1.5" />
              <line x1="0" y1="132" x2="500" y2="132" stroke="#1e3050" strokeWidth="1.5" />
              <line x1="100" y1="0" x2="100" y2="176" stroke="#1e3050" strokeWidth="1.5" />
              <line x1="250" y1="0" x2="250" y2="176" stroke="#1e3050" strokeWidth="1.5" />
              <line x1="380" y1="0" x2="380" y2="176" stroke="#1e3050" strokeWidth="1.5" />

              {/* Red Flood Inundation Polygon */}
              <rect x="200" y="60" width="180" height="75" fill="rgba(239,68,68,0.25)" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 2" rx="4" />
              <text x="290" y="100" textAnchor="middle" fill="#fca5a5" fontSize="8" fontFamily="monospace">
                FLOOD INUNDATION ZONE
              </text>

              {/* Safe A* Bypass Route */}
              <path
                d={
                  routeCompromised
                    ? "M 80 130 L 100 30 L 380 30 L 430 90" // Rerouted North Corridor Bypass
                    : "M 80 130 L 100 88 L 250 44 L 380 88 L 430 90" // Original Hazard-Avoidance Bypass
                }
                fill="none"
                stroke={routeCompromised ? "#ef4444" : "#14b8a6"}
                strokeWidth="3"
                strokeDasharray="8 4"
                strokeLinecap="round"
              />

              {/* Team Marker */}
              <circle cx="80" cy="130" r="10" fill="rgba(20,184,166,0.3)" stroke="#14b8a6" strokeWidth="2" />
              <text x="80" y="134" textAnchor="middle" fill="#14b8a6" fontSize="8" fontFamily="JetBrains Mono" fontWeight="bold">
                R
              </text>
              <text x="80" y="148" textAnchor="middle" fill="#5eead4" fontSize="8" fontFamily="JetBrains Mono">
                {activeSelected.id}
              </text>

              {/* SOS Incident Marker */}
              {assignedSOS && (
                <g>
                  <circle cx="430" cy="90" r="10" fill="rgba(239,68,68,0.3)" stroke="#ef4444" strokeWidth="2" className="animate-pulse" />
                  <text x="430" y="94" textAnchor="middle" fill="#ef4444" fontSize="10" fontFamily="sans-serif" fontWeight="bold">!</text>
                  <text x="430" y="108" textAnchor="middle" fill="#fca5a5" fontSize="8" fontFamily="JetBrains Mono">{assignedSOS.id}</text>
                </g>
              )}

              {/* ETA Label Badge */}
              {activeSelected.status === "EN_ROUTE" && (
                <g>
                  <rect x="200" y="16" width="65" height="18" fill="rgba(6,182,212,0.2)" stroke="#06b6d4" strokeWidth="1" rx="4" />
                  <text x="232" y="28" textAnchor="middle" fill="#22d3ee" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                    ETA {activeSelected.etaMin}m
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* ─── LIFECYCLE MISSION STEPPER COMPONENT ────────────────────────────── */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">
              End-to-End Mission Lifecycle Tracker
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">
              STATUS: {(activeSelected.status || "ASSIGNED").replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center justify-between relative px-2">
            {["RECEIVED", "VERIFIED", "ASSIGNED", "EN_ROUTE", "RESCUED", "CLOSED"].map((s, i, arr) => {
              const currentIdx =
                activeSelected.status === "EN_ROUTE"
                  ? 3
                  : activeSelected.status === "ON_SCENE"
                    ? 4
                    : 2;
              const isDone = i <= currentIdx;
              return (
                <div key={s} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer"
                      style={{
                        background: isDone ? "#06b6d4" : "#1a2640",
                        border: isDone ? "2px solid #22d3ee" : "1px solid #1a2640",
                        boxShadow: isDone ? "0 0 10px rgba(6,182,212,0.4)" : "none",
                      }}
                      title={`Step: ${s.replace("_", " ")}`}
                    >
                      {isDone ? (
                        <CheckCircle size={14} className="text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-600" />
                      )}
                    </div>
                    <span
                      className="text-[9px] font-mono font-bold mt-1.5 whitespace-nowrap"
                      style={{ color: isDone ? "#22d3ee" : "#4a6080" }}
                    >
                      {s.replace("_", " ")}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      className="flex-1 h-0.5 mx-2 transition-all"
                      style={{
                        background: i < currentIdx ? "#06b6d4" : "#1a2640",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
