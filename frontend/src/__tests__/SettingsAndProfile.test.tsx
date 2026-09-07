import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingsProvider } from "../context/SettingsContext";
import SettingsModal from "../components/SettingsModal";
import ProfileModal from "../components/ProfileModal";
import { AuthProvider } from "../context/AuthContext";

describe("SettingsContext & SettingsModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("SettingsModal renders all three tactical tabs and allows interaction", () => {
    const handleClose = vi.fn();

    render(
      <SettingsProvider>
        <SettingsModal isOpen={true} onClose={handleClose} isMeshSimulated={false} />
      </SettingsProvider>
    );

    // Modal title
    expect(screen.getByText(/SYSTEM SETTINGS/i)).toBeInTheDocument();
    expect(screen.getByText(/Telemetry & Alarms/i)).toBeInTheDocument();

    // Switch to Map & Units tab
    const mapTabBtn = screen.getByRole("button", { name: /Map & Units/i });
    fireEvent.click(mapTabBtn);
    expect(screen.getByText(/Water Depth Units/i)).toBeInTheDocument();

    // Switch to Mesh & Storage tab
    const meshTabBtn = screen.getByRole("button", { name: /Mesh & Storage/i });
    fireEvent.click(meshTabBtn);
    expect(screen.getByText(/P2P Disaster Mesh Network Simulation/i)).toBeInTheDocument();

    // Close modal
    const closeBtn = screen.getByLabelText(/Close Settings/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("SettingsModal does not render when isOpen is false", () => {
    const handleClose = vi.fn();

    render(
      <SettingsProvider>
        <SettingsModal isOpen={false} onClose={handleClose} />
      </SettingsProvider>
    );

    expect(screen.queryByText(/SYSTEM SETTINGS/i)).not.toBeInTheDocument();
  });
});

describe("ProfileModal", () => {
  it("ProfileModal renders officer identity, clearance badge, and role switcher", () => {
    const handleClose = vi.fn();
    const handleSwitchView = vi.fn();

    render(
      <AuthProvider>
        <ProfileModal
          isOpen={true}
          onClose={handleClose}
          activeCity={{
            id: "patna",
            name: "Patna",
            state: "Bihar",
            center: [25.5941, 85.1376],
            regionType: "Gangetic Plain",
            zoom: 13,
            rainfallMmHr: 88,
            waterBody: "Ganges River",
          }}
          onSwitchView={handleSwitchView}
        />
      </AuthProvider>
    );

    // Verify Officer Identity is displayed
    expect(screen.getByText(/OPERATIONAL PERSONNEL IDENTITY/i)).toBeInTheDocument();
    expect(screen.getByText(/Commander V. Sharma/i)).toBeInTheDocument();
    expect(screen.getByText(/Level-4 \(Incident Commander\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Patna/i).length).toBeGreaterThan(0);

    // Close button triggers onClose
    const closeBtn = screen.getByLabelText(/Close Profile/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
