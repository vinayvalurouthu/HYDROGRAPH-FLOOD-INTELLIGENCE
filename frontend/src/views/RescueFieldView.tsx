import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  RotateCcw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Send,
  LifeBuoy,
  Anchor,
  Activity,
  Wind,
  Gauge,
  Crosshair,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Sliders,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "../context/DispatchContext";
import { useCity } from "../context/CityContext";
import { playSynthesizedChime } from "../context/SettingsContext";

// Predefined Active Mission Targets for dynamic incident switching
const ACTIVE_MISSION_TARGETS = [
  {
    id: "#10366",
    location: "rajam",
    landmark: "Near Canal Road Bridge",
    lat: 19.076,
    lng: 72.8777,
    priority: "HIGH",
    people: 2,
    children: 0,
    elderly: 0,
    waterDepthM: 0.5,
    depthLabel: "SUBMERGED ROOF",
    medicalStatus: "STABLE",
    medicalSub: "AMBULANCE READY",
    initialDistanceKm: 1.4,
    bearing: "042° NE",
    safeWaypoints: 4,
    hazard1: { label: "SEVERE FLOOD INUNDATION", sub: "DEPTH 2.4m", speed: "1.8 m/s" },
    hazard2: { label: "HIGH CURRENT ZONE", sub: "2.8 m/s", speed: "2.8 m/s" }
  },
  {
    id: "#10372",
    location: "Ward 4 School Sector",
    landmark: "Old High School Rooftop",
    lat: 19.0825,
    lng: 72.8841,
    priority: "CRITICAL",
    people: 5,
    children: 2,
    elderly: 1,
    waterDepthM: 1.8,
    depthLabel: "SECOND FLOOR SUBMERGED",
    medicalStatus: "CRITICAL PATIENT",
    medicalSub: "OXYGEN REQUIRED",
    initialDistanceKm: 2.1,
    bearing: "058° ENE",
    safeWaypoints: 6,
    hazard1: { label: "TURBULENT DRAIN COLLAPSE", sub: "DEPTH 3.1m", speed: "3.2 m/s" },
    hazard2: { label: "HIGH DEBRIS ACCUMULATION", sub: "OBSTRUCTED", speed: "1.2 m/s" }
  },
  {
    id: "#10385",
    location: "Riverbank Temple Ghat",
    landmark: "Ghat Steps Sluice Gate",
    lat: 19.0712,
    lng: 72.8698,
    priority: "HIGH",
    people: 3,
    children: 1,
    elderly: 0,
    waterDepthM: 0.8,
    depthLabel: "WAIST LEVEL SURGE",
    medicalStatus: "STABLE",
    medicalSub: "TRIAGE ON ARRIVAL",
    initialDistanceKm: 1.1,
    bearing: "215° SW",
    safeWaypoints: 3,
    hazard1: { label: "CANAL SLUICE BACKFLOW", sub: "DEPTH 2.0m", speed: "2.1 m/s" },
    hazard2: { label: "SUBMERGED POWER LINES", sub: "HAZARD HIGH", speed: "0.5 m/s" }
  }
];

// Initial Tactical Radio Communications Transceiver Feed
const INITIAL_RADIO_FEED = [
  { id: 1, sender: "MUNICIPAL DISPATCH", text: "Unit Taskforce R-07, vector coordinates locked. Proceed via Canal bypass.", time: "10:46:12", type: "base" },
  { id: 2, sender: "BOAT TASKFORCE R-07", text: "Vector route acknowledged. Doppler radar shows 2.4m depth to port side.", time: "10:46:28", type: "team" },
  { id: 3, sender: "MUNICIPAL DISPATCH", text: "Keep 45m safe clearance from Canal bridge footing. High current zone ahead.", time: "10:46:44", type: "base" }
];

