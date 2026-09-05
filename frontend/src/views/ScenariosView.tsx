import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
import type { CityPreset, CityFloodDataset } from "../services/cityDataGenerator";

const riverLevels = ["NORMAL", "WARNING", "DANGER", "EXTREME"] as const;

interface Props {
  activeCity?: CityPreset;
  cityDataset?: CityFloodDataset | null;
}

export default function ScenariosView({ activeCity, cityDataset }: Props) {
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

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const floodLayerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    
    const center = activeCity ? activeCity.center : [25.6093, 85.1376];
    const zoom = activeCity ? activeCity.zoom : 13;

    const map = L.map(mapContainerRef.current, {
      center: center as [number, number],
      zoom,
      zoomControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }
    ).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [activeCity]);

  useEffect(() => {
    if (!mapRef.current || !cityDataset) return;
    const map = mapRef.current;

    if (floodLayerRef.current) {
      map.removeLayer(floodLayerRef.current);
    }

    if (!result && !running) {
      floodLayerRef.current = L.geoJSON(
        cityDataset.floodZones.map(fz => fz.geojson), 
        {
          style: {
            color: "#06b6d4",
            fillColor: "#06b6d4",
            fillOpacity: 0.15,
            weight: 1
          }
        }
      ).addTo(map);
    } else if (result && !running) {
      const deltaFactor = 1 + (result.floodedAreaPct / 100);
      
      const scaledFeatures = cityDataset.floodZones.map(fz => {
         const newCoords = fz.geojson.geometry.coordinates[0].map((coord: [number, number]) => {
            const [lng, lat] = coord;
            const cLng = activeCity!.center[1];
            const cLat = activeCity!.center[0];
            return [
               cLng + (lng - cLng) * deltaFactor,
               cLat + (lat - cLat) * deltaFactor
            ];
         });
         return {
            ...fz.geojson,
            geometry: {
               ...fz.geojson.geometry,
               coordinates: [newCoords]
            }
         };
      });

      const dangerColor = result.peakDepthDeltaCm > 20 ? "#ef4444" : "#f59e0b";
      floodLayerRef.current = L.geoJSON(scaledFeatures, {
        style: {
          color: dangerColor,
          fillColor: dangerColor,
          fillOpacity: 0.35,
          weight: 1.5
        }
      }).addTo(map);
    }
  }, [result, running, cityDataset, activeCity]);

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

      {/* Map Background & Results Panel */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={mapContainerRef} className="absolute inset-0 bg-[#07111e] z-0" />

        {/* Floating overlays */}
        <div className="absolute inset-0 z-10 pointer-events-none p-5 flex flex-col justify-between">
          
          {!result && !running && (
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-3 p-6 rounded-2xl"
              style={{ background: "rgba(12,19,34,0.8)", border: "1px solid #1a2640", backdropFilter: "blur(8px)" }}
            >
              <div className="text-4xl mb-2">⚡</div>
              <p className="text-sm font-mono text-white">Configure conditions and run scenario</p>
              <p className="text-xs" style={{ color: "#8da0b8" }}>
                Adjust rainfall, drainage capacity, and river level to simulate flood impact
              </p>
            </div>
          )}

          {running && (
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-4 p-8 rounded-2xl"
              style={{ background: "rgba(12,19,34,0.9)", border: "1px solid #1a2640", backdropFilter: "blur(8px)" }}
            >
              <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              <div className="text-sm font-mono font-bold" style={{ color: "#22d3ee" }}>
                Running hydraulic model…
              </div>
              <div className="text-xs" style={{ color: "#8da0b8" }}>
                Calculating flood extent and road impact
              </div>
            </div>
          )}

          {result && !running && (
            <div className="pointer-events-auto absolute top-5 right-5 w-96 flex flex-col gap-4 max-h-[calc(100vh-100px)] overflow-y-auto pb-5">
              
              {/* Header card */}
              <div
                className="p-4 rounded-xl flex items-center justify-between shadow-2xl"
                style={{ background: "rgba(8,13,28,0.9)", border: "1px solid #1a2640", backdropFilter: "blur(12px)" }}
              >
                <h2 className="text-sm font-bold text-white">SCENARIO RESULT</h2>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1 hover:bg-white/10 transition-colors"
                  style={{ border: "1px solid #1a2640", color: "#4a6080" }}
                >
                  <Save size={12} />
                  SAVE
                </button>
              </div>

              {/* Result KPIs */}
              <div className="grid grid-cols-2 gap-2">
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
                  const isWorse = item.delta > 0 ? item.dangerous : !item.dangerous;
                  return (
                    <div
                      key={item.label}
                      className="rounded-xl p-3 shadow-xl"
                      style={{
                        background:
                          item.delta === 0
                            ? "rgba(12,19,34,0.8)"
                            : isWorse
                              ? "rgba(239,68,68,0.15)"
                              : "rgba(16,185,129,0.15)",
                        border: `1px solid ${
                          item.delta === 0
                            ? "#1a2640"
                            : isWorse
                              ? "rgba(239,68,68,0.35)"
                              : "rgba(16,185,129,0.35)"
                        }`,
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      <div className="text-[10px] font-mono mb-1" style={{ color: "#8da0b8" }}>
                        {item.label}
                      </div>
                      <div className="flex items-end gap-1">
                        <span
                          className="text-lg font-mono font-black"
                          style={{ color: "#f0f4ff" }}
                        >
                          {item.baseline + item.delta}{item.unit}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1 text-[9px] font-mono mt-1"
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
                className="rounded-xl p-4 shadow-2xl"
                style={{ background: "rgba(12,19,34,0.9)", border: "1px solid #1a2640", backdropFilter: "blur(12px)" }}
              >
                <h3 className="text-xs font-mono tracking-widest text-white mb-3 uppercase">
                  Impact Comparison
                </h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} margin={{ top: 5, right: 0, bottom: 5, left: -25 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#4a6080", fontSize: 9, fontFamily: "JetBrains Mono" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#4a6080", fontSize: 9, fontFamily: "JetBrains Mono" }}
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
                        fontSize: 10,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 9, fontFamily: "JetBrains Mono", color: "#4a6080" }}
                    />
                    <Bar dataKey="baseline" name="Baseline" fill="rgba(6,182,212,0.5)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="scenario" name="Scenario" fill="rgba(239,68,68,0.6)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
          )}
        </div>
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
