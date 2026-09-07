import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { DispatchProvider } from "../context/DispatchContext";
import { CityProvider } from "../context/CityContext";
import { ProtectedRoute } from "../components/ProtectedRoute";
import LoginView from "../views/LoginView";
import RescueFieldView from "../views/RescueFieldView";
import App from "../App";

function DummyOperatorView() {
  return <div data-testid="operator-view">Central Municipal Command Base</div>;
}

function DummyCitizenView() {
  return <div data-testid="citizen-view">Citizen Emergency SOS Portal</div>;
}

function TestAppRouter({ initialRoute = "/operator" }: { initialRoute?: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <CityProvider>
          <DispatchProvider>
            <Routes>
              <Route path="/login" element={<LoginView />} />
              <Route
                path="/operator"
                element={
                  <ProtectedRoute allowedRoles={["OPERATOR"]}>
                    <DummyOperatorView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen"
                element={
                  <ProtectedRoute allowedRoles={["CITIZEN"]}>
                    <DummyCitizenView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rescue"
                element={
                  <ProtectedRoute allowedRoles={["RESCUER"]}>
                    <RescueFieldView />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </DispatchProvider>
        </CityProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("Phase 3: Frontend Client Routing & Guard Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ─── 1. ProtectedRoute Guard Verification ─────────────────────────────────

  it("redirects unauthenticated user at /operator to /login", async () => {
    render(<TestAppRouter initialRoute="/operator" />);

    await waitFor(() => {
      expect(screen.getByText(/FLOOD INTELLIGENCE/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /AUTHENTICATE & ENTER PORTAL/i })).toBeInTheDocument();
    });
  });

  it("blocks user with role CITIZEN from accessing /operator and redirects to /citizen", async () => {
    localStorage.setItem(
      "hydrograph_auth_user",
      JSON.stringify({
        id: "usr-citizen",
        name: "Rahul Kumar",
        email: "citizen@hydrograph.gov",
        role: "CITIZEN",
        token: "mock-citizen-jwt",
        unitOrCity: "Patna Sector 4",
      })
    );

    render(<TestAppRouter initialRoute="/operator" />);

    await waitFor(() => {
      expect(screen.getByTestId("citizen-view")).toBeInTheDocument();
      expect(screen.queryByTestId("operator-view")).not.toBeInTheDocument();
    });
  });

  it("renders RescueFieldView correctly when authenticated as RESCUER navigating to /rescue", async () => {
    localStorage.setItem(
      "hydrograph_auth_user",
      JSON.stringify({
        id: "usr-rescuer",
        name: "NDRF Taskforce Boat 04",
        email: "rescue04@hydrograph.gov",
        role: "RESCUER",
        token: "mock-rescuer-jwt",
        unitOrCity: "Team R-07",
      })
    );

    render(<TestAppRouter initialRoute="/rescue" />);

    await waitFor(() => {
      expect(screen.getByText(/ACTIVE MISSION TARGET/i)).toBeInTheDocument();
    });
  });

  // ─── 2. Quick-Fill Button Interactivity ──────────────────────────────────

  it("auto-fills demo credentials on [Login as Operator] click and submits form", async () => {
    render(<TestAppRouter initialRoute="/login" />);

    const operatorQuickFillBtn = screen.getByRole("button", { name: /LOGIN AS OPERATOR/i });
    expect(operatorQuickFillBtn).toBeInTheDocument();
    fireEvent.click(operatorQuickFillBtn);

    const usernameInput = screen.getByPlaceholderText(/operator@hydrograph.gov/i) as HTMLInputElement;
    expect(usernameInput.value).toBe("operator@hydrograph.gov");

    const submitBtn = screen.getByRole("button", { name: /AUTHENTICATE & ENTER PORTAL/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("operator-view")).toBeInTheDocument();
    });
  });

  // ─── 3. Layout & Viewport Clipping Assertions ─────────────────────────────

  it("applies min-h-screen and overflow-hidden to main application wrapper and mt-auto to bottom sidebar nav", async () => {
    localStorage.setItem(
      "hydrograph_auth_user",
      JSON.stringify({
        id: "usr-operator",
        name: "Commander V. Sharma",
        email: "operator@hydrograph.gov",
        role: "OPERATOR",
        token: "mock-operator-jwt",
        unitOrCity: "Patna Command Base",
      })
    );

    window.history.pushState({}, "Operator Base", "/operator");

    const { container } = render(<App />);

    await waitFor(() => {
      const mainWrapper = container.firstElementChild as HTMLElement;
      expect(mainWrapper).toBeInTheDocument();
      expect(mainWrapper).toHaveClass("overflow-hidden");
      expect(mainWrapper).toHaveClass("min-h-screen");

      const bottomNav = container.querySelector(".mt-auto");
      expect(bottomNav).toBeInTheDocument();
    });
  });
});
