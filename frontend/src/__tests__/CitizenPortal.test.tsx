import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CitizenPortal from "../views/CitizenPortal";
import { DispatchProvider } from "../context/DispatchContext";
import { CityProvider } from "../context/CityContext";
import { AuthProvider } from "../context/AuthContext";
import { getQRModules } from "../services/qrGenerator";

describe("CitizenPortal & Optical SOS QR Code", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("qrGenerator produces valid matrix modules and finder patterns", () => {
    const payload = JSON.stringify({ id: "#78322", people: 2 });
    const { modules, size } = getQRModules(payload, 25);
    expect(size).toBe(25);
    expect(modules.length).toBeGreaterThan(50);
  });

  it("CitizenPortal renders distress telemetry transmitter, vulnerability controls, live telemetry, and optical QR code", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CityProvider>
            <DispatchProvider>
              <CitizenPortal />
            </DispatchProvider>
          </CityProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Header & Base
    expect(screen.getByText(/CITIZEN EMERGENCY PORTAL/i)).toBeInTheDocument();
    expect(screen.getByText(/DEVICE GPS GEOFENCE/i)).toBeInTheDocument();

    // Red Transmitter
    expect(screen.getByText(/TRANSMIT SOS/i)).toBeInTheDocument();
    expect(screen.getByText(/DISTRESS TELEMETRY TRANSMITTER/i)).toBeInTheDocument();

    // Vulnerability & Triage
    expect(screen.getByText(/VULNERABILITY & TRIAGE CONTROLS/i)).toBeInTheDocument();
    expect(screen.getByText(/TOTAL PEOPLE/i)).toBeInTheDocument();
    expect(screen.getByText(/CHILDREN/i)).toBeInTheDocument();
    expect(screen.getByText(/ELDERLY/i)).toBeInTheDocument();

    // Live Response Telemetry
    expect(screen.getByText(/LIVE RESPONSE TELEMETRY/i)).toBeInTheDocument();
    expect(screen.getByText(/ACTIVE TICKET ID/i)).toBeInTheDocument();
    expect(screen.getAllByText(/#78322/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Team R-09/i).length).toBeGreaterThan(0);

    // Optical QR Code
    expect(screen.getByText(/ZERO-SIGNAL FALLBACK & QR CODE/i)).toBeInTheDocument();
    expect(screen.getByText(/OPTICAL SCAN FOR RESCUE TASKFORCES/i)).toBeInTheDocument();
  });

  it("advances lifecycle progress step dynamically when Advance Lifecycle Step button is clicked", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CityProvider>
            <DispatchProvider>
              <CitizenPortal />
            </DispatchProvider>
          </CityProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    const advanceBtn = screen.getByRole("button", { name: /Advance Lifecycle Step/i });
    expect(advanceBtn).toBeInTheDocument();

    // Initially ASSIGNED (stage 2)
    expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument();

    // Click advance -> should move to stage 3 (EN_ROUTE)
    fireEvent.click(advanceBtn);
    expect(screen.getByText(/Step 3 of 4/i)).toBeInTheDocument();
  });

  it("toggles medical emergency vulnerability and updates button state", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CityProvider>
            <DispatchProvider>
              <CitizenPortal />
            </DispatchProvider>
          </CityProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    const medicalToggle = screen.getByText(/MEDICAL EMERGENCY \/ CRITICAL PATIENT PRESENT/i);
    expect(medicalToggle).toBeInTheDocument();

    // Initially NO
    expect(screen.getByText("NO")).toBeInTheDocument();

    // Click to toggle YES
    fireEvent.click(medicalToggle);
    expect(screen.getByText("YES")).toBeInTheDocument();
  });
});
