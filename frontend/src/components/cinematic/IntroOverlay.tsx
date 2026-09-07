import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  ChevronRight,
  ChevronsRight,
  ShieldAlert,
  Radio,
  Compass,
  ArrowRight,
  Lock,
  Zap,
} from "lucide-react";
import { playSynthesizedChime } from "../../context/SettingsContext";

interface IntroOverlayProps {
  onDragProgress: (progress: number) => void;
  onDeploy: () => void;
  isWarping: boolean;
}

export default function IntroOverlay({
  onDragProgress,
  onDeploy,
  isWarping,
}: IntroOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxDrag, setMaxDrag] = useState<number>(260);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const x = useMotionValue(0);

  // Measure slider track width
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      // Subtract knob size (56px) and padding
      setMaxDrag(Math.max(160, containerWidth - 64));
    }
    const handleResize = () => {
      if (containerRef.current) {
        setMaxDrag(Math.max(160, containerRef.current.offsetWidth - 64));
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update progress for 3D canvas reactive expansion
  useEffect(() => {
    const unsubscribe = x.on("change", (latest) => {
      if (maxDrag > 0) {
        const progress = Math.min(1, Math.max(0, latest / maxDrag));
        onDragProgress(progress);
      }
    });
    return () => unsubscribe();
  }, [x, maxDrag, onDragProgress]);

  // Handle release: trigger deployment if dragged past 82%
  const handleDragEnd = () => {
    const currentX = x.get();
    const threshold = maxDrag * 0.82;
    if (currentX >= threshold && !isCompleted) {
      setIsCompleted(true);
      playSynthesizedChime(880, 0.4);
      setTimeout(() => playSynthesizedChime(1174, 0.5), 200);
      onDeploy();
    } else {
      // Snap back if released before threshold
      x.set(0);
      onDragProgress(0);
    }
  };

  const handleDirectClick = () => {
    if (!isCompleted) {
      setIsCompleted(true);
      playSynthesizedChime(880, 0.3);
      onDeploy();
    }
  };

  // Dynamic width for cyan glowing trail behind knob
  const trailWidth = useTransform(x, (val) => `${Math.max(28, val + 28)}px`);
  const textOpacity = useTransform(x, [0, maxDrag * 0.7], [1, 0.15]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-8 font-mono select-none z-20">
      {/* TOP TACTICAL HUD MICRO-HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-bold text-cyan-300 tracking-wider bg-cyan-950/70 border border-cyan-500/40 px-2.5 py-1 rounded-md">
            DEFENSE NODE // ACTIVE
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            ENCRYPTED RELAY: 48.000 kHz
          </span>
        </div>

        <div className="text-center sm:text-right">
          <div className="text-[11px] font-black text-cyan-400 tracking-widest uppercase">
            NATIONAL DISASTER INTELLIGENCE // REAL-TIME FLOOD NOWCASTING
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 flex items-center justify-center sm:justify-end gap-2">
            <span>GRID COORDS: 18.4659&deg;N, 83.6610&deg;E</span>
            <span>&bull;</span>
            <span className="text-amber-400 font-bold">SEC-DEF-LEVEL-4</span>
          </div>
        </div>
      </motion.div>

      {/* FULL-SCREEN WARP FLASH / LENS-FLARE WHEN CAMERA CRUSHES FORWARD */}
      {isWarping && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0.2, 1] }}
          transition={{ duration: 1.1, times: [0, 0.4, 0.7, 1] }}
          className="fixed inset-0 pointer-events-none z-50 bg-gradient-to-b from-cyan-400/20 via-transparent to-cyan-500/40 backdrop-blur-[2px]"
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-72 h-1 bg-cyan-300 blur-sm animate-pulse shadow-[0_0_80px_#00f2fe]" />
          </div>
        </motion.div>
      )}

      {/* BOTTOM INTERACTIVE MECHANIC: SLIDE TO INITIALIZE */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: isWarping ? 0 : 1, y: isWarping ? 40 : 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="w-full flex flex-col items-center justify-center pb-4"
      >
        <div className="w-full max-w-md pointer-events-auto flex flex-col items-center gap-3">
          {/* THE GLASSMORPHIC SLIDER CAPSULE */}
          <div
            ref={containerRef}
            onClick={handleDirectClick}
            className="w-full h-14 relative rounded-full backdrop-blur-xl bg-slate-950/70 border border-cyan-500/40 p-1.5 shadow-[0_0_35px_rgba(6,182,212,0.2)] hover:border-cyan-400 transition-colors flex items-center overflow-hidden cursor-pointer"
          >
            {/* Glowing cyan trail fill */}
            <motion.div
              style={{ width: trailWidth }}
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-500/30 to-cyan-400/50 rounded-full pointer-events-none shadow-[0_0_25px_#06b6d4]"
            />

            {/* Shimmering Center Text */}
            <motion.div
              style={{ opacity: textOpacity }}
              className="absolute inset-0 flex items-center justify-center text-xs font-bold text-cyan-200/90 tracking-widest pointer-events-none pl-6 pr-4"
            >
              <span className="flex items-center gap-1.5 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]">
                SLIDE TO DEPLOY COMMAND PROTOCOL
                <ChevronsRight size={15} className="text-cyan-400 animate-pulse" />
              </span>
            </motion.div>

            {/* DRAGGABLE METALLIC KNOB */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: maxDrag }}
              dragElastic={0.08}
              style={{ x }}
              onDragEnd={handleDragEnd}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-700 shadow-[0_0_20px_#06b6d4] border-2 border-white/80 flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
            >
              <ArrowRight size={18} className="text-black font-extrabold" />
            </motion.div>
          </div>

          {/* Micro-Instructions & Fast-Track Skip Link */}
          <div className="flex items-center justify-between w-full px-4 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Zap size={10} className="text-cyan-400" />
              Drag to threshold or click track
            </span>
            <button
              onClick={handleDirectClick}
              className="text-cyan-400 hover:text-white transition-colors cursor-pointer underline underline-offset-2"
            >
              Direct Fast-Track &rarr;
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
