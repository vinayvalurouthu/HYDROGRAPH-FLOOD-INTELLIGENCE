import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { rescueTeams as initialRescueTeams, sosIncidents as initialSOS } from "../mockData";
import type { RescueTeam, SOSIncident } from "../mockData";
import { getRescueTeams, getSOSIncidents, requestFieldInspection, submitSOSReport } from "../services/api";

export interface InspectionDispatch {
  id: string; // e.g. "INSP-DN-RA-01"
  nodeId: string; // e.g. "DN-RA-01"
  nodeName: string; // e.g. "Rajam Main Outfall Sluice #1"
  status: string; // "CRITICAL" | "STRESSED" | "NORMAL"
  timestamp: string;
  teamId: string; // e.g. "RT-DN-RA-01"
  location: string;
}

export interface DispatchAlert {
  id: string;
  title: string;
  message: string;
  nodeId: string;
  nodeName: string;
  teamId: string;
  timestamp: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
}

export interface CitizenSOSPayload {
  people: number;
  children: number;
  elderly: number;
  medical: boolean;
  submergedLevel: "KNEE" | "WAIST" | "ROOF" | "OVERHEAD";
  landmark: string;
  lat: number;
  lng: number;
}

interface DispatchContextType {
  activeInspections: InspectionDispatch[];
  alertQueue: DispatchAlert[];
  latestDispatchAlert: DispatchAlert | null;
  rescueTeams: RescueTeam[];
  sosIncidents: SOSIncident[];
  requestInspection: (nodeId: string, nodeName?: string, nodeStatus?: string) => Promise<void>;
  loadingNodeId: string | null;
  setSelectedTeamId: (teamId: string | null) => void;
  selectedTeamId: string | null;
  
  // Real-time synchronization extensions
  activeCitizenTicketId: string | null;
  activeFieldTeamId: string;
  setActiveFieldTeamId: (teamId: string) => void;
  submitCitizenSOS: (payload: CitizenSOSPayload) => Promise<SOSIncident>;
  updateSOSLifecycle: (sosId: string, newStatus: SOSIncident["status"]) => void;
  updateTeamLifecycle: (teamId: string, newStatus: RescueTeam["status"]) => void;
}

const DispatchContext = createContext<DispatchContextType | undefined>(undefined);

