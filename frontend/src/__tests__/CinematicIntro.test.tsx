import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import IntroOverlay from "../components/cinematic/IntroOverlay";
import TacticalLoginModal from "../components/cinematic/TacticalLoginModal";
import { AuthProvider } from "../context/AuthContext";

describe("Cinematic 3D Intro & Tactical Login", () => {
  it("renders IntroOverlay with HUD micro-text and interactive slider capsule", () => {
    const handleDragProgress = vi.fn();
    const handleDeploy = vi.fn();

    render(
      <IntroOverlay
        onDragProgress={handleDragProgress}
        onDeploy={handleDeploy}
        isWarping={false}
      />
    );

    // Tactical HUD header
    expect(screen.getByText(/NATIONAL DISASTER INTELLIGENCE/i)).toBeInTheDocument();
    expect(screen.getByText(/DEFENSE NODE \/\/ ACTIVE/i)).toBeInTheDocument();
    expect(screen.getByText(/SEC-DEF-LEVEL-4/i)).toBeInTheDocument();

    // Slider text
    expect(screen.getByText(/SLIDE TO DEPLOY COMMAND PROTOCOL/i)).toBeInTheDocument();

    // Clicking Direct Fast-Track triggers deployment
    const fastTrackBtn = screen.getByRole("button", { name: /Direct Fast-Track/i });
    fireEvent.click(fastTrackBtn);
    expect(handleDeploy).toHaveBeenCalledTimes(1);
  });

  it("renders TacticalLoginModal with defense status, role options, and credentials form", () => {
    const handleReplay = vi.fn();

    render(
      <MemoryRouter>
        <AuthProvider>
          <TacticalLoginModal onReplayIntro={handleReplay} />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/HYDROGRAPH/i)).toBeInTheDocument();
    expect(screen.getByText(/FLOOD INTELLIGENCE/i)).toBeInTheDocument();
    expect(screen.getByText(/DEFENSE NODE \/\/ ACTIVE/i)).toBeInTheDocument();

    // Role options
    expect(screen.getByText(/LOGIN AS OPERATOR/i)).toBeInTheDocument();
    expect(screen.getByText(/LOGIN AS RESCUER/i)).toBeInTheDocument();
    expect(screen.getByText(/LOGIN AS CITIZEN/i)).toBeInTheDocument();

    // Replay button
    const replayBtn = screen.getByRole("button", { name: /Replay Intro/i });
    fireEvent.click(replayBtn);
    expect(handleReplay).toHaveBeenCalledTimes(1);
  });
});
