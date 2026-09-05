import { useState, useEffect } from "react";
import { drainageNodes } from "../mockData";
import type { DrainageNode } from "../mockData";
import { AlertTriangle, CheckCircle, MapPin, Wrench, Loader2 } from "lucide-react";
import { getDrainageStatus, requestFieldInspection } from "../services/api";

function UtilizationBar({ pct, status }: { pct: number; status: DrainageNode["status"] }) {
  const color =
    status === "CRITICAL" ? "#ef4444" : status === "STRESSED" ? "#f59e0b" : "#10b981";
  return (
    <div>
      <div className="flex justify-between text-[10px] font-mono mb-1">
        <span style={{ color: "#4a6080" }}>Utilization</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "#1a2640" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

const statusConfig = {
  NORMAL: { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)" },
  STRESSED: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
  CRITICAL: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.35)" },
};

function getStatusConfig(status?: string) {
  const normalized = (status || "NORMAL").toUpperCase() as keyof typeof statusConfig;
  return statusConfig[normalized] || statusConfig.NORMAL;
}

import type { CityFloodDataset, CityPreset } from "../services/cityDataGenerator";
import { useDispatch } from "../context/DispatchContext";

interface DrainageViewProps {
  cityDataset?: CityFloodDataset | null;
  activeCity?: CityPreset;
}

export default function DrainageView({ cityDataset, activeCity }: DrainageViewProps) {
  const { requestInspection } = useDispatch();
  const [nodes, setNodes] = useState<DrainageNode[]>(
    cityDataset?.drainageNodes || drainageNodes
  );
  const [selected, setSelected] = useState<DrainageNode>(
    cityDataset?.drainageNodes[0] || drainageNodes[0]
  );
  const [inspectionSent, setInspectionSent] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [dispatchToast, setDispatchToast] = useState<string | null>(null);

  useEffect(() => {
    if (cityDataset && cityDataset.drainageNodes && cityDataset.drainageNodes.length > 0) {
      setNodes(cityDataset.drainageNodes);
      setSelected(cityDataset.drainageNodes[0]);
    } else {
      getDrainageStatus(activeCity?.id).then((res) => {
        if (res && res.nodes && res.nodes.length > 0) {
          setNodes(res.nodes);
          setSelected(res.nodes[0]);
        }
      });
    }
  }, [cityDataset, activeCity?.id]);

  const activeSelected = selected || nodes[0] || drainageNodes[0];

  const handleInspection = async (id: string) => {
    setLoadingId(id);
    try {
      await requestInspection(id, activeSelected.name, activeSelected.status);
      setInspectionSent((p) => new Set(p).add(id));
      setDispatchToast(`🚨 DISPATCH ALERT BROADCAST: Clearance Unit assigned to junction ${activeSelected.name} (${id})`);
      setTimeout(() => setDispatchToast(null), 6000);
    } finally {
      setLoadingId(null);
    }
  };

  const activeSelected = selected || nodes[0] || drainageNodes[0];
  const selectedCfg = getStatusConfig(activeSelected.status);

  return (
    <div className="h-full flex overflow-hidden relative">
      {/* Toast Notification */}
      {dispatchToast && (
        <div
          className="absolute top-4 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-down"
          style={{
            background: "#0c1322",
            border: "1px solid #06b6d4",
            boxShadow: "0 0 25px rgba(6,182,212,0.3)",
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
            <Wrench className="text-cyan-400 animate-pulse" size={16} />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-cyan-400">RESCUE TEAM ALERT BROADCAST</div>
            <div className="text-xs font-semibold text-white mt-0.5">{dispatchToast}</div>
          </div>
        </div>
      )}
      {/* Node list */}
      <div
        className="w-72 flex-shrink-0 border-r overflow-y-auto"
        style={{ borderColor: "#1a2640" }}
      >
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #1a2640" }}>
          <h2 className="text-sm font-bold text-white">DRAINAGE NETWORK</h2>
          <div className="flex items-center gap-3 mt-1.5">
            {(["NORMAL", "STRESSED", "CRITICAL"] as const).map((s) => (
              <div key={s} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: statusConfig[s].color }}
                />
                <span className="text-[10px] font-mono" style={{ color: "#4a6080" }}>
                  {nodes.filter((n) => (n.status || "").toUpperCase() === s).length} {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 space-y-2">
          {nodes.map((node) => {
            const cfg = getStatusConfig(node.status);
            const isSelected = activeSelected.id === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setSelected(node)}
                className="w-full text-left rounded-xl p-3 transition-all"
                style={{
                  background: isSelected ? cfg.bg : "rgba(12,19,34,0.5)",
                  border: `1px solid ${isSelected ? cfg.border : "#1a2640"}`,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-white">{node.id}</span>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                  >
                    {node.status}
                  </span>
                </div>
                <UtilizationBar pct={node.utilizationPct} status={node.status} />
                {node.anomaly && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={9} style={{ color: "#f59e0b" }} />
                    <span className="text-[10px]" style={{ color: "#d97706" }}>
                      Anomaly detected
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Header */}
        <div
          className="rounded-xl p-4 animate-slide-up"
          style={{
            background: selectedCfg.bg,
            border: `1px solid ${selectedCfg.border}`,
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-xl font-mono font-black text-white">{activeSelected.name}</h2>
              <span
                className="text-sm font-mono font-bold px-3 py-1 rounded-full mt-1 inline-block"
                style={{
                  background: selectedCfg.color,
                  color: "white",
                }}
              >
                {activeSelected.status}
              </span>
            </div>
            {/* Confidence ring */}
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center relative"
                style={{
                  background: `conic-gradient(${selectedCfg.color} ${(activeSelected.confidencePct || 0) * 3.6}deg, #1a2640 0deg)`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "#0c1322" }}
                >
                  <span className="text-xs font-mono font-bold" style={{ color: selectedCfg.color }}>
                    {activeSelected.confidencePct}%
                  </span>
                </div>
              </div>
              <div className="text-[9px] font-mono mt-1" style={{ color: "#4a6080" }}>
                CONFIDENCE
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Flow metrics */}
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
          >
            <h3 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#4a6080" }}>
              Flow Metrics
            </h3>
            {[
              { label: "Utilization", value: `${activeSelected.utilizationPct}%` },
              { label: "Design Capacity", value: `${activeSelected.capacityLs} L/s` },
              { label: "Current Est. Flow", value: `${activeSelected.flowLs} L/s` },
              {
                label: "Headroom",
                value: `${activeSelected.capacityLs - activeSelected.flowLs} L/s`,
              },
            ].map((r) => (
              <div
                key={r.label}
                className="flex justify-between py-2"
                style={{ borderBottom: "1px solid #1a2640" }}
              >
                <span className="text-xs" style={{ color: "#4a6080" }}>
                  {r.label}
                </span>
                <span className="text-sm font-mono font-bold text-white">{r.value}</span>
              </div>
            ))}

            <div className="mt-3">
              <UtilizationBar pct={activeSelected.utilizationPct} status={activeSelected.status} />
            </div>
          </div>

          {/* Anomaly + action */}
          <div className="space-y-3">
            {activeSelected.anomaly ? (
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.3)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} style={{ color: "#f59e0b" }} />
                  <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: "#f59e0b" }}>
                    Anomaly Detected
                  </h3>
                </div>
                <p className="text-sm text-white mb-2">{activeSelected.anomaly}</p>
                <p className="text-[11px]" style={{ color: "#9a6e00" }}>
                  Note: This is an inferred condition based on flow data, not a confirmed physical blockage. Field inspection required to confirm.
                </p>
              </div>
            ) : (
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.3)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={14} style={{ color: "#10b981" }} />
                  <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: "#10b981" }}>
                    No Anomalies Detected
                  </h3>
                </div>
                <p className="text-xs text-white">
                  Node operating within normal parameters.
                </p>
              </div>
            )}

            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
            >
              <h3 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#4a6080" }}>
                Recommended Action
              </h3>
              {activeSelected.status === "CRITICAL" ? (
                <p className="text-sm text-white mb-3">
                  Immediate field inspection. Alert maintenance team. Consider upstream road closure.
                </p>
              ) : activeSelected.status === "STRESSED" ? (
                <p className="text-sm text-white mb-3">
                  Schedule field inspection within 30 min. Monitor flow rate closely.
                </p>
              ) : (
                <p className="text-sm text-white mb-3">
                  Continue monitoring. No action required at this time.
                </p>
              )}

              {inspectionSent.has(activeSelected.id) ? (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}
                >
                  <CheckCircle size={14} className="text-green-400" />
                  <span className="text-xs font-mono text-green-300">
                    Inspection request sent to dispatch
                  </span>
                </div>
              ) : (
                <button
                  disabled={loadingId === activeSelected.id}
                  onClick={() => handleInspection(activeSelected.id)}
                  className="w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#06b6d4" }}
                >
                  {loadingId === activeSelected.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Wrench size={14} />
                  )}
                  {loadingId === activeSelected.id ? "DISPATCHING..." : "REQUEST FIELD INSPECTION"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Network map */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
        >
          <h3 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#4a6080" }}>
            Network Overview
          </h3>
          <div className="relative" style={{ height: 180 }}>
            <svg viewBox="0 0 600 180" width="100%" height="100%">
              {/* Network lines */}
              <line x1="120" y1="90" x2="250" y2="60" stroke="#1a2640" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="250" y1="60" x2="350" y2="90" stroke="#1a2640" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="350" y1="90" x2="480" y2="70" stroke="#1a2640" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="120" y1="90" x2="300" y2="140" stroke="#1a2640" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="300" y1="140" x2="480" y2="70" stroke="#1a2640" strokeWidth="2" strokeDasharray="4 4" />

              {nodes.map((node, i) => {
                const defaultPositions = [
                  { x: 350, y: 90 },
                  { x: 250, y: 60 },
                  { x: 480, y: 70 },
                  { x: 300, y: 140 },
                  { x: 120, y: 90 },
                  { x: 410, y: 130 },
                ];
                const pos = defaultPositions[i] || { x: 100 + ((i * 75) % 450), y: 50 + ((i * 35) % 90) };
                const cfg = getStatusConfig(node.status);
                const isSelected = activeSelected.id === node.id;
                return (
                  <g
                    key={node.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(node)}
                  >
                    {isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={18}
                        fill="none"
                        stroke={cfg.color}
                        strokeWidth={1.5}
                        opacity={0.4}
                      />
                    )}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={12}
                      fill={cfg.bg}
                      stroke={cfg.color}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 4}
                      textAnchor="middle"
                      fill={cfg.color}
                      fontSize={7}
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                    >
                      {node.utilizationPct}%
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + 24}
                      textAnchor="middle"
                      fill="#4a6080"
                      fontSize={8}
                      fontFamily="JetBrains Mono"
                    >
                      {node.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

