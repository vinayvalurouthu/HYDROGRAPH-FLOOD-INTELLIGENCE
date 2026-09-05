import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Map,
  Flame,
  Waves,
  Navigation,
  Building2,
  Zap,
  Users,
  FlaskConical,
  History,
  Activity,
  Settings,
  UserCircle,
  Bell,
  X,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { alerts, roads, kpiData } from "./mockData";
import type { Alert } from "./mockData";
import { PRESET_CITIES, generatePresetCityData } from "./services/cityDataGenerator";
import type { CityPreset, CityFloodDataset } from "./services/cityDataGenerator";
import { DispatchProvider } from "./context/DispatchContext";

// Views
import OverviewView from "./views/OverviewView";
import FloodMapView from "./views/FloodMapView";
import HotspotsView from "./views/HotspotsView";
import DrainageView from "./views/DrainageView";
import RoutingView from "./views/RoutingView";
import SheltersView from "./views/SheltersView";
import SOSView from "./views/SOSView";
import RescueView from "./views/RescueView";
import ScenariosView from "./views/ScenariosView";
import ReplayView from "./views/ReplayView";
import SystemHealthView from "./views/SystemHealthView";

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  critical?: boolean;
};

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "map", label: "Live Map", icon: Map },
  { id: "hotspots", label: "Hotspots", icon: Flame, badge: 6, critical: true },
  { id: "drainage", label: "Drainage", icon: Waves },
  { id: "routing", label: "Routing", icon: Navigation },
  { id: "shelters", label: "Shelters", icon: Building2 },
  { id: "sos", label: "SOS", icon: Zap, badge: 18, critical: true },
  { id: "rescue", label: "Rescue", icon: Users, badge: 2 },
  { id: "scenarios", label: "Scenarios", icon: FlaskConical },
  { id: "replay", label: "Replay", icon: History },
  { id: "health", label: "System Health", icon: Activity },
];

