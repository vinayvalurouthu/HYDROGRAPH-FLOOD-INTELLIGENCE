import { useState, useEffect } from "react";
import {
  Shield,
  MapPin,
  Clock,
  Phone,
  Share2,
  Navigation,
  AlertTriangle,
  CheckCircle,
  X,
  Copy,
  Check,
  UserCheck,
  Radio,
  CornerUpRight,
  Volume2,
  VolumeX,
  Pause,
  Play,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { shelters } from "../mockData";
import type { Shelter } from "../mockData";

interface SheltersViewProps {
  onNavigate?: (
    view: string,
    targetIdOrName?: string,
    customCoords?: { lat?: number; lng?: number; name?: string }
  ) => void;
}

function CapacityBar({ pct, status }: { pct: number; status: Shelter["status"] }) {
  const color =
    status === "NEAR_FULL" || pct > 90
      ? "#ef4444"
      : pct > 70
        ? "#f59e0b"
        : "#10b981";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "#1a2640" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

function AmenityPill({
  label,
  available,
}: {
  label: string;
  available: boolean;
}) {
  return (
    <span
      className="text-[10px] font-mono px-2 py-0.5 rounded"
      style={{
        background: available ? "rgba(16,185,129,0.12)" : "rgba(26,38,64,0.5)",
        color: available ? "#6ee7b7" : "#2a3a55",
        border: `1px solid ${available ? "rgba(16,185,129,0.25)" : "#1a2640"}`,
      }}
    >
      {available ? "✓ " : "✗ "}{label}
    </span>
  );
}

// ─── TACTICAL IN-APP NAVIGATION HUD COMPONENT ─────────────────────────────────
function TacticalNavView({
  shelter,
  onExit,
  onCallOfficer,
}: {
  shelter: Shelter;
  onExit: () => void;
  onCallOfficer: () => void;
}) {
  const [navProgress, setNavProgress] = useState(0.15); // 0.0 to 1.0
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Animate user movement along the route
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setNavProgress((prev) => (prev >= 1 ? 0.05 : prev + 0.008));
    }, 400);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Route path points (hazard-aware vector bypassing Moderate & High flood zones)
  const routePoints = [
    { x: 140, y: 360 }, // User start
    { x: 140, y: 210 }, // Turn up
    { x: 230, y: 210 }, // Turn right along Bailey Road West
    { x: 440, y: 210 }, // Continue along Bailey Road West
    { x: 700, y: 360 }, // Diagonal bypass around high flood zone
    { x: 700, y: 190 }, // Up to Central School corridor
    { x: 840, y: 190 }, // Destination: Central School
  ];

  // Interpolate vehicle position
  const totalSegs = routePoints.length - 1;
  const currSegIndex = Math.min(totalSegs - 1, Math.floor(navProgress * totalSegs));
  const segFrac = navProgress * totalSegs - currSegIndex;
  const pt1 = routePoints[currSegIndex];
  const pt2 = routePoints[currSegIndex + 1] || pt1;

  const vehicleX = pt1.x + (pt2.x - pt1.x) * segFrac;
  const vehicleY = pt1.y + (pt2.y - pt1.y) * segFrac;

  // Traveled path points SVG string
  const traveledPathD = routePoints
    .slice(0, currSegIndex + 1)
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ") + ` L ${vehicleX} ${vehicleY}`;

  // Complete hazard-avoidance route path SVG
  const fullRoutePathD = routePoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Derived stats
  const remainingKm = (shelter.distanceKm * (1 - navProgress)).toFixed(1);
  const remainingMin = Math.max(1, Math.round(shelter.etaMin * (1 - navProgress)));
  const nextTurnDistance = Math.round(271 * (1 - segFrac));

  return (
    <div className="relative w-full h-full bg-[#030712] overflow-hidden select-none flex flex-col font-sans">
      {/* ─── TOP HUD: TURN-BY-TURN BANNER ───────────────────────────────────── */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-2xl rounded-2xl p-4 flex items-center justify-between shadow-2xl backdrop-blur-xl z-30 animate-slide-down"
        style={{
          background: "linear-gradient(135deg, rgba(6,78,59,0.95), rgba(4,47,38,0.95))",
          border: "1px solid rgba(16,185,129,0.4)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.7), 0 0 30px rgba(16,185,129,0.15)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(16,185,129,0.25)",
              border: "1px solid rgba(16,185,129,0.5)",
              color: "#34d399",
            }}
          >
            <CornerUpRight size={26} />
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-300">
              IN {nextTurnDistance} METERS
            </div>
            <div className="text-lg font-extrabold text-white leading-tight">
              Proceed along Bailey Road West
            </div>
            <div className="text-xs font-medium text-emerald-200/80 flex items-center gap-1 mt-0.5">
              <span>→</span> Then head towards {shelter.name}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer hover:bg-white/10"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: isMuted ? "#fca5a5" : "#a7f3d0",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
            title={isMuted ? "Unmute Voice Guidance" : "Mute Voice Guidance"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <button
            onClick={onExit}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-lg shadow-red-500/30"
            style={{ background: "#ef4444", color: "#ffffff" }}
            title="Exit Tactical Navigation"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ─── MAIN MAP CANVAS (TACTICAL GRID & HAZARD LAYERS) ─────────────────── */}
      <div className="flex-1 w-full h-full relative">
        <svg
          className="w-full h-full"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Tactical Grid Pattern */}
            <pattern
              id="grid-pattern"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 80 0 L 0 0 0 80"
                fill="none"
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
            </pattern>
            {/* Glow Filter for Active Route */}
            <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Glow Filter for User Vehicle */}
            <filter id="user-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background & Tactical Grid */}
          <rect width="1000" height="600" fill="#030712" />
          <rect width="1000" height="600" fill="url(#grid-pattern)" />

          {/* Street / Corridor Labels */}
          <text x="230" y="195" fill="#475569" fontSize="11" fontFamily="monospace">
            Bailey Road West
          </text>
          <text x="500" y="195" fill="#475569" fontSize="11" fontFamily="monospace">
            North Arterial Corridor
          </text>
          <text x="500" y="380" fill="#475569" fontSize="11" fontFamily="monospace">
            Central Bypass Expressway
          </text>

          {/* ─── HAZARD POLYGONS ────────────────────────────────────────────── */}
          {/* 1. MODERATE FLOOD ZONE (Orange) */}
          <g>
            <rect
              x="300"
              y="310"
              width="230"
              height="130"
              rx="10"
              fill="rgba(180, 83, 9, 0.22)"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <text
              x="415"
              y="345"
              fill="#f59e0b"
              fontSize="12"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              MODERATE FLOOD ZONE
            </text>
          </g>

          {/* 2. FLOOD RISK HIGH (Red) */}
          <g>
            <rect
              x="560"
              y="140"
              width="360"
              height="280"
              rx="10"
              fill="rgba(220, 38, 38, 0.18)"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <text
              x="740"
              y="170"
              fill="#ef4444"
              fontSize="12"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              FLOOD RISK HIGH
            </text>
          </g>

          {/* ─── HAZARD-AWARE ROUTING PATH (Bypasses flood zones) ─────────────── */}
          {/* Full Planned Route (Dashed Emerald/Cyan) */}
          <path
            d={fullRoutePathD}
            fill="none"
            stroke="#10b981"
            strokeWidth="5"
            strokeDasharray="10 6"
            filter="url(#route-glow)"
          />

          {/* Traveled Route Segment (Solid Cyan Glow Trail) */}
          <path
            d={traveledPathD}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#route-glow)"
          />

          {/* ─── SHELTER & DESTINATION MARKERS ──────────────────────────────── */}
          {/* Shelter SH-03 Marker */}
          <g transform="translate(440, 490)">
            <circle r="10" fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth="1.5" />
            <text x="0" y="4" fill="#10b981" fontSize="10" textAnchor="middle">⛺</text>
            <text x="0" y="24" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">
              Shelter SH-03
            </text>
          </g>

          {/* Destination Hub Marker */}
          <g transform="translate(840, 360)">
            <circle r="12" fill="rgba(6,182,212,0.2)" stroke="#06b6d4" strokeWidth="1.5" />
            <text x="0" y="4" fill="#06b6d4" fontSize="10" textAnchor="middle">★</text>
            <text x="0" y="24" fill="#06b6d4" fontSize="10" fontFamily="monospace" textAnchor="middle">
              Destination Hub
            </text>
          </g>

          {/* Central School (Selected Target Shelter) */}
          <g transform="translate(840, 190)">
            <circle r="16" fill="rgba(16,185,129,0.25)" stroke="#10b981" strokeWidth="2" />
            <circle r="10" fill="#10b981" />
            <text x="0" y="4" fill="#ffffff" fontSize="10" textAnchor="middle">★</text>
            <text
              x="0"
              y="32"
              fill="#6ee7b7"
              fontSize="12"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              CENTRAL SCHOOL
            </text>
          </g>

          {/* ─── USER VEHICLE MARKER & SPEED BADGE ──────────────────────────── */}
          <g transform={`translate(${vehicleX}, ${vehicleY})`}>
            {/* Pulsing Aura Ring */}
            <circle r="22" fill="rgba(6,182,212,0.2)" stroke="#06b6d4" strokeWidth="2" filter="url(#user-glow)" />
            <circle r="10" fill="#06b6d4" />
            {/* Heading Arrow */}
            <polygon points="0,-7 -5,5 5,5" fill="#ffffff" />

            {/* Floating Speed Badge */}
            <g transform="translate(-65, -34)">
              <rect
                width="62"
                height="22"
                rx="6"
                fill="rgba(6,182,212,0.25)"
                stroke="#06b6d4"
                strokeWidth="1"
              />
              <text
                x="31"
                y="15"
                fill="#22d3ee"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                38 KM/H
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* ─── BOTTOM HUD: TRIP STATUS PANEL ───────────────────────────────────── */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-4xl rounded-2xl p-4 flex items-center justify-between shadow-2xl backdrop-blur-xl z-30 animate-slide-up"
        style={{
          background: "rgba(8,13,28,0.95)",
          border: "1px solid #1a2640",
          boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
        }}
      >
        {/* Remaining Time & ETA */}
        <div className="flex items-baseline gap-3">
          <div>
            <span className="text-3xl font-mono font-black text-emerald-400 leading-none">
              {remainingMin}
            </span>
            <span className="text-sm font-mono font-bold text-emerald-300 ml-1.5 uppercase">
              MIN
            </span>
          </div>
          <div className="text-xs font-mono text-slate-400 border-l pl-3 border-slate-800">
            {remainingKm} km left • ETA 08:58 am
          </div>
        </div>

        {/* Flood Avoidance Active Badge */}
        <div
          className="px-4 py-2 rounded-xl flex items-center gap-2.5"
          style={{
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.3)",
          }}
        >
          <ShieldCheck size={20} className="text-emerald-400 animate-pulse" />
          <div>
            <div className="text-xs font-mono font-bold text-emerald-300 tracking-wider">
              FLOOD AVOIDANCE ACTIVE
            </div>
            <div className="text-[10px] text-emerald-400/70">
              Antigravity Route Clear
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-white flex items-center gap-2 transition-colors cursor-pointer hover:bg-white/10"
            style={{ background: "#1e293b", border: "1px solid #334155" }}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? "RESUME" : "PAUSE"}
          </button>

          <button
            onClick={onCallOfficer}
            className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-cyan-300 flex items-center gap-2 transition-colors cursor-pointer hover:bg-cyan-500/10"
            style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.4)" }}
          >
            <Phone size={14} />
            CALL OFFICER
          </button>

          <button
            onClick={onExit}
            className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold text-white flex items-center gap-2 transition-all hover:opacity-90 cursor-pointer shadow-lg shadow-red-500/20"
            style={{ background: "#ef4444" }}
          >
            <X size={14} />
            EXIT
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN SHELTERS VIEW ───────────────────────────────────────────────────────
export default function SheltersView({ onNavigate }: SheltersViewProps) {
  const [selected, setSelected] = useState<Shelter>(shelters[0]);
  const [showAlert, setShowAlert] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [isTacticalNavActive, setIsTacticalNavActive] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [sharedSuccess, setSharedSuccess] = useState(false);

  const occupancyPct = Math.round((selected.occupancy / selected.capacity) * 100);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowCallModal(false);
        setIsTacticalNavActive(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const phoneNum = selected.phone || "+91 612 289 9023";
  const cleanPhone = phoneNum.replace(/\s+/g, "");
  const officerName = selected.contactOfficer || "Prof. S. N. Singh";
  const officerRole = selected.officerRole || "Camp Director & Nodal Officer";

  // Trigger Direct Tactical Navigation HUD
  const handlePrimaryNavigate = () => {
    setIsTacticalNavActive(true);
    if (onNavigate) {
      onNavigate("routing", selected.name, {
        lat: selected.lat,
        lng: selected.lng,
        name: selected.name,
      });
    }
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(phoneNum);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const handleShare = () => {
    const text = `HydroGraph Relief Shelter: ${selected.name} (${selected.address}) - Coordinates: ${selected.lat}, ${selected.lng}. Contact: ${phoneNum}`;
    if (navigator.share) {
      navigator.share({ title: selected.name, text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setSharedSuccess(true);
      setTimeout(() => setSharedSuccess(false), 2500);
    }
  };

  // If Tactical Navigation Mode is active, render Full-Screen Tactical Nav HUD directly
  if (isTacticalNavActive) {
    return (
      <TacticalNavView
        shelter={selected}
        onExit={() => setIsTacticalNavActive(false)}
        onCallOfficer={() => setShowCallModal(true)}
      />
    );
  }

  return (
    <div className="h-full flex overflow-hidden relative">
      {/* Shelter list */}
      <div
        className="w-72 flex-shrink-0 border-r overflow-y-auto"
        style={{ borderColor: "#1a2640" }}
      >
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #1a2640" }}>
          <h2 className="text-sm font-bold text-white">SHELTERS</h2>
          <p className="text-[11px] mt-0.5" style={{ color: "#4a6080" }}>
            {shelters.filter((s) => s.status === "OPEN").length} open ·{" "}
            {shelters.filter((s) => s.status === "NEAR_FULL").length} near full
          </p>
        </div>

        <div className="p-3 space-y-2">
          {shelters.map((s) => {
            const pct = Math.round((s.occupancy / s.capacity) * 100);
            const isSelected = selected.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="w-full text-left rounded-xl p-3 transition-all cursor-pointer"
                style={{
                  background: isSelected
                    ? "rgba(6,182,212,0.08)"
                    : "rgba(12,19,34,0.5)",
                  border: `1px solid ${isSelected ? "rgba(6,182,212,0.3)" : "#1a2640"}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white truncate flex-1 mr-2">
                    {s.name}
                    {s.recommended && (
                      <span
                        className="ml-2 text-[9px] px-1.5 py-0.5 rounded font-mono"
                        style={{ background: "rgba(6,182,212,0.15)", color: "#22d3ee" }}
                      >
                        REC
                      </span>
                    )}
                  </span>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{
                      background:
                        s.status === "OPEN"
                          ? "rgba(16,185,129,0.12)"
                          : s.status === "NEAR_FULL"
                            ? "rgba(239,68,68,0.12)"
                            : "rgba(245,158,11,0.12)",
                      color:
                        s.status === "OPEN"
                          ? "#6ee7b7"
                          : s.status === "NEAR_FULL"
                            ? "#fca5a5"
                            : "#fde68a",
                    }}
                  >
                    {s.status.replace("_", " ")}
                  </span>
                </div>
                <div className="text-[10px] mb-2 flex items-center gap-1" style={{ color: "#4a6080" }}>
                  <MapPin size={9} />
                  {s.distanceKm} km · {s.etaMin} min
                </div>
                <CapacityBar pct={pct} status={s.status} />
                <div className="mt-1.5 flex items-center gap-1">
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background:
                        s.floodRisk === "LOW"
                          ? "rgba(16,185,129,0.1)"
                          : "rgba(245,158,11,0.1)",
                      color: s.floodRisk === "LOW" ? "#6ee7b7" : "#fde68a",
                    }}
                  >
                    Flood: {s.floodRisk}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Toast alerts */}
        {sharedSuccess && (
          <div
            className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-white flex items-center gap-2 shadow-2xl animate-slide-down"
            style={{ background: "#10b981", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <Check size={14} /> Shelter link & contact copied to clipboard!
          </div>
        )}

        {/* Alert banner */}
        {showAlert && (
          <div
            className="rounded-xl p-4 flex items-start gap-3 animate-slide-up"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.4)" }}
          >
            <AlertTriangle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />
            <div className="flex-1">
              <div className="text-sm font-bold text-white">SHELTER STATUS CHANGE</div>
              <div className="text-xs mt-0.5" style={{ color: "#fca5a5" }}>
                {selected.name} — Flood risk: LOW → HIGH
              </div>
              <div className="text-xs mt-1" style={{ color: "#4a6080" }}>
                Recommended: STOP NEW ARRIVALS. Routing updated for citizens.
              </div>
            </div>
            <button
              onClick={() => setShowAlert(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: "#ef4444" }}
            >
              MARK UNAVAILABLE
            </button>
          </div>
        )}

        {/* Header */}
        <div
          className="rounded-xl p-4 animate-slide-up"
          style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {selected.name}
                {selected.recommended && (
                  <span
                    className="text-xs font-mono px-2 py-1 rounded-full"
                    style={{ background: "rgba(6,182,212,0.15)", color: "#22d3ee" }}
                  >
                    RECOMMENDED
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: "#4a6080" }}>
                <MapPin size={12} />
                {selected.address}
              </div>
            </div>
            <div
              className="text-sm font-mono font-bold px-3 py-1.5 rounded-lg"
              style={{
                background:
                  selected.status === "OPEN"
                    ? "rgba(16,185,129,0.15)"
                    : selected.status === "NEAR_FULL"
                      ? "rgba(239,68,68,0.15)"
                      : "rgba(245,158,11,0.15)",
                color:
                  selected.status === "OPEN"
                    ? "#6ee7b7"
                    : selected.status === "NEAR_FULL"
                      ? "#fca5a5"
                      : "#fde68a",
              }}
            >
              {selected.status.replace("_", " ")}
            </div>
          </div>

          {/* Capacity visual */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: "#4a6080" }}>Occupancy</span>
              <span className="font-mono text-white">
                {selected.occupancy} / {selected.capacity}
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "#1a2640" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${occupancyPct}%`,
                  background:
                    occupancyPct > 90
                      ? "linear-gradient(90deg, #f97316, #ef4444)"
                      : occupancyPct > 70
                        ? "linear-gradient(90deg, #f59e0b, #f97316)"
                        : "linear-gradient(90deg, #10b981, #14b8a6)",
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] font-mono" style={{ color: "#4a6080" }}>0</span>
              <span
                className="text-[10px] font-mono font-bold"
                style={{
                  color: occupancyPct > 90 ? "#ef4444" : occupancyPct > 70 ? "#f59e0b" : "#10b981",
                }}
              >
                {occupancyPct}% FULL
              </span>
              <span className="text-[10px] font-mono" style={{ color: "#4a6080" }}>100%</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Distance", value: `${selected.distanceKm} km`, icon: MapPin },
              { label: "ETA", value: `${selected.etaMin} min`, icon: Clock },
              {
                label: "Flood Risk",
                value: selected.floodRisk,
                icon: Shield,
                color:
                  selected.floodRisk === "LOW"
                    ? "#10b981"
                    : selected.floodRisk === "MODERATE"
                      ? "#f59e0b"
                      : "#ef4444",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg p-2 text-center"
                style={{ background: "rgba(20,30,58,0.5)", border: "1px solid #1a2640" }}
              >
                <div className="text-[10px] mb-1" style={{ color: "#4a6080" }}>
                  {s.label}
                </div>
                <div
                  className="text-sm font-mono font-bold"
                  style={{ color: s.color || "#f0f4ff" }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── RELIEF LOGISTICS & SUPPLIES DEPOT ────────────────────────────── */}
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: "rgba(12,19,34,0.85)", border: "1px solid #1a2640" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
              RELIEF LOGISTICS & SUPPLIES DEPOT
            </h3>
            <button
              onClick={() => {
                setSharedSuccess(true);
                setTimeout(() => setSharedSuccess(false), 3000);
              }}
              className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer transition-all flex items-center gap-1"
            >
              <Truck size={12} /> DISPATCH RESUPPLY TRUCK
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            {/* Water */}
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
              <div className="flex justify-between mb-1 text-[10px] text-slate-400">
                <span>🚰 DRINKING WATER</span>
                <span className="text-cyan-400 font-bold">84%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: "84%" }} />
              </div>
              <div className="text-[10px] text-white font-bold">4,200 L / 5,000 L</div>
            </div>

            {/* Food */}
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
              <div className="flex justify-between mb-1 text-[10px] text-slate-400">
                <span>🍞 RATIONS & MEALS</span>
                <span className="text-amber-400 font-bold">62%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: "62%" }} />
              </div>
              <div className="text-[10px] text-white font-bold">1,250 Meals</div>
            </div>

            {/* Medical */}
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
              <div className="flex justify-between mb-1 text-[10px] text-slate-400">
                <span>💊 MEDICAL KITS</span>
                <span className="text-emerald-400 font-bold">96%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: "96%" }} />
              </div>
              <div className="text-[10px] text-white font-bold">48 Emergency Kits</div>
            </div>

            {/* Generator Fuel */}
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
              <div className="flex justify-between mb-1 text-[10px] text-slate-400">
                <span>⚡ GENERATOR DIESEL</span>
                <span className="text-purple-400 font-bold">78%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-purple-400 h-full rounded-full" style={{ width: "78%" }} />
              </div>
              <div className="text-[10px] text-white font-bold">390 Liters</div>
            </div>
          </div>
        </div>

        {/* Facilities & Amenities */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
        >
          <h3 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#4a6080" }}>
            Facilities & Amenities
          </h3>
          <div className="flex flex-wrap gap-2">
            <AmenityPill label="Medical" available={selected.medical} />
            <AmenityPill label="Food" available={selected.food} />
            <AmenityPill label="Water" available={selected.water} />
            <AmenityPill label="Power" available={selected.power} />
            <AmenityPill label="Accessibility" available={selected.accessibility} />
          </div>
          <div className="mt-2 text-[10px]" style={{ color: "#2a3a55" }}>
            Last updated: {selected.lastUpdated}
          </div>
        </div>

        {/* ─── ACTION BUTTONS (NAVIGATE & CALL) ─────────────────────────────────── */}
        <div className="flex gap-2">
          {/* NAVIGATE BUTTON (Cyan Primary Action - Triggers Tactical HUD) */}
          <button
            onClick={handlePrimaryNavigate}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99] cursor-pointer shadow-lg shadow-cyan-500/10"
            style={{ background: "#06b6d4" }}
            aria-label={`Navigate to ${selected.name}`}
          >
            <Navigation size={15} className="animate-pulse" />
            NAVIGATE
          </button>

          {/* CALL BUTTON (Secondary Action - Opens Call Modal) */}
          <button
            onClick={() => setShowCallModal(true)}
            className="px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/5 cursor-pointer flex items-center gap-2 active:scale-[0.98]"
            style={{ border: "1px solid #1a2640", color: "#8da0b8" }}
            aria-label={`View call details for ${selected.name}`}
          >
            <Phone size={14} className="text-cyan-400" />
            CALL
          </button>

          {/* SHARE BUTTON */}
          <button
            onClick={handleShare}
            className="px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/5 cursor-pointer flex items-center gap-2 active:scale-[0.98]"
            style={{ border: "1px solid #1a2640", color: "#8da0b8" }}
            aria-label={`Share ${selected.name} info`}
          >
            <Share2 size={14} />
            SHARE
          </button>

          {/* FLAG UNSAFE BUTTON */}
          <button
            onClick={() => setShowAlert(true)}
            className="px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-2 hover:bg-red-500/10 active:scale-[0.98]"
            style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
            aria-label={`Flag ${selected.name} as unsafe`}
          >
            <AlertTriangle size={14} />
            FLAG UNSAFE
          </button>
        </div>

        {/* Why recommended box */}
        {selected.recommended && (
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)" }}
          >
            <h3 className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "#22d3ee" }}>
              Why Recommended?
            </h3>
            {[
              "Lowest flood exposure of all open shelters",
              "Route safety: HIGH",
              "Most available capacity (40% used)",
              "Full medical support on-site",
            ].map((r) => (
              <div key={r} className="flex items-center gap-2 py-1">
                <CheckCircle size={12} className="text-teal-400 flex-shrink-0" />
                <span className="text-xs text-white">{r}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── CALL DETAILS MODAL ─────────────────────────────────────────────── */}
      {showCallModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(3,6,15,0.75)", backdropFilter: "blur(6px)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="call-modal-title"
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
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close call modal"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)" }}
              >
                <Phone size={20} style={{ color: "#22d3ee" }} />
              </div>
              <div>
                <h3 id="call-modal-title" className="text-base font-bold text-white">
                  CALL DETAILS & HELPLINE
                </h3>
                <p className="text-xs font-mono" style={{ color: "#4a6080" }}>
                  {selected.name}
                </p>
              </div>
            </div>

            {/* Officer Contact Card */}
            <div
              className="rounded-xl p-4 mb-4"
              style={{ background: "rgba(18,28,48,0.7)", border: "1px solid #1a2640" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
                  >
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{officerName}</div>
                    <div className="text-[11px]" style={{ color: "#8da0b8" }}>
                      {officerRole}
                    </div>
                  </div>
                </div>
                <span
                  className="text-[9px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: "rgba(16,185,129,0.15)", color: "#6ee7b7" }}
                >
                  <Radio size={8} className="animate-pulse text-emerald-400" />
                  24/7 ACTIVE
                </span>
              </div>

              <div className="space-y-1.5 text-xs pt-2 border-t" style={{ borderColor: "#1a2640" }}>
                <div className="flex justify-between">
                  <span style={{ color: "#4a6080" }}>Shelter Location</span>
                  <span className="text-slate-200 font-mono">{selected.address}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#4a6080" }}>Distance / ETA</span>
                  <span className="text-slate-200 font-mono">
                    {selected.distanceKm} km · {selected.etaMin} min ETA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#4a6080" }}>Direct Helpline</span>
                  <span className="text-cyan-400 font-mono font-bold">{phoneNum}</span>
                </div>
              </div>
            </div>

            {/* Direct Dial Tel Link & Copy Action */}
            <div className="space-y-2 mb-4">
              <a
                href={`tel:${cleanPhone}`}
                className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99] shadow-lg shadow-cyan-500/20"
                style={{ background: "#06b6d4" }}
              >
                <Phone size={16} />
                DIAL DIRECTLY NOW ({phoneNum})
              </a>

              <button
                onClick={handleCopyPhone}
                className="w-full py-2.5 rounded-xl text-xs font-mono font-bold transition-colors flex items-center justify-center gap-2 hover:bg-white/5 cursor-pointer"
                style={{ border: "1px solid #1a2640", color: copiedPhone ? "#10b981" : "#8da0b8" }}
              >
                {copiedPhone ? (
                  <>
                    <Check size={14} /> COPIED PHONE NUMBER!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> COPY PHONE NUMBER
                  </>
                )}
              </button>
            </div>

            {/* Emergency Central Control Room Fallback */}
            <div
              className="rounded-xl p-3 text-xs"
              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              <div className="font-bold mb-1" style={{ color: "#fde68a" }}>
                District Flood Control Room Fallback
              </div>
              <div className="text-[11px] flex justify-between items-center" style={{ color: "#8da0b8" }}>
                <span>State Emergency Helpline:</span>
                <a
                  href="tel:1070"
                  className="font-mono font-bold text-amber-300 underline hover:text-amber-200"
                >
                  1070
                </a>
              </div>
              <div className="text-[11px] flex justify-between items-center mt-1" style={{ color: "#8da0b8" }}>
                <span>National Emergency Response:</span>
                <a
                  href="tel:112"
                  className="font-mono font-bold text-amber-300 underline hover:text-amber-200"
                >
                  112
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
