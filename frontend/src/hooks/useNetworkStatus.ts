/**
 * Custom Hook: useNetworkStatus
 * Monitors browser online/offline status, manages simulated P2P mesh relay state,
 * and triggers background sync when reconnecting to SATELLITE ONLINE.
 */

import { useState, useEffect, useCallback } from "react";
import { syncPendingTicketsToBackend } from "../services/offlineStorage";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isMeshSimulated, setIsMeshSimulated] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncedCount, setSyncedCount] = useState<number>(0);

  const triggerBackgroundSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const count = await syncPendingTicketsToBackend();
      setSyncedCount(count);
    } catch (err) {
      console.warn("[useNetworkStatus] Auto-sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerBackgroundSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [triggerBackgroundSync]);

  const toggleMeshSimulation = useCallback(() => {
    setIsMeshSimulated((prev) => {
      const next = !prev;
      if (!next && isOnline) {
        triggerBackgroundSync();
      }
      return next;
    });
  }, [isOnline, triggerBackgroundSync]);

  const isConnected = isOnline && !isMeshSimulated;

  return {
    isOnline,
    isMeshSimulated,
    isConnected,
    isSyncing,
    syncedCount,
    toggleMeshSimulation,
    triggerBackgroundSync,
  };
}
