import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type UserRole = "OPERATOR" | "CITIZEN" | "RESCUER" | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: "OPERATOR" | "CITIZEN" | "RESCUER";
  token: string;
  unitOrCity?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (username: string, password?: string) => Promise<User>;
  logout: () => void;
  switchRole: (newRole: "OPERATOR" | "CITIZEN" | "RESCUER") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Predefined Demo Accounts for Hackathon Judging & Evaluation
const DEMO_ACCOUNTS: Record<string, { role: "OPERATOR" | "CITIZEN" | "RESCUER"; name: string; unit: string }> = {
  "operator@hydrograph.gov": { role: "OPERATOR", name: "Commander V. Sharma", unit: "Patna Command Base" },
  "rescue04@hydrograph.gov": { role: "RESCUER", name: "NDRF Taskforce Boat 04", unit: "Team R-07" },
  "citizen@hydrograph.gov": { role: "CITIZEN", name: "Rahul Kumar (Citizen)", unit: "Patna Sector 4" }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // App boots to unauthenticated login screen by default unless stored in localStorage
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("hydrograph_auth_user");
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(user ? user.token : null);
  const [role, setRole] = useState<UserRole>(user ? user.role : null);

  useEffect(() => {
    if (user) {
      localStorage.setItem("hydrograph_auth_user", JSON.stringify(user));
      setToken(user.token);
      setRole(user.role);
    } else {
      localStorage.removeItem("hydrograph_auth_user");
      setToken(null);
      setRole(null);
    }
  }, [user]);

  const login = useCallback(async (username: string, password?: string): Promise<User> => {
    const cleanUsername = username.trim().toLowerCase();
    const demo = DEMO_ACCOUNTS[cleanUsername];

    let assignedRole: "OPERATOR" | "CITIZEN" | "RESCUER" = "OPERATOR";
    let name = "Command Operator";
    let unit = "Central Command Base";

    if (demo) {
      assignedRole = demo.role;
      name = demo.name;
      unit = demo.unit;
    } else if (cleanUsername.includes("citizen") || cleanUsername.includes("sos")) {
      assignedRole = "CITIZEN";
      name = "Citizen User";
      unit = "Patna Sector B";
    } else if (cleanUsername.includes("rescue") || cleanUsername.includes("ndrf")) {
      assignedRole = "RESCUER";
      name = "NDRF Rescue Unit";
      unit = "Team R-07";
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email: username,
      role: assignedRole,
      token: `jwt_token_${assignedRole}_${Date.now()}`,
      unitOrCity: unit
    };

    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setRole(null);
  }, []);

  const switchRole = useCallback((newRole: "OPERATOR" | "CITIZEN" | "RESCUER") => {
    const demoEmail = newRole === "OPERATOR" ? "operator@hydrograph.gov" : (newRole === "RESCUER" ? "rescue04@hydrograph.gov" : "citizen@hydrograph.gov");
    login(demoEmail);
  }, [login]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated: !!user,
        login,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
