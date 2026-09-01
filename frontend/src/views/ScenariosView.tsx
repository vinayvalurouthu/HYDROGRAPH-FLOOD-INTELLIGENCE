import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Play, RotateCcw, Save, TrendingUp, TrendingDown, CheckCircle } from "lucide-react";
import { runScenario, baselineScenario, historicalEvents } from "../mockData";
import type { ScenarioResult } from "../mockData";

const riverLevels = ["NORMAL", "WARNING", "DANGER", "EXTREME"] as const;

export default function ScenariosView() {
  const [rainfall, setRainfall] = useState(100);
  const [drainage, setDrainage] = useState(100);
  const [riverLevel, setRiverLevel] = useState<string>("NORMAL");
  const [roadClosed, setRoadClosed] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState<
    { name: string; date: string; result: ScenarioResult; rainfall: number; drainage: number; river: string }[]
  >([]);
  const [saveToast, setSaveToast] = useState(false);
  const [compareMode, setCompareMode] = useState<"swipe" | "blink">("swipe");

  const handleRun = async () => {
    setRunning(true);
    await new Promise((r) => setTimeout(r, 1400));
    setResult(runScenario(rainfall, drainage, riverLevel));
    setRunning(false);
  };

  const handleReset = () => {
    setRainfall(100);
    setDrainage(100);
    setRiverLevel("NORMAL");
    setRoadClosed(false);
    setResult(null);
  };

  const handleSave = () => {
    if (!result) return;
    const label = `Rain ${rainfall}% · Drain ${drainage}% · River ${riverLevel}`;
    setSaved((p) => [
      ...p,
      {
        name: label,
        date: new Date().toLocaleTimeString(),
        result,
        rainfall,
        drainage,
        river: riverLevel,
      },
    ]);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const chartData = result
    ? [
        { name: "Flooded Roads", baseline: 12, scenario: 12 + result.floodedRoadsDelta },
        { name: "Peak Depth (cm)", baseline: 42, scenario: 42 + result.peakDepthDeltaCm },
        { name: "SOS Exposure %", baseline: baselineScenario.sosExposurePct, scenario: result.sosExposurePct },
        { name: "Shelters Affected", baseline: 1, scenario: 1 + result.affectedSheltersDelta },
      ]
    : [];

  const sliderStyle = (val: number, max: number) =>
    `linear-gradient(to right, #06b6d4 ${(val / max) * 100}%, #1a2640 ${(val / max) * 100}%)`;

  return (
    <div className="h-full flex overflow-hidden">
      {/* Controls */}
      <div
        className="w-80 flex-shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ borderColor: "#1a2640" }}
      >
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #1a2640" }}>
          <h2 className="text-sm font-bold text-white">WHAT-IF FLOOD SIMULATOR</h2>
          <p className="text-[11px] mt-1" style={{ color: "#4a6080" }}>
            Adjust conditions and run scenario to see flood impact
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Baseline badge */}
          <div
            className="rounded-lg px-3 py-2 flex items-center justify-between"
            style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.2)" }}
          >
            <span className="text-xs font-mono" style={{ color: "#22d3ee" }}>BASELINE</span>
            <span className="text-xs font-mono" style={{ color: "#4a6080" }}>
              14:32 — Current live conditions
            </span>
          </div>

          {/* Rainfall slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: "#4a6080" }}>
                Rainfall Intensity
              </label>
              <span
                className="text-sm font-mono font-bold"
                style={{ color: rainfall > 125 ? "#ef4444" : rainfall > 100 ? "#f59e0b" : "#22d3ee" }}
              >
                {rainfall}%
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={200}
              step={25}
              value={rainfall}
              onChange={(e) => setRainfall(Number(e.target.value))}
              className="w-full scenario-slider appearance-none h-1 rounded-full"
              style={{ background: sliderStyle(rainfall - 50, 150) }}
            />
            <div className="flex justify-between mt-1">
              {[50, 75, 100, 125, 150, 175, 200].map((v) => (
                <button
                  key={v}
                  onClick={() => setRainfall(v)}
                  className="text-[9px] font-mono"
                  style={{ color: rainfall === v ? "#22d3ee" : "#2a3a55" }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Drainage slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: "#4a6080" }}>
                Drainage Capacity
              </label>
              <span
                className="text-sm font-mono font-bold"
                style={{ color: drainage < 50 ? "#ef4444" : drainage < 75 ? "#f59e0b" : "#10b981" }}
              >
                {drainage}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={25}
              value={drainage}
              onChange={(e) => setDrainage(Number(e.target.value))}
              className="w-full scenario-slider appearance-none h-1 rounded-full"
              style={{ background: sliderStyle(drainage - 10, 90) }}
            />
            <div className="flex justify-between mt-1">
              {[10, 25, 50, 75, 100].map((v) => (
                <button
                  key={v}
                  onClick={() => setDrainage(v)}
                  className="text-[9px] font-mono"
                  style={{ color: drainage === v ? "#22d3ee" : "#2a3a55" }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* River level */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wider mb-2 block" style={{ color: "#4a6080" }}>
              River Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              {riverLevels.map((l) => {
                const colors: Record<string, string> = {
                  NORMAL: "#10b981",
                  WARNING: "#f59e0b",
                  DANGER: "#f97316",
                  EXTREME: "#ef4444",
                };
                return (
                  <button
                    key={l}
                    onClick={() => setRiverLevel(l)}
                    className="py-2 rounded-lg text-xs font-mono font-bold transition-all"
                    style={{
                      background:
                        riverLevel === l ? `${colors[l]}20` : "rgba(12,19,34,0.5)",
                      border: `1px solid ${riverLevel === l ? colors[l] : "#1a2640"}`,
                      color: riverLevel === l ? colors[l] : "#4a6080",
                    }}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Road closure toggle */}
          <div
            className="flex items-center justify-between rounded-lg p-3"
            style={{ background: "rgba(12,19,34,0.5)", border: "1px solid #1a2640" }}
          >
            <span className="text-xs font-mono" style={{ color: "#4a6080" }}>
              Major Road Closure
            </span>
            <button
              onClick={() => setRoadClosed((p) => !p)}
              className="w-10 h-5 rounded-full relative transition-colors"
              style={{ background: roadClosed ? "#06b6d4" : "#1a2640" }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                style={{ transform: roadClosed ? "translateX(20px)" : "translateX(2px)" }}
              />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleRun}
              disabled={running}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: running ? "#1a2640" : "#06b6d4" }}
            >
              {running ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  RUNNING…
                </>
              ) : (
                <>
                  <Play size={14} />
                  RUN SCENARIO
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-3 rounded-xl transition-colors hover:bg-white/5"
              style={{ border: "1px solid #1a2640", color: "#4a6080" }}
              title="Reset"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Saved scenarios */}
          {saved.length > 0 && (
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "#4a6080" }}>
                Saved Scenarios
              </h3>
              <div className="space-y-1.5">
                {saved.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-lg p-2"
                    style={{ background: "rgba(12,19,34,0.5)", border: "1px solid #1a2640" }}
                  >
                    <div className="text-[10px] font-mono text-white truncate">{s.name}</div>
                    <div className="text-[9px] mt-0.5" style={{ color: "#4a6080" }}>
                      {s.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {!result && !running && (
          <div
            className="h-full flex flex-col items-center justify-center gap-3"
            style={{ color: "#4a6080" }}
          >
            <div className="text-4xl mb-2">⚡</div>
            <p className="text-sm font-mono">Configure conditions and run scenario</p>
            <p className="text-xs" style={{ color: "#2a3a55" }}>
              Adjust rainfall, drainage capacity, and river level to simulate flood impact
            </p>
          </div>
        )}

        {running && (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <div className="text-sm font-mono" style={{ color: "#22d3ee" }}>
              Running hydraulic model…
            </div>
            <div className="text-xs" style={{ color: "#4a6080" }}>
              Calculating flood extent and road impact
            </div>
          </div>
        )}

        {result && !running && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">SCENARIO RESULT</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1 hover:bg-white/5 transition-colors"
                  style={{ border: "1px solid #1a2640", color: "#4a6080" }}
                >
                  <Save size={12} />
                  SAVE
                </button>
                <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #1a2640" }}>
                  {(["swipe", "blink"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setCompareMode(m)}
                      className="px-3 py-1.5 text-xs font-mono transition-colors"
                      style={{
                        background: compareMode === m ? "rgba(6,182,212,0.15)" : "transparent",
                        color: compareMode === m ? "#22d3ee" : "#4a6080",
                      }}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Result KPIs */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Flooded Roads",
                  baseline: 12,
                  delta: result.floodedRoadsDelta,
                  unit: "",
                  dangerous: true,
                },
                {
                  label: "Peak Depth",
                  baseline: 42,
                  delta: result.peakDepthDeltaCm,
                  unit: " cm",
                  dangerous: true,
                },
                {
                  label: "Flooded Area",
                  baseline: baselineScenario.floodedAreaPct,
                  delta: result.floodedAreaPct - baselineScenario.floodedAreaPct,
                  unit: "%",
                  dangerous: true,
                },
                {
                  label: "Time-to-Flood",
                  baseline: 27,
                  delta: result.timeToFloodDeltaMin,
                  unit: " min",
                  dangerous: result.timeToFloodDeltaMin < 0,
                },
                {
                  label: "Shelters Affected",
                  baseline: 1,
                  delta: result.affectedSheltersDelta,
                  unit: "",
                  dangerous: true,
                },
                {
                  label: "SOS Exposure",
                  baseline: baselineScenario.sosExposurePct,
                  delta: result.sosExposurePct - baselineScenario.sosExposurePct,
                  unit: "%",
                  dangerous: true,
                },
              ].map((item) => {
                const isWorse =
                  item.delta > 0 ? item.dangerous : !item.dangerous;
                return (
                  <div
                    key={item.label}
                    className="rounded-xl p-3"
                    style={{
                      background:
                        item.delta === 0
                          ? "rgba(12,19,34,0.5)"
                          : isWorse
                            ? "rgba(239,68,68,0.07)"
                            : "rgba(16,185,129,0.07)",
                      border: `1px solid ${
                        item.delta === 0
                          ? "#1a2640"
                          : isWorse
                            ? "rgba(239,68,68,0.25)"
                            : "rgba(16,185,129,0.25)"
                      }`,
                    }}
                  >
                    <div className="text-[10px] font-mono mb-1" style={{ color: "#4a6080" }}>
                      {item.label}
                    </div>
                    <div className="flex items-end gap-1">
                      <span
                        className="text-xl font-mono font-black"
                        style={{ color: "#f0f4ff" }}
                      >
                        {item.baseline + item.delta}{item.unit}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1 text-[10px] font-mono mt-1"
                      style={{
                        color: item.delta === 0 ? "#4a6080" : isWorse ? "#fca5a5" : "#6ee7b7",
                      }}
                    >
                      {item.delta > 0 ? (
                        <TrendingUp size={10} />
                      ) : item.delta < 0 ? (
                        <TrendingDown size={10} />
                      ) : null}
                      {item.delta > 0 ? "+" : ""}{item.delta}{item.unit} vs baseline
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comparison chart */}
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640" }}
            >
              <h3 className="text-sm font-semibold text-white mb-3">
                BASELINE vs SCENARIO — Impact Comparison
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#4a6080", fontSize: 10, fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#4a6080", fontSize: 10, fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0c1322",
                      border: "1px solid #1a2640",
                      borderRadius: 8,
                      color: "#f0f4ff",
                      fontFamily: "JetBrains Mono",
                      fontSize: 11,
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono", color: "#4a6080" }}
                  />
                  <Bar dataKey="baseline" name="Baseline" fill="rgba(6,182,212,0.5)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="scenario" name="Scenario" fill="rgba(239,68,68,0.6)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Split map comparison */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid #1a2640" }}
            >
              <div
                className="grid grid-cols-2"
                style={{ gap: 0 }}
              >
                {["BASELINE", "SCENARIO"].map((label, idx) => (
                  <div
                    key={label}
                    className="relative h-40 map-grid flex items-center justify-center"
                    style={{ background: "#07111e" }}
                  >
                    {/* Mini city SVG */}
                    <svg viewBox="0 0 300 160" width="100%" height="100%">
                      {/* roads */}
                      <line x1="0" y1="60" x2="300" y2="60" stroke="#1e3050" strokeWidth="2" />
                      <line x1="0" y1="100" x2="300" y2="100" stroke="#1e3050" strokeWidth="2" />
                      <line x1="80" y1="0" x2="80" y2="160" stroke="#1e3050" strokeWidth="2" />
                      <line x1="160" y1="0" x2="160" y2="160" stroke="#1e3050" strokeWidth="2" />
                      <line x1="220" y1="0" x2="220" y2="160" stroke="#1e3050" strokeWidth="2" />
                      {/* Flood zones - more in scenario */}
                      <rect
                        x={0}
                        y={50}
                        width={idx === 1 ? 200 : 120}
                        height={idx === 1 ? 80 : 50}
                        fill={idx === 1 ? "rgba(185,28,28,0.45)" : "rgba(239,68,68,0.3)"}
                        rx={4}
                      />
                      <rect
                        x={idx === 1 ? 140 : 80}
                        y={90}
                        width={idx === 1 ? 160 : 100}
                        height={idx === 1 ? 70 : 45}
                        fill={idx === 1 ? "rgba(239,68,68,0.4)" : "rgba(250,204,21,0.25)"}
                        rx={4}
                      />
                    </svg>
                    <div
                      className="absolute top-2 left-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                      style={{
                        background:
                          idx === 0 ? "rgba(6,182,212,0.15)" : "rgba(239,68,68,0.15)",
                        color: idx === 0 ? "#22d3ee" : "#fca5a5",
                        border: `1px solid ${idx === 0 ? "rgba(6,182,212,0.3)" : "rgba(239,68,68,0.3)"}`,
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Save toast */}
      {saveToast && (
        <div
          className="absolute bottom-6 right-6 rounded-xl px-4 py-3 flex items-center gap-2 animate-slide-up"
          style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)" }}
        >
          <CheckCircle size={16} className="text-green-400" />
          <span className="text-sm font-mono text-green-300">Scenario saved</span>
        </div>
      )}
    </div>
  );
}
