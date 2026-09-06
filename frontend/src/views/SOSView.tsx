import { useState, useEffect } from "react";
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
  Sparkles,
  Zap,
  Radio,
  Send,
  Truck,
  Copy,
  ShieldCheck,
  Check,
  Video,
  Eye,
  Camera,
  ZoomIn,
  ZoomOut,
  Crosshair,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import { sosIncidents, rescueTeams } from "../mockData";
import type { SOSIncident, IncidentStatus } from "../mockData";
import {
  saveTicketToIndexedDB,
  getPendingTicketsFromIndexedDB,
  syncPendingTicketsToBackend,
} from "../services/offlineStorage";

interface Props {
  onAssignTeam: (sosId: string, teamId: string) => void;
  onNavigate?: (
    view: string,
    targetIdOrName?: string,
    customCoords?: { lat?: number; lng?: number; name?: string; autoStartNav?: boolean }
  ) => void;
}

const priorityConfig = {
  CRITICAL: { color: "#ef4444", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.5)", text: "#fca5a5" },
  HIGH: { color: "#f97316", bg: "rgba(249,115,22,0.15)", border: "rgba(249,115,22,0.5)", text: "#fdba74" },
  MODERATE: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)", text: "#fde68a" },
};

const statusOrder: IncidentStatus[] = ["RECEIVED", "VERIFIED", "ASSIGNED", "EN_ROUTE", "RESCUED", "CLOSED"];

const statusLabels: Record<IncidentStatus, string> = {
  RECEIVED: "SOS Received",
  VERIFIED: "Location Verified",
  ASSIGNED: "Team Assigned",
  EN_ROUTE: "Team En Route",
  RESCUED: "Citizen Rescued",
  CLOSED: "Case Closed",
};