function RightPanel({
  roadId,
  onClose,
  onCloseRoad,
  onNavigate,
}: {
  roadId: string | null;
  onClose: () => void;
  onCloseRoad: (id: string) => void;
  onNavigate: (view: string) => void;
}) {
  const [showRoadClose, setShowRoadClose] = useState(false);
  const [roadClosed, setRoadClosed] = useState(false);
  const [toast, setToast] = useState(false);

  const road = roads.find((r) => r.id === roadId);
  if (!road) return null;

  const riskColor = {
    SEVERE: "#ef4444",
    HIGH: "#f97316",
    MODERATE: "#f59e0b",
    LOW: "#10b981",
  }[road.risk];

  const handleClose = () => {
    setRoadClosed(true);
    setShowRoadClose(false);
    setToast(true);
    onCloseRoad(road.id);
    setTimeout(() => setToast(false), 3000);
  };

  return (
    <div
      className="w-72 flex-shrink-0 flex flex-col border-l overflow-hidden animate-slide-right"
      style={{ borderColor: "#1a2640", background: "rgba(8,13,28,0.95)" }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: "1px solid #1a2640" }}
      >
        <div>
          <div className="text-base font-mono font-black text-white">{road.id}</div>
          <div className="text-[10px]" style={{ color: "#4a6080" }}>{road.name}</div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono font-bold px-2 py-1 rounded"
            style={{
              background: `${riskColor}15`,
              color: riskColor,
              border: `1px solid ${riskColor}40`,
            }}
          >
            {road.risk}
          </span>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X size={12} style={{ color: "#4a6080" }} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Action intelligence */}
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: `${riskColor}10`, border: `1px solid ${riskColor}30` }}
        >
          <div className="text-[9px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "#4a6080" }}>
            RECOMMENDED ACTION
          </div>
          <div className="text-xs font-bold" style={{ color: riskColor }}>
            {road.risk === "SEVERE"
              ? "CLOSE IMMEDIATELY"
              : road.risk === "HIGH"
                ? `AVOID AFTER +${road.timeToFloodMin} MIN`
                : "MONITOR"}
          </div>
        </div>

        {/* Metrics */}
        {[
          { l: "Current", v: `${road.depthCm} cm` },
          { l: "Peak Forecast", v: `${road.peakDepthCm} cm` },
          { l: "Velocity", v: `${road.velocityMs} m/s` },
          { l: "Duration", v: `${road.durationMin} min` },
          { l: "Time-to-flood", v: `${road.timeToFloodMin} min` },
          { l: "Confidence", v: `${road.confidencePct}%` },
          { l: "Rainfall", v: `${road.rainfallMmHr} mm/hr` },
          { l: "Drain util.", v: `${road.drainUtilPct}%` },
        ].map((r) => (
          <div key={r.l} className="flex justify-between items-center py-1" style={{ borderBottom: "1px solid #1a2640" }}>
            <span className="text-xs" style={{ color: "#4a6080" }}>{r.l}</span>
            <span className="text-xs font-mono font-bold text-white">{r.v}</span>
          </div>
        ))}

        {/* Cause */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: "#4a6080" }}>
            Possible Cause
          </div>
          {road.cause.map((c) => (
            <div key={c} className="text-xs text-white">• {c}</div>
          ))}
        </div>

        {roadClosed && (
          <div
            className="rounded-lg px-3 py-2 flex items-center gap-2"
            style={{ background: "rgba(107,114,128,0.15)", border: "1px solid rgba(107,114,128,0.3)" }}
          >
            <CheckCircle size={12} style={{ color: "#9ca3af" }} />
            <span className="text-xs font-mono" style={{ color: "#9ca3af" }}>
              ROAD CLOSED
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-4 py-3 space-y-2 flex-shrink-0" style={{ borderTop: "1px solid #1a2640" }}>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigate("routing")}
            className="py-2 rounded-lg text-[11px] font-mono font-bold text-white hover:opacity-90 transition-all"
            style={{ background: "#06b6d4" }}
          >
            VIEW ROUTE
          </button>
          <button
            onClick={() => onNavigate("scenarios")}
            className="py-2 rounded-lg text-[11px] font-mono hover:bg-white/5 transition-colors"
            style={{ border: "1px solid #1a2640", color: "#8da0b8" }}
          >
            SIMULATE
          </button>
          <button
            className="py-2 rounded-lg text-[11px] font-mono hover:bg-white/5 transition-colors"
            style={{ border: "1px solid #1a2640", color: "#8da0b8" }}
          >
            REPORT
          </button>
          {!roadClosed ? (
            <button
              onClick={() => setShowRoadClose(true)}
              className="py-2 rounded-lg text-[11px] font-mono font-bold transition-all"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#fca5a5",
              }}
            >
              CLOSE ROAD
            </button>
          ) : (
            <button
              className="py-2 rounded-lg text-[11px] font-mono font-bold transition-all"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#6ee7b7" }}
            >
              REOPEN
            </button>
          )}
        </div>
      </div>

      {/* Road close modal */}
      {showRoadClose && (
        <div
          className="absolute inset-0 z-50 flex items-end justify-center pb-4 px-4"
          style={{ background: "rgba(3,6,15,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="rounded-2xl p-5 w-full animate-slide-up"
            style={{ background: "#0c1322", border: "1px solid rgba(239,68,68,0.4)" }}
          >
            <h3 className="text-sm font-bold text-white mb-2">CLOSE {road.id}?</h3>
            <div className="space-y-1 text-xs mb-4">
              <div className="flex justify-between">
                <span style={{ color: "#4a6080" }}>Reason</span>
                <span className="text-white">Flood above threshold</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#4a6080" }}>Affected routes</span>
                <span className="font-mono text-amber-400">7</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 py-2 rounded-lg text-xs font-bold text-white"
                style={{ background: "#dc2626" }}
              >
                CONFIRM
              </button>
              <button
                onClick={() => setShowRoadClose(false)}
                className="flex-1 py-2 rounded-lg text-xs font-medium hover:bg-white/5"
                style={{ border: "1px solid #1a2640", color: "#8da0b8" }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="absolute bottom-16 left-4 right-4 rounded-lg px-3 py-2 flex items-center gap-2 animate-slide-up"
          style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}
        >
          <CheckCircle size={12} style={{ color: "#10b981" }} />
          <span className="text-xs font-mono text-white">ROAD CLOSED · 7 routes recalculated</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState("overview");
  const [activeCity, setActiveCity] = useState<CityPreset>(PRESET_CITIES[0]);
  const [cityDataset, setCityDataset] = useState<CityFloodDataset | null>(null);
  const [selectedRoad, setSelectedRoad] = useState<string | null>(null);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [localAlerts, setLocalAlerts] = useState<Alert[]>(alerts);
  const [liveTime, setLiveTime] = useState(new Date());
  const [closedRoads, setClosedRoads] = useState<Set<string>>(new Set());

  useEffect(() => {
    const initialDataset = generatePresetCityData(PRESET_CITIES[0]);
    setCityDataset(initialDataset);
    const t = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleNavigate = (view: string, roadId?: string) => {
    setActiveView(view);
    if (roadId) setSelectedRoad(roadId);
  };

  const dismissAlert = (id: string) => {
    setLocalAlerts((p) => p.filter((a) => a.id !== id));
  };

  const markRead = (id: string) => {
    setLocalAlerts((p) => p.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const handleReportIssue = (roadId: string, details: string) => {
    const newAlert: Alert = {
      id: `a${Date.now()}`,
      type: "WARNING",
      title: `Field Report — ${roadId}`,
      message: details,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      read: false,
      roadId: roadId,
    };
    setLocalAlerts((prev) => [newAlert, ...prev]);
  };

  const unreadCount = localAlerts.filter((a) => !a.read).length;
  const criticalAlerts = localAlerts.filter((a) => a.type === "CRITICAL" && !a.read);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <DispatchProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: "#07111e" }}>
      {/* TOP COMMAND BAR */}
      <div
        className="flex-shrink-0 flex items-center px-4 py-2 gap-4"
        style={{
          background: "rgba(8,13,28,0.98)",
          borderBottom: "1px solid #1a2640",
          height: 52,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}
          >
            <Waves size={14} style={{ color: "white" }} />
          </div>
          <div>
            <div
              className="text-sm font-black tracking-wider leading-none"
              style={{ color: "#f0f4ff", letterSpacing: "0.1em" }}
            >
              HYDROGRAPH
            </div>
            <div className="text-[8px] font-mono" style={{ color: "#4a6080" }}>
              FLOOD INTELLIGENCE
            </div>
          </div>
        </div>

        <div className="w-px h-6 flex-shrink-0" style={{ background: "#1a2640" }} />

        {/* Location + status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div>
            <div className="text-xs font-mono font-bold text-white tracking-wide">{activeCity.name.toUpperCase()}</div>
            <div className="text-[9px] font-mono" style={{ color: "#4a6080" }}>{activeCity.state.toUpperCase()} · {activeCity.regionType.toUpperCase()}</div>
          </div>
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: "#10b981" }} />
            <span className="text-[10px] font-mono" style={{ color: "#6ee7b7" }}>
              SYSTEM OPERATIONAL
            </span>
          </div>
        </div>

        {/* Critical alerts strip */}
        {criticalAlerts.length > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full animate-alert-critical"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.4)",
            }}
          >
            <AlertTriangle size={12} style={{ color: "#ef4444" }} />
            <span className="text-[11px] font-mono font-bold" style={{ color: "#fca5a5" }}>
              ⚠ {criticalAlerts.length} CRITICAL ALERTS
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right status indicators */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {[
            { label: "RADAR", value: "● LIVE", color: "#10b981" },
            { label: "FORECAST", value: "2 min ago", color: "#8da0b8" },
            { label: "MODEL", value: formatTime(liveTime).slice(0, 5), color: "#8da0b8" },
            { label: "DATA QUALITY", value: "GOOD", color: "#06b6d4" },
          ].map((s) => (
            <div key={s.label} className="text-right">
              <div className="text-[8px] font-mono uppercase tracking-widest" style={{ color: "#2a3a55" }}>
                {s.label}
              </div>
              <div className="text-[10px] font-mono font-bold" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}

          <div className="w-px h-6" style={{ background: "#1a2640" }} />

          {/* Clock */}
          <div
            className="text-sm font-mono font-black"
            style={{ color: "#22d3ee", letterSpacing: "0.08em" }}
          >
            {formatTime(liveTime)}
          </div>

          <div className="w-px h-6" style={{ background: "#1a2640" }} />

          {/* Notifications */}
          <button
            onClick={() => setShowAlerts((p) => !p)}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <Bell size={15} style={{ color: unreadCount > 0 ? "#f59e0b" : "#4a6080" }} />
            {unreadCount > 0 && (
              <div
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                style={{ background: "#ef4444" }}
              >
                {unreadCount}
              </div>
            )}
          </button>

          {/* User */}
          <div className="flex items-center gap-1.5">
            <UserCircle size={16} style={{ color: "#4a6080" }} />
            <div>
              <div className="text-[10px] font-bold text-white">Operator</div>
              <div className="text-[8px] font-mono" style={{ color: "#4a6080" }}>MUNICIPAL</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT NAV RAIL */}
        <nav
          className="flex-shrink-0 flex flex-col py-2"
          style={{
            width: 56,
            background: "rgba(8,13,28,0.95)",
            borderRight: "1px solid #1a2640",
          }}
        >
          <div className="flex-1 flex flex-col gap-0.5 px-1">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  title={item.label}
                  className="relative w-full flex flex-col items-center py-2.5 rounded-lg transition-all group"
                  style={{
                    background: isActive ? "rgba(6,182,212,0.1)" : "transparent",
                    borderRight: isActive ? "2px solid #06b6d4" : "2px solid transparent",
                  }}
                >
                  <item.icon
                    size={17}
                    style={{
                      color: isActive ? "#22d3ee" : "#3a4f6a",
                    }}
                  />
                  {item.badge && (
                    <div
                      className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
                      style={{ background: item.critical ? "#ef4444" : "#06b6d4" }}
                    >
                      {typeof item.badge === "number" && item.badge > 9 ? "9+" : item.badge}
                    </div>
                  )}
                  {/* Tooltip */}
                  <div
                    className="absolute left-full ml-2 px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                    style={{
                      background: "#0c1322",
                      border: "1px solid #1a2640",
                      color: "#f0f4ff",
                    }}
                  >
                    {item.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom nav */}
          <div className="flex flex-col gap-0.5 px-1 pb-1 border-t pt-2" style={{ borderColor: "#1a2640" }}>
            {[
              { icon: Settings, label: "Settings" },
              { icon: UserCircle, label: "Profile" },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                title={label}
                className="w-full flex items-center justify-center py-2.5 rounded-lg hover:bg-white/5 transition-colors group relative"
              >
                <Icon size={15} style={{ color: "#3a4f6a" }} />
                <div
                  className="absolute left-full ml-2 px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                  style={{ background: "#0c1322", border: "1px solid #1a2640", color: "#f0f4ff" }}
                >
                  {label}
                </div>
              </button>
            ))}
          </div>
        </nav>

        {/* CENTER CONTENT */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* View area */}
          <div className="flex-1 overflow-hidden relative">
            {activeView === "overview" && (
              <OverviewView onNavigate={handleNavigate} />
            )}
            {activeView === "map" && (
              <FloodMapView
                selectedRoadId={selectedRoad ?? undefined}
                onRoadSelect={(id) => setSelectedRoad(id)}
                timelineIndex={timelineIndex}
                onTimelineChange={setTimelineIndex}
                onCloseRoad={(id) => setClosedRoads((p) => new Set(p).add(id))}
                activeCity={activeCity}
                cityDataset={cityDataset}
                onCityChange={setActiveCity}
                onCityDatasetChange={setCityDataset}
              />
            )}
            {activeView === "hotspots" && (
              <HotspotsView
                onNavigate={handleNavigate}
                cityDataset={cityDataset}
                onReportIssue={handleReportIssue}
              />
            )}
            {activeView === "drainage" && (
              <DrainageView cityDataset={cityDataset} activeCity={activeCity} />
            )}
            {activeView === "routing" && (
              <RoutingView activeCity={activeCity} cityDataset={cityDataset} />
            )}
            {activeView === "shelters" && <SheltersView />}
            {activeView === "sos" && (
              <SOSView
                onAssignTeam={(sosId, teamId) => {
                  console.log("Assigned", teamId, "to", sosId);
                }}
              />
            )}
            {activeView === "rescue" && <RescueView />}
            {activeView === "scenarios" && <ScenariosView />}
            {activeView === "replay" && <ReplayView />}
            {activeView === "health" && <SystemHealthView />}
          </div>

          {/* Right panel — road intelligence */}
          {selectedRoad && activeView === "map" && (
            <RightPanel
              roadId={selectedRoad}
              onClose={() => setSelectedRoad(null)}
              onCloseRoad={(id) => setClosedRoads((p) => new Set(p).add(id))}
              onNavigate={setActiveView}
            />
          )}
        </div>

        {/* ALERT DRAWER */}
        {showAlerts && (
          <div
            className="absolute top-0 right-0 h-full w-80 flex flex-col animate-slide-right z-40"
            style={{ background: "rgba(8,13,28,0.98)", borderLeft: "1px solid #1a2640" }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: "1px solid #1a2640" }}
            >
              <div>
                <h2 className="text-sm font-bold text-white">ALERT CENTER</h2>
                <p className="text-[11px]" style={{ color: "#4a6080" }}>
                  {unreadCount} unread alerts
                </p>
              </div>
              <button
                onClick={() => setShowAlerts(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X size={14} style={{ color: "#4a6080" }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {localAlerts.map((a) => {
                const alertColor =
                  a.type === "CRITICAL"
                    ? "#ef4444"
                    : a.type === "WARNING"
                      ? "#f59e0b"
                      : a.type === "SUCCESS"
                        ? "#10b981"
                        : "#3b82f6";
                const AlertIcon =
                  a.type === "CRITICAL"
                    ? AlertTriangle
                    : a.type === "WARNING"
                      ? AlertTriangle
                      : a.type === "SUCCESS"
                        ? CheckCircle
                        : Info;
                return (
                  <div
                    key={a.id}
                    className="rounded-xl p-3 transition-all"
                    style={{
                      background: `${alertColor}08`,
                      border: `1px solid ${alertColor}${a.read ? "20" : "40"}`,
                      opacity: a.read ? 0.65 : 1,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <AlertIcon
                        size={13}
                        style={{ color: alertColor, flexShrink: 0, marginTop: 1 }}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[11px] font-bold leading-tight"
                          style={{ color: a.read ? "#6b7fa0" : "#f0f4ff" }}
                        >
                          {a.title}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: "#4a6080" }}>
                          {a.message}
                        </div>
                        <div className="text-[9px] font-mono mt-1" style={{ color: "#2a3a55" }}>
                          {a.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {!a.read && (
                        <button
                          onClick={() => markRead(a.id)}
                          className="text-[9px] font-mono px-2 py-0.5 rounded hover:bg-white/10 transition-colors"
                          style={{ border: "1px solid #1a2640", color: "#4a6080" }}
                        >
                          MARK READ
                        </button>
                      )}
                      {a.roadId && (
                        <button
                          onClick={() => {
                            setSelectedRoad(a.roadId!);
                            setActiveView("map");
                            setShowAlerts(false);
                          }}
                          className="text-[9px] font-mono px-2 py-0.5 rounded hover:bg-white/10 transition-colors"
                          style={{ border: "1px solid rgba(6,182,212,0.3)", color: "#22d3ee" }}
                        >
                          VIEW ON MAP
                        </button>
                      )}
                      <button
                        onClick={() => dismissAlert(a.id)}
                        className="text-[9px] font-mono px-2 py-0.5 rounded hover:bg-white/10 transition-colors ml-auto"
                        style={{ border: "1px solid #1a2640", color: "#4a6080" }}
                      >
                        DISMISS
                      </button>
                    </div>
                  </div>
                );
              })}

              {localAlerts.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <CheckCircle size={32} style={{ color: "#10b981" }} />
                  <p className="text-sm font-mono text-white">ALL CLEAR</p>
                  <p className="text-xs" style={{ color: "#4a6080" }}>
                    No active alerts
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TAGLINE STRIP */}
      <div
        className="flex-shrink-0 flex items-center justify-center py-1 gap-4"
        style={{ background: "rgba(6,9,18,0.98)", borderTop: "1px solid #1a2640" }}
      >
        {["PREDICT", "EXPLAIN", "WARN", "ROUTE", "EVACUATE", "RESCUE"].map((step, i, arr) => (
          <div key={step} className="flex items-center gap-4">
            <span
              className="text-[9px] font-mono font-bold tracking-widest"
              style={{ color: "#2a3a55" }}
            >
              {step}
            </span>
            {i < arr.length - 1 && (
              <span className="text-[9px]" style={{ color: "#1a2640" }}>→</span>
            )}
          </div>
        ))}
        <div className="ml-auto flex items-center gap-3 pr-2">
          <span className="text-[9px] font-mono" style={{ color: "#2a3a55" }}>
            v2.4.1 · PILOT ZONE
          </span>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
            <span className="text-[9px] font-mono" style={{ color: "#2a3a55" }}>LIVE</span>
          </div>
        </div>
      </div>
    </div>
  </DispatchProvider>
);
}
