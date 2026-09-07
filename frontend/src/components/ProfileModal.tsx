import React from "react";
import {
  X,
  UserCircle,
  Shield,
  ShieldCheck,
  Radio,
  MapPin,
  Clock,
  LogOut,
  Award,
  Users,
  CheckCircle,
  Activity,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { CityPreset } from "../services/cityDataGenerator";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCity?: CityPreset;
  onSwitchView?: (view: string) => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  activeCity,
  onSwitchView,
}: ProfileModalProps) {
  const { user, role, logout, switchRole } = useAuth();

  if (!isOpen) return null;

  const currentRole = role || "OPERATOR";

  const handleRoleSelect = (newRole: "OPERATOR" | "RESCUER" | "CITIZEN") => {
    switchRole(newRole);
    if (newRole === "CITIZEN") {
      onSwitchView?.("citizen");
    } else if (newRole === "RESCUER") {
      onSwitchView?.("field");
    } else {
      onSwitchView?.("overview");
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        background: "rgba(3, 6, 15, 0.75)",
        backdropFilter: "blur(8px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col border shadow-2xl animate-scale-up"
        style={{
          background: "#080d1c",
          borderColor: "#1a2640",
          boxShadow: "0 24px 60px rgba(0,0,0,0.8), 0 0 40px rgba(16,185,129,0.1)",
          maxHeight: "85vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "#1a2640", background: "rgba(12,19,34,0.7)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            >
              <UserCircle size={20} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-black tracking-wider text-white">
                OPERATIONAL PERSONNEL IDENTITY
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Authorized Emergency Command Responder
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Profile"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Identity ID Card */}
          <div
            className="p-5 rounded-2xl border relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0c1527 0%, #0d1a33 100%)",
              borderColor: "rgba(6,182,212,0.3)",
              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05)",
            }}
          >
            {/* Holographic Watermark Badge */}
            <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
              <Shield size={140} />
            </div>

            <div className="flex items-start gap-4">
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-cyan-400/40"
                  style={{
                    background: "linear-gradient(135deg, #14223c, #1b3158)",
                    boxShadow: "0 0 20px rgba(6,182,212,0.25)",
                  }}
                >
                  <UserCircle size={32} className="text-cyan-300" />
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#080d1c] bg-emerald-400"
                  title="Status: Active Duty"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white truncate">
                    {user?.name || "Commander V. Sharma"}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    {currentRole}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 truncate">
                  {user?.unitOrCity || "Patna Command Base · Ganges River Basin HQ"}
                </div>
                <div className="text-[11px] font-mono text-cyan-400/90 mt-1">
                  ID: <span className="text-white">HG-NDMA-2026-8814</span>
                </div>
              </div>
            </div>

            {/* Tactical Grid Info */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Radio Call-Sign</span>
                <span className="text-slate-200 font-bold flex items-center gap-1.5 mt-0.5">
                  <Radio size={12} className="text-emerald-400" />
                  DELTA-04 (156.8 MHz)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Clearance Level</span>
                <span className="text-slate-200 font-bold flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck size={12} className="text-cyan-400" />
                  Level-4 (Incident Commander)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Assigned Jurisdiction</span>
                <span className="text-slate-200 font-bold flex items-center gap-1.5 mt-0.5">
                  <MapPin size={12} className="text-amber-400" />
                  {activeCity?.name || "Patna"}, {activeCity?.state || "Bihar"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Shift Time</span>
                <span className="text-slate-200 font-bold flex items-center gap-1.5 mt-0.5">
                  <Clock size={12} className="text-cyan-400" />
                  04h 28m On-Duty
                </span>
              </div>
            </div>
          </div>

          {/* Quick Role Switcher */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex justify-between items-center">
              <span>Switch Operational Viewpoint</span>
              <span className="text-[9px] font-mono text-slate-500">RBAC SIMULATOR</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  role: "OPERATOR" as const,
                  title: "Commander",
                  desc: "HQ flood monitoring, dispatch & model control",
                  color: "#06b6d4",
                },
                {
                  role: "RESCUER" as const,
                  title: "NDRF Field Boat",
                  desc: "Field mobile UI, live SOS waypoint triage",
                  color: "#10b981",
                },
                {
                  role: "CITIZEN" as const,
                  title: "Citizen Portal",
                  desc: "Public distress beacon & safe shelter lookup",
                  color: "#f59e0b",
                },
              ].map((r) => {
                const isActive = currentRole === r.role;
                return (
                  <button
                    key={r.role}
                    onClick={() => handleRoleSelect(r.role)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isActive
                        ? "bg-white/10 border-white/40 shadow-md"
                        : "bg-[#0c1322] border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs font-bold"
                        style={{ color: isActive ? "#ffffff" : r.color }}
                      >
                        {r.title}
                      </span>
                      {isActive && <CheckCircle size={12} className="text-emerald-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">{r.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Capabilities Authorization */}
          <div
            className="p-4 rounded-xl border space-y-2"
            style={{ background: "#0c1322", borderColor: "#1a2640" }}
          >
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Authorized Operational Privileges
            </div>
            <div className="space-y-1.5 text-xs text-slate-300 font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />
                <span>Road Closure & Hydro Inundation Broadcast Authority</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />
                <span>NDRF & SDRF Fast-Response Unit Fleet Dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />
                <span>Satellite Live Overpass & P2P Mesh Network Override</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: "#1a2640", background: "rgba(12,19,34,0.7)" }}
        >
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut size={14} />
            Sign Out Session
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-mono font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
