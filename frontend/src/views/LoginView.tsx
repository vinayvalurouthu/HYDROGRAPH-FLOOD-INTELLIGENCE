import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import HeroCanvas from "../components/cinematic/HeroCanvas";
import IntroOverlay from "../components/cinematic/IntroOverlay";
import TacticalLoginModal from "../components/cinematic/TacticalLoginModal";

function isWebGLSupported(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export default function LoginView() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Check if WebGL is supported or if URL has ?skip_intro=1
  const [hasWebGL] = useState<boolean>(() => isWebGLSupported());
  const [cinematicPhase, setCinematicPhase] = useState<"intro" | "transitioning" | "login">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("skip_intro") === "1") {
        return "login";
      }
      // If no WebGL (e.g. headless tests or older devices), default directly to login
      if (!isWebGLSupported()) {
        return "login";
      }
    }
    return "intro";
  });

  const [dragProgress, setDragProgress] = useState<number>(0);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasNavigatedRef = useRef<boolean>(false);

  // Directly enter project as Operator
  const enterProject = async () => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    try {
      await login("operator@hydrograph.gov", "admin123");
    } catch (err) {
      console.error("Auto login error:", err);
    }
    navigate("/operator");
  };

  const handleDeployTriggered = () => {
    setCinematicPhase("transitioning");

    // Safety fallback: guarantee project opens within 850ms even if WebGL is slow or dropped
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => {
      enterProject();
    }, 850);
  };

  const handleWarpComplete = () => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    enterProject();
  };

  const handleReplayIntro = () => {
    hasNavigatedRef.current = false;
    setDragProgress(0);
    setCinematicPhase("intro");
  };

  const handleOpenLoginModal = () => {
    setCinematicPhase("login");
  };

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030712] font-mono select-none">
      {/* 3D WEBGL HERO CANVAS LAYER */}
      {hasWebGL && (
        <HeroCanvas
          dragProgress={dragProgress}
          isWarping={cinematicPhase === "transitioning"}
          onWarpComplete={handleWarpComplete}
        />
      )}

      {/* TACTICAL INTRO HUD & INTERACTIVE SLIDER CAPSULE */}
      {cinematicPhase !== "login" && (
        <IntroOverlay
          onDragProgress={setDragProgress}
          onDeploy={handleDeployTriggered}
          onDirectEnterProject={enterProject}
          onOpenLoginModal={handleOpenLoginModal}
          isWarping={cinematicPhase === "transitioning"}
        />
      )}

      {/* TACTICAL OFFICER LOGIN MODAL */}
      {cinematicPhase === "login" && (
        <TacticalLoginModal onReplayIntro={handleReplayIntro} />
      )}
    </div>
  );
}
