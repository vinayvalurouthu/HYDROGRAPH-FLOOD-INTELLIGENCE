import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Shield,
  KeyRound,
  User,
  Radio,
  Users,
  Building2,
  ArrowRight,
  ShieldAlert,
  Waves
} from "lucide-react";

export default function LoginView() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("operator@hydrograph.gov");
  const [password, setPassword] = useState("admin123");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleQuickFill = (role: "OPERATOR" | "RESCUER" | "CITIZEN") => {
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const loggedUser = await login(username, password);

      // Redirect user to their specific portal based on role
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
    } catch (err) {
      console.error("Login authentication failed:", err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex-1 bg-[#070c19] text-white p-4 md:p-8 flex flex-col items-center justify-center font-mono min-h-screen relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Tactical Login Card */}
      <div className="max-w-md w-full bg-[#0b132b] border border-cyan-500/30 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative z-10">
        {/* Branding Header */}
        <div className="text-center space-y-2 border-b border-slate-800 pb-4">
          <div className="w-14 h-14 bg-[#1c2541] border border-cyan-500/50 rounded-xl flex items-center justify-center mx-auto text-cyan-400 shadow-lg shadow-cyan-950/50">
            <Waves className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-cyan-300">
            HYDROGRAPH <span className="text-red-500">FLOOD INTELLIGENCE</span>
          </h1>
          <p className="text-xs text-slate-400">
            MUNICIPAL DISASTER RESPONSE & TELEMETRY COMMAND BASE
          </p>
        </div>

        {/* Demo Role Quick-Fill Buttons */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
            DEMO ROLE QUICK-FILL (ONE-TAP ACCESSIBILITY)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("OPERATOR")}
              className={`flex flex-col items-center p-2.5 rounded-lg border text-center transition-all ${
                username === "operator@hydrograph.gov"
                  ? "bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-md"
                  : "bg-[#1c2541] border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <Building2 className="w-4 h-4 mb-1 text-cyan-400" />
              <span className="text-[9px] font-bold">LOGIN AS OPERATOR</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("RESCUER")}
              className={`flex flex-col items-center p-2.5 rounded-lg border text-center transition-all ${
                username === "rescue04@hydrograph.gov"
                  ? "bg-amber-950/60 border-amber-400 text-amber-300 shadow-md"
                  : "bg-[#1c2541] border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <Users className="w-4 h-4 mb-1 text-amber-400" />
              <span className="text-[9px] font-bold">LOGIN AS RESCUE</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("CITIZEN")}
              className={`flex flex-col items-center p-2.5 rounded-lg border text-center transition-all ${
                username === "citizen@hydrograph.gov"
                  ? "bg-red-950/60 border-red-400 text-red-300 shadow-md"
                  : "bg-[#1c2541] border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <Radio className="w-4 h-4 mb-1 text-red-400" />
              <span className="text-[9px] font-bold">LOGIN AS CITIZEN</span>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-cyan-400 mb-1">
              EMAIL / TACTICAL IDENTITY
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="operator@hydrograph.gov"
                className="w-full bg-[#1c2541] border border-cyan-500/30 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-cyan-400 mb-1">
              PASSWORD
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
                className="w-full bg-[#1c2541] border border-cyan-500/30 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-black font-extrabold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 active:scale-95 transition-all text-xs tracking-wider cursor-pointer"
          >
            <span>AUTHENTICATE & ENTER PORTAL</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Info Footer */}
        <div className="bg-[#1c2541] p-3 rounded-lg border border-slate-800 text-[9px] text-slate-400 space-y-1">
          <div className="font-bold text-cyan-300">DEMO ACCOUNTS PRESET:</div>
          <div>&bull; Operator: <span className="text-white">operator@hydrograph.gov</span> (admin123)</div>
          <div>&bull; Rescue: <span className="text-white">rescue04@hydrograph.gov</span> (rescue123)</div>
          <div>&bull; Citizen: <span className="text-white">citizen@hydrograph.gov</span> (sos123)</div>
        </div>
      </div>
    </div>
  );
}
