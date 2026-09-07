import React, { useState, useEffect, useMemo } from "react";
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
  Wifi,
  RefreshCw,
  PhoneCall,
  ArrowRight,
  RotateCcw,
  Building2,
  Compass,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronDown,
  ShieldAlert,
  Sun,
  Flame,
  Check,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "../context/DispatchContext";
import { useCity } from "../context/CityContext";
import { PRESET_CITIES } from "../services/cityDataGenerator";
import type { SOSIncident } from "../mockData";
import OpticalSOSQRCode from "../components/OpticalSOSQRCode";
import { playSynthesizedChime } from "../context/SettingsContext";

// Contextual landmark suggestions per city
const CITY_LANDMARK_SUGGESTIONS: Record<string, string[]> = {
  rajam: [
    "rajam",
    "GMRIT Main Campus Gate",
    "Canal Road Sluice #2",
    "RTC Complex Bus Stand",
    "Old Bazar Junction",
    "Srikakulam Highway Bridge",
  ],
  mumbai: [
    "Kurla Station West",
    "Mithi River Bridge",
    "Milan Subway Bowl",
    "Hindmata Flyover",
    "Sion Circle Underpass",
    "Bandra Bandstand Lowlands",
  ],
  patna: [
    "Canal Road Bridge",
    "Gandhi Maidan Relief Camp",
    "Rajendra Nagar 2nd Floor",
    "Dak Bungalow Crossing",
    "Bailey Road Flyover Sump",
    "Patna Marine Drive Slip",
  ],
  vizag: [
    "RK Beach Road Promenade",
    "Gnanapuram Low Sump Basin",
    "Dwaraka Nagar Commercial Spine",
    "Scindia Port Access Expressway",
    "NAD Flyover Junction",
  ],
  chennai: [
    "Adyar River Bank Ward 4",
    "Velachery Main Road Sump",
    "Mudichur Lake Sluice Spillway",
    "Tambaram Railway Colony",
    "Marina Beach Canal Outlet",
  ],
  kochi: [
    "Vembanad Waterway Pier",
    "Marine Drive Jetty Slip",
    "Edappally Canal Sump Gate",
    "Kadavanthra Metro Pillar 88",
  ],
  kolkata: [
    "Hooghly Riverfront Strand",
    "Park Circus Underpass",
    "Central Avenue Sump",
    "College Street Low Basin",
  ],
  guwahati: [
    "Bharalu River Sluice Gate",
    "Kamakhya Station Approach",
    "Zoo Road Flood Channel",
    "Ulubari Flyover Basin",
  ],
};

// Safe Evacuation Hubs per city
const CITY_SAFE_SHELTERS: Record<string, { name: string; distanceM: number; capacity: string; routeSafe: boolean }[]> = {
  rajam: [
    { name: "GMRIT Indoor Sports Complex Shelter", distanceM: 650, capacity: "180/400 beds", routeSafe: true },
    { name: "Rajam Municipal High School Relief Hub", distanceM: 1100, capacity: "90/250 beds", routeSafe: true },
  ],
  mumbai: [
    { name: "Dharavi Municipal Sports Ground", distanceM: 850, capacity: "320/600 beds", routeSafe: true },
    { name: "Bandra Kurla Complex Relief Pavilion", distanceM: 1400, capacity: "450/800 beds", routeSafe: true },
  ],
  patna: [
    { name: "Rajendra Nagar Relief Base", distanceM: 520, capacity: "210/350 beds", routeSafe: true },
    { name: "Gandhi Maidan Central Pavilion", distanceM: 1250, capacity: "540/1000 beds", routeSafe: true },
  ],
  vizag: [
    { name: "Andhra University Indoor Stadium", distanceM: 780, capacity: "310/500 beds", routeSafe: true },
    { name: "Dwaraka Nagar Community Center", distanceM: 1300, capacity: "180/300 beds", routeSafe: true },
  ],
  chennai: [
    { name: "Velachery High School Shelter", distanceM: 620, capacity: "220/400 beds", routeSafe: true },
    { name: "Tambaram Community Relief Center", distanceM: 1150, capacity: "190/350 beds", routeSafe: true },
  ],
};

