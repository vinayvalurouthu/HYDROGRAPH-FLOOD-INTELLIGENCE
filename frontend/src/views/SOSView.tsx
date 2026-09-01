import { useState } from "react";
import {
  AlertTriangle,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  Phone,
  CheckCircle,
  Circle,
  Loader,
  X,
  Navigation,
} from "lucide-react";
import { sosIncidents, rescueTeams } from "../mockData";
import type { SOSIncident } from "../mockData";

interface Props {
  onAssignTeam: (sosId: string, teamId: string) => void;
}

const priorityConfig = {
  CRITICAL: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.4)", text: "#fca5a5" },
  HIGH: { color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.4)", text: "#fdba74" },
  MODERATE: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", text: "#fde68a" },
};

const statusOrder = ["RECEIVED", "VERIFIED", "ASSIGNED", "EN_ROUTE", "RESCUED", "CLOSED"];

function StatusTracker({ incident }: { incident: SOSIncident }) {
  const statusLabels: Record<string, string> = {
    RECEIVED: "SOS Received",
    VERIFIED: "Location Verified",
    ASSIGNED: "Team Assigned",
    EN_ROUTE: "Team En Route",
    RESCUED: "Citizen Rescued",
    CLOSED: "Case Closed",
  };
  const currentIdx = statusOrder.indexOf(incident.status);

  return (
    <div className="space-y-2">
      {statusOrder.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const ts = incident.timestamps.find((t) => t.status.toLowerCase().includes(s.toLowerCase().replace("_", " ")));
        return (
          <div key={s} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: done
                    ? "#10b981"
                    : active
                      ? "#06b6d4"
                      : "#1a2640",
                  border: active ? "2px solid #22d3ee" : "none",
                }}
              >
                {done ? (
                  <CheckCircle size={12} style={{ color: "white" }} />
                ) : active ? (
                  <span className="w-2 h-2 rounded-full animate-blink" style={{ background: "white" }} />
                ) : (
                  <Circle size={10} style={{ color: "#2a3a55" }} />
                )}
              </div>
              {i < statusOrder.length - 1 && (
                <div
                  className="w-px flex-1 mt-1"
                  style={{
                    height: 18,
                    background: done ? "#10b981" : "#1a2640",
                  }}
                />
              )}
            </div>
            <div className="pb-2">
              <div
                className="text-xs font-medium"
                style={{ color: done ? "#6ee7b7" : active ? "#22d3ee" : "#2a3a55" }}
              >
                {statusLabels[s]}
              </div>
              {ts && (
                <div className="text-[10px] font-mono" style={{ color: "#4a6080" }}>
                  {ts.time}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SOSView({ onAssignTeam }: Props) {
  const [selected, setSelected] = useState<SOSIncident>(sosIncidents[0]);
  const [showAssign, setShowAssign] = useState(false);
  const [assignedTeams, setAssignedTeams] = useState<Record<string, string>>(
    Object.fromEntries(sosIncidents.filter((s) => s.assignedTeam).map((s) => [s.id, s.assignedTeam!]))
  );
  const [toast, setToast] = useState<string | null>(null);

  const handleAssign = (teamId: string) => {
    setAssignedTeams((p) => ({ ...p, [selected.id]: teamId }));
    setShowAssign(false);
    onAssignTeam(selected.id, teamId);
    setToast(`Team ${teamId} assigned to ${selected.id}`);
    setTimeout(() => setToast(null), 3000);
  };

  const availableTeams = rescueTeams.filter((t) => t.status === "AVAILABLE" || t.status === "EN_ROUTE");

  return (
    <div className="h-full flex overflow-hidden">
      {/* Incident queue */}
      <div
        className="w-72 flex-shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ borderColor: "#1a2640" }}
      >
        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid #1a2640" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">SOS INCIDENTS</h2>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded animate-blink"
              style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              {sosIncidents.length} ACTIVE
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sosIncidents.map((s) => {
            const cfg = priorityConfig[s.priority];
            const isSelected = selected.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="w-full text-left rounded-xl p-3 transition-all"
                style={{
                  background: isSelected ? cfg.bg : "rgba(12,19,34,0.5)",
                  border: `1px solid ${isSelected ? cfg.border : "#1a2640"}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-white">{s.id}</span>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase"
                    style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
                  >
                    {s.priority}
                  </span>
                </div>
                <div className="text-[11px] text-white truncate mb-1.5">{s.location}</div>
                <div className="flex items-center justify-between text-[10px]" style={{ color: "#4a6080" }}>
                  <div className="flex items-center gap-2">
                    <Users size={10} />
                    <span>{s.people} people</span>
                    {s.medical && (
                      <span
                        className="px-1 rounded"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}
                      >
                        MED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={10} />
                    <span className="font-mono">{s.waitingMin}m</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background:
                        s.status === "EN_ROUTE"
                          ? "rgba(6,182,212,0.12)"
                          : s.status === "RECEIVED"
                            ? "rgba(239,68,68,0.12)"
                            : "rgba(245,158,11,0.12)",
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
                  {assignedTeams[s.id] && (
                    <span className="text-[10px] font-mono" style={{ color: "#14b8a6" }}>
                      {assignedTeams[s.id]}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {selected && (
          <>
            {/* Header */}
            <div
              className="rounded-xl p-4 animate-slide-up"
              style={{
                background: priorityConfig[selected.priority].bg,
                border: `1px solid ${priorityConfig[selected.priority].border}`,
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl font-mono font-black text-white">{selected.id}</span>
                    <span
                      className="text-sm font-mono font-bold px-3 py-1 rounded-full"
                      style={{
                        background: priorityConfig[selected.priority].color,
                        color: "white",
                      }}
                    >
                      {selected.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: "#8da0b8" }}>
                    <MapPin size={14} />
                    <span>{selected.location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono" style={{ color: "#4a6080" }}>
                    WAITING
                  </div>
                  <div
                    className="text-2xl font-mono font-black"
                    style={{ color: priorityConfig[selected.priority].color }}
                  >
                    {selected.waitingMin}m
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Incident details */}
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
              >
                <h3 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#4a6080" }}>
                  Incident Details
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "People", value: selected.people },
                    { label: "Children", value: selected.children > 0 ? `Yes (${selected.children})` : "No" },
                    { label: "Elderly", value: selected.elderly > 0 ? `Yes (${selected.elderly})` : "No" },
                    { label: "Medical", value: selected.medical ? "YES" : "No" },
                    { label: "Water Depth", value: `~${selected.waterDepthM} m` },
                    { label: "Flood Risk", value: selected.floodRisk },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between items-center">
                      <span className="text-xs" style={{ color: "#4a6080" }}>{r.label}</span>
                      <span
                        className="text-xs font-mono font-bold"
                        style={{
                          color:
                            r.label === "Medical" && selected.medical
                              ? "#fca5a5"
                              : r.label === "Flood Risk"
                                ? selected.floodRisk === "SEVERE"
                                  ? "#ef4444"
                                  : "#f97316"
                                : "#f0f4ff",
                        }}
                      >
                        {r.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status tracker */}
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
              >
                <h3 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#4a6080" }}>
                  Rescue Status
                </h3>
                <StatusTracker incident={selected} />
              </div>
            </div>

            {/* Recommended action */}
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)" }}
            >
              <h3 className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "#22d3ee" }}>
                Recommended Action
              </h3>
              <p className="text-sm text-white mb-3">
                Dispatch Rescue Team R-07 via safe route (4.2 km, ETA 11 min). Boat vehicle recommended due to ~1m water depth.
              </p>
              {assignedTeams[selected.id] ? (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)" }}
                >
                  <CheckCircle size={14} className="text-teal-400" />
                  <span className="text-sm font-mono font-bold" style={{ color: "#5eead4" }}>
                    {assignedTeams[selected.id]} ASSIGNED — EN ROUTE
                  </span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAssign(true)}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: "#06b6d4" }}
                  >
                    ASSIGN TEAM
                  </button>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/5" style={{ border: "1px solid #1a2640", color: "#8da0b8" }}>
                    OPEN ROUTE
                  </button>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/5" style={{ border: "1px solid #1a2640", color: "#8da0b8" }}>
                    <Phone size={14} className="inline mr-1" />CALL
                  </button>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/5" style={{ border: "1px solid #1a2640", color: "#8da0b8" }}>
                    MARK VERIFIED
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Assign team modal */}
      {showAssign && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(3,6,15,0.75)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="rounded-2xl p-6 w-96 animate-slide-up"
            style={{ background: "#0c1322", border: "1px solid #1a2640" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">ASSIGN RESCUE TEAM</h3>
              <button
                onClick={() => setShowAssign(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10"
              >
                <X size={14} style={{ color: "#4a6080" }} />
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: "#4a6080" }}>
              Select a team for {selected.id}
            </p>
            <div className="space-y-3">
              {availableTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleAssign(team.id)}
                  className="w-full text-left rounded-xl p-3 hover:bg-white/5 transition-colors"
                  style={{ background: "rgba(20,30,58,0.6)", border: "1px solid #1a2640" }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-mono font-bold text-white">{team.name}</div>
                      <div className="text-xs mt-1" style={{ color: "#4a6080" }}>
                        {team.vehicle} · Capacity: {team.capacity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold" style={{ color: "#22d3ee" }}>
                        ETA {team.etaMin}min
                      </div>
                      <div className="text-xs font-mono" style={{ color: "#4a6080" }}>
                        {team.distanceKm} km
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: team.routeSafety === "SAFE" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                        color: team.routeSafety === "SAFE" ? "#6ee7b7" : "#fde68a",
                      }}
                    >
                      Route: {team.routeSafety}
                    </span>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: team.status === "AVAILABLE" ? "rgba(16,185,129,0.1)" : "rgba(6,182,212,0.1)",
                        color: team.status === "AVAILABLE" ? "#6ee7b7" : "#22d3ee",
                      }}
                    >
                      {team.status.replace("_", " ")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="absolute bottom-6 right-6 rounded-xl px-4 py-3 flex items-center gap-2 animate-slide-up"
          style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)" }}
        >
          <CheckCircle size={16} className="text-green-400" />
          <span className="text-sm font-mono text-green-300">{toast}</span>
        </div>
      )}
    </div>
  );
}
