import React, { useState } from "react";
import {
  Navigation,
  ShieldAlert,
  Radio,
  Users,
  Battery,
  Fuel,
  Compass,
  MapPin,
  CheckCircle,
  AlertCircle,
  Clock,
  Waves,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw
} from "lucide-react";
import { useDispatch } from "../context/DispatchContext";
import { useCity } from "../context/CityContext";

export default function RescueFieldView() {
  const { rescueTeams, sosIncidents, updateTeamLifecycle, activeFieldTeamId } = useDispatch();
  const { selectedCity } = useCity();
  const currentCity = selectedCity || { name: "Patna", lat: 25.5941, lng: 85.1376 };

  // Selected rescue team or active field team
  const currentTeam =
    rescueTeams.find((t) => t.id === activeFieldTeamId) ||
    rescueTeams[0] || {
      id: "RT-01",
      name: "NDRF Boat Taskforce 04",
      status: "EN_ROUTE",
      assignedSOS: "#10276",
      capacity: 8,
      distanceKm: 1.4,
      etaMin: 6
    };

  // Associated target SOS incident
  const targetIncident =
    sosIncidents.find((s) => s.id === currentTeam.assignedSOS || s.assignedTeam === currentTeam.id) ||
    sosIncidents[0] || {
      id: "#10276",
      location: `${currentCity.name} Canal Road Bridge Sector`,
      people: 4,
      children: 1,
      elderly: 1,
      medical: true,
      waterDepthM: 1.8,
      lat: currentCity.lat + 0.006,
      lng: currentCity.lng + 0.004,
      priority: "CRITICAL",
      status: "ASSIGNED"
    };

  const handleStatusChange = (newStatus: any) => {
    updateTeamLifecycle(currentTeam.id, newStatus);
  };

  return (
    <div className="flex-1 bg-[#070c19] text-white p-4 md:p-6 overflow-y-auto font-mono">
      {/* 1. TOP TACTICAL BANNER: ACTIVE MISSION TARGET */}
      <div className="bg-gradient-to-r from-[#0b132b] via-[#1c2541] to-[#0b132b] border border-cyan-500/40 rounded-xl p-5 mb-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-red-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded font-bold">
                  ACTIVE MISSION TARGET: {targetIncident.id}
                </span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-bold">
                  PRIORITY: {targetIncident.priority}
                </span>
              </div>
              <h2 className="text-lg font-black text-cyan-300 mt-1">
                {targetIncident.location}
              </h2>
              <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  {targetIncident.lat.toFixed(4)}°N, {targetIncident.lng.toFixed(4)}°E
                </span>
                <span>&bull;</span>
                <span className="text-amber-300 font-bold">
                  LANDMARK: Near Canal Road Bridge
                </span>
              </div>
            </div>
          </div>

          {/* Incident Telemetry Metrics */}
          <div className="grid grid-cols-3 gap-3 bg-[#0d162a] p-3 rounded-lg border border-slate-700/60 text-center">
            <div>
              <div className="text-[9px] text-slate-400 font-bold">TRAPPED VICTIMS</div>
              <div className="text-base font-extrabold text-cyan-300">
                {targetIncident.people} PPL
              </div>
              <div className="text-[8px] text-amber-300 font-bold">
                {targetIncident.children} Children &bull; {targetIncident.elderly} Elderly
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400 font-bold">WATER DEPTH</div>
              <div className="text-base font-extrabold text-red-400 flex items-center justify-center gap-1">
                <Waves className="w-3.5 h-3.5" />
                {targetIncident.waterDepthM}m
              </div>
              <div className="text-[8px] text-red-300">SUBMERGED ROOF</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400 font-bold">MEDICAL STATUS</div>
              <div className={`text-xs font-extrabold mt-1 ${targetIncident.medical ? "text-red-400" : "text-emerald-400"}`}>
                {targetIncident.medical ? "CRITICAL PATIENT" : "STABLE"}
              </div>
              <div className="text-[8px] text-slate-400">AMBULANCE READY</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Team Allocation HUD & Navigation Canvas */}
        <div className="lg:col-span-8 space-y-6">
          {/* Team Allocation HUD */}
          <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  TEAM ALLOCATION HUD & TELEMETRY
                </h3>
              </div>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded font-mono font-bold">
                FIELD UNIT: {currentTeam.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#1c2541] p-3 rounded-lg border border-slate-700/60">
                <div className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                  <Radio className="w-3 h-3 text-cyan-400" /> RADIO CHANNEL
                </div>
                <div className="text-sm font-bold text-cyan-300 mt-1">CH-04 (142.85 MHz)</div>
              </div>

              <div className="bg-[#1c2541] p-3 rounded-lg border border-slate-700/60">
                <div className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                  <Users className="w-3 h-3 text-emerald-400" /> PAYLOAD CAPACITY
                </div>
                <div className="text-sm font-bold text-emerald-300 mt-1">
                  {targetIncident.people} / {currentTeam.capacity || 8} PASSENGERS
                </div>
              </div>

              <div className="bg-[#1c2541] p-3 rounded-lg border border-slate-700/60">
                <div className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                  <Battery className="w-3 h-3 text-cyan-400" /> BATTERY / POWER
                </div>
                <div className="text-sm font-bold text-cyan-300 mt-1">88% OPTIMAL</div>
              </div>

              <div className="bg-[#1c2541] p-3 rounded-lg border border-slate-700/60">
                <div className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                  <Fuel className="w-3 h-3 text-amber-400" /> OUTBOARD FUEL
                </div>
                <div className="text-sm font-bold text-amber-300 mt-1">74% (3.8h RUNTIME)</div>
              </div>
            </div>
          </div>

          {/* Turn-by-Turn Navigation Canvas */}
          <div className="bg-[#0b132b] border border-cyan-500/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-cyan-400 animate-spin-slow" />
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  A* FLOOD-AVOIDANCE VECTOR NAVIGATION MAP
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold">
                SAFE WATER ROUTE COMPUTED
              </span>
            </div>

            {/* Simulated Tactical Canvas Map UI */}
            <div className="relative w-full h-72 bg-[#070c19] border border-cyan-900/60 rounded-lg overflow-hidden flex items-center justify-center">
              {/* Grid Background */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(#22d3ee 1px, transparent 1px)",
                  backgroundSize: "24px 24px"
                }}
              />

              {/* Flooded Inundation Polygons */}
              <div className="absolute top-8 left-12 w-44 h-32 bg-red-600/20 border-2 border-dashed border-red-500/60 rounded-3xl flex items-center justify-center text-[10px] text-red-400 font-bold rotate-6">
                SEVERE FLOOD INUNDATION (DEPTH 2.4m)
              </div>
              <div className="absolute bottom-6 right-16 w-36 h-28 bg-red-600/20 border-2 border-dashed border-red-500/60 rounded-2xl flex items-center justify-center text-[10px] text-red-400 font-bold -rotate-12">
                HIGH CURRENT ZONE (2.8 m/s)
              </div>

              {/* Safe A* Vector Path */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <path
                  d="M 60 220 Q 180 180 280 130 T 520 80"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="4"
                  strokeDasharray="8 4"
                  className="animate-pulse"
                />
              </svg>

              {/* Rescue Boat Origin Marker */}
              <div className="absolute left-12 bottom-12 flex items-center gap-2 bg-cyan-950/90 border border-cyan-400 px-3 py-1.5 rounded-lg shadow-lg">
                <Compass className="w-4 h-4 text-cyan-300 animate-spin" />
                <div>
                  <div className="text-[9px] text-cyan-200 font-bold">BOAT TASKFORCE R-07</div>
                  <div className="text-[8px] text-slate-400">ETA: {currentTeam.etaMin || 6} MINS</div>
                </div>
              </div>

              {/* Victim SOS Target Marker */}
              <div className="absolute right-16 top-12 flex items-center gap-2 bg-red-950/90 border border-red-500 px-3 py-1.5 rounded-lg shadow-lg animate-bounce">
                <MapPin className="w-4 h-4 text-red-400" />
                <div>
                  <div className="text-[9px] text-red-200 font-bold">VICTIM TICKET {targetIncident.id}</div>
                  <div className="text-[8px] text-amber-300">{targetIncident.people} TRAPPED</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
              <span>DISTANCE: {currentTeam.distanceKm || 1.4} KM</span>
              <span className="text-cyan-300">WAYPOINTS: 4 SAFE NODES PASSED</span>
              <span>BEARING: 042° NE</span>
            </div>
          </div>
        </div>

        {/* Right Column: Mission Lifecycle Stepper Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0b132b] border border-cyan-500/30 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  MISSION LIFECYCLE STEPPER
                </h3>
              </div>
              <span className="text-[9px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded font-mono">
                OPERATOR SYNC
              </span>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Tap status buttons sequentially to inform the Central Municipal Operator base of field progression in real time.
            </p>

            {/* Stepper Buttons */}
            <div className="space-y-3">
              {[
                { status: "ASSIGNED", label: "ACKNOWLEDGE ASSIGNMENT", color: "border-cyan-500 text-cyan-300 bg-cyan-950/40" },
                { status: "EN_ROUTE", label: "EN ROUTE TO VICTIM", color: "border-amber-500 text-amber-300 bg-amber-950/40" },
                { status: "ON_SCENE", label: "ON SCENE AT LANDMARK", color: "border-purple-500 text-purple-300 bg-purple-950/40" },
                { status: "RESCUED", label: "VICTIMS RESCUED & ABOARD", color: "border-emerald-500 text-emerald-300 bg-emerald-950/40" },
                { status: "CLOSED", label: "EN ROUTE TO SHELTER (COMPLETE)", color: "border-blue-500 text-blue-300 bg-blue-950/40" }
              ].map((step, idx) => {
                const isActive = currentTeam.status === step.status;
                return (
                  <button
                    key={step.status}
                    onClick={() => handleStatusChange(step.status)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left font-mono transition-all ${
                      isActive
                        ? `${step.color} shadow-lg ring-1 ring-cyan-400`
                        : "bg-[#1c2541] border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-xs font-bold flex items-center justify-center text-slate-300">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-extrabold">{step.label}</span>
                    </div>
                    {isActive ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="bg-[#1c2541] p-3 rounded-lg border border-slate-800 text-center">
              <div className="text-[9px] text-slate-400 font-bold">CURRENT TEAM STATUS</div>
              <div className="text-sm font-extrabold text-cyan-300 font-mono uppercase mt-0.5">
                {currentTeam.status}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