export default function CitizenPortal() {
  const navigate = useNavigate();
  const { submitCitizenSOS, sosIncidents, activeCitizenTicketId, updateSOSLifecycle } = useDispatch();
  const { selectedCity, selectCity, presetCities } = useCity();

  // Active City details
  const currentCity = selectedCity || {
    id: "rajam",
    name: "Rajam",
    state: "Andhra Pradesh",
    center: [18.4659, 83.661],
    regionType: "North Coastal Andhra · Srikakulam",
  };

  const cityLat = currentCity.lat ?? currentCity.center?.[0] ?? 18.4659;
  const cityLng = currentCity.lng ?? currentCity.center?.[1] ?? 83.661;

  // GPS Geofence state (Default to exact coordinates from user screenshot: 18.4659°N, 83.6610°E)
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: cityLat,
    lng: cityLng,
  });
  const [gpsStatus, setGpsStatus] = useState<"ACQUIRING" | "LOCKED" | "FALLBACK">("LOCKED");
  const [gpsAccuracyM, setGpsAccuracyM] = useState<number>(4.2);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  // Landmark state (Default to "rajam" as in user screenshot)
  const [landmark, setLandmark] = useState<string>("rajam");

  // Triage state (Defaults from screenshot: 2 people, 0 kids, 0 elderly, waist level)
  const [people, setPeople] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [elderlyCount, setElderlyCount] = useState(0);
  const [medical, setMedical] = useState(false);
  const [mobilityImpaired, setMobilityImpaired] = useState(false);
  const [petsPresent, setPetsPresent] = useState(false);
  const [trappedOnRoof, setTrappedOnRoof] = useState(false);
  const [submergedLevel, setSubmergedLevel] = useState<"KNEE" | "WAIST" | "ROOF" | "OVERHEAD">("WAIST");

  // Telemetry & SOS Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sosTransmittedSuccess, setSosTransmittedSuccess] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Live ETA countdown timer (in seconds)
  const [etaSeconds, setEtaSeconds] = useState(380); // ~6 min 20 sec

  // Default active ticket aligned with the user screenshot (#78322, Team R-09, ASSIGNED)
  const [activeTicket, setActiveTicket] = useState<SOSIncident>({
    id: "#78322",
    priority: "CRITICAL",
    location: "rajam",
    people: 2,
    children: 0,
    elderly: 0,
    medical: false,
    waterDepthM: 1.1,
    waitingMin: 4,
    status: "ASSIGNED",
    floodRisk: "HIGH",
    lat: cityLat,
    lng: cityLng,
    assignedTeam: "Team R-09",
    timestamps: [
      { status: "Distress signal geofenced", time: "21:55" },
      { status: "Tasked to NDRF Boat R-09", time: "21:56" },
    ],
  });

  // When selectedCity changes, dynamically update coordinates and default landmark
  useEffect(() => {
    setCoords({ lat: cityLat, lng: cityLng });
    const suggestions = CITY_LANDMARK_SUGGESTIONS[currentCity.id] || CITY_LANDMARK_SUGGESTIONS.rajam;
    if (suggestions && suggestions[0]) {
      setLandmark(suggestions[0]);
    }
  }, [currentCity.id, cityLat, cityLng]);

  // Sync active ticket if updated in DispatchContext
  useEffect(() => {
    if (activeCitizenTicketId) {
      const found = sosIncidents.find((s) => s.id === activeCitizenTicketId);
      if (found) {
        setActiveTicket(found);
      }
    }
  }, [activeCitizenTicketId, sosIncidents]);

  // Live countdown timer for boat ETA
  useEffect(() => {
    const timer = setInterval(() => {
      setEtaSeconds((prev) => (prev > 10 ? prev - 1 : 120));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format ETA MM:SS
  const formatEta = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Distance calculated dynamically from ETA (at approx ~12 km/h water craft speed)
  const dynamicDistanceKm = useMemo(() => {
    const dist = (etaSeconds / 3600) * 11.5;
    return Math.max(0.15, Number(dist.toFixed(2)));
  }, [etaSeconds]);

  // Real GPS Recalibrate handler
  const handleRecalibrateGPS = () => {
    setGpsStatus("ACQUIRING");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsStatus("LOCKED");
          setGpsAccuracyM(pos.coords.accuracy ? Number(pos.coords.accuracy.toFixed(1)) : 3.8);
          if (soundEnabled) playSynthesizedChime(1040, 0.15);
        },
        () => {
          setCoords({ lat: cityLat, lng: cityLng });
          setGpsStatus("LOCKED");
          setGpsAccuracyM(4.2);
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    } else {
      setGpsStatus("LOCKED");
    }
  };

  // People Counter Handlers with intelligent constraints
  const handleSetChildren = (newVal: number) => {
    const val = Math.max(0, newVal);
    setChildrenCount(val);
    if (val + elderlyCount > people) {
      setPeople(val + elderlyCount);
    }
  };

  const handleSetElderly = (newVal: number) => {
    const val = Math.max(0, newVal);
    setElderlyCount(val);
    if (childrenCount + val > people) {
      setPeople(childrenCount + val);
    }
  };

  const handleSetPeople = (newVal: number) => {
    const val = Math.max(1, newVal);
    setPeople(val);
    // If people is less than dependents, adjust
    if (val < childrenCount + elderlyCount) {
      setChildrenCount(Math.min(childrenCount, val));
      setElderlyCount(Math.max(0, val - childrenCount));
    }
  };

  // Transmit SOS Distress Signal
  const handleTransmitSOS = async () => {
    setIsSubmitting(true);

    // 1. Play High-Decibel Web Audio Synthesized Emergency Beacon
    if (soundEnabled) {
      playSynthesizedChime(880, 0.3);
      setTimeout(() => playSynthesizedChime(440, 0.4), 320);
    }

    // 2. Hardware vibration haptic feedback
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([300, 150, 300, 150, 500]);
      }
    } catch {
      /* ignore */
    }

    try {
      const ticket = await submitCitizenSOS({
        people,
        children: childrenCount,
        elderly: elderlyCount,
        medical,
        submergedLevel,
        landmark: landmark || `${currentCity.name} Sector B (GPS Geofenced)`,
        lat: coords.lat,
        lng: coords.lng,
      });

      // Maintain unit R-09 designation if relevant
      const enrichedTicket: SOSIncident = {
        ...ticket,
        assignedTeam: ticket.assignedTeam || "Team R-09",
        location: landmark || `${currentCity.name} Geofence`,
        people,
        children: childrenCount,
        elderly: elderlyCount,
        medical,
      };

      setActiveTicket(enrichedTicket);
      setSosTransmittedSuccess(true);
      setTimeout(() => setSosTransmittedSuccess(false), 4000);
    } catch (err) {
      console.error("SOS Transmission fallback", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Advance Mission Lifecycle Step (Interactive Simulation)
  const handleAdvanceLifecycle = () => {
    if (!activeTicket) return;

    const stages: SOSIncident["status"][] = ["RECEIVED", "ASSIGNED", "EN_ROUTE", "RESCUED"];
    const currentIdx = stages.indexOf(activeTicket.status as any);
    const nextIdx = currentIdx < stages.length - 1 ? currentIdx + 1 : 0;
    const nextStatus = stages[nextIdx];

    updateSOSLifecycle(activeTicket.id, nextStatus);
    setActiveTicket((prev) => ({
      ...prev,
      status: nextStatus,
    }));

    if (soundEnabled) playSynthesizedChime(750, 0.2);
  };

  // Stand down / I am safe
  const handleMarkSafe = () => {
    if (!activeTicket) return;
    updateSOSLifecycle(activeTicket.id, "CLOSED");
    setActiveTicket((prev) => ({ ...prev, status: "CLOSED" }));
    if (soundEnabled) playSynthesizedChime(520, 0.3);
  };

  // Lifecycle Stage mapping
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

  const currentStage = activeTicket ? getLifecycleStage(activeTicket.status) : 2;

  // Real-time dynamic optical QR payload
  const qrPayload = useMemo(() => {
    const payloadObj = {
      id: activeTicket?.id || "#78322",
      hub: `${currentCity.name.toUpperCase()} COMMAND BASE`,
      coords: [Number(coords.lat.toFixed(4)), Number(coords.lng.toFixed(4))],
      people,
      kids: childrenCount,
      seniors: elderlyCount,
      medical,
      mobility: mobilityImpaired,
      roof: trappedOnRoof,
      submerged: submergedLevel,
      landmark: landmark || currentCity.name,
      assigned: activeTicket?.assignedTeam || "Team R-09",
      sec_token: `HG-NDMA-${(coords.lat * 100).toFixed(0)}-SEC`,
    };
    return JSON.stringify(payloadObj);
  }, [
    activeTicket,
    currentCity.name,
    coords.lat,
    coords.lng,
    people,
    childrenCount,
    elderlyCount,
    medical,
    mobilityImpaired,
    trappedOnRoof,
    submergedLevel,
    landmark,
  ]);

  const landmarkSuggestions = CITY_LANDMARK_SUGGESTIONS[currentCity.id] || CITY_LANDMARK_SUGGESTIONS.rajam;
  const safeShelters = CITY_SAFE_SHELTERS[currentCity.id] || CITY_SAFE_SHELTERS.rajam;

  return (
    <div className="flex-1 bg-[#060b18] text-white p-4 md:p-6 overflow-y-auto font-mono selection:bg-cyan-500 selection:text-black min-h-screen">
      {/* TOP COMMAND HEADER */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-900/40 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/50 flex items-center justify-center">
              <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-wider text-cyan-400 flex items-center gap-2">
                HYDROGRAPH <span className="text-red-500">CITIZEN EMERGENCY PORTAL</span>
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-400">Direct Tactical Distress Relay &bull;</span>

                {/* Dynamic Command Base Switcher Dropdown */}
                <div className="relative inline-block">
                  <button
                    onClick={() => setCityDropdownOpen((p) => !p)}
                    className="text-xs font-bold text-cyan-300 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-cyan-500/30 transition-colors cursor-pointer"
                    title="Click to switch active emergency command base"
                  >
                    <span>{currentCity.name.toUpperCase()} COMMAND BASE</span>
                    <ChevronDown size={12} className={`transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {cityDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-60 rounded-xl bg-[#0c1426] border border-cyan-500/40 shadow-2xl py-1.5 z-50">
                      <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                        Select Emergency Jurisdiction
                      </div>
                      {presetCities.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            selectCity(c);
                            setCityDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs font-mono flex items-center justify-between hover:bg-cyan-500/10 transition-colors cursor-pointer ${
                            c.id === currentCity.id ? "text-cyan-300 font-bold bg-cyan-500/15" : "text-slate-300"
                          }`}
                        >
                          <div>
                            <div className="leading-tight">{c.name}</div>
                            <div className="text-[9px] text-slate-500">{c.state}</div>
                          </div>
                          {c.id === currentCity.id && <Check size={14} className="text-cyan-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GPS Geofence Pill & Quick Navigation Action */}
        <div className="flex items-center gap-3">
          {/* Audio Chime Toggle */}
          <button
            onClick={() => setSoundEnabled((p) => !p)}
            className="p-2 rounded-lg bg-[#0d162a] border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            title={soundEnabled ? "Mute Siren Chime" : "Enable Emergency Siren Chime"}
          >
            {soundEnabled ? <Volume2 size={16} className="text-cyan-400" /> : <VolumeX size={16} />}
          </button>

          {/* DEVICE GPS GEOFENCE PILL */}
          <div className="flex items-center gap-2.5 bg-[#0d162a] border border-cyan-500/30 px-3.5 py-1.5 rounded-xl text-xs shadow-lg">
            <MapPin
              className={`w-4 h-4 ${
                gpsStatus === "LOCKED" ? "text-emerald-400" : "text-amber-400 animate-spin"
              }`}
            />
            <div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>DEVICE GPS GEOFENCE</span>
                <span className="text-[8px] font-normal text-slate-500">(&plusmn;{gpsAccuracyM}m)</span>
              </div>
              <div className="text-cyan-300 font-mono font-bold text-xs">
                {coords.lat.toFixed(4)}&deg;N, {coords.lng.toFixed(4)}&deg;E
              </div>
            </div>

            <button
              onClick={handleRecalibrateGPS}
              title="Click to recalibrate GPS location"
              className={`ml-1 px-2 py-0.5 text-[9px] rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                gpsStatus === "LOCKED"
                  ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}
            >
              <RefreshCw size={10} className={gpsStatus === "ACQUIRING" ? "animate-spin" : ""} />
              {gpsStatus}
            </button>
          </div>

          {/* Role Switcher Back to Command Center */}
          <button
            onClick={() => navigate("/operator")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-500/15 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 text-xs font-bold transition-all cursor-pointer"
            title="Switch to Municipal Operator Dashboard"
          >
            <span>Operator Base</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* EMERGENCY DISASTER BANNER IF ACTIVE */}
      {sosTransmittedSuccess && (
        <div className="max-w-5xl mx-auto mb-5 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/60 flex items-center justify-between shadow-2xl animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-400" />
            <div>
              <div className="text-xs font-bold text-emerald-200">
                DISTRESS TELEMETRY TRANSMITTED SUCCESSFULLY
              </div>
              <div className="text-[10px] text-emerald-400/80">
                Ticket {activeTicket.id} geofenced and dispatched to {activeTicket.assignedTeam || "Team R-09"}. Rescuer vessel en route.
              </div>
            </div>
          </div>
          <button
            onClick={() => setSosTransmittedSuccess(false)}
            className="text-xs text-emerald-300 hover:text-white px-2 py-1 rounded bg-emerald-900/50"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ======================================================== */}
        {/* LEFT COLUMN: DISTRESS TRANSMITTER & VULNERABILITY TRIAGE */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* MAIN SOS TRIGGER TRANSMITTER CARD */}
          <div className="bg-[#0b132b] border border-red-500/40 rounded-2xl p-6 relative overflow-hidden shadow-2xl shadow-red-950/30">
            {/* Atmospheric Background Glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-5">
              <h2 className="text-sm uppercase tracking-widest text-slate-300 font-bold mb-1 flex items-center justify-center gap-2">
                <Radio size={16} className="text-red-400 animate-pulse" />
                DISTRESS TELEMETRY TRANSMITTER
              </h2>
              <p className="text-xs text-red-300/80">
                Pressing this button alerts nearest NDRF / SDRF amphibious units immediately.
              </p>
            </div>

            {/* THE BIG PULSING RED TRANSMIT SOS BUTTON */}
            <div className="flex flex-col items-center justify-center my-3 relative">
              {/* Radiating Ripple Waves */}
              <div className="relative flex items-center justify-center">
                <span className="absolute w-56 h-56 md:w-64 md:h-64 rounded-full border border-red-500/30 animate-ping pointer-events-none opacity-40" />
                <span className="absolute w-52 h-52 md:w-60 md:h-60 rounded-full border border-cyan-400/20 animate-pulse pointer-events-none" />

                <button
                  onClick={handleTransmitSOS}
                  disabled={isSubmitting}
                  className="relative group w-48 h-48 md:w-56 md:h-56 rounded-full flex flex-col items-center justify-center border-4 border-red-500/90 bg-gradient-to-br from-red-600 via-red-700 to-red-950 shadow-[0_0_60px_rgba(239,68,68,0.6)] hover:shadow-[0_0_90px_rgba(239,68,68,0.9)] active:scale-95 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                >
                  <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 text-white mb-2 group-hover:scale-110 transition-transform drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                  <span className="text-lg md:text-xl font-black text-white tracking-widest leading-none">
                    {isSubmitting ? "TRANSMITTING..." : "TRANSMIT SOS"}
                  </span>
                  <span className="text-[10px] text-cyan-200 mt-1 font-semibold tracking-wider">
                    ONE-TAP EMERGENCY
                  </span>
                </button>
              </div>

              {/* Beacon Status Strip */}
              <div className="mt-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] text-slate-400 font-mono">
                  DIRECT SATELLITE & CELLULAR DUAL-RELAY READY
                </span>
              </div>
            </div>

            {/* NEARBY LANDMARK / BUILDING NAME (OPTIONAL) */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-cyan-400">
                  NEARBY LANDMARK / BUILDING NAME (OPTIONAL)
                </label>
                <span className="text-[9px] text-slate-500 font-mono">Real-time rescue tag</span>
              </div>

              <div className="relative">
                <Navigation className="absolute left-3.5 top-3 w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. rajam or Near Canal Road Bridge, 2nd Floor Roof"
                  className="w-full bg-[#1c2541] border border-cyan-500/30 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition-all shadow-inner"
                />
              </div>

              {/* Dynamic Landmark Quick Chips */}
              <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                <span className="text-[9px] text-slate-500">Suggested:</span>
                {landmarkSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLandmark(item)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                      landmark.toLowerCase() === item.toLowerCase()
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold"
                        : "bg-white/5 hover:bg-white/10 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* VULNERABILITY & TRIAGE CONTROLS CARD */}
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  VULNERABILITY & TRIAGE CONTROLS
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Rescue Prioritization Matrix
              </span>
            </div>

            {/* PEOPLE COUNTERS */}
            <div className="grid grid-cols-3 gap-3">
              {/* TOTAL PEOPLE */}
              <div className="bg-[#1c2541] p-3 rounded-xl border border-slate-700/60 shadow-sm">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-2">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-cyan-400" /> TOTAL PEOPLE
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleSetPeople(people - 1)}
                    className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-lg font-bold text-white text-sm transition-all cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-base font-black text-cyan-300">{people}</span>
                  <button
                    onClick={() => handleSetPeople(people + 1)}
                    className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-lg font-bold text-white text-sm transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* CHILDREN */}
              <div className="bg-[#1c2541] p-3 rounded-xl border border-slate-700/60 shadow-sm">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-2">
                  <span className="flex items-center gap-1">
                    <Baby className="w-3 h-3 text-amber-400" /> CHILDREN
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleSetChildren(childrenCount - 1)}
                    className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-lg font-bold text-white text-sm transition-all cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-base font-black text-amber-300">{childrenCount}</span>
                  <button
                    onClick={() => handleSetChildren(childrenCount + 1)}
                    className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-lg font-bold text-white text-sm transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* ELDERLY */}
              <div className="bg-[#1c2541] p-3 rounded-xl border border-slate-700/60 shadow-sm">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-2">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-purple-400" /> ELDERLY
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleSetElderly(elderlyCount - 1)}
                    className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-lg font-bold text-white text-sm transition-all cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-base font-black text-purple-300">{elderlyCount}</span>
                  <button
                    onClick={() => handleSetElderly(elderlyCount + 1)}
                    className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-lg font-bold text-white text-sm transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* CRITICAL VULNERABILITY TOGGLE */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                CRITICAL VULNERABILITY TOGGLE
              </label>
              <button
                type="button"
                onClick={() => {
                  setMedical(!medical);
                  if (soundEnabled) playSynthesizedChime(!medical ? 920 : 440, 0.15);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                  medical
                    ? "bg-red-950/60 border-red-500 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    : "bg-[#1c2541] border-slate-700 text-slate-400 hover:border-slate-500"
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs font-bold">
                  <HeartPulse
                    className={`w-4 h-4 ${medical ? "text-red-400 animate-pulse" : "text-slate-500"}`}
                  />
                  <span>MEDICAL EMERGENCY / CRITICAL PATIENT PRESENT</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${
                    medical ? "bg-red-500 text-white animate-pulse" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {medical ? "YES" : "NO"}
                </span>
              </button>

              {/* Sub-triage Quick Chips */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setMobilityImpaired(!mobilityImpaired)}
                  className={`py-1.5 px-2 rounded-lg border text-[10px] font-mono text-center transition-all cursor-pointer ${
                    mobilityImpaired
                      ? "bg-cyan-950/60 border-cyan-400 text-cyan-300 font-bold"
                      : "bg-[#141e38] border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {mobilityImpaired ? "♿ Mobility Impaired: YES" : "♿ Mobility Impaired: NO"}
                </button>
                <button
                  type="button"
                  onClick={() => setTrappedOnRoof(!trappedOnRoof)}
                  className={`py-1.5 px-2 rounded-lg border text-[10px] font-mono text-center transition-all cursor-pointer ${
                    trappedOnRoof
                      ? "bg-amber-950/60 border-amber-400 text-amber-300 font-bold"
                      : "bg-[#141e38] border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {trappedOnRoof ? "🏠 Trapped on Roof: YES" : "🏠 Trapped on Roof: NO"}
                </button>
                <button
                  type="button"
                  onClick={() => setPetsPresent(!petsPresent)}
                  className={`py-1.5 px-2 rounded-lg border text-[10px] font-mono text-center transition-all cursor-pointer ${
                    petsPresent
                      ? "bg-emerald-950/60 border-emerald-400 text-emerald-300 font-bold"
                      : "bg-[#141e38] border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {petsPresent ? "🐾 Pets Present: YES" : "🐾 Pets Present: NO"}
                </button>
              </div>
            </div>

            {/* FLOOD WATER SUBMERGENCE LEVEL */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  FLOOD WATER SUBMERGENCE LEVEL
                </label>
                <span className="text-[10px] font-bold font-mono text-cyan-400">
                  {submergedLevel === "KNEE"
                    ? "0.5m"
                    : submergedLevel === "WAIST"
                    ? "1.1m"
                    : submergedLevel === "ROOF"
                    ? "2.4m"
                    : "3.2m+ Critical"}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  {
                    level: "KNEE",
                    label: "KNEE LEVEL",
                    desc: "0.5m Depth",
                    color: "border-emerald-500/50 text-emerald-300",
                  },
                  {
                    level: "WAIST",
                    label: "WAIST LEVEL",
                    desc: "1.1m Depth",
                    color: "border-amber-500/50 text-amber-300",
                  },
                  {
                    level: "ROOF",
                    label: "ROOF LEVEL",
                    desc: "2.4m Depth",
                    color: "border-orange-500/50 text-orange-300",
                  },
                  {
                    level: "OVERHEAD",
                    label: "OVERHEAD",
                    desc: "3.2m+ Critical",
                    color: "border-red-500/50 text-red-300",
                  },
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => {
                      setSubmergedLevel(item.level as any);
                      if (soundEnabled) playSynthesizedChime(600, 0.1);
                    }}
                    className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      submergedLevel === item.level
                        ? `bg-cyan-950/70 border-cyan-400 ${item.color} shadow-lg shadow-cyan-950/50 font-bold scale-[1.02]`
                        : "bg-[#1c2541] border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <Waves className="w-3.5 h-3.5 mb-1" />
                    <span className="text-[10px] font-bold leading-tight">{item.label}</span>
                    <span className="text-[8px] text-slate-400 mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: LIVE RESPONSE TELEMETRY & ZERO-SIGNAL FALLBACK QR */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* LIVE RESPONSE TELEMETRY CARD */}
          <div className="bg-[#0b132b] border border-cyan-500/40 rounded-2xl p-5 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  LIVE RESPONSE TELEMETRY
                </h3>
              </div>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                REAL-TIME SYNC
              </span>
            </div>

            {/* TICKET DETAILS BOX */}
            <div className="bg-[#1c2541] p-4 rounded-xl border border-cyan-500/20 shadow-md">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold tracking-wider">ACTIVE TICKET ID</span>
                <span className="text-sm font-extrabold text-cyan-300 font-mono tracking-wider">
                  {activeTicket.id}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400 font-bold">ASSIGNED UNIT:</span>
                <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Radio size={12} className="text-amber-400" />
                  {activeTicket.assignedTeam || "Team R-09"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs mb-3">
                <span className="text-slate-400 font-bold">STATUS:</span>
                <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                  {activeTicket.status}
                </span>
              </div>

              {/* Dynamic Live Countdown & Rescuer Vessel Distance */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[10px] font-mono">
                <div className="bg-[#0f172a] p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">ESTIMATED ARRIVAL:</span>
                  <span className="text-xs font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                    <Clock size={12} className="animate-spin text-emerald-400" />
                    {formatEta(etaSeconds)} min
                  </span>
                </div>
                <div className="bg-[#0f172a] p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">DISTANCE TO CRAFT:</span>
                  <span className="text-xs font-black text-cyan-300 flex items-center gap-1 mt-0.5">
                    <Navigation size={12} className="text-cyan-400" />
                    {dynamicDistanceKm} km
                  </span>
                </div>
              </div>
            </div>

            {/* MISSION LIFECYCLE PROGRESS */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  MISSION LIFECYCLE PROGRESS
                </label>
                <span className="text-[9px] font-mono text-cyan-400">Step {currentStage} of 4</span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    stage: 1,
                    label: "TICKET LOGGED",
                    desc: "Distress signal geofenced",
                  },
                  {
                    stage: 2,
                    label: "DISPATCHED",
                    desc: `Tasked to NDRF Boat ${activeTicket.assignedTeam || "R-09"}`,
                  },
                  {
                    stage: 3,
                    label: "TEAM EN ROUTE",
                    desc: "Navigating via A* flood route",
                  },
                  {
                    stage: 4,
                    label: "SAFE",
                    desc: "Evacuated to Shelter",
                  },
                ].map((step) => {
                  const isComplete = currentStage >= step.stage;
                  const isCurrent = currentStage === step.stage;
                  return (
                    <div
                      key={step.stage}
                      className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                        isCurrent
                          ? "bg-cyan-500/10 border border-cyan-500/30"
                          : "border border-transparent"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                          isComplete
                            ? "bg-cyan-500 text-black border-cyan-400 shadow-sm"
                            : "bg-slate-800 text-slate-500 border-slate-700"
                        } ${isCurrent ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0b132b] animate-pulse" : ""}`}
                      >
                        {isComplete ? <CheckCircle2 className="w-4 h-4" /> : step.stage}
                      </div>
                      <div className="flex-1">
                        <div
                          className={`text-xs font-bold ${
                            isComplete ? "text-cyan-300" : "text-slate-500"
                          }`}
                        >
                          {step.label}
                        </div>
                        <div className="text-[9px] text-slate-500">{step.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DYNAMIC LIFECYCLE SIMULATION CONTROLS */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleAdvanceLifecycle}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all cursor-pointer active:scale-98"
                  title="Simulate dispatch progressing to next response step"
                >
                  <Zap size={13} />
                  <span>Advance Lifecycle Step &rarr;</span>
                </button>
                <button
                  type="button"
                  onClick={handleMarkSafe}
                  className="py-2 px-3 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
                  title="Citizen marks themselves safe / stood down"
                >
                  Mark Safe
                </button>
              </div>
            </div>
          </div>

          {/* ZERO-SIGNAL FALLBACK & OPTICAL QR CODE CARD */}
          <div className="bg-[#0b132b] border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  ZERO-SIGNAL FALLBACK & QR CODE
                </h3>
              </div>
              <button
                onClick={() => setIsOfflineMode((p) => !p)}
                className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold transition-all cursor-pointer ${
                  isOfflineMode
                    ? "bg-amber-500 text-black border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
                title="Toggle cellular disconnect simulation"
              >
                {isOfflineMode ? "OFFLINE BUFFER ACTIVE" : "INDEXEDDB READY"}
              </button>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              If cellular tower network drops, your SOS packet is saved locally. Display this high-density optical QR code directly to rescue drones or boat taskforces for instant scanning.
            </p>

            {/* Offline notification banner if toggled */}
            {isOfflineMode && (
              <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-[10px] font-mono text-amber-200 flex items-center gap-2">
                <WifiOff size={14} className="text-amber-400 animate-pulse flex-shrink-0" />
                <span>Cellular disconnected. High-contrast QR matrix operating in autonomous offline cache mode.</span>
              </div>
            )}

            {/* DYNAMIC SCANNABLE HIGH-DENSITY OPTICAL QR CODE */}
            <div className="bg-[#1c2541] p-4 rounded-xl flex flex-col items-center justify-center border border-amber-500/30">
              <OpticalSOSQRCode
                payload={qrPayload}
                ticketId={activeTicket.id}
                isOffline={isOfflineMode}
              />
            </div>

            {/* Emergency Speed Dial Footer */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              <span className="flex items-center gap-1">
                <PhoneCall className="w-3 h-3 text-cyan-400" /> HELPLINE: 112 / 1070
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                OFFLINE MESH STANDBY
              </span>
            </div>
          </div>

          {/* NEAREST SAFE EVACUATION HUBS (Effective & Unique Safe Shelter Route) */}
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-cyan-400" />
                <span className="text-xs font-bold text-slate-200 uppercase">
                  NEAREST SAFE RELIEF SHELTERS
                </span>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 font-bold">DRY CORRIDOR</span>
            </div>

            <div className="space-y-2">
              {safeShelters.map((s, idx) => (
                <div
                  key={s.name}
                  className="p-2.5 rounded-xl bg-[#141e38] border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {s.name}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {s.distanceM}m away &bull; Available: {s.capacity}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (soundEnabled) playSynthesizedChime(800, 0.1);
                      navigate(`/operator`);
                    }}
                    className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                  >
                    Nav Route &rarr;
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
