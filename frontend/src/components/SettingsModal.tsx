import React, { useState } from "react";
import {
  X,
  Sliders,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  Wifi,
  WifiOff,
  Database,
  Trash2,
  RotateCcw,
  Check,
  Shield,
  Layers,
  Activity,
  Cpu,
  Zap,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMeshSimulated?: boolean;
  onToggleMesh?: () => void;
}

type TabType = "telemetry" | "display" | "network";

export default function SettingsModal({
  isOpen,
  onClose,
  isMeshSimulated = false,
  onToggleMesh,
}: SettingsModalProps) {
  const { settings, updateSettings, resetSettings, playAlertSound } = useSettings();
  const [activeTab, setActiveTab] = useState<TabType>("telemetry");
  const [cacheCleared, setCacheCleared] = useState(false);
  const [soundTested, setSoundTested] = useState(false);

  if (!isOpen) return null;

  const handleTestChime = () => {
    playAlertSound(960, 0.3);
    setSoundTested(true);
    setTimeout(() => setSoundTested(false), 1500);
  };

  const handleClearCache = () => {
    try {
      // Clear non-essential cached responses while preserving auth & settings
      const keysToKeep = ["hydrograph_auth_user", "hydrograph_system_settings"];
      Object.keys(localStorage).forEach((key) => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2000);
    } catch {
      /* ignore */
    }
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
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col border shadow-2xl animate-scale-up"
        style={{
          background: "#080d1c",
          borderColor: "#1a2640",
          boxShadow: "0 24px 60px rgba(0,0,0,0.8), 0 0 40px rgba(6,182,212,0.1)",
          maxHeight: "85vh",
        }}
      >
        {/* Top Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "#1a2640", background: "rgba(12,19,34,0.7)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}
            >
              <Sliders size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-black tracking-wider text-white flex items-center gap-2">
                SYSTEM SETTINGS & PARAMETERS
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  LIVE OPS
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Configure radar polling, disaster thresholds, and map units
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Settings"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex border-b px-6 gap-2 flex-shrink-0"
          style={{ borderColor: "#1a2640", background: "#0c1322" }}
        >
          {[
            { id: "telemetry" as TabType, label: "Telemetry & Alarms", icon: Activity },
            { id: "display" as TabType, label: "Map & Units", icon: Layers },
            { id: "network" as TabType, label: "Mesh & Storage", icon: Radio },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === id
                  ? "text-cyan-400 border-cyan-400 bg-cyan-500/10"
                  : "text-slate-400 border-transparent hover:text-slate-200"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: TELEMETRY & ALERTS */}
          {activeTab === "telemetry" && (
            <div className="space-y-5">
              {/* Auto Refresh */}
              <div
                className="p-4 rounded-xl border flex items-center justify-between"
                style={{ background: "#0c1322", borderColor: "#1a2640" }}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Zap size={14} className="text-cyan-400" />
                    Automated Sensor Polling Rate
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    How frequently water-level radar gauges fetch live telemetry
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-[#141e3a] p-1 rounded-lg border border-slate-700">
                  {[
                    { label: "5s", val: 5 },
                    { label: "15s", val: 15 },
                    { label: "30s", val: 30 },
                    { label: "60s", val: 60 },
                    { label: "Manual", val: 0 },
                  ].map(({ label, val }) => (
                    <button
                      key={label}
                      onClick={() => updateSettings({ autoRefreshIntervalSec: val })}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
                        settings.autoRefreshIntervalSec === val
                          ? "bg-cyan-500 text-black shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Alerts */}
              <div
                className="p-4 rounded-xl border flex items-center justify-between"
                style={{ background: "#0c1322", borderColor: "#1a2640" }}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    {settings.soundAlerts ? (
                      <Volume2 size={14} className="text-emerald-400" />
                    ) : (
                      <VolumeX size={14} className="text-slate-500" />
                    )}
                    Synthesized Command Audio Alarm
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Plays tactical warning chime when critical flood breaches or SOS signals occur
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTestChime}
                    disabled={!settings.soundAlerts}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {soundTested ? "Chime Played!" : "Test Chime"}
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.soundAlerts}
                      onChange={(e) => updateSettings({ soundAlerts: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
              </div>

              {/* Critical Flood Depth Slider */}
              <div
                className="p-4 rounded-xl border space-y-3"
                style={{ background: "#0c1322", borderColor: "#1a2640" }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Shield size={14} className="text-red-400" />
                      Critical Inundation Alert Threshold
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Roads exceeding this depth trigger immediate evacuation warnings & closure recommendations
                    </div>
                  </div>
                  <div className="text-base font-mono font-black text-red-400 bg-red-950/40 px-3 py-1 rounded-lg border border-red-500/40">
                    {settings.criticalFloodThresholdCm} cm
                  </div>
                </div>
                <input
                  type="range"
                  min="20"
                  max="90"
                  step="5"
                  value={settings.criticalFloodThresholdCm}
                  onChange={(e) =>
                    updateSettings({ criticalFloodThresholdCm: Number(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>20 cm (Minor puddle)</span>
                  <span>45 cm (Standard car exhaust limit)</span>
                  <span>90 cm (Severe boat clearance)</span>
                </div>
              </div>

              {/* Auto Dispatch Recommendations */}
              <div
                className="p-4 rounded-xl border flex items-center justify-between"
                style={{ background: "#0c1322", borderColor: "#1a2640" }}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Cpu size={14} className="text-cyan-400" />
                    AI Auto-Dispatch Optimization
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Automatically computes shortest flood-safe ETA when assigning rescue boats
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoDispatchRecommendations}
                    onChange={(e) =>
                      updateSettings({ autoDispatchRecommendations: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: MAP & UNITS */}
          {activeTab === "display" && (
            <div className="space-y-5">
              {/* Units */}
              <div
                className="p-4 rounded-xl border space-y-4"
                style={{ background: "#0c1322", borderColor: "#1a2640" }}
              >
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Measurement Display Preferences
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1.5">
                      Water Depth Units
                    </label>
                    <div className="flex rounded-lg bg-[#141e3a] p-1 border border-slate-700">
                      {[
                        { id: "cm", label: "Centimeters (cm)" },
                        { id: "in", label: "Inches (in)" },
                        { id: "m", label: "Meters (m)" },
                      ].map(({ id, label }) => (
                        <button
                          key={id}
                          onClick={() => updateSettings({ depthUnit: id as any })}
                          className={`flex-1 py-1 text-[11px] font-mono font-bold rounded transition-colors cursor-pointer ${
                            settings.depthUnit === id
                              ? "bg-cyan-500 text-black shadow-sm"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1.5">
                      Water Flow Velocity
                    </label>
                    <div className="flex rounded-lg bg-[#141e3a] p-1 border border-slate-700">
                      {[
                        { id: "m/s", label: "Meters/sec (m/s)" },
                        { id: "km/h", label: "Kilometers/hr" },
                      ].map(({ id, label }) => (
                        <button
                          key={id}
                          onClick={() => updateSettings({ velocityUnit: id as any })}
                          className={`flex-1 py-1 text-[11px] font-mono font-bold rounded transition-colors cursor-pointer ${
                            settings.velocityUnit === id
                              ? "bg-cyan-500 text-black shadow-sm"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Visual Theme */}
              <div
                className="p-4 rounded-xl border space-y-3"
                style={{ background: "#0c1322", borderColor: "#1a2640" }}
              >
                <div>
                  <div className="text-xs font-bold text-white">Cartographic Basemap Theme</div>
                  <div className="text-[11px] text-slate-400">
                    High-contrast color profiles for daylight command centers and night ops
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      id: "streets",
                      title: "Streets v2",
                      desc: "Clean street vectors with building footings",
                      badge: "Standard",
                    },
                    {
                      id: "dark_tactical",
                      title: "Dark Tactical",
                      desc: "Ultra-dark high contrast for night shifts",
                      badge: "Command HQ",
                    },
                    {
                      id: "satellite",
                      title: "Satellite Hybrid",
                      desc: "Aerial imagery with street overlay",
                      badge: "Orthophoto",
                    },
                  ].map((m) => (
                    <div
                      key={m.id}
                      onClick={() => updateSettings({ mapTheme: m.id as any })}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        settings.mapTheme === m.id
                          ? "bg-cyan-500/15 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          : "bg-[#141e3a]/60 border-slate-800 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-white">{m.title}</span>
                        <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/10 text-cyan-300">
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Low Bandwidth Mode */}
              <div
                className="p-4 rounded-xl border flex items-center justify-between"
                style={{ background: "#0c1322", borderColor: "#1a2640" }}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Activity size={14} className="text-amber-400" />
                    Field Low-Bandwidth Mode
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Disables glow animations and throttles polygon render steps to save field device battery
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.lowBandwidthMode}
                    onChange={(e) => updateSettings({ lowBandwidthMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: NETWORK & OFFLINE RESILIENCE */}
          {activeTab === "network" && (
            <div className="space-y-5">
              {/* P2P Mesh Simulation */}
              <div
                className="p-4 rounded-xl border flex items-center justify-between"
                style={{ background: "#0c1322", borderColor: "#1a2640" }}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    {isMeshSimulated ? (
                      <WifiOff size={14} className="text-amber-400 animate-pulse" />
                    ) : (
                      <Wifi size={14} className="text-emerald-400" />
                    )}
                    P2P Disaster Mesh Network Simulation
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Simulate cellular tower blackout with decentralized Bluetooth/VHF peer relay routing
                  </div>
                </div>
                <button
                  onClick={onToggleMesh}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    isMeshSimulated
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                  }`}
                >
                  {isMeshSimulated ? "OFFLINE MESH ACTIVE" : "SATELLITE ONLINE"}
                </button>
              </div>

              {/* Local Storage Cache Management */}
              <div
                className="p-4 rounded-xl border flex items-center justify-between"
                style={{ background: "#0c1322", borderColor: "#1a2640" }}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Database size={14} className="text-cyan-400" />
                    Local Geospatial & Incident Offline Cache
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Stores road segments, shelters, and relief waypoints for zero-latency offline operation
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">~14.2 MB cached</span>
                  <button
                    onClick={handleClearCache}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-red-950/40 border border-red-500/40 text-red-300 hover:bg-red-900/60 transition-colors"
                  >
                    {cacheCleared ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        <span>Purged!</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={12} />
                        <span>Clear Cache</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* System Microservices Health Endpoint Card */}
              <div
                className="p-4 rounded-xl border space-y-2.5"
                style={{ background: "#0c1322", borderColor: "#1a2640" }}
              >
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Backend Intelligence Node Status</span>
                  <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    HEALTHY
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                  <div className="bg-[#141e3a]/50 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[9px]">REST API NODE</span>
                    <span className="text-white font-bold">http://127.0.0.1:8000</span>
                  </div>
                  <div className="bg-[#141e3a]/50 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[9px]">PIPELINE LATENCY</span>
                    <span className="text-cyan-400 font-bold">~14 ms (FastAPI + SQLite)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: "#1a2640", background: "rgba(12,19,34,0.7)" }}
        >
          <button
            onClick={resetSettings}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw size={12} />
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-mono font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
