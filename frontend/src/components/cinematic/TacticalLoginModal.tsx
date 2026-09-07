import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Shield,
  KeyRound,
  User,
  Radio,
  Building2,
  ArrowRight,
  ShieldAlert,
  Waves,
  Lock,
  RotateCcw,
  CheckCircle2,
  Cpu,
} from "lucide-react";
import { playSynthesizedChime } from "../../context/SettingsContext";

interface TacticalLoginModalProps {
  onReplayIntro?: () => void;
}

export default function TacticalLoginModal({ onReplayIntro }: TacticalLoginModalProps) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("operator@hydrograph.gov");
  const [password, setPassword] = useState("admin123");
  const [selectedRole, setSelectedRole] = useState<"OPERATOR" | "RESCUER" | "CITIZEN">("OPERATOR");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleSelect = (role: "OPERATOR" | "RESCUER" | "CITIZEN") => {
    setSelectedRole(role);
    setErrorMessage(null);
    playSynthesizedChime(640, 0.1);
    if (role === "OPERATOR") {
      setUsername("operator@hydrograph.gov");
      setPassword("admin123");
    } else if (role === "RESCUER") {
      setUsername("rescue04@hydrograph.gov");
      setPassword("rescue123");
    } else if (role === "CITIZEN") {
      setUsername("citizen@hydrograph.gov");
      setPassword("sos123");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErrorMessage(null);
    playSynthesizedChime(880, 0.2);

    try {
      const loggedUser = await login(username, password);
      // Route based on role
      switch (loggedUser.role) {
        case "OPERATOR":
          navigate("/operator");
          break;
        case "RESCUER":
          navigate("/rescue");
          break;
        case "CITIZEN":
          navigate("/citizen");
          break;
        default:
          navigate("/operator");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Tactical authentication failed. Please verify credentials.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 font-mono select-none overflow-y-auto">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg rounded-2xl overflow-hidden backdrop-blur-2xl bg-slate-950/85 border border-cyan-500/40 p-6 md:p-8 space-y-6 shadow-[0_20px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(6,182,212,0.15)] relative z-10"
      >
        {/* TOP STATUS BADGE & REPLAY INTRO */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              DEFENSE NODE // ACTIVE
            </span>
          </div>

          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
              title="Replay 3D Cinematic Opening"
            >
              <RotateCcw size={11} />
              <span>Replay Intro</span>
            </button>
          )}
        </div>

        {/* BRANDING HEADER */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 rounded-xl flex items-center justify-center mx-auto text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <Waves className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black tracking-wider text-white">
            HYDROGRAPH <span className="text-cyan-400">FLOOD INTELLIGENCE</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            MUNICIPAL DISASTER RESPONSE &amp; TELEMETRY COMMAND BASE
          </p>
        </div>

        {/* ROLE SELECTION TABS */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            SELECT DISASTER RESPONSE ROLE
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                role: "OPERATOR" as const,
                label: "LOGIN AS OPERATOR",
                sub: "Municipal Command",
                icon: Building2,
              },
              {
                role: "RESCUER" as const,
                label: "LOGIN AS RESCUER",
                sub: "NDRF Taskforce",
                icon: Radio,
              },
              {
                role: "CITIZEN" as const,
                label: "LOGIN AS CITIZEN",
                sub: "Emergency Relay",
                icon: ShieldAlert,
              },
            ].map(({ role, label, sub, icon: Icon }) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center text-center ${
                  selectedRole === role
                    ? "bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)] font-bold"
                    : "bg-[#10182c] border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <Icon
                  size={16}
                  className={selectedRole === role ? "text-cyan-300 mb-1" : "text-slate-500 mb-1"}
                />
                <div className="text-[10px] font-bold tracking-tight">{label}</div>
                <div className="text-[8px] text-slate-500">{sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/60 text-red-300 text-xs flex items-center gap-2">
              <ShieldAlert size={14} className="text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* OPERATOR ID */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              OPERATOR ID / CLEARANCE IDENTIFIER
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="operator@hydrograph.gov"
                className="w-full bg-[#0c1426] border border-cyan-500/30 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors shadow-inner"
              />
            </div>
          </div>

          {/* SECURITY PASSCODE */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              TACTICAL PASSCODE / CIPHER
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0c1426] border border-cyan-500/30 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors shadow-inner"
              />
            </div>
          </div>

          {/* AUTHENTICATE BUTTON */}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 rounded-xl font-black text-xs tracking-wider uppercase bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoggingIn ? (
              <span>VERIFYING CRYPTOGRAPHIC TOKEN...</span>
            ) : (
              <>
                <span>AUTHENTICATE &amp; ENTER PORTAL</span>
                <ArrowRight size={14} className="text-black" />
              </>
            )}
          </button>
        </form>

        {/* ENCRYPTION AUDIT FOOTER */}
        <div className="flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-800 pt-3">
          <span className="flex items-center gap-1">
            <Lock size={10} className="text-cyan-500" />
            256-BIT QUANTUM-RESISTANT ENCRYPTION
          </span>
          <span>NDMA / MOES PROTOCOL v2.4</span>
        </div>
      </motion.div>
    </div>
  );
}
