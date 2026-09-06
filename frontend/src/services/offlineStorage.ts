/**
 * HydroGraph Offline Storage & P2P Mesh Relay Engine
 * Manages IndexedDB persistent queue, offline sync, and WebRTC/BLE Mesh Packet Broadcasting.
 */

import type { SOSIncident } from "../mockData";

const DB_NAME = "HydroGraphOfflineDB";
const STORE_NAME = "sos_tickets";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB unavailable in current context"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Save an SOS ticket locally to IndexedDB when offline */
export async function saveTicketToIndexedDB(ticket: SOSIncident): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const offlineTicket = {
      ...ticket,
      syncStatus: "QUEUED_LOCALLY",
      queuedAt: new Date().toISOString(),
    };
    store.put(offlineTicket);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    // Trigger WebRTC / BLE Mesh Packet broadcast fallback simulation
    broadcastP2PMeshRelay(offlineTicket);
  } catch (err) {
    console.warn("[OfflineStorage] IndexedDB put failed, falling back to localStorage:", err);
    const existing = JSON.parse(localStorage.getItem("hydrograph_offline_sos") || "[]");
    existing.push({ ...ticket, syncStatus: "QUEUED_LOCALLY" });
    localStorage.setItem("hydrograph_offline_sos", JSON.stringify(existing));
  }
}

/** Retrieve all locally queued SOS tickets from IndexedDB */
export async function getPendingTicketsFromIndexedDB(): Promise<SOSIncident[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return JSON.parse(localStorage.getItem("hydrograph_offline_sos") || "[]");
  }
}

/** Clear a synced ticket from IndexedDB */
export async function removeTicketFromIndexedDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const existing: SOSIncident[] = JSON.parse(localStorage.getItem("hydrograph_offline_sos") || "[]");
    const filtered = existing.filter((item) => item.id !== id);
    localStorage.setItem("hydrograph_offline_sos", JSON.stringify(filtered));
  }
}

/**
 * P2P WebRTC / Bluetooth Low Energy (BLE) Mesh Packet Broadcast Execution Trigger
 * Executes ad-hoc packet hop to nearest available field drone or neighbor node when internet is down.
 */
export function broadcastP2PMeshRelay(ticket: SOSIncident): void {
  console.log(`[P2P Mesh Network] Broadcasting BLE/WebRTC distress packet for ticket ${ticket.id}...`);
  // PLACEHOLDER: WebRTC DataChannel broadcast / BLE peripheral packet advertisement logic
}

/**
 * Background Sync Function: Triggers when switching back to SATELLITE ONLINE.
 * Iterates through IndexedDB queue, posts tickets to backend API, and clears them upon success.
 */
export async function syncPendingTicketsToBackend(
  onTicketSynced?: (ticket: SOSIncident) => void
): Promise<number> {
  const pending = await getPendingTicketsFromIndexedDB();
  if (!pending.length) return 0;

  let syncedCount = 0;
  for (const ticket of pending) {
    try {
      const res = await fetch("/api/v1/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priority: ticket.priority,
          location: ticket.location,
          people: ticket.people,
          children: ticket.children,
          elderly: ticket.elderly,
          medical: ticket.medical,
          water_depth_m: ticket.waterDepthM,
        }),
      });

      if (res.ok || res.status === 201) {
        await removeTicketFromIndexedDB(ticket.id);
        syncedCount++;
        if (onTicketSynced) {
          onTicketSynced({ ...ticket, syncStatus: "SYNCED" });
        }
      }
    } catch (err) {
      console.warn(`[OfflineSync] Sync failed for ticket ${ticket.id}:`, err);
    }
  }

  return syncedCount;
}