// Vertical Stepper Component matching Reference Screenshot
function RescueStatusStepper({ incident }: { incident: SOSIncident }) {
  const currentIdx = statusOrder.indexOf(incident.status);

  return (
    <div className="space-y-4 font-sans">
      {statusOrder.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const ts = incident.timestamps.find((t) =>
          t.status.toLowerCase().includes(s.toLowerCase().replace("_", " "))
        );

        return (
          <div key={s} className="flex items-start gap-3 relative">
            <div className="flex flex-col items-center z-10">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  background: done
                    ? "#10b981"
                    : active
                      ? "#06b6d4"
                      : "rgba(26,38,64,0.8)",
                  border: active ? "2px solid #22d3ee" : done ? "1px solid #10b981" : "1px solid #2a3a55",
                  boxShadow: active ? "0 0 10px rgba(6,182,212,0.6)" : "none",
                }}
              >
                {done ? (
                  <CheckCircle size={12} className="text-white" />
                ) : active ? (
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                ) : (
                  <Circle size={10} className="text-slate-600" />
                )}
              </div>

              {i < statusOrder.length - 1 && (
                <div
                  className="w-0.5 my-1"
                  style={{
                    height: 20,
                    background: done ? "#10b981" : "rgba(26,38,64,0.8)",
                  }}
                />
              )}
            </div>

            <div>
              <div
                className="text-xs font-mono font-bold tracking-tight"
                style={{
                  color: done ? "#6ee7b7" : active ? "#22d3ee" : "#4a6080",
                }}
              >
                {statusLabels[s]}
              </div>
              {ts ? (
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">{ts.time}</div>
              ) : active ? (
                <div className="text-[10px] font-mono text-cyan-400/80 mt-0.5">IN PROGRESS...</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SOSView({ onAssignTeam, onNavigate }: Props) {
  const [incidentsList, setIncidentsList] = useState<SOSIncident[]>(sosIncidents);
  const [selectedId, setSelectedId] = useState<string>(sosIncidents[0].id);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // View Mode: COMMAND (Dispatcher Matrix) vs CITIZEN_PORTAL (Citizen Portal)
  const [viewMode, setViewMode] = useState<"COMMAND" | "CITIZEN_PORTAL">("COMMAND");

  // Citizen SOS Submission Form state
  const [citizenLoc, setCitizenLoc] = useState("Rajendra Nagar Terminal Gate 2");
  const [citizenPeople, setCitizenPeople] = useState(3);
  const [citizenChildren, setCitizenChildren] = useState(1);
  const [citizenElderly, setCitizenElderly] = useState(1);
  const [citizenMedical, setCitizenMedical] = useState(true);
  const [citizenNotes, setCitizenNotes] = useState("Water level is rising fast (~1m). Need evacuation boat.");
  const [citizenSubmitted, setCitizenSubmitted] = useState(false);
  const [submittedIncidentId, setSubmittedIncidentId] = useState<string | null>("#10302");

  // NLP Raw Text Simulation State
  const [nlpPrompt, setNlpPrompt] = useState(
    "Trapped on roof with 1 baby and grandma, water is 1m high, urgent medical assistance needed!"
  );
  const [showNlpPanel, setShowNlpPanel] = useState(false);

  // UAV Thermal Feed PIP & Offline Queue State
  const [showDronePip, setShowDronePip] = useState(false);
  const [droneMode, setDroneMode] = useState<"THERMAL" | "VISIBLE" | "NVG">("THERMAL");
  const [droneZoom, setDroneZoom] = useState<number>(2);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  const selected = incidentsList.find((i) => i.id === selectedId) || incidentsList[0];
  const activeCfg = priorityConfig[selected.priority];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    getPendingTicketsFromIndexedDB().then((pending) => {
      if (pending && pending.length > 0) {
        setOfflineQueueCount(pending.length);
      }
    });
  }, []);

  const handleSyncMeshTickets = async () => {
    const count = await syncPendingTicketsToBackend((syncedTicket) => {
      setIncidentsList((prev) =>
        prev.map((i) => (i.id === syncedTicket.id ? { ...i, syncStatus: "SYNCED" } : i))
      );
    });
    setOfflineQueueCount(0);
    triggerToast(`P2P MESH AUTO-SYNC COMPLETE: Synced ${count} tickets to backend!`);
  };

  const handleCitizenSubmit = async () => {
    const newId = `#10${Math.floor(100 + Math.random() * 900)}`;
    const isCurrentlyOffline = typeof navigator !== "undefined" && !navigator.onLine;

    const newIncident: SOSIncident & { syncStatus?: "SYNCED" | "QUEUED_LOCALLY" } = {
      id: newId,
      priority: citizenMedical ? "CRITICAL" : "HIGH",
      location: citizenLoc,
      people: citizenPeople,
      children: citizenChildren,
      elderly: citizenElderly,
      medical: citizenMedical,
      waterDepthM: 1.0,
      waitingMin: 1,
      status: "RECEIVED",
      floodRisk: "SEVERE",
      lat: 25.604,
      lng: 85.129,
      syncStatus: isCurrentlyOffline ? "QUEUED_LOCALLY" : "SYNCED",
      timestamps: [
        {
          status: isCurrentlyOffline ? "Stored in Offline Mesh Queue (IndexedDB)" : "SOS received at Command Center",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    };

    if (isCurrentlyOffline) {
      await saveTicketToIndexedDB(newIncident);
      setOfflineQueueCount((prev) => prev + 1);
      triggerToast(`OFFLINE MESH QUEUED: Ticket ${newId} saved to IndexedDB. Broadcasting via P2P Mesh...`);
    } else {
      triggerToast(`CITIZEN DISTRESS SUBMITTED: Emergency Ticket ${newId} created & synced!`);
    }

    setIncidentsList([newIncident, ...incidentsList]);
    setSelectedId(newId);
    setSubmittedIncidentId(newId);
    setCitizenSubmitted(true);
  };

  // One-Click Smart Dispatch handler
  const handleExecuteDispatch = (teamId?: string) => {
    const assignedTeam = teamId || selected.assignedTeam || "R-07";
    const currentTimeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setIncidentsList((prev) =>
      prev.map((item) => {
        if (item.id === selected.id) {
          const existingTimestamps = item.timestamps.filter(
            (t) => !t.status.toLowerCase().includes("en route") && !t.status.toLowerCase().includes("assigned")
          );
          return {
            ...item,
            status: "EN_ROUTE",
            assignedTeam,
            timestamps: [
              ...existingTimestamps,
              { status: "Team assigned", time: currentTimeStr },
              { status: "Team en route", time: currentTimeStr },
            ],
          };
        }
        return item;
      })
    );

    onAssignTeam(selected.id, assignedTeam);
    setShowAssignModal(false);
    triggerToast(`DISPATCH EXECUTED: Rescue Team ${assignedTeam} dispatched to ${selected.id}!`);
  };

  // Mark Verified Action
  const handleMarkVerified = () => {
    const currentTimeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setIncidentsList((prev) =>
      prev.map((item) => {
        if (item.id === selected.id) {
          return {
            ...item,
            status: "VERIFIED",
            timestamps: [...item.timestamps, { status: "Location verified", time: currentTimeStr }],
          };
        }
        return item;
      })
    );
    triggerToast(`Location verified for SOS Incident ${selected.id}`);
  };

  // NLP Raw Text Parser Simulation Logic
  const handleRunNlpTriage = () => {
    const prompt = nlpPrompt.toLowerCase();
    let childrenCount = 0;
    let elderlyCount = 0;
    let medicalNeeded = false;
    let extractedDepth = selected.waterDepthM;
    let totalPeople = selected.people;

    if (prompt.includes("baby") || prompt.includes("child") || prompt.includes("kid")) {
      childrenCount = 1;
    }
    if (prompt.includes("grandma") || prompt.includes("elderly") || prompt.includes("senior")) {
      elderlyCount = 1;
    }
    if (prompt.includes("medical") || prompt.includes("sick") || prompt.includes("injured") || prompt.includes("bleeding")) {
      medicalNeeded = true;
    }
    if (prompt.includes("1m") || prompt.includes("1 m") || prompt.includes("1 meter")) {
      extractedDepth = 1.0;
    } else if (prompt.includes("0.5m") || prompt.includes("half meter")) {
      extractedDepth = 0.5;
    } else if (prompt.includes("1.5m")) {
      extractedDepth = 1.5;
    }

    if (childrenCount > 0 || elderlyCount > 0) {
      totalPeople = Math.max(totalPeople, childrenCount + elderlyCount + 2);
    }

    setIncidentsList((prev) =>
      prev.map((item) => {
        if (item.id === selected.id) {
          return {
            ...item,
            people: totalPeople,
            children: childrenCount,
            elderly: elderlyCount,
            medical: medicalNeeded,
            waterDepthM: extractedDepth,
            priority: extractedDepth >= 0.8 || medicalNeeded ? "CRITICAL" : "HIGH",
            floodRisk: extractedDepth >= 1.0 ? "SEVERE" : "HIGH",
          };
        }
        return item;
      })
    );

    triggerToast(`NLP Triage Parsed: Updated Children (${childrenCount}), Elderly (${elderlyCount}), Medical (${medicalNeeded ? "YES" : "NO"}), Water Depth (~${extractedDepth}m)`);
  };

  // Dynamic Survivability Criticality Calculation
  const isSurvivabilityCritical = selected.waitingMin >= 5 && selected.waterDepthM >= 0.8;
  const availableTeams = rescueTeams.filter((t) => t.status === "AVAILABLE" || t.status === "EN_ROUTE");

  return (
    <div className="h-full flex overflow-hidden select-none font-sans relative bg-[#070d18] text-slate-100 flex-col md:flex-row">
      {/* Toast Notification Overlay */}
      {toastMessage && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-white flex items-center gap-2 shadow-2xl animate-slide-down"
          style={{ background: "#06b6d4", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <Zap size={14} className="text-amber-300 animate-pulse" /> {toastMessage}
        </div>
      )}

      {/* ─── 1. LEFT SIDEBAR: INCIDENT FEED & MODE SWITCHER ─────────────────────── */}
      <div
        className="w-80 flex-shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ borderColor: "#1a2640", background: "rgba(8,13,24,0.95)" }}
      >
        <div className="px-4 py-3 border-b flex flex-col gap-2" style={{ borderColor: "#1a2640" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">SOS DISPATCH</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-bold animate-pulse">
              {incidentsList.length} ACTIVE
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode("COMMAND")}
              className={`py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                viewMode === "COMMAND"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              COMMAND OPS
            </button>
            <button
              onClick={() => setViewMode("CITIZEN_PORTAL")}
              className={`py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                viewMode === "CITIZEN_PORTAL"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              CITIZEN PORTAL
            </button>
          </div>
        </div>

          {/* P2P MESH QUEUE SYNC BANNER */}
          {offlineQueueCount > 0 && (
            <button
              onClick={handleSyncMeshTickets}
              className="mx-3 my-2 p-2.5 rounded-xl text-xs font-mono font-bold text-amber-200 bg-amber-950/80 border border-amber-500/50 hover:bg-amber-900/60 flex items-center justify-between cursor-pointer animate-pulse shadow-lg"
            >
              <div className="flex items-center gap-2">
                <HardDrive size={14} className="text-amber-400" />
                <span>{offlineQueueCount} MESH QUEUED</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                <RefreshCw size={11} className="animate-spin" /> SYNC NOW
              </div>
            </button>
          )}

        {viewMode === "COMMAND" ? (
          <div className="p-3 space-y-2.5 flex-1">
            {incidentsList.map((s) => {
              const isSelected = selected.id === s.id;
              const cfg = priorityConfig[s.priority];
              const syncSt = (s as any).syncStatus;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className="w-full text-left rounded-xl p-3.5 transition-all cursor-pointer relative overflow-hidden"
                  style={{
                    background: isSelected ? "rgba(12,19,34,0.5)" : "rgba(12,19,34,0.5)",
                    border: `1px solid ${isSelected ? cfg.border : "#1a2640"}`,
                    boxShadow: isSelected ? `0 0 16px ${cfg.color}20` : "none",
                  }}
                >
                  {/* Header Line */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-black text-white">{s.id}</span>
                      {syncSt === "QUEUED_LOCALLY" ? (
                        <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                          <HardDrive size={8} /> P2P QUEUED
                        </span>
                      ) : (
                        <span className="text-[8px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
                          <CheckCircle size={8} /> SYNCED
                        </span>
                      )}
                    </div>
                    <span
                      className="text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase"
                      style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
                    >
                      {s.priority}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="text-xs text-slate-300 truncate font-sans mb-2">{s.location}</div>

                  {/* Victims & Waiting Time */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-slate-400" />
                      <span>{s.people} people</span>
                      {s.medical && (
                        <span className="px-1 py-0.2 rounded bg-red-500/20 text-red-300 text-[9px] font-bold">
                          MED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" />
                      <span>{s.waitingMin}m</span>
                    </div>
                  </div>

                  {/* Status Pill & Assigned Unit */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span
                      className="text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase"
                      style={{
                        background:
                          s.status === "EN_ROUTE"
                            ? "rgba(6,182,212,0.15)"
                            : s.status === "ASSIGNED"
                              ? "rgba(245,158,11,0.15)"
                              : s.status === "VERIFIED"
                                ? "rgba(16,185,129,0.15)"
                                : "rgba(239,68,68,0.15)",
                        color:
                          s.status === "EN_ROUTE"
                            ? "#38bdf8"
                            : s.status === "ASSIGNED"
                              ? "#fde68a"
                              : s.status === "VERIFIED"
                                ? "#6ee7b7"
                                : "#fca5a5",
                      }}
                    >
                      {s.status.replace("_", " ")}
                    </span>
                    {s.assignedTeam && (
                      <span className="text-[10px] font-mono font-bold text-cyan-400">
                        {s.assignedTeam}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 space-y-3 text-xs flex-1 font-mono text-slate-300">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
              📌 CITIZEN DISTRESS PORTAL ACTIVE
              <p className="text-[10px] text-slate-400 mt-1">
                Direct public interface for citizens trapped in flooded sectors to report SOS & track rescue boats live.
              </p>
            </div>
          </div>
        )}

        {/* NLP Parser Launcher Toggle (Command Mode) */}
        {viewMode === "COMMAND" && (
          <div className="p-3 border-t border-slate-800">
            <button
              onClick={() => setShowNlpPanel(!showNlpPanel)}
              className="w-full py-2 rounded-xl text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 hover:bg-cyan-900/40 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles size={14} className="text-cyan-400 animate-pulse" />
              {showNlpPanel ? "HIDE NLP TRIAGE TOOL" : "NLP TEXT TRIAGE ENGINE"}
            </button>
          </div>
        )}
      </div>

      {/* ─── 2. MAIN WORKSPACE VIEW (COMMAND vs CITIZEN PORTAL) ───────────────── */}
      {viewMode === "CITIZEN_PORTAL" ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div className="rounded-2xl p-6 bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-mono font-black text-white flex items-center gap-2">
                  <ShieldCheck size={24} className="text-cyan-400" />
                  HYDROGRAPH PUBLIC CITIZEN EMERGENCY PORTAL
                </h1>
                <p className="text-xs text-cyan-200 mt-1 font-sans">
                  Direct connection to Patna HydroGraph Disaster Command & Autonomous Boat Dispatch Matrix
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold animate-pulse">
                🔴 LIVE EMERGENCY LINK ACTIVE
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SUBMIT SOS FORM */}
            <div className="rounded-2xl p-6 bg-slate-900/80 border border-slate-800 space-y-4">
              <h2 className="text-sm font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" />
                SUBMIT DISTRESS SOS REPORT
              </h2>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">YOUR CURRENT LOCATION</label>
                <div className="flex gap-2">
                  <input
                    value={citizenLoc}
                    onChange={(e) => setCitizenLoc(e.target.value)}
                    className="flex-1 bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-sans"
                  />
                  <button
                    onClick={() => {
                      setCitizenLoc("Rajendra Nagar Terminal Gate 2 (GPS)");
                      triggerToast("GPS Coords Auto-Detected: 25.6040° N, 85.1290° E");
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 cursor-pointer"
                  >
                    GPS AUTO-DETECT
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">CITIZENS</label>
                  <input
                    type="number"
                    value={citizenPeople}
                    onChange={(e) => setCitizenPeople(Number(e.target.value))}
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">CHILDREN</label>
                  <input
                    type="number"
                    value={citizenChildren}
                    onChange={(e) => setCitizenChildren(Number(e.target.value))}
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">ELDERLY</label>
                  <input
                    type="number"
                    value={citizenElderly}
                    onChange={(e) => setCitizenElderly(Number(e.target.value))}
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">ADDITIONAL NOTES / TRANSCRIPT</label>
                <textarea
                  rows={2}
                  value={citizenNotes}
                  onChange={(e) => setCitizenNotes(e.target.value)}
                  className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <button
                onClick={handleCitizenSubmit}
                className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-xl cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  boxShadow: "0 0 20px rgba(239,68,68,0.4)",
                }}
              >
                <AlertTriangle size={16} />
                SUBMIT EMERGENCY DISTRESS REQUEST
              </button>
            </div>

            {/* LIVE RESCUE TRACKER VIEW (Citizen Side) */}
            <div className="rounded-2xl p-6 bg-slate-900/80 border border-slate-800 space-y-4">
              <h2 className="text-sm font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Truck size={16} className="text-cyan-400" />
                LIVE RESCUE BOAT TRACKER
              </h2>

              {citizenSubmitted ? (
                <div className="space-y-4 animate-slide-up">
                  <div className="p-4 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-xs font-mono space-y-2">
                    <div className="flex justify-between items-center text-sm font-bold text-white">
                      <span>INCIDENT TICKET {submittedIncidentId}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        STATUS: EN ROUTE
                      </span>
                    </div>
                    <div className="text-slate-300">Location: {citizenLoc}</div>
                    <div className="text-amber-400">Assigned Unit: Flood Taskforce Motorboat 03 (Motorboat)</div>
                    <div className="text-cyan-300 font-bold text-base">ESTIMATED ARRIVAL: 8 MINUTES</div>
                  </div>

                  {/* Rescue Stepper Timeline for Citizen */}
                  <RescueStatusStepper incident={selected} />

                  <div className="p-3 rounded-xl bg-black/40 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div className="font-bold text-amber-300">⚠️ CITIZEN EMERGENCY SAFETY GUIDE:</div>
                    <p>• Stay calm and move to the highest accessible dry floor or roof.</p>
                    <p>• Keep mobile devices dry. Flash light towards the sky if dark.</p>
                    <p>• Do not attempt to walk or swim through flowing flood water.</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 font-mono text-xs">
                  Fill out the Emergency Distress form on the left to activate Live Rescue Boat Tracking.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* COMMAND OPS MATRIX VIEW */
        <>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* NLP TRIAGE SIMULATOR PANEL (Interactive NLP text parser) */}
        {showNlpPanel && (
          <div
            className="rounded-2xl p-4 animate-slide-down border shadow-2xl relative"
            style={{ background: "rgba(12,22,42,0.95)", borderColor: "rgba(6,182,212,0.4)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300">
                <Sparkles size={16} className="text-cyan-400" />
                NLP SOS TEXT PARSER & TRIAGE EXTRACTOR
              </div>
              <button onClick={() => setShowNlpPanel(false)} className="text-slate-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              Simulate raw citizen distress SMS/Call transcripts to automatically extract key parameters.
            </p>
            <div className="flex gap-2">
              <input
                value={nlpPrompt}
                onChange={(e) => setNlpPrompt(e.target.value)}
                placeholder="Enter raw distress transcript string..."
                className="flex-1 bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleRunNlpTriage}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-white bg-cyan-600 hover:bg-cyan-500 cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
              >
                <Send size={12} />
                PARSE & UPDATE
              </button>
            </div>
          </div>
        )}

        {/* ─── 2. MAIN HEADER (Matching Reference Screenshot) ────────────────── */}
        <div
          className="rounded-2xl p-5 animate-slide-up relative overflow-hidden"
          style={{
            background: "rgba(15,23,42,0.9)",
            border: `1px solid ${activeCfg.border}`,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-mono font-black text-white tracking-tight">{selected.id}</h1>
                <span
                  className="text-xs font-mono font-bold px-3 py-1 rounded-full text-white tracking-wider"
                  style={{ background: activeCfg.color }}
                >
                  {selected.priority}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-300 font-sans">
                <MapPin size={15} className="text-red-400" />
                <span>{selected.location}</span>
              </div>
            </div>

            {/* WAITING TIMER WITH DYNAMIC SURVIVABILITY CRITICALITY PULSE */}
            <div className="text-right flex flex-col items-end">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-0.5">
                WAITING
              </div>
              <div
                className={`text-4xl font-mono font-black tracking-tight ${
                  isSurvivabilityCritical ? "text-red-500 animate-pulse" : ""
                }`}
                style={{
                  color: isSurvivabilityCritical ? "#ef4444" : activeCfg.color,
                  textShadow: isSurvivabilityCritical ? "0 0 15px rgba(239,68,68,0.8)" : "none",
                }}
              >
                {selected.waitingMin}m
              </div>
              {isSurvivabilityCritical && (
                <div className="text-[9px] font-mono font-bold text-red-400 mt-1 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle size={10} className="animate-ping" /> CRITICAL WAITING THRESHOLD EXCEEDED
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── 3. GRID LAYOUT: INCIDENT DETAILS & RESCUE STATUS STEPPER ────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* INCIDENT DETAILS PANEL (Extracted parameters) */}
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: "rgba(12,19,34,0.85)", border: "1px solid #1a2640" }}
          >
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold mb-4">
              INCIDENT DETAILS
            </h3>

            <div className="space-y-3 text-xs font-sans">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">People</span>
                <span className="font-mono font-bold text-white text-sm">{selected.people}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">Children</span>
                <span className="font-mono font-bold text-slate-200">
                  {selected.children > 0 ? `Yes (${selected.children})` : "No"}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">Elderly</span>
                <span className="font-mono font-bold text-slate-200">
                  {selected.elderly > 0 ? `Yes (${selected.elderly})` : "No"}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">Medical</span>
                <span
                  className={`font-mono font-bold ${
                    selected.medical ? "text-red-400 text-sm" : "text-slate-300"
                  }`}
                >
                  {selected.medical ? "YES" : "No"}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">Water Depth</span>
                <span className="font-mono font-bold text-amber-400">~{selected.waterDepthM} m</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Flood Risk</span>
                <span
                  className={`font-mono font-bold uppercase ${
                    selected.floodRisk === "SEVERE" ? "text-red-500" : "text-amber-400"
                  }`}
                >
                  {selected.floodRisk}
                </span>
              </div>
            </div>
          </div>

          {/* RESCUE STATUS (VERTICAL STEPPER) */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "rgba(12,19,34,0.85)", border: "1px solid #1a2640" }}
          >
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold mb-4">
              RESCUE STATUS
            </h3>

            <RescueStatusStepper incident={selected} />
          </div>
        </div>

        {/* ─── 4. RECOMMENDED ACTION PANEL (Matching Reference Screenshot) ───────── */}
        <div
          className="rounded-2xl p-5 animate-slide-up"
          style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.3)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-300 font-bold">
              RECOMMENDED ACTION
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60 font-bold">
              AI DISPATCH ENGINE
            </span>
          </div>

          <p className="text-sm text-slate-100 font-sans mb-4 leading-relaxed">
            Dispatch Rescue Team {selected.assignedTeam || "R-07"} via safe route (4.2 km, ETA 11 min). Motorboat vehicle recommended due to ~{selected.waterDepthM}m water depth.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            {/* ONE-CLICK SMART DISPATCH BUTTON */}
            <button
              onClick={() => handleExecuteDispatch()}
              className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold text-white transition-all cursor-pointer shadow-xl flex items-center gap-2 hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                boxShadow: "0 0 16px rgba(6,182,212,0.4)",
              }}
            >
              <Truck size={14} />
              EXECUTE DISPATCH ({selected.assignedTeam || "R-07"})
            </button>

            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate("routing", selected.location, {
                    name: `SOS ${selected.id}: ${selected.location}`,
                    autoStartNav: true,
                  });
                }
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all hover:bg-white/5 cursor-pointer flex items-center gap-2"
              style={{ border: "1px solid #1a2640", color: "#38bdf8" }}
            >
              <Navigation size={14} />
              OPEN HAZARD ROUTE
            </button>

            <button
              onClick={() => setShowCallModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all hover:bg-white/5 cursor-pointer flex items-center gap-2"
              style={{ border: "1px solid #1a2640", color: "#34d399" }}
            >
              <Phone size={14} />
              CALL CITIZEN
            </button>

            <button
              onClick={handleMarkVerified}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all hover:bg-white/5 cursor-pointer flex items-center gap-2"
              style={{ border: "1px solid #1a2640", color: "#8da0b8" }}
            >
              <ShieldCheck size={14} />
              MARK VERIFIED
            </button>

            <button
              onClick={() => setShowDronePip(!showDronePip)}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all hover:bg-white/5 cursor-pointer flex items-center gap-2"
              style={{
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#fca5a5",
                background: showDronePip ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.08)",
              }}
            >
              <Video size={14} className="text-red-400 animate-pulse" />
              {showDronePip ? "HIDE UAV PIP FEED" : "UAV THERMAL FEED"}
            </button>
          </div>
        </div>
      </div>

      {/* ─── UAV THERMAL PIP FLOATING HUD ────────────────────────────────────── */}
      {showDronePip && (
        <div
          className="fixed bottom-6 right-6 z-50 w-96 rounded-2xl border shadow-2xl overflow-hidden animate-slide-up"
          style={{
            background: "#080e1a",
            borderColor: droneMode === "THERMAL" ? "rgba(239,68,68,0.5)" : "rgba(6,182,212,0.5)",
            boxShadow: "0 0 30px rgba(0,0,0,0.8)",
          }}
        >
          {/* PIP HEADER */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-black/80 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <Video size={14} className="text-red-400" />
              <span>UAV DRONE-04 TELEMETRY FEED</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/60 font-bold">
                REC · {droneZoom}X
              </span>
              <button
                onClick={() => setShowDronePip(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* SIMULATED THERMAL VIEWFINDER SCREEN */}
          <div className="relative h-56 bg-black flex flex-col justify-between p-3 overflow-hidden">
            {/* Background Grid & Thermal Spectrum Gradient Effect */}
            <div
              className="absolute inset-0 opacity-40 transition-all duration-500"
              style={{
                backgroundImage:
                  droneMode === "THERMAL"
                    ? "radial-gradient(circle at 50% 50%, rgba(239,68,68,0.3) 0%, rgba(245,158,11,0.2) 40%, rgba(6,182,212,0.1) 80%, rgba(0,0,0,0.9) 100%)"
                    : droneMode === "NVG"
                    ? "radial-gradient(circle at 50% 50%, rgba(34,197,94,0.35) 0%, rgba(16,185,129,0.15) 50%, rgba(0,0,0,0.95) 100%)"
                    : "radial-gradient(circle at 50% 50%, rgba(56,189,248,0.2) 0%, rgba(15,23,42,0.8) 100%)",
              }}
            />

            {/* Target Crosshair & Bounding Box Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Crosshair size={64} className="text-red-500/60 animate-pulse" />
              <div
                className="absolute border-2 border-dashed border-amber-400 rounded-lg p-6 animate-pulse flex flex-col items-center justify-center"
                style={{ width: 140, height: 100 }}
              >
                <span className="text-[9px] font-mono font-bold text-amber-300 bg-black/80 px-1 py-0.5 rounded">
                  TARGET LOCK 🎯
                </span>
                <span className="text-[8px] font-mono text-red-400 bg-black/80 mt-1">
                  37.2°C HEAT DETECTED
                </span>
              </div>
            </div>

            {/* Viewfinder Top Bar Overlay */}
            <div className="relative z-10 flex justify-between items-start text-[9px] font-mono text-slate-300 bg-black/50 p-1.5 rounded border border-white/10">
              <div>ALT: 120m | HDG: 142° SE | SAT: 14</div>
              <div className="text-amber-400 font-bold">BAT: 87% ⚡</div>
            </div>

            {/* Viewfinder Bottom Status Overlay */}
            <div className="relative z-10 flex justify-between items-end text-[9px] font-mono text-slate-300 bg-black/50 p-1.5 rounded border border-white/10">
              <div>
                <span className="text-cyan-400 font-bold">INCIDENT: {selected.id}</span>
                <div className="text-slate-400">{selected.location}</div>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-bold">VICTIMS: {selected.people} SURVIVORS</span>
                <div className="text-amber-300">WATER DEPTH: ~{selected.waterDepthM}m</div>
              </div>
            </div>
          </div>

          {/* PIP CONTROLS & SPECTRUM MODE TABS */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">SPECTRUM MODE</span>
              <div className="flex gap-1">
                {(["THERMAL", "VISIBLE", "NVG"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDroneMode(mode)}
                    className="px-2 py-1 rounded text-[9px] font-mono font-bold transition-colors cursor-pointer"
                    style={{
                      background: droneMode === mode ? "#06b6d4" : "rgba(255,255,255,0.05)",
                      color: droneMode === mode ? "#ffffff" : "#94a3b8",
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* ZOOM CONTROLS */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">ZOOM MAGNIFICATION</span>
              <div className="flex items-center gap-1">
                {[1, 2, 4, 8].map((z) => (
                  <button
                    key={z}
                    onClick={() => setDroneZoom(z)}
                    className="px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer"
                    style={{
                      background: droneZoom === z ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.05)",
                      color: droneZoom === z ? "#f59e0b" : "#64748b",
                      border: droneZoom === z ? "1px solid rgba(245,158,11,0.5)" : "1px solid transparent",
                    }}
                  >
                    {z}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ASSIGN RESCUE TEAM MODAL ───────────────────────────────────────── */}
      {showAssignModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(3,6,15,0.8)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="rounded-2xl p-6 w-96 animate-slide-up border shadow-2xl"
            style={{ background: "#0c1322", borderColor: "rgba(6,182,212,0.3)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">ASSIGN RESCUE TEAM</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 text-slate-400"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs mb-4 text-slate-400">
              Select response unit for incident {selected.id}
            </p>
            <div className="space-y-2.5">
              {availableTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleExecuteDispatch(team.id)}
                  className="w-full text-left rounded-xl p-3 hover:bg-white/5 transition-colors cursor-pointer"
                  style={{ background: "rgba(20,30,58,0.6)", border: "1px solid #1a2640" }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-mono font-bold text-white">{team.name}</div>
                      <div className="text-xs mt-1 text-slate-400">
                        {team.vehicle} · Capacity: {team.capacity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-cyan-400">
                        ETA {team.etaMin}m
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {team.distanceKm} km
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── CALL CITIZEN MODAL ──────────────────────────────────────────────── */}
      {showCallModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(3,6,15,0.8)", backdropFilter: "blur(6px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCallModal(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl animate-slide-up border relative"
            style={{ background: "#0c1322", borderColor: "rgba(6,182,212,0.3)" }}
          >
            <button
              onClick={() => setShowCallModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)" }}
              >
                <Phone size={20} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">CITIZEN DISTRESS CALL</h3>
                <p className="text-xs font-mono text-slate-400">
                  Incident {selected.id} • {selected.location}
                </p>
              </div>
            </div>

            <div
              className="rounded-xl p-4 mb-4 space-y-2 text-xs"
              style={{ background: "rgba(18,28,48,0.7)", border: "1px solid #1a2640" }}
            >
              <div className="flex justify-between">
                <span className="text-slate-400">Reported Location</span>
                <span className="text-slate-200 font-mono">{selected.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trapped People</span>
                <span className="text-amber-400 font-mono font-bold">{selected.people} Citizens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Water Depth</span>
                <span className="text-red-400 font-mono font-bold">~{selected.waterDepthM}m</span>
              </div>
              <div className="flex justify-between border-t pt-2 border-slate-800">
                <span className="text-slate-400">Caller Phone</span>
                <span className="text-cyan-400 font-mono font-bold">+91 98765 43210</span>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href="tel:+919876543210"
                className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-lg shadow-cyan-500/20"
                style={{ background: "#06b6d4" }}
              >
                <Phone size={16} />
                DIAL CITIZEN DIRECTLY (+91 98765 43210)
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText("+91 98765 43210");
                  setCopiedPhone(true);
                  setTimeout(() => setCopiedPhone(false), 2500);
                }}
                className="w-full py-2.5 rounded-xl text-xs font-mono font-bold transition-colors flex items-center justify-center gap-2 hover:bg-white/5 cursor-pointer"
                style={{ border: "1px solid #1a2640", color: copiedPhone ? "#10b981" : "#8da0b8" }}
              >
                {copiedPhone ? (
                  <>
                    <Check size={14} className="text-emerald-400" /> COPIED PHONE NUMBER!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> COPY PHONE NUMBER
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
    )
  }
</div>
  );
}
