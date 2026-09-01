import { useState } from "react";
import {
  Shield,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  Phone,
  Share2,
  Navigation,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { shelters } from "../mockData";
import type { Shelter } from "../mockData";

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

export default function SheltersView() {
  const [selected, setSelected] = useState<Shelter>(shelters[0]);
  const [showAlert, setShowAlert] = useState(false);

  const occupancyPct = Math.round((selected.occupancy / selected.capacity) * 100);

  return (
    <div className="h-full flex overflow-hidden">
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
                className="w-full text-left rounded-xl p-3 transition-all"
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

      {/* Detail */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Alert banner */}
        {showAlert && (
          <div
            className="rounded-xl p-4 flex items-start gap-3 animate-slide-up animate-alert-critical"
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
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
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

        {/* Amenities */}
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

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: "#06b6d4" }}
          >
            <Navigation size={14} />
            NAVIGATE
          </button>
          <button
            className="px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-white/5 flex items-center gap-2"
            style={{ border: "1px solid #1a2640", color: "#8da0b8" }}
          >
            <Phone size={14} />
            CALL
          </button>
          <button
            className="px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-white/5 flex items-center gap-2"
            style={{ border: "1px solid #1a2640", color: "#8da0b8" }}
          >
            <Share2 size={14} />
            SHARE
          </button>
          <button
            onClick={() => setShowAlert(true)}
            className="px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
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
    </div>
  );
}
