import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { rescueTeams as initialRescueTeams, sosIncidents as initialSOS } from "../mockData";
import type { RescueTeam, SOSIncident } from "../mockData";
import { getRescueTeams, getSOSIncidents, requestFieldInspection } from "../services/api";

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
}

const DispatchContext = createContext<DispatchContextType | undefined>(undefined);

export const DispatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rescueTeams, setRescueTeams] = useState<RescueTeam[]>(initialRescueTeams);
  const [sosIncidents, setSosIncidents] = useState<SOSIncident[]>(initialSOS);
  const [activeInspections, setActiveInspections] = useState<InspectionDispatch[]>([]);
  const [alertQueue, setAlertQueue] = useState<DispatchAlert[]>([]);
  const [loadingNodeId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Poll server periodically while maintaining unshifted new local dispatches at top
  useEffect(() => {
    const syncWithBackend = () => {
      Promise.all([getRescueTeams(), getSOSIncidents()]).then(([tData, sData]) => {
        if (tData && tData.length > 0) {
          setRescueTeams((currentTeams) => {
            const teamMap = new Map<string, RescueTeam>();
            // Add server items first
            tData.forEach((t) => teamMap.set(t.id, t));
            // Ensure any local dispatch teams remain present at the top
            currentTeams.forEach((t) => {
              if (t.id.startsWith("RT-") && !teamMap.has(t.id)) {
                teamMap.set(t.id, t);
              }
            });
            const merged = Array.from(teamMap.values());
            // Sort so that active inspection dispatches (RT-DN- / RT-N- / RT-RA-) or newest updated teams are first
            return merged.sort((a, b) => {
              const aIsDispatch = a.id.startsWith("RT-") || a.name.includes("Drainage Clearance");
              const bIsDispatch = b.id.startsWith("RT-") || b.name.includes("Drainage Clearance");
              if (aIsDispatch && !bIsDispatch) return -1;
              if (!aIsDispatch && bIsDispatch) return 1;
              return 0;
            });
          });
        }

        if (sData && sData.length > 0) {
          setSosIncidents((currentSOS) => {
            const sosMap = new Map<string, SOSIncident>();
            sData.forEach((s) => sosMap.set(s.id, s));
            currentSOS.forEach((s) => {
              if (s.id.startsWith("INSP-") && !sosMap.has(s.id)) {
                sosMap.set(s.id, s);
              }
            });
            const merged = Array.from(sosMap.values());
            return merged.sort((a, b) => {
              const aIsInsp = a.id.startsWith("INSP-");
              const bIsInsp = b.id.startsWith("INSP-");
              if (aIsInsp && !bIsInsp) return -1;
              if (!aIsInsp && bIsInsp) return 1;
              return 0;
            });
          });
        }
      });
    };

    syncWithBackend();
    const interval = setInterval(syncWithBackend, 4000);
    return () => clearInterval(interval);
  }, []);

  const requestInspection = useCallback(
    async (nodeId: string, nodeName?: string, nodeStatus?: string) => {
      const formattedNodeName = nodeName || `Junction ${nodeId}`;
      const status = nodeStatus || "CRITICAL";
      const teamId = `RT-${nodeId}`;
      const inspId = `INSP-${nodeId}`;
      const nowStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

      // Call API
      await requestFieldInspection(nodeId);

      // 1. New Inspection Dispatch Object
      const newDispatch: InspectionDispatch = {
        id: inspId,
        nodeId,
        nodeName: formattedNodeName,
        status,
        timestamp: nowStr,
        teamId,
        location: `Drainage Junction ${formattedNodeName} (${nodeId})`,
      };

      // 2. New Alert Object
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

      // 3. New Clearance Rescue Team
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

      // 4. New SOS Incident
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

      // Update Global State Reactively
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
