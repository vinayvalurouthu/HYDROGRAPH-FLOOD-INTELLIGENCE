import { useState } from "react";
import { rescueTeams, sosIncidents } from "../mockData";
import type { RescueTeam } from "../mockData";
import { MapPin, Clock, Navigation, AlertTriangle, CheckCircle, Shield, Truck } from "lucide-react";

const statusConfig = {
  AVAILABLE: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "AVAILABLE" },
  EN_ROUTE: { color: "#06b6d4", bg: "rgba(6,182,212,0.1)", label: "EN ROUTE" },
  ON_SCENE: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "ON SCENE" },
  RETURNING: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", label: "RETURNING" },
};

export default function RescueView() {
  const [selected, setSelected] = useState<RescueTeam>(rescueTeams[0]);
  const [routeCompromised, setRouteCompromised] = useState(false);

  const assignedSOS = selected.assignedSOS
    ? sosIncidents.find((s) => s.id === selected.assignedSOS)
    : null;

  return (
    <div className="h-full flex overflow-hidden">
      {/* Team list */}
      <div
        className="w-72 flex-shrink-0 border-r overflow-y-auto"
        style={{ borderColor: "#1a2640" }}
      >
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #1a2640" }}>
          <h2 className="text-sm font-bold text-white">RESCUE TEAMS</h2>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} />
              <span className="text-[10px] font-mono" style={{ color: "#4a6080" }}>
                {rescueTeams.filter((t) => t.status === "AVAILABLE").length} available
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full animate-blink" style={{ background: "#06b6d4" }} />
              <span className="text-[10px] font-mono" style={{ color: "#4a6080" }}>
                {rescueTeams.filter((t) => t.status === "EN_ROUTE").length} en route
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 space-y-2">
          {rescueTeams.map((team) => {
            const cfg = statusConfig[team.status];
            const isSelected = selected.id === team.id;
            return (
              <button
                key={team.id}
                onClick={() => setSelected(team)}
                className="w-full text-left rounded-xl p-3 transition-all"
                style={{
                  background: isSelected ? cfg.bg : "rgba(12,19,34,0.5)",
                  border: `1px solid ${isSelected ? cfg.color + "50" : "#1a2640"}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.color}40` }}
                    >
                      <Truck size={12} style={{ color: cfg.color }} />
                    </div>
                    <span className="text-xs font-mono font-bold text-white">{team.name}</span>
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
                {team.status === "EN_ROUTE" && (
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

      {/* Detail */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Route compromised warning */}
        {routeCompromised && selected.status === "EN_ROUTE" && (
          <div
            className="rounded-xl p-4 flex items-start gap-3 animate-slide-up animate-alert-critical"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.4)" }}
          >
            <AlertTriangle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />
            <div className="flex-1">
              <div className="text-sm font-bold text-white">CURRENT ROUTE COMPROMISED</div>
              <div className="text-xs mt-0.5" style={{ color: "#fca5a5" }}>
                Road R-102 predicted severe flooding in 8 min. Alternative safe route available.
              </div>
            </div>
            <button
              onClick={() => setRouteCompromised(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
              style={{ background: "#06b6d4" }}
            >
              REROUTE
            </button>
          </div>
        )}

        {/* Team header */}
        <div
          className="rounded-xl p-4 animate-slide-up"
          style={{
            background: statusConfig[selected.status].bg,
            border: `1px solid ${statusConfig[selected.status].color}50`,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-mono font-black text-white">{selected.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-sm font-mono font-bold px-3 py-1 rounded-full"
                  style={{ background: statusConfig[selected.status].color, color: "white" }}
                >
                  {statusConfig[selected.status].label}
                </span>
                <span className="text-xs" style={{ color: "#8da0b8" }}>
                  {selected.vehicle}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono" style={{ color: "#4a6080" }}>CAPACITY</div>
              <div className="text-3xl font-mono font-black" style={{ color: statusConfig[selected.status].color }}>
                {selected.capacity}
              </div>
              <div className="text-[10px]" style={{ color: "#4a6080" }}>persons</div>
            </div>
          </div>

          {selected.status === "EN_ROUTE" && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { label: "Distance", value: `${selected.distanceKm} km`, icon: MapPin },
                { label: "ETA", value: `${selected.etaMin} min`, icon: Clock },
                { label: "Route Safety", value: selected.routeSafety, icon: Shield },
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
                            ? selected.routeSafety === "SAFE"
                              ? "#10b981"
                              : selected.routeSafety === "HIGH"
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
        </div>

        {/* Assigned SOS */}
        {assignedSOS && (
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <h3 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#fca5a5" }}>
              Assigned Incident
            </h3>
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-lg font-mono font-black text-white">
                  {assignedSOS.id}
                </span>
                <div className="text-xs mt-0.5" style={{ color: "#4a6080" }}>
                  {assignedSOS.location}
                </div>
              </div>
              <span
                className="text-sm font-mono font-bold px-2 py-1 rounded"
                style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5" }}
              >
                {assignedSOS.priority}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="flex gap-1">
                <span style={{ color: "#4a6080" }}>People:</span>
                <span className="font-mono text-white">{assignedSOS.people}</span>
              </div>
              <div className="flex gap-1">
                <span style={{ color: "#4a6080" }}>Medical:</span>
                <span
                  className="font-mono"
                  style={{ color: assignedSOS.medical ? "#fca5a5" : "#4a6080" }}
                >
                  {assignedSOS.medical ? "YES" : "No"}
                </span>
              </div>
              <div className="flex gap-1">
                <span style={{ color: "#4a6080" }}>Water:</span>
                <span className="font-mono text-white">~{assignedSOS.waterDepthM}m</span>
              </div>
            </div>
          </div>
        )}

        {/* Route map */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid #1a2640" }}
        >
          <div
            className="px-4 py-2.5 flex items-center justify-between"
            style={{ borderBottom: "1px solid #1a2640", background: "rgba(12,19,34,0.6)" }}
          >
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "#4a6080" }}>
              Live Route
            </span>
            <button
              onClick={() => setRouteCompromised(true)}
              className="text-[10px] font-mono px-2 py-1 rounded hover:bg-white/5 transition-colors"
              style={{ color: "#4a6080", border: "1px solid #1a2640" }}
            >
              SIM: ROUTE ALERT
            </button>
          </div>
          <div className="relative h-44 map-grid" style={{ background: "#07111e" }}>
            <svg viewBox="0 0 500 176" width="100%" height="100%">
              {/* Map base */}
              <line x1="0" y1="88" x2="500" y2="88" stroke="#1e3050" strokeWidth="2" />
              <line x1="0" y1="44" x2="500" y2="44" stroke="#1e3050" strokeWidth="1.5" />
              <line x1="0" y1="132" x2="500" y2="132" stroke="#1e3050" strokeWidth="1.5" />
              <line x1="100" y1="0" x2="100" y2="176" stroke="#1e3050" strokeWidth="1.5" />
              <line x1="250" y1="0" x2="250" y2="176" stroke="#1e3050" strokeWidth="1.5" />
              <line x1="380" y1="0" x2="380" y2="176" stroke="#1e3050" strokeWidth="1.5" />

              {/* Flood zone */}
              <rect x="200" y="60" width="200" height="80" fill="rgba(239,68,68,0.25)" rx="4" />

              {/* Safe route */}
              <path
                d="M 80 130 L 100 88 L 250 44 L 380 88 L 430 90"
                fill="none"
                stroke="#14b8a6"
                strokeWidth="3"
                strokeDasharray="8 4"
                strokeLinecap="round"
              />

              {/* Team marker */}
              <circle cx="80" cy="130" r="10" fill="rgba(20,184,166,0.3)" stroke="#14b8a6" strokeWidth="2" />
              <text x="80" y="134" textAnchor="middle" fill="#14b8a6" fontSize="8" fontFamily="JetBrains Mono" fontWeight="bold">
                R
              </text>
              <text x="80" y="148" textAnchor="middle" fill="#5eead4" fontSize="8" fontFamily="JetBrains Mono">
                {selected.id}
              </text>

              {/* SOS marker */}
              {assignedSOS && (
                <g>
                  <circle cx="430" cy="90" r="10" fill="rgba(239,68,68,0.3)" stroke="#ef4444" strokeWidth="2" className="animate-flood-pulse" />
                  <text x="430" y="94" textAnchor="middle" fill="#ef4444" fontSize="10" fontFamily="sans-serif" fontWeight="bold">!</text>
                  <text x="430" y="108" textAnchor="middle" fill="#fca5a5" fontSize="8" fontFamily="JetBrains Mono">{assignedSOS.id}</text>
                </g>
              )}

              {/* ETA label on route */}
              {selected.status === "EN_ROUTE" && (
                <g>
                  <rect x="200" y="24" width="60" height="18" fill="rgba(6,182,212,0.15)" rx="4" />
                  <text x="230" y="36" textAnchor="middle" fill="#22d3ee" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                    ETA {selected.etaMin}m
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Status workflow */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
        >
          <h3 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#4a6080" }}>
            Rescue Workflow
          </h3>
          <div className="flex items-center gap-0">
            {["RECEIVED", "VERIFIED", "ASSIGNED", "EN ROUTE", "RESCUED", "CLOSED"].map((s, i, arr) => {
              const statuses = ["RECEIVED", "VERIFIED", "ASSIGNED", "EN_ROUTE", "RESCUED", "CLOSED"];
              const currentIdx = statuses.indexOf(
                selected.status === "EN_ROUTE" && assignedSOS
                  ? assignedSOS.status
                  : "ASSIGNED"
              );
              const isDone = i <= currentIdx;
              return (
                <div key={s} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{
                        background: isDone ? "#06b6d4" : "#1a2640",
                        border: isDone ? "none" : "1px solid #1a2640",
                      }}
                    >
                      {isDone ? (
                        <CheckCircle size={12} style={{ color: "white" }} />
                      ) : (
                        <div className="w-2 h-2 rounded-full" style={{ background: "#2a3a55" }} />
                      )}
                    </div>
                    <span
                      className="text-[8px] font-mono mt-1 whitespace-nowrap"
                      style={{ color: isDone ? "#22d3ee" : "#2a3a55" }}
                    >
                      {s}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      className="flex-1 h-px mx-1"
                      style={{
                        background: isDone && i < currentIdx ? "#06b6d4" : "#1a2640",
                        minWidth: 16,
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
