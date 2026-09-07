import React, { useState, useEffect } from "react";
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
  // Check if WebGL is supported or if URL has ?skip_intro=1
  const [hasWebGL] = useState<boolean>(() => isWebGLSupported());
  const [cinematicPhase, setCinematicPhase] = useState<"intro" | "transitioning" | "login">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("skip_intro") === "1" || params.get("direct") === "1") {
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

  const handleDeployTriggered = () => {
    setCinematicPhase("transitioning");
  };

  const handleWarpComplete = () => {
    setCinematicPhase("login");
  };

  const handleReplayIntro = () => {
    setDragProgress(0);
    setCinematicPhase("intro");
  };

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