export const DispatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rescueTeams, setRescueTeams] = useState<RescueTeam[]>(initialRescueTeams);
  const [sosIncidents, setSosIncidents] = useState<SOSIncident[]>(initialSOS);
  const [activeInspections, setActiveInspections] = useState<InspectionDispatch[]>([]);
  const [alertQueue, setAlertQueue] = useState<DispatchAlert[]>([]);
  const [loadingNodeId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [activeCitizenTicketId, setActiveCitizenTicketId] = useState<string | null>(null);
  const [activeFieldTeamId, setActiveFieldTeamId] = useState<string>("RT-01");

  // Poll server periodically while maintaining unshifted new local dispatches at top
  useEffect(() => {
    const syncWithBackend = () => {
      Promise.all([getRescueTeams(), getSOSIncidents()]).then(([tData, sData]) => {
        if (tData && tData.length > 0) {
          setRescueTeams((currentTeams) => {
            const teamMap = new Map<string, RescueTeam>();
            tData.forEach((t) => teamMap.set(t.id, t));
            currentTeams.forEach((t) => {
              if ((t.id.startsWith("RT-") || t.id.startsWith("TEAM-")) && !teamMap.has(t.id)) {
                teamMap.set(t.id, t);
              }
            });
            const merged = Array.from(teamMap.values());
            return merged;
          });
        }

        if (sData && sData.length > 0) {
          setSosIncidents((currentSOS) => {
            const sosMap = new Map<string, SOSIncident>();
            sData.forEach((s) => sosMap.set(s.id, s));
            currentSOS.forEach((s) => {
              if ((s.id.startsWith("INSP-") || s.id.startsWith("#")) && !sosMap.has(s.id)) {
                sosMap.set(s.id, s);
              }
            });
            return Array.from(sosMap.values());
          });
        }
      });
    };

    syncWithBackend();
    const interval = setInterval(syncWithBackend, 4000);
    return () => clearInterval(interval);
  }, []);

  // Submit Citizen SOS Ticket & Assign Available Unit
  const submitCitizenSOS = useCallback(async (payload: CitizenSOSPayload): Promise<SOSIncident> => {
    const ticketId = `#${Math.floor(10000 + Math.random() * 90000)}`;
    const nowStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    
    // Water depth mapping from submerged level
    const depthMap = {
      KNEE: 0.5,
      WAIST: 1.1,
      ROOF: 2.4,
      OVERHEAD: 3.2
    };
    const waterDepthM = depthMap[payload.submergedLevel] || 1.0;

    // Find available team to allocate
    let assignedTeam = rescueTeams.find((t) => t.status === "AVAILABLE");
    if (!assignedTeam) {
      assignedTeam = rescueTeams[0] || { id: "RT-07", name: "NDRF Boat Taskforce 04" };
    }

    const newSOS: SOSIncident = {
      id: ticketId,
      priority: payload.medical || payload.submergedLevel === "ROOF" || payload.submergedLevel === "OVERHEAD" ? "CRITICAL" : "HIGH",
      location: payload.landmark || "Patna Central Inundation Sector",
      people: payload.people,
      children: payload.children,
      elderly: payload.elderly,
      medical: payload.medical,
      waterDepthM,
      waitingMin: 1,
      status: "ASSIGNED",
      floodRisk: payload.submergedLevel === "ROOF" || payload.submergedLevel === "OVERHEAD" ? "SEVERE" : "HIGH",
      lat: payload.lat,
      lng: payload.lng,
      timestamps: [
        { status: "SOS Signal Received & Geofenced", time: nowStr },
        { status: `Dispatched to Unit ${assignedTeam.name}`, time: nowStr }
      ],
      assignedTeam: assignedTeam.id
    };

    // Cache locally for offline IndexedDB/localStorage zero-signal fallback
    try {
      localStorage.setItem("hydrograph_offline_sos", JSON.stringify(newSOS));
    } catch {
      /* ignore */
    }

    // Try posting to backend endpoint async
    submitSOSReport({
      victimCount: payload.people,
      childrenCount: payload.children,
      elderlyCount: payload.elderly,
      hasMedical: payload.medical,
      reportedWaterDepthCm: waterDepthM * 100,
      priorityScore: payload.medical ? 95 : 75,
      lat: payload.lat,
      lng: payload.lng,
      locationName: payload.landmark
    }).catch(() => {});

    // Update state synchronously
    setSosIncidents((prev) => [newSOS, ...prev.filter((s) => s.id !== ticketId)]);
    setRescueTeams((prev) =>
      prev.map((t) =>
        t.id === assignedTeam!.id
          ? { ...t, status: "EN_ROUTE", assignedSOS: ticketId, etaMin: 8 }
          : t
      )
    );
    setActiveCitizenTicketId(ticketId);
    setActiveFieldTeamId(assignedTeam.id);

    return newSOS;
  }, [rescueTeams]);

  // Update SOS Ticket Status Across Platform
  const updateSOSLifecycle = useCallback((sosId: string, newStatus: SOSIncident["status"]) => {
    const nowStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setSosIncidents((prev) =>
      prev.map((s) => {
        if (s.id === sosId) {
          const updatedTimestamps = [
            ...(s.timestamps || []),
            { status: `Lifecycle Updated to ${newStatus}`, time: nowStr }
          ];
          return { ...s, status: newStatus, timestamps: updatedTimestamps };
        }
        return s;
      })
    );
  }, []);

  // Update Rescue Team Status Across Platform
  const updateTeamLifecycle = useCallback((teamId: string, newStatus: RescueTeam["status"]) => {
    setRescueTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return { ...t, status: newStatus };
        }
        return t;
      })
    );

    // Also update associated SOS ticket if rescued or en route
    setSosIncidents((prev) =>
      prev.map((s) => {
        if (s.assignedTeam === teamId) {
          let sosStatus: SOSIncident["status"] = s.status;
          if (newStatus === "EN_ROUTE") sosStatus = "EN_ROUTE";
          if (newStatus === "ON_SCENE") sosStatus = "EN_ROUTE";
          if (newStatus === "RESCUED") sosStatus = "RESCUED";
          return { ...s, status: sosStatus };
        }
        return s;
      })
    );
  }, []);

  const requestInspection = useCallback(
    async (nodeId: string, nodeName?: string, nodeStatus?: string) => {
      const formattedNodeName = nodeName || `Junction ${nodeId}`;
      const status = nodeStatus || "CRITICAL";
      const teamId = `RT-${nodeId}`;
      const inspId = `INSP-${nodeId}`;
      const nowStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

      await requestFieldInspection(nodeId);

      const newDispatch: InspectionDispatch = {
        id: inspId,
        nodeId,
        nodeName: formattedNodeName,
        status,
        timestamp: nowStr,
        teamId,
        location: `Drainage Junction ${formattedNodeName} (${nodeId})`,
      };

      const newAlert: DispatchAlert = {
        id: `alert-${Date.now()}`,
        title: `URGENT FIELD INSPECTION REQUEST ARRIVED (${inspId})`,
        message: `Drainage Junction ${formattedNodeName} (${nodeId}) — Clearance Team Added to Rescue List`,
        nodeId,
        nodeName: formattedNodeName,
        teamId,
        timestamp: nowStr,
        severity: status === "CRITICAL" ? "CRITICAL" : "WARNING",
      };

      const newTeam: RescueTeam = {
        id: teamId,
        name: `Drainage Clearance Unit (${nodeId})`,
        status: "EN_ROUTE",
        distanceKm: 2.1,
        etaMin: 10,
        vehicle: "Drainage Service Truck",
        capacity: 4,
        routeSafety: "SAFE",
        assignedSOS: inspId,
      };

      const newSOS: SOSIncident = {
        id: inspId,
        priority: status === "CRITICAL" ? "CRITICAL" : "HIGH",
        location: `Drainage Junction ${formattedNodeName}`,
        people: 0,
        children: 0,
        elderly: 0,
        medical: false,
        waterDepthM: 0.65,
        waitingMin: 1,
        status: "ASSIGNED",
        floodRisk: status === "CRITICAL" ? "SEVERE" : "HIGH",
        lat: 25.606,
        lng: 85.152,
        timestamps: [
          { status: "Drainage Inspection Dispatched", time: nowStr },
          { status: "Clearance Team En Route", time: nowStr },
        ],
        assignedTeam: teamId,
      };

      setActiveInspections((prev) => [newDispatch, ...prev.filter((i) => i.id !== inspId)]);
      setAlertQueue((prev) => [newAlert, ...prev]);
      setRescueTeams((prev) => [newTeam, ...prev.filter((t) => t.id !== teamId)]);
      setSosIncidents((prev) => [newSOS, ...prev.filter((s) => s.id !== inspId)]);
      setSelectedTeamId(teamId);
    },
    []
  );

  const latestDispatchAlert = alertQueue.length > 0 ? alertQueue[0] : null;

  return (
    <DispatchContext.Provider
      value={{
        activeInspections,
        alertQueue,
        latestDispatchAlert,
        rescueTeams,
        sosIncidents,
        requestInspection,
        loadingNodeId,
        selectedTeamId,
        setSelectedTeamId,
        activeCitizenTicketId,
        activeFieldTeamId,
        setActiveFieldTeamId,
        submitCitizenSOS,
        updateSOSLifecycle,
        updateTeamLifecycle,
      }}
    >
      {children}
    </DispatchContext.Provider>
  );
};

export const useDispatch = () => {
  const context = useContext(DispatchContext);
  if (!context) {
    throw new Error("useDispatch must be used within a DispatchProvider");
  }
  return context;
};