export default function RescueFieldView() {
  const { rescueTeams, sosIncidents, updateTeamLifecycle, activeFieldTeamId } = useDispatch();
  const { selectedCity } = useCity();

  // Active Mission Target Index
  const [activeTargetIdx, setActiveTargetIdx] = useState<number>(0);
  const targetIncident = ACTIVE_MISSION_TARGETS[activeTargetIdx];

  // Sound Feedback Toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Selected rescue team or active field team
  const currentTeam =
    rescueTeams.find((t) => t.id === activeFieldTeamId) ||
    rescueTeams[0] || {
      id: "RT-07",
      name: "Flood Taskforce Motorboat 03",
      status: "ON_SCENE",
      assignedSOS: targetIncident.id,
      capacity: 6,
      distanceKm: targetIncident.initialDistanceKm,
      etaMin: 6
    };

  // ─── LIVE DYNAMIC STATE & SIMULATION ───────────────────────────────────────
  // Current Lifecycle Step Index: 0 = ASSIGNED, 1 = EN_ROUTE, 2 = ON_SCENE, 3 = RESCUED, 4 = CLOSED
  const [activeStepIdx, setActiveStepIdx] = useState<number>(2); // Starts on ON_SCENE matching original UI
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 2x, 4x

  // Normalized boat progress along path: 0.0 (dock) to 1.0 (victim location)
  const [boatProgress, setBoatProgress] = useState<number>(0.65); // 65% en route towards victim

  // Live telemetry metrics with natural micro-fluctuations
  const [boatSpeedKnots, setBoatSpeedKnots] = useState<number>(14.8);
  const [engineRPM, setEngineRPM] = useState<number>(3200);
  const [fuelPct, setFuelPct] = useState<number>(74.0);
  const [batteryPct, setBatteryPct] = useState<number>(88.0);
  const [radioChannel, setRadioChannel] = useState<string>("CH-04 (142.85 MHz)");
  const [channelIdx, setChannelIdx] = useState<number>(0);
  const [radioFeed, setRadioFeed] = useState(INITIAL_RADIO_FEED);
  const [newRadioMsg, setNewRadioMsg] = useState("");
  const [passengersAboard, setPassengersAboard] = useState<number>(0);

  // Mission stopwatch
  const [missionSeconds, setMissionSeconds] = useState<number>(14 * 60 + 32);

  // A* Safe Corridor Recalculation Scan State
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [corridorMargin, setCorridorMargin] = useState<number>(45);

  // Radar Ping Wave pulses
  const [radarPulseKey, setRadarPulseKey] = useState<number>(0);

  // Sound trigger helper
  const triggerChime = useCallback((freq = 880, dur = 0.2) => {
    if (soundEnabled) {
      playSynthesizedChime(freq, dur);
    }
  }, [soundEnabled]);

  // Stopwatch timer & micro-telemetry fluctuations loop
  useEffect(() => {
    const timer = setInterval(() => {
      setMissionSeconds((s) => s + 1);

      // Micro-fluctuate engine RPM & battery
      setEngineRPM((rpm) => Math.max(2800, Math.min(3600, rpm + Math.floor((Math.random() - 0.5) * 40))));
      setBatteryPct((b) => +(b + (Math.random() > 0.6 ? 0.05 : -0.05)).toFixed(1));

      // Realistic minor fuel consumption while moving
      if (activeStepIdx === 1 || isSimulating) {
        setFuelPct((f) => +(Math.max(12, f - 0.02 * simSpeed)).toFixed(1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeStepIdx, isSimulating, simSpeed]);

  // Autonomous Mission Simulation Engine Loop
  useEffect(() => {
    if (!isSimulating) return;

    const intervalTime = 120 / simSpeed; // Updates every 120ms / simSpeed
    const simTimer = setInterval(() => {
      setBoatProgress((prev) => {
        let next = prev + 0.015 * simSpeed;

        // Auto-advance lifecycle steps based on boat progress
        if (next >= 0.15 && activeStepIdx < 1) {
          setActiveStepIdx(1);
          triggerChime(640, 0.15);
        } else if (next >= 0.72 && activeStepIdx < 2) {
          setActiveStepIdx(2);
          setBoatSpeedKnots(4.2);
          triggerChime(880, 0.25);
          // Add arrival chatter
          setRadioFeed((rf) => [
            ...rf,
            {
              id: Date.now(),
              sender: "BOAT TASKFORCE R-07",
              text: `On scene at ${targetIncident.landmark}. Searchlights locked on target victims.`,
              time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              type: "team"
            }
          ]);
        } else if (next >= 0.92 && activeStepIdx < 3) {
          setActiveStepIdx(3);
          setPassengersAboard(targetIncident.people);
          triggerChime(1050, 0.3);
          setRadioFeed((rf) => [
            ...rf,
            {
              id: Date.now(),
              sender: "BOAT TASKFORCE R-07",
              text: `All ${targetIncident.people} victims secured aboard with lifejackets. Preparing return transit.`,
              time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              type: "team"
            }
          ]);
        } else if (next >= 1.0) {
          setActiveStepIdx(4);
          setIsSimulating(false);
          triggerChime(1200, 0.4);
          setRadioFeed((rf) => [
            ...rf,
            {
              id: Date.now(),
              sender: "MUNICIPAL DISPATCH",
              text: `Mission #${targetIncident.id} Complete. Medical triage team standing by at Rajam Relief Shelter.`,
              time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              type: "base"
            }
          ]);
          return 1.0;
        }

        return next;
      });
    }, intervalTime);

    return () => clearInterval(simTimer);
  }, [isSimulating, activeStepIdx, simSpeed, targetIncident, triggerChime]);

  // Compute Bezier Curve Position for the Boat:
  // Route curve: M 60 220 Q 180 180 280 130 T 520 80
  const boatCoords = useMemo(() => {
    const t = Math.max(0, Math.min(1, boatProgress));
    // Sample coordinates along the curved trajectory
    // P0 = (60, 220), P1 = (180, 180), P2 = (280, 130), P3 = (520, 80)
    const x = Math.round(60 + t * (520 - 60) + Math.sin(t * Math.PI) * -35);
    const y = Math.round(220 - t * (220 - 80) + Math.cos(t * Math.PI * 0.8) * 15);

    // Compute tangent angle for heading
    const dt = 0.02;
    const tNext = Math.min(1, t + dt);
    const nextX = 60 + tNext * (520 - 60) + Math.sin(tNext * Math.PI) * -35;
    const nextY = 220 - tNext * (220 - 80) + Math.cos(tNext * Math.PI * 0.8) * 15;
    const angleRad = Math.atan2(nextY - y, nextX - x);
    const angleDeg = Math.round((angleRad * 180) / Math.PI);

    return { x, y, angleDeg };
  }, [boatProgress]);

  // Live computed distance to victim & ETA
  const liveDistanceKm = useMemo(() => {
    const d = targetIncident.initialDistanceKm * (1 - boatProgress);
    return Math.max(0, +d.toFixed(2));
  }, [targetIncident.initialDistanceKm, boatProgress]);

  const liveEtaMin = useMemo(() => {
    return Math.max(0, Math.ceil(6 * (1 - boatProgress)));
  }, [boatProgress]);

  const waypointsPassed = useMemo(() => {
    return Math.min(targetIncident.safeWaypoints, Math.floor(boatProgress * (targetIncident.safeWaypoints + 1)));
  }, [targetIncident.safeWaypoints, boatProgress]);

  // Stepper Step Transition Handler
  const handleStepSelect = (idx: number, statusKey: any) => {
    setActiveStepIdx(idx);
    triggerChime(750 + idx * 80, 0.2);

    // Set boat progress matching the step
    const progressMap = [0.05, 0.45, 0.72, 0.92, 1.0];
    setBoatProgress(progressMap[idx]);

    if (idx === 3) {
      setPassengersAboard(targetIncident.people);
    } else if (idx < 3) {
      setPassengersAboard(0);
    }

    if (idx === 1) {
      setBoatSpeedKnots(16.5);
    } else if (idx === 2) {
      setBoatSpeedKnots(3.8);
    } else if (idx === 4) {
      setBoatSpeedKnots(0.0);
    }

    // Sync status with DispatchContext
    updateTeamLifecycle(currentTeam.id, statusKey);
  };

  // Recalculate A* Safe Vector Corridor
  const handleRecalculateCorridor = () => {
    setIsRecalculating(true);
    triggerChime(950, 0.3);
    setTimeout(() => {
      setIsRecalculating(false);
      setCorridorMargin((m) => (m === 45 ? 52 : 45));
      triggerChime(1100, 0.2);
    }, 900);
  };

  // Toggle Radio Channels
  const CHANNELS = ["CH-04 (142.85 MHz)", "CH-09 (156.45 MHz)", "CH-16 (156.80 MHz)"];
  const handleToggleChannel = () => {
    const nextIdx = (channelIdx + 1) % CHANNELS.length;
    setChannelIdx(nextIdx);
    setRadioChannel(CHANNELS[nextIdx]);
    triggerChime(580, 0.15);
  };

  // Transmit quick radio message
  const handleSendQuickRadio = (msg: string) => {
    if (!msg.trim()) return;
    const newEntry = {
      id: Date.now(),
      sender: "BOAT TASKFORCE R-07",
      text: msg,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      type: "team"
    };
    setRadioFeed((p) => [...p, newEntry]);
    setNewRadioMsg("");
    triggerChime(820, 0.15);
  };

  // Format mission stopwatch time
  const formatMissionTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600).toString().padStart(2, "0");
    const mins = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${hrs}:${mins}:${s}`;
  };

  // Stepper lifecycle config array
  const STEPPER_STEPS = [
    { status: "ASSIGNED", label: "ACKNOWLEDGE ASSIGNMENT", color: "border-cyan-500 text-cyan-300 bg-cyan-950/40" },
    { status: "EN_ROUTE", label: "EN ROUTE TO VICTIM", color: "border-amber-500 text-amber-300 bg-amber-950/40" },
    { status: "ON_SCENE", label: "ON SCENE AT LANDMARK", color: "border-purple-500 text-purple-300 bg-purple-950/40" },
    { status: "RESCUED", label: "VICTIMS RESCUED & ABOARD", color: "border-emerald-500 text-emerald-300 bg-emerald-950/40" },
    { status: "CLOSED", label: "EN ROUTE TO SHELTER (COMPLETE)", color: "border-blue-500 text-blue-300 bg-blue-950/40" }
  ];

  return (
    <div className="flex-1 bg-[#070c19] text-white p-3 md:p-6 overflow-y-auto font-mono select-none">
      {/* ─── 1. TOP TACTICAL BANNER: ACTIVE MISSION TARGET & LIVE TELEMETRY ─── */}
      <div className="bg-gradient-to-r from-[#0b132b] via-[#15203b] to-[#0b132b] border border-cyan-500/40 rounded-xl p-4 md:p-5 mb-5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Neon scanline accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {/* Pulsing Emergency Shield Icon */}
            <div className="p-3 bg-red-950/70 border border-red-500/60 rounded-xl text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] flex-shrink-0 relative">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Exact Active Mission Target Badge matching user UI & test */}
                <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded font-bold">
                  ACTIVE MISSION TARGET: {targetIncident.id}
                </span>

                {/* Target Switcher Dropdown */}
                <div className="relative group">
                  <select
                    value={activeTargetIdx}
                    onChange={(e) => {
                      setActiveTargetIdx(Number(e.target.value));
                      setBoatProgress(0.1);
                      setActiveStepIdx(1);
                      triggerChime(880, 0.2);
                    }}
                    className="text-[10px] bg-slate-900/90 text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 px-2 py-0.5 rounded font-bold cursor-pointer focus:outline-none transition-colors"
                    title="Switch active emergency target"
                  >
                    {ACTIVE_MISSION_TARGETS.map((t, idx) => (
                      <option key={t.id} value={idx} className="bg-slate-900 text-white font-mono">
                        SWITCH TARGET: {t.id} ({t.location})
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  PRIORITY: {targetIncident.priority}
                </span>

                <span className="text-[10px] bg-slate-900/80 text-slate-300 border border-slate-700 px-2 py-0.5 rounded flex items-center gap-1">
                  <Clock size={11} className="text-cyan-400" />
                  <span>ELAPSED: {formatMissionTime(missionSeconds)}</span>
                </span>
              </div>

              {/* Location Name & Landmark */}
              <h2 className="text-xl font-black text-cyan-300 mt-1 capitalize tracking-wide flex items-center gap-2">
                <span>{targetIncident.location}</span>
                <span className="text-xs font-normal text-slate-400 lowercase">
                  ({selectedCity?.name || "Patna"} Operational Sector)
                </span>
              </h2>

              <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 md:gap-3 mt-1">
                <span className="flex items-center gap-1 text-cyan-300">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  {targetIncident.lat.toFixed(4)}°N, {targetIncident.lng.toFixed(4)}°E
                </span>
                <span>&bull;</span>
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <span>LANDMARK:</span>
                  <span className="text-white">{targetIncident.landmark}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Incident Telemetry Metrics & Sound Toggle */}
          <div className="flex items-center gap-3">
            <div className="grid grid-cols-3 gap-2 md:gap-3 bg-[#0d162a]/90 p-3 rounded-xl border border-slate-700/60 text-center shadow-inner min-w-[280px]">
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">TRAPPED VICTIMS</div>
                <div className="text-base font-black text-cyan-300">
                  {targetIncident.people} PPL
                </div>
                <div className="text-[8px] text-amber-300 font-bold">
                  {targetIncident.children} Children &bull; {targetIncident.elderly} Elderly
                </div>
              </div>

              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">WATER DEPTH</div>
                <div className="text-base font-black text-red-400 flex items-center justify-center gap-1">
                  <Waves className="w-3.5 h-3.5 animate-pulse" />
                  {targetIncident.waterDepthM}m
                </div>
                <div className="text-[8px] text-red-300 font-bold uppercase">
                  {targetIncident.depthLabel}
                </div>
              </div>

              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">MEDICAL STATUS</div>
                <div className={`text-xs font-black mt-1 ${targetIncident.medicalStatus === "CRITICAL PATIENT" ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
                  {targetIncident.medicalStatus}
                </div>
                <div className="text-[8px] text-slate-400 font-bold">
                  {targetIncident.medicalSub}
                </div>
              </div>
            </div>

            {/* Audio Feedback Toggle */}
            <button
              onClick={() => setSoundEnabled((p) => !p)}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 ${
                soundEnabled
                  ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:border-cyan-400"
                  : "bg-slate-900 border-slate-700 text-slate-500"
              }`}
              title={soundEnabled ? "Tactical Audio FX Active (Click to Mute)" : "Audio FX Muted (Click to Enable)"}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span className="text-[7px] font-bold">{soundEnabled ? "SFX ON" : "MUTED"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT GRID: 8 COLS LEFT, 4 COLS RIGHT ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Team HUD + Live Vector Navigation Map */}
        <div className="lg:col-span-8 space-y-5">
          {/* ─── 2. TEAM ALLOCATION HUD & TELEMETRY ─── */}
          <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-4 md:p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  TEAM ALLOCATION HUD &amp; TELEMETRY
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded font-mono font-bold">
                  FIELD UNIT: {currentTeam.name || "Flood Taskforce Motorboat 03"}
                </span>
              </div>
            </div>

            {/* 4 Dynamic Telemetry Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Radio Channel with live audio wave & switcher */}
              <div
                onClick={handleToggleChannel}
                className="bg-[#1c2541] p-3 rounded-lg border border-slate-700/60 hover:border-cyan-500/50 transition-all cursor-pointer group"
                title="Click to switch tactical SDR radio channel"
              >
                <div className="text-[9px] text-slate-400 font-bold uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Radio className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
                    RADIO CHANNEL
                  </span>
                  <span className="text-[8px] text-cyan-400 opacity-80">TAP ⇄</span>
                </div>
                <div className="text-sm font-bold text-cyan-300 mt-1 truncate">
                  {radioChannel}
                </div>
                {/* Live animated waveform visualizer */}
                <div className="flex items-end gap-1 h-3 mt-1.5 opacity-70">
                  <span className="w-1 bg-cyan-400 rounded-full animate-pulse h-2" />
                  <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-3" />
                  <span className="w-1 bg-cyan-400 rounded-full animate-pulse h-1.5" />
                  <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-3" />
                  <span className="w-1 bg-cyan-400 rounded-full animate-pulse h-2.5" />
                  <span className="text-[8px] text-slate-400 ml-1">SDR RX LOCK</span>
                </div>
              </div>

              {/* Payload Capacity with live passenger aboard tracking */}
              <div className="bg-[#1c2541] p-3 rounded-lg border border-slate-700/60">
                <div className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                  <Users className="w-3 h-3 text-emerald-400" /> PAYLOAD CAPACITY
                </div>
                <div className="text-sm font-bold text-emerald-300 mt-1">
                  {passengersAboard > 0 ? passengersAboard : targetIncident.people} / {currentTeam.capacity || 6} PASSENGERS
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((passengersAboard || targetIncident.people) / (currentTeam.capacity || 6)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Battery / Power with micro-fluctuation */}
              <div className="bg-[#1c2541] p-3 rounded-lg border border-slate-700/60">
                <div className="text-[9px] text-slate-400 font-bold uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Battery className="w-3 h-3 text-cyan-400" /> BATTERY / POWER
                  </span>
                  <span className="text-[8px] text-emerald-400 font-bold">+45W SOLAR</span>
                </div>
                <div className="text-sm font-bold text-cyan-300 mt-1">
                  {batteryPct}% OPTIMAL
                </div>
                <div className="text-[8px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>24.2V DUAL LiFePO4</span>
                  <span className="text-emerald-400 font-mono">100% HEALTH</span>
                </div>
              </div>

              {/* Outboard Fuel with live flow rate & consumption */}
              <div className="bg-[#1c2541] p-3 rounded-lg border border-slate-700/60">
                <div className="text-[9px] text-slate-400 font-bold uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Fuel className="w-3 h-3 text-amber-400" /> OUTBOARD FUEL
                  </span>
                  <span className="text-[8px] text-amber-300 font-bold">{engineRPM} RPM</span>
                </div>
                <div className="text-sm font-bold text-amber-300 mt-1">
                  {fuelPct}% (3.8h RUNTIME)
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, fuelPct)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─── 3. A* FLOOD-AVOIDANCE VECTOR NAVIGATION MAP ─── */}
          <div className="bg-[#0b132b] border border-cyan-500/30 rounded-xl p-4 md:p-5 space-y-3 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-cyan-400 animate-spin-slow" />
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  A* FLOOD-AVOIDANCE VECTOR NAVIGATION MAP
                </h3>
              </div>

              {/* Recalculate Corridor & Autonomous Navigation Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRecalculateCorridor}
                  disabled={isRecalculating}
                  className="px-2.5 py-1 rounded-md bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-[10px] font-bold text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Recalculate A* Safe Corridor with updated depth telemetry"
                >
                  <RefreshCw size={11} className={isRecalculating ? "animate-spin text-cyan-400" : "text-cyan-400"} />
                  <span>{isRecalculating ? "COMPUTING..." : "RECALCULATE CORRIDOR"}</span>
                </button>

                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-1 rounded font-mono font-bold flex items-center gap-1">
                  <CheckCircle size={11} className="text-emerald-400" />
                  SAFE WATER ROUTE COMPUTED
                </span>
              </div>
            </div>

            {/* ─── LIVE INTERACTIVE TACTICAL CANVAS MAP ─── */}
            <div className="relative w-full h-80 bg-[#070c19] border border-cyan-900/60 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
              {/* Grid Background */}
              <div
                className="absolute inset-0 opacity-25 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(#22d3ee 1px, transparent 1px)",
                  backgroundSize: "22px 22px"
                }}
              />

              {/* Dynamic Radar Sweep Beam */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-radar-sweep" />
              </div>

              {/* Hydrodynamic Water Velocity Arrow Particles flowing in background */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <svg className="w-full h-full">
                  <defs>
                    <pattern id="flow-arrows" width="60" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 10 20 L 30 20 M 24 16 L 30 20 L 24 24" stroke="#00f2fe" strokeWidth="1.2" fill="none" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#flow-arrows)" />
                </svg>
              </div>

              {/* HAZARD ZONE 1: Severe Flood Inundation Polygon (Top-Left) */}
              <div className="absolute top-7 left-12 w-48 h-36 bg-red-600/15 border-2 border-dashed border-red-500/60 rounded-3xl flex flex-col items-center justify-center p-2 text-center rotate-6 shadow-[0_0_25px_rgba(239,68,68,0.15)] group hover:border-red-400 transition-all cursor-pointer">
                <div className="flex items-center gap-1 text-[10px] text-red-400 font-extrabold tracking-wide">
                  <AlertTriangle size={12} className="animate-pulse" />
                  <span>{targetIncident.hazard1.label}</span>
                </div>
                <div className="text-[9px] text-red-300 mt-0.5">({targetIncident.hazard1.sub})</div>
                <div className="text-[8px] text-slate-400 mt-1 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/30">
                  SURFACE FLOW: {targetIncident.hazard1.speed}
                </div>
              </div>

              {/* HAZARD ZONE 2: High Current Zone Polygon (Bottom-Right) */}
              <div className="absolute bottom-6 right-14 w-44 h-32 bg-red-600/15 border-2 border-dashed border-red-500/60 rounded-2xl flex flex-col items-center justify-center p-2 text-center -rotate-12 shadow-[0_0_25px_rgba(239,68,68,0.15)] group hover:border-red-400 transition-all cursor-pointer">
                <div className="flex items-center gap-1 text-[10px] text-red-400 font-extrabold tracking-wide">
                  <Waves size={12} className="animate-pulse" />
                  <span>{targetIncident.hazard2.label}</span>
                </div>
                <div className="text-[9px] text-red-300 mt-0.5">({targetIncident.hazard2.sub})</div>
                <div className="text-[8px] text-slate-400 mt-1 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/30">
                  CURRENT SPEED: {targetIncident.hazard2.speed}
                </div>
              </div>

              {/* Safe A* Vector Path (Curving around both hazard zones) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 280" preserveAspectRatio="none">
                {/* Glow underlay */}
                <path
                  d="M 60 220 Q 180 180 280 130 T 520 80"
                  fill="none"
                  stroke="#00f2fe"
                  strokeWidth="8"
                  opacity="0.2"
                />

                {/* Main animated dash path */}
                <path
                  d="M 60 220 Q 180 180 280 130 T 520 80"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3.5"
                  strokeDasharray="8 5"
                  className="animate-pulse"
                />

                {/* Safe Navigation Waypoints Nodes along vector */}
                {[
                  { cx: 60, cy: 220, label: "BASE" },
                  { cx: 175, cy: 180, label: "WP-1" },
                  { cx: 280, cy: 130, label: "WP-2" },
                  { cx: 395, cy: 98, label: "WP-3" },
                  { cx: 520, cy: 80, label: "TARGET" }
                ].map((pt, i) => (
                  <g key={pt.label}>
                    <circle cx={pt.cx} cy={pt.cy} r="4" fill="#0b132b" stroke="#00f2fe" strokeWidth="2" />
                    <circle
                      cx={pt.cx}
                      cy={pt.cy}
                      r="7"
                      fill="none"
                      stroke={boatProgress * 5 >= i ? "#10b981" : "#38bdf8"}
                      strokeWidth="1"
                      opacity="0.6"
                    />
                  </g>
                ))}
              </svg>

              {/* ─── LIVE ANIMATED BOAT POSITION MARKER ─── */}
              <div
                className="absolute transition-all duration-300 z-20 pointer-events-auto cursor-grab group"
                style={{
                  left: `${(boatCoords.x / 600) * 100}%`,
                  top: `${(boatCoords.y / 280) * 100}%`,
                  transform: "translate(-50%, -50%)"
                }}
              >
                {/* Water wake ripples trailing boat */}
                <span className="absolute -inset-2 rounded-full bg-cyan-400/30 animate-ping" />
                <span className="absolute -inset-4 rounded-full border border-cyan-400/40 animate-pulse" />

                {/* Boat Tactical Capsule */}
                <div className="flex items-center gap-2 bg-cyan-950/95 border-2 border-cyan-400 px-3 py-1.5 rounded-lg shadow-[0_0_25px_rgba(6,182,212,0.8)] backdrop-blur-md">
                  <div
                    className="transition-transform duration-300"
                    style={{ transform: `rotate(${boatCoords.angleDeg}deg)` }}
                  >
                    <Compass className="w-4 h-4 text-cyan-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-[9px] text-cyan-100 font-extrabold tracking-wider">
                      {currentTeam.name ? "BOAT TASKFORCE R-07" : "BOAT TASKFORCE R-07"}
                    </div>
                    <div className="text-[8px] text-cyan-300 font-bold flex items-center gap-1.5">
                      <span>ETA: {liveEtaMin} MINS</span>
                      <span>&bull;</span>
                      <span className="text-amber-300">{boatSpeedKnots} KTS</span>
                    </div>
                  </div>
                </div>

                {/* Searchlight cone shining forward when on scene */}
                {activeStepIdx >= 2 && (
                  <div
                    className="absolute left-full top-1/2 -translate-y-1/2 w-28 h-16 bg-gradient-to-r from-cyan-400/40 via-cyan-300/15 to-transparent rounded-r-full pointer-events-none blur-sm"
                    style={{ transformOrigin: "left center", transform: `rotate(${boatCoords.angleDeg}deg)` }}
                  />
                )}
              </div>

              {/* ─── VICTIM SOS TARGET MARKER (Top-Right) ─── */}
              <div className="absolute right-14 top-10 flex items-center gap-2 bg-red-950/90 border-2 border-red-500 px-3 py-1.5 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-bounce z-10 cursor-pointer">
                <MapPin className="w-4 h-4 text-red-400" />
                <div>
                  <div className="text-[9px] text-red-200 font-black">
                    VICTIM TICKET {targetIncident.id}
                  </div>
                  <div className="text-[8px] text-amber-300 font-bold">
                    {targetIncident.people} TRAPPED &bull; {targetIncident.depthLabel}
                  </div>
                </div>
              </div>

              {/* Origin Base Dock Station (Bottom-Left) */}
              <div className="absolute left-6 bottom-5 flex items-center gap-1.5 text-[8px] text-slate-400 bg-slate-900/80 border border-slate-700 px-2 py-1 rounded">
                <Anchor size={11} className="text-cyan-400" />
                <span>SECTOR BASE DOCK</span>
              </div>
            </div>

            {/* ─── MAP METRICS FOOTER STRIP ─── */}
            <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/80 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">DISTANCE:</span>
                <span className="text-cyan-300 font-black">{liveDistanceKm} KM</span>
                <span className="text-slate-600">|</span>
                <span className="text-white font-bold">SPEED:</span>
                <span className="text-emerald-300 font-mono">{boatSpeedKnots} KTS</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-cyan-300 font-bold">
                  WAYPOINTS: {waypointsPassed} / {targetIncident.safeWaypoints} SAFE NODES PASSED
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-amber-300 font-bold">MARGIN: {corridorMargin}m</span>
              </div>

              <div>
                <span>BEARING: </span>
                <span className="text-white font-black">{targetIncident.bearing}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: MISSION LIFECYCLE STEPPER & RADIO CHATTER ─── */}
        <div className="lg:col-span-4 space-y-5">
          {/* ─── 4. MISSION LIFECYCLE STEPPER CONTROLS ─── */}
          <div className="bg-[#0b132b] border border-cyan-500/30 rounded-xl p-4 md:p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  MISSION LIFECYCLE STEPPER
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  OPERATOR SYNC
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Tap status buttons sequentially to inform the Central Municipal Operator base of field progression in real time.
            </p>

            {/* AUTONOMOUS SIMULATION TOOLBAR */}
            <div className="bg-[#101935] p-3 rounded-lg border border-cyan-500/30 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setIsSimulating((p) => !p);
                  triggerChime(880, 0.2);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isSimulating
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                }`}
              >
                {isSimulating ? (
                  <>
                    <Pause size={13} className="animate-pulse" />
                    <span>PAUSE SIMULATION</span>
                  </>
                ) : (
                  <>
                    <Play size={13} />
                    <span>AUTO-SIMULATE RUN</span>
                  </>
                )}
              </button>

              {/* Speed multiplier toggle */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
                {[1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSimSpeed(s)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                      simSpeed === s ? "bg-cyan-500 text-black font-black" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {/* Reset Mission Button */}
              <button
                onClick={() => {
                  setIsSimulating(false);
                  setActiveStepIdx(0);
                  setBoatProgress(0.05);
                  setPassengersAboard(0);
                  setBoatSpeedKnots(0.0);
                  triggerChime(520, 0.2);
                }}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Reset mission to Stage 1"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Stepper Buttons (1 to 5) */}
            <div className="space-y-2.5">
              {STEPPER_STEPS.map((step, idx) => {
                const isActive = activeStepIdx === idx;
                const isPassed = activeStepIdx > idx;
                return (
                  <button
                    key={step.status}
                    onClick={() => handleStepSelect(idx, step.status)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left font-mono transition-all cursor-pointer ${
                      isActive
                        ? `${step.color} shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400 font-black`
                        : isPassed
                          ? "bg-slate-900/60 border-slate-800 text-emerald-400/80"
                          : "bg-[#1c2541] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                          isActive
                            ? "bg-cyan-400 text-black font-black"
                            : isPassed
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                              : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-extrabold tracking-wide">{step.label}</span>
                    </div>

                    {isActive ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
                    ) : isPassed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500/60" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Current Team Status Display */}
            <div className="bg-[#1c2541] p-3 rounded-lg border border-slate-800 text-center">
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                CURRENT TEAM STATUS
              </div>
              <div className="text-sm font-black text-cyan-300 font-mono uppercase mt-0.5 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>{STEPPER_STEPS[activeStepIdx]?.status || currentTeam.status}</span>
              </div>
            </div>
          </div>

          {/* ─── 5. LIVE TACTICAL RADIO CHATTER FEED ─── */}
          <div className="bg-[#0b132b] border border-cyan-500/30 rounded-xl p-4 md:p-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h4 className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                  TACTICAL RADIO TRANSCEIVER FEED
                </h4>
              </div>
              <span className="text-[8px] bg-slate-900 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                LIVE RELAY
              </span>
            </div>

            {/* Message Feed Box */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
              {radioFeed.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded-lg border text-[11px] space-y-0.5 ${
                    msg.type === "base"
                      ? "bg-slate-900/80 border-slate-800 text-slate-300"
                      : "bg-cyan-950/40 border-cyan-500/30 text-cyan-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-[8px] font-bold opacity-75">
                    <span className={msg.type === "base" ? "text-amber-300" : "text-cyan-300"}>
                      {msg.sender}
                    </span>
                    <span className="text-slate-500">{msg.time}</span>
                  </div>
                  <p className="leading-tight">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Quick Field Transmit Buttons */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                QUICK FIELD TRANSMIT:
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleSendQuickRadio("Visual contact confirmed on victims atop roof.")}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[9px] text-slate-300 hover:text-cyan-300 text-left truncate transition-colors cursor-pointer"
                >
                  👁 Visual Contact
                </button>
                <button
                  onClick={() => handleSendQuickRadio("Victims secured aboard with lifejackets. No trauma.")}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[9px] text-slate-300 hover:text-cyan-300 text-left truncate transition-colors cursor-pointer"
                >
                  🛡 Victims Secured
                </button>
                <button
                  onClick={() => handleSendQuickRadio("Submerged electrical pole encountered. Rerouting 20m east.")}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[9px] text-slate-300 hover:text-cyan-300 text-left truncate transition-colors cursor-pointer"
                >
                  ⚠ Obstacle Reported
                </button>
                <button
                  onClick={() => handleSendQuickRadio("Requesting secondary relief boat for remaining 3 civilians.")}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[9px] text-slate-300 hover:text-cyan-300 text-left truncate transition-colors cursor-pointer"
                >
                  🚤 Request Backup
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
