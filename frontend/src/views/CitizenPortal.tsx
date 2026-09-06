import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Radio,
  MapPin,
  Users,
  Baby,
  UserCheck,
  HeartPulse,
  Waves,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Navigation,
  Clock,
  WifiOff,
  RefreshCw,
  Info,
  PhoneCall
} from "lucide-react";
import { useDispatch } from "../context/DispatchContext";
import { useCity } from "../context/CityContext";
import type { SOSIncident } from "../mockData";

export default function CitizenPortal() {
  const { submitCitizenSOS, sosIncidents, activeCitizenTicketId } = useDispatch();
  const { selectedCity } = useCity();
  const currentCity = selectedCity || { name: "Patna", lat: 25.5941, lng: 85.1376 };

  // GPS Geofence state
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: currentCity.lat,
    lng: currentCity.lng
  });
  const [gpsStatus, setGpsStatus] = useState<"ACQUIRING" | "LOCKED" | "FALLBACK">("ACQUIRING");
  const [landmark, setLandmark] = useState("");

  // Triage state
  const [people, setPeople] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [elderlyCount, setElderlyCount] = useState(0);
  const [medical, setMedical] = useState(false);
  const [submergedLevel, setSubmergedLevel] = useState<"KNEE" | "WAIST" | "ROOF" | "OVERHEAD">("WAIST");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offlineCached, setOfflineCached] = useState(false);
  const [activeTicket, setActiveTicket] = useState<SOSIncident | null>(null);

  // Auto-acquire device GPS on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsStatus("LOCKED");
        },
        () => {
          setCoords({ lat: currentCity.lat + 0.005, lng: currentCity.lng + 0.005 });
          setGpsStatus("FALLBACK");
        },
        { timeout: 5000 }
      );
    } else {
      setGpsStatus("FALLBACK");
    }

    // Check for cached offline SOS ticket in localStorage
    try {
      const cached = localStorage.getItem("hydrograph_offline_sos");
      if (cached) {
        const parsed = JSON.parse(cached);
        setActiveTicket(parsed);
        setOfflineCached(true);
      }
    } catch {
      /* ignore */
    }
  }, [currentCity]);

  // Sync active ticket if updated in DispatchContext
  useEffect(() => {
    if (activeCitizenTicketId) {
      const found = sosIncidents.find((s) => s.id === activeCitizenTicketId);
      if (found) {
        setActiveTicket(found);
      }
    }
  }, [activeCitizenTicketId, sosIncidents]);

  const handleTransmitSOS = async () => {
    setIsSubmitting(true);

    try {
      const ticket = await submitCitizenSOS({
        people,
        children: childrenCount,
        elderly: elderlyCount,
        medical,
        submergedLevel,
        landmark: landmark || `${currentCity.name} Sector B (GPS Geofenced)`,
        lat: coords.lat,
        lng: coords.lng
      });
      setActiveTicket(ticket);
      setOfflineCached(true);
    } catch (err) {
      console.error("SOS Transmission offline fallback triggered", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLifecycleStage = (status?: string) => {
    switch (status) {
      case "RECEIVED":
        return 1;
      case "VERIFIED":
      case "ASSIGNED":
        return 2;
      case "EN_ROUTE":
        return 3;
      case "RESCUED":
      case "CLOSED":
        return 4;
      default:
        return 2;
    }
  };

  const currentStage = activeTicket ? getLifecycleStage(activeTicket.status) : 0;

  // Generate SVG QR Code string representing offline SOS payload
  const qrPayload = activeTicket
    ? `HYDROGRAPH-SOS|ID:${activeTicket.id}|LAT:${activeTicket.lat.toFixed(5)}|LNG:${activeTicket.lng.toFixed(5)}|P:${activeTicket.people}|C:${activeTicket.children}|E:${activeTicket.elderly}|MED:${activeTicket.medical ? 1 : 0}|DEPTH:${activeTicket.waterDepthM}m`
    : "";

  return (
    <div className="flex-1 bg-[#070c19] text-white p-4 md:p-6 overflow-y-auto font-mono">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-900/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <h1 className="text-xl font-extrabold tracking-wider text-cyan-400">
              HYDROGRAPH <span className="text-red-500">CITIZEN EMERGENCY PORTAL</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Direct Tactical Distress Relay &bull; {currentCity.name.toUpperCase()} COMMAND BASE
          </p>
        </div>

        {/* GPS Geofence Pill */}
        <div className="flex items-center gap-2 bg-[#0d162a] border border-cyan-500/30 px-3 py-1.5 rounded-lg text-xs">
          <MapPin className={`w-4 h-4 ${gpsStatus === "LOCKED" ? "text-emerald-400" : "text-amber-400 animate-bounce"}`} />
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">DEVICE GPS GEOFENCE</div>
            <div className="text-cyan-300 font-mono">
              {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
            </div>
          </div>
          <span className={`ml-2 px-1.5 py-0.5 text-[9px] rounded font-bold ${gpsStatus === "LOCKED" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
            {gpsStatus}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Triage & SOS Trigger */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main SOS Trigger Card */}
          <div className="bg-[#0b132b] border border-red-500/40 rounded-xl p-6 relative overflow-hidden shadow-2xl shadow-red-950/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

            <div className="text-center mb-6">
              <h2 className="text-sm uppercase tracking-widest text-slate-400 font-bold mb-1">
                DISTRESS TELEMETRY TRANSMITTER
              </h2>
              <p className="text-xs text-red-300/80">
                Pressing this button alerts nearest NDRF / SDRF amphibious units immediately.
              </p>
            </div>

            {/* TRANSMIT SOS BUTTON */}
            <div className="flex justify-center my-4">
              <button
                onClick={handleTransmitSOS}
                disabled={isSubmitting}
                className="relative group w-48 h-48 md:w-56 md:h-56 rounded-full flex flex-col items-center justify-center border-4 border-red-500/80 bg-gradient-to-br from-red-600 via-red-700 to-red-900 shadow-[0_0_50px_rgba(239,68,68,0.5)] hover:shadow-[0_0_80px_rgba(239,68,68,0.8)] active:scale-95 transition-all duration-300 disabled:opacity-50"
              >
                <span className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-30 pointer-events-none" />
                <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 text-white mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-lg md:text-xl font-black text-white tracking-widest">TRANSMIT SOS</span>
                <span className="text-[10px] text-cyan-200 mt-1 font-semibold">ONE-TAP EMERGENCY</span>
              </button>
            </div>

            {/* Landmark Input */}
            <div className="mt-6">
              <label className="block text-xs font-bold text-cyan-400 mb-1">
                NEARBY LANDMARK / BUILDING NAME (OPTIONAL)
              </label>
              <div className="relative">
                <Navigation className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Canal Road Bridge, 2nd Floor Roof"
                  className="w-full bg-[#1c2541] border border-cyan-500/30 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Rapid Triage Input Controls */}
          <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                VULNERABILITY & TRIAGE CONTROLS
              </h3>
            </div>

            {/* People Counters */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#1c2541] p-3 rounded-lg border border-slate-700/60">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-2">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3 text-cyan-400" /> TOTAL PEOPLE</span>
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={() => setPeople(Math.max(1, people - 1))} className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded font-bold text-white text-sm">-</button>
                  <span className="text-base font-bold text-cyan-300">{people}</span>
                  <button onClick={() => setPeople(people + 1)} className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded font-bold text-white text-sm">+</button>
                </div>
              </div>

              <div className="bg-[#1c2541] p-3 rounded-lg border border-slate-700/60">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-2">
                  <span className="flex items-center gap-1"><Baby className="w-3 h-3 text-amber-400" /> CHILDREN</span>
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))} className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded font-bold text-white text-sm">-</button>
                  <span className="text-base font-bold text-amber-300">{childrenCount}</span>
                  <button onClick={() => setChildrenCount(childrenCount + 1)} className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded font-bold text-white text-sm">+</button>
                </div>
              </div>

              <div className="bg-[#1c2541] p-3 rounded-lg border border-slate-700/60">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-2">
                  <span className="flex items-center gap-1"><UserCheck className="w-3 h-3 text-purple-400" /> ELDERLY</span>
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={() => setElderlyCount(Math.max(0, elderlyCount - 1))} className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded font-bold text-white text-sm">-</button>
                  <span className="text-base font-bold text-purple-300">{elderlyCount}</span>
                  <button onClick={() => setElderlyCount(elderlyCount + 1)} className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded font-bold text-white text-sm">+</button>
                </div>
              </div>
            </div>

            {/* Vulnerability Chips */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                CRITICAL VULNERABILITY TOGGLE
              </label>
              <button
                type="button"
                onClick={() => setMedical(!medical)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all ${
                  medical
                    ? "bg-red-950/40 border-red-500 text-red-300"
                    : "bg-[#1c2541] border-slate-700 text-slate-400 hover:border-slate-500"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <HeartPulse className={`w-4 h-4 ${medical ? "text-red-400 animate-pulse" : "text-slate-500"}`} />
                  <span>MEDICAL EMERGENCY / CRITICAL PATIENT PRESENT</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${medical ? "bg-red-500 text-white" : "bg-slate-800 text-slate-400"}`}>
                  {medical ? "YES" : "NO"}
                </span>
              </button>
            </div>

            {/* Submerged Level Chips */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                FLOOD WATER SUBMERGENCE LEVEL
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { level: "KNEE", label: "KNEE LEVEL", desc: "0.5m Depth", color: "border-emerald-500/50 text-emerald-300" },
                  { level: "WAIST", label: "WAIST LEVEL", desc: "1.1m Depth", color: "border-amber-500/50 text-amber-300" },
                  { level: "ROOF", label: "ROOF LEVEL", desc: "2.4m Depth", color: "border-orange-500/50 text-orange-300" },
                  { level: "OVERHEAD", label: "OVERHEAD", desc: "3.2m+ Critical", color: "border-red-500/50 text-red-300" }
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setSubmergedLevel(item.level as any)}
                    className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all ${
                      submergedLevel === item.level
                        ? `bg-cyan-950/60 border-cyan-400 ${item.color} shadow-lg shadow-cyan-950/40`
                        : "bg-[#1c2541] border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <Waves className="w-3.5 h-3.5 mb-1" />
                    <span className="text-[10px] font-bold">{item.label}</span>
                    <span className="text-[8px] text-slate-400">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Response Telemetry & Offline QR Fallback */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Response Telemetry Card */}
          <div className="bg-[#0b132b] border border-cyan-500/30 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  LIVE RESPONSE TELEMETRY
                </h3>
              </div>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-mono">
                REAL-TIME SYNC
              </span>
            </div>

            {activeTicket ? (
              <div className="space-y-4">
                {/* Ticket Details */}
                <div className="bg-[#1c2541] p-4 rounded-lg border border-cyan-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-400 font-bold">ACTIVE TICKET ID</span>
                    <span className="text-sm font-extrabold text-cyan-300 font-mono">{activeTicket.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">ASSIGNED UNIT:</span>
                    <span className="font-bold text-amber-300">
                      {activeTicket.assignedTeam ? `Team ${activeTicket.assignedTeam}` : "Team R-07 (NDRF)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">STATUS:</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {activeTicket.status}
                    </span>
                  </div>
                </div>

                {/* Live Progress Tracker Stepper */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3">
                    MISSION LIFECYCLE PROGRESS
                  </label>
                  <div className="space-y-3">
                    {[
                      { stage: 1, label: "TICKET LOGGED", desc: "Distress signal geofenced" },
                      { stage: 2, label: "DISPATCHED", desc: "Tasked to NDRF Boat R-07" },
                      { stage: 3, label: "TEAM EN ROUTE", desc: "Navigating via A* flood route" },
                      { stage: 4, label: "SAFE", desc: "Evacuated to Shelter" }
                    ].map((step) => {
                      const isComplete = currentStage >= step.stage;
                      const isCurrent = currentStage === step.stage;
                      return (
                        <div key={step.stage} className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                              isComplete
                                ? "bg-cyan-500 text-black border-cyan-400"
                                : "bg-slate-800 text-slate-500 border-slate-700"
                            } ${isCurrent ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0b132b]" : ""}`}
                          >
                            {isComplete ? <CheckCircle2 className="w-4 h-4" /> : step.stage}
                          </div>
                          <div className="flex-1">
                            <div className={`text-xs font-bold ${isComplete ? "text-cyan-300" : "text-slate-500"}`}>
                              {step.label}
                            </div>
                            <div className="text-[9px] text-slate-500">{step.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyan-400" />
                No active SOS ticket transmitted yet. Use the red transmitter to log an emergency.
              </div>
            )}
          </div>

          {/* Zero-Signal Fallback & Offline QR Code Card */}
          <div className="bg-[#0b132b] border border-amber-500/40 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  ZERO-SIGNAL FALLBACK & QR CODE
                </h3>
              </div>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                INDEXEDDB READY
              </span>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              If cellular tower network drops, your SOS packet is saved locally. Display this high-density optical QR code directly to rescue drones or boat taskforces for instant scanning.
            </p>

            {/* Simulated QR Code Canvas/SVG */}
            <div className="bg-[#1c2541] p-4 rounded-lg flex flex-col items-center justify-center border border-amber-500/30">
              {activeTicket ? (
                <div className="text-center">
                  <div className="w-36 h-36 bg-white p-2 rounded-lg mx-auto flex items-center justify-center shadow-lg">
                    {/* Simulated High Density Matrix Pattern */}
                    <div className="w-full h-full border-4 border-black bg-slate-900 grid grid-cols-6 gap-1 p-1">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-sm ${
                            i % 2 === 0 || i % 5 === 0 ? "bg-white" : "bg-cyan-400"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] text-amber-300 font-mono font-bold mt-2">
                    SCAN FOR RESCUE BOAT INFRASTRUCTURE
                  </div>
                  <div className="text-[8px] text-slate-400 font-mono max-w-[200px] truncate mx-auto mt-0.5">
                    {qrPayload}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500">QR Code generates automatically after SOS transmission.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span className="flex items-center gap-1"><PhoneCall className="w-3 h-3 text-cyan-400" /> HELPLINE: 112 / 1070</span>
              <span className="text-emerald-400 font-bold">OFFLINE MESH STANDBY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
