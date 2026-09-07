import React, { useState, useMemo } from "react";
import { QrCode, Copy, Check, Sun, Smartphone, Download, ShieldCheck } from "lucide-react";
import { getQRModules } from "../services/qrGenerator";

interface OpticalSOSQRCodeProps {
  payload: string;
  ticketId?: string;
  isOffline?: boolean;
}

export default function OpticalSOSQRCode({
  payload,
  ticketId = "#78322",
  isOffline = false,
}: OpticalSOSQRCodeProps) {
  const [copied, setCopied] = useState(false);
  const [torchMode, setTorchMode] = useState(false);

  const { modules, size } = useMemo(() => {
    return getQRModules(payload || "HYDROGRAPH-SOS-EMPTY", 25);
  }, [payload]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    const svgElement = document.getElementById("sos-qr-svg");
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `HYDROGRAPH_SOS_${ticketId.replace(/[^a-zA-Z0-9]/g, "")}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Fullscreen Torch Light Modal for Drone Optics */}
      {torchMode && (
        <div
          className="fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center p-6 cursor-pointer"
          onClick={() => setTorchMode(false)}
          title="Click anywhere to exit high-brightness rescue beacon"
        >
          <div className="text-black font-black text-lg mb-4 tracking-widest text-center">
            RESCUE DRONE / BOAT OPTICAL OPTIMIZATION
          </div>
          <div className="w-72 h-72 bg-white p-4 border-8 border-black rounded-2xl shadow-2xl flex items-center justify-center">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-full h-full shape-rendering-crispEdges"
              style={{ shapeRendering: "crispEdges" }}
            >
              <rect width={size} height={size} fill="#ffffff" />
              {modules.map(({ x, y }) => (
                <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#000000" />
              ))}
            </svg>
          </div>
          <p className="text-black font-mono text-xs mt-4 text-center max-w-sm">
            Maximum contrast screen beacon active. Hold screen towards approaching NDRF drone or boat. Tap anywhere to exit.
          </p>
        </div>
      )}

      {/* Optical QR Box */}
      <div
        className="w-44 h-44 p-3 rounded-xl flex items-center justify-center border transition-all duration-300 relative group shadow-xl"
        style={{
          background: "#ffffff",
          borderColor: isOffline ? "#f59e0b" : "#06b6d4",
          boxShadow: isOffline
            ? "0 0 25px rgba(245,158,11,0.25)"
            : "0 0 25px rgba(6,182,212,0.25)",
        }}
      >
        <svg
          id="sos-qr-svg"
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full"
          style={{ shapeRendering: "crispEdges" }}
        >
          <rect width={size} height={size} fill="#ffffff" />
          {modules.map(({ x, y }) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#050b17" />
          ))}
        </svg>

        {/* Center Logo Watermark Icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-lg bg-[#070c19] border border-cyan-400/80 flex items-center justify-center shadow-lg">
            <ShieldCheck size={16} className="text-cyan-400" />
          </div>
        </div>
      </div>

      <div className="text-[10px] text-amber-300 font-mono font-bold mt-2.5 flex items-center gap-1.5">
        <Smartphone size={12} className="text-amber-400" />
        OPTICAL SCAN FOR RESCUE TASKFORCES
      </div>

      <div className="text-[9px] text-slate-400 font-mono max-w-[280px] truncate text-center mt-1 px-2 py-0.5 rounded bg-black/40 border border-slate-800">
        {payload}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => setTorchMode(true)}
          title="Boost Screen Brightness for Night Drones"
          className="flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer"
        >
          <Sun size={12} />
          Torch Brightness
        </button>
        <button
          onClick={handleCopy}
          title="Copy SOS Data Packet"
          className="flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy Packet"}
        </button>
        <button
          onClick={handleDownloadSVG}
          title="Save QR Code SVG"
          className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
        >
          <Download size={12} />
          SVG
        </button>
      </div>
    </div>
  );
}
