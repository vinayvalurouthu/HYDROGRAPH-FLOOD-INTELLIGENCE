import { useState } from "react";
import { Navigation, MapPin, Clock, Shield, ChevronRight, CheckCircle, AlertTriangle } from "lucide-react";

const routes = [
  {
    id: "R1",
    label: "RECOMMENDED",
    type: "SAFEST",
    eta: 18,
    distanceKm: 5.2,
    floodExposure: "LOW" as const,
    avoidedRoads: 3,
    color: "#10b981",
    why: [
      "Avoids severe flood zones",
      "Avoids predicted road closures",
      "Lowest flood exposure",
      "Shelter available nearby",
    ],
  },
  {
    id: "R2",
    label: "ALTERNATIVE",
    type: "FASTER",
    eta: 14,
    distanceKm: 4.1,
    floodExposure: "MODERATE" as const,
    avoidedRoads: 1,
    color: "#f59e0b",
    why: [
      "Shorter distance",
      "Passes near moderate flood zone",
      "Higher risk if conditions worsen",
    ],
  },
];

const exposureColor = { LOW: "#10b981", MODERATE: "#f59e0b", HIGH: "#f97316", SEVERE: "#ef4444" };

export default function RoutingView() {
  const [from, setFrom] = useState("Current Location");
  const [to, setTo] = useState("");
  const [calculated, setCalculated] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState("R1");
  const [showWhy, setShowWhy] = useState<string | null>(null);
  const [routeAlert, setRouteAlert] = useState(false);
  const [routeChanged, setRouteChanged] = useState(false);

  const handleCalculate = async () => {
    if (!to.trim()) return;
    setCalculating(true);
    await new Promise((r) => setTimeout(r, 1600));
    setCalculated(true);
    setCalculating(false);
    setTimeout(() => setRouteAlert(true), 4000);
  };

  const handleRecalculate = () => {
    setRouteAlert(false);
    setRouteChanged(true);
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Controls */}
      <div
        className="w-80 flex-shrink-0 border-r flex flex-col overflow-y-auto"
        style={{ borderColor: "#1a2640" }}
      >
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #1a2640" }}>
          <h2 className="text-sm font-bold text-white">FIND SAFE ROUTE</h2>
          <p className="text-[11px] mt-0.5" style={{ color: "#4a6080" }}>
            Flood-aware routing prioritizes safety
          </p>
        </div>

        <div className="p-4 space-y-3 flex-1">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider mb-1 block" style={{ color: "#4a6080" }}>
              FROM
            </label>
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2.5"
              style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
            >
              <MapPin size={13} style={{ color: "#10b981" }} />
              <span className="text-xs text-white">{from}</span>
              <span className="text-[10px] font-mono ml-auto" style={{ color: "#4a6080" }}>
                GPS
              </span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider mb-1 block" style={{ color: "#4a6080" }}>
              TO
            </label>
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2.5"
              style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
            >
              <MapPin size={13} style={{ color: "#06b6d4" }} />
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Enter destination…"
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-[#2a3a55]"
                style={{ color: "#f0f4ff", fontFamily: "Inter" }}
              />
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={calculating || !to.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "#06b6d4" }}
          >
            {calculating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                CALCULATING…
              </>
            ) : (
              <>
                <Navigation size={14} />
                FIND SAFEST ROUTE
              </>
            )}
          </button>

          {calculated && (
            <div className="space-y-2 animate-slide-up">
              {routes.map((r) => {
                const isSelected = selectedRoute === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoute(r.id)}
                    className="w-full text-left rounded-xl p-3 transition-all"
                    style={{
                      background: isSelected ? `${r.color}10` : "rgba(12,19,34,0.5)",
                      border: `1px solid ${isSelected ? r.color + "50" : "#1a2640"}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                        style={{ background: `${r.color}20`, color: r.color }}
                      >
                        {r.label}
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: "#4a6080" }}>
                        {r.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-mono font-black" style={{ color: "#f0f4ff" }}>
                          {r.eta} min
                        </div>
                        <div className="text-[10px] font-mono" style={{ color: "#4a6080" }}>
                          {r.distanceKm} km
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className="text-xs font-mono font-bold"
                          style={{ color: exposureColor[r.floodExposure] }}
                        >
                          Exposure: {r.floodExposure}
                        </div>
                        <div className="text-[10px]" style={{ color: "#4a6080" }}>
                          Avoided {r.avoidedRoads} risk roads
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowWhy(showWhy === r.id ? null : r.id);
                      }}
                      className="mt-2 text-[10px] font-mono flex items-center gap-1 hover:text-cyan-400 transition-colors"
                      style={{ color: "#4a6080" }}
                    >
                      WHY THIS ROUTE? <ChevronRight size={10} style={{ transform: showWhy === r.id ? "rotate(90deg)" : undefined, transition: "transform 0.2s" }} />
                    </button>

                    {showWhy === r.id && (
                      <div className="mt-2 space-y-1 animate-slide-up">
                        {r.why.map((w) => (
                          <div key={w} className="flex items-center gap-1.5">
                            <CheckCircle size={10} style={{ color: r.color }} />
                            <span className="text-[11px] text-white">{w}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}

              {routeChanged && (
                <div
                  className="rounded-lg px-3 py-2 flex items-center gap-2 animate-slide-up"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}
                >
                  <CheckCircle size={12} style={{ color: "#10b981" }} />
                  <span className="text-xs" style={{ color: "#6ee7b7" }}>
                    Safer route calculated
                  </span>
                </div>
              )}

              <button
                className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: "#10b981" }}
              >
                <Navigation size={14} />
                START NAVIGATION
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative overflow-hidden map-grid" style={{ background: "#07111e" }}>
        {/* Route changed alert */}
        {routeAlert && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-3 rounded-xl animate-slide-up"
            style={{
              background: "rgba(245,158,11,0.15)",
              border: "1px solid rgba(245,158,11,0.5)",
              minWidth: 340,
            }}
          >
            <AlertTriangle size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
            <div className="flex-1">
              <div className="text-xs font-bold text-white">ROUTE CONDITIONS CHANGED</div>
              <div className="text-[11px]" style={{ color: "#d97706" }}>
                Road ahead predicted to become severe in 12 min.
              </div>
            </div>
            <button
              onClick={handleRecalculate}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white flex-shrink-0"
              style={{ background: "#06b6d4" }}
            >
              RECALCULATE
            </button>
          </div>
        )}

        <svg viewBox="0 0 700 500" width="100%" height="100%">
          {/* City streets */}
          <line x1="60" y1="170" x2="640" y2="170" stroke="#1e3050" strokeWidth="2" />
          <line x1="60" y1="270" x2="640" y2="270" stroke="#1e3050" strokeWidth="2" />
          <line x1="60" y1="380" x2="640" y2="380" stroke="#1e3050" strokeWidth="2" />
          <line x1="150" y1="60" x2="150" y2="440" stroke="#1e3050" strokeWidth="2" />
          <line x1="300" y1="60" x2="300" y2="440" stroke="#1e3050" strokeWidth="2" />
          <line x1="480" y1="60" x2="480" y2="440" stroke="#1e3050" strokeWidth="2" />
          <line x1="610" y1="60" x2="610" y2="440" stroke="#1e3050" strokeWidth="2" />

          {/* Flood zones */}
          <rect x="380" y="150" width="260" height="140" fill="rgba(239,68,68,0.3)" rx="4" />
          <rect x="200" y="250" width="160" height="100" fill="rgba(249,115,22,0.25)" rx="4" />

          {/* Blocked roads indicator */}
          <line x1="380" y1="170" x2="640" y2="170" stroke="#ef4444" strokeWidth="4" strokeDasharray="8 6" opacity="0.7" />
          <text x="500" y="160" fill="#ef4444" fontSize="9" fontFamily="JetBrains Mono">FLOOD RISK HIGH</text>

          {calculated && (
            <>
              {/* Safe route */}
              <path
                d="M 80 400 L 80 270 L 150 270 L 150 170 L 300 170 L 480 270 L 580 270"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeDasharray="10 5"
                strokeLinecap="round"
              />
              <text x="240" y="245" fill="#10b981" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                SAFE ROUTE
              </text>

              {/* Current location */}
              <circle cx="80" cy="400" r="10" fill="rgba(6,182,212,0.3)" stroke="#06b6d4" strokeWidth="2" />
              <circle cx="80" cy="400" r="4" fill="#06b6d4" />
              <text x="80" y="422" textAnchor="middle" fill="#22d3ee" fontSize="9" fontFamily="JetBrains Mono">YOU</text>

              {/* Destination */}
              <circle cx="580" cy="270" r="10" fill="rgba(16,185,129,0.3)" stroke="#10b981" strokeWidth="2" />
              <text x="580" y="274" textAnchor="middle" fill="#10b981" fontSize="12">★</text>
              <text x="580" y="290" textAnchor="middle" fill="#6ee7b7" fontSize="9" fontFamily="JetBrains Mono">DEST</text>

              {/* Shelter nearby */}
              <circle cx="300" cy="380" r="8" fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth="1.5" />
              <text x="300" y="384" textAnchor="middle" fill="#10b981" fontSize="10">⛺</text>
              <text x="300" y="398" textAnchor="middle" fill="#6ee7b7" fontSize="8" fontFamily="JetBrains Mono">Shelter</text>
            </>
          )}

          {!calculated && (
            <text x="350" y="250" textAnchor="middle" fill="#2a3a55" fontSize="14" fontFamily="JetBrains Mono">
              Enter destination to calculate safe route
            </text>
          )}
        </svg>

        {/* Route legend */}
        {calculated && (
          <div
            className="absolute bottom-4 left-4 rounded-xl p-3 animate-fade-in"
            style={{ background: "rgba(7,17,30,0.9)", border: "1px solid #1a2640" }}
          >
            <div className="space-y-1.5">
              {[
                { color: "#10b981", dash: false, label: "Safe Route" },
                { color: "#ef4444", dash: true, label: "Flood Risk / Blocked" },
                { color: "#06b6d4", dash: false, label: "Current Location" },
                { color: "#f59e0b", dash: false, label: "Moderate Risk" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <div
                    className="w-6 h-0.5 rounded"
                    style={{
                      background: l.color,
                      borderTop: l.dash ? `2px dashed ${l.color}` : undefined,
                      height: l.dash ? 0 : undefined,
                    }}
                  />
                  <span className="text-[10px] font-mono" style={{ color: "#8da0b8" }}>
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
