import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface SystemSettings {
  autoRefreshIntervalSec: number; // 0 (manual), 5, 15, 30, 60
  soundAlerts: boolean; // Play synthesized tone on critical alarms
  criticalFloodThresholdCm: number; // e.g. 45cm
  depthUnit: "cm" | "in" | "m";
  velocityUnit: "m/s" | "km/h";
  mapTheme: "streets" | "dark_tactical" | "satellite";
  lowBandwidthMode: boolean; // Disable particles & throttle telemetry for field rescue
  autoDispatchRecommendations: boolean; // AI auto-matches best team on distress signal
  hapticFeedback: boolean;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  autoRefreshIntervalSec: 15,
  soundAlerts: true,
  criticalFloodThresholdCm: 45,
  depthUnit: "cm",
  velocityUnit: "m/s",
  mapTheme: "streets",
  lowBandwidthMode: false,
  autoDispatchRecommendations: true,
  hapticFeedback: true,
};

interface SettingsContextType {
  settings: SystemSettings;
  updateSettings: (partial: Partial<SystemSettings>) => void;
  resetSettings: () => void;
  playAlertSound: (frequency?: number, duration?: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = "hydrograph_system_settings";

/**
 * Synthesizes a crisp tactical emergency alert chime using the native Web Audio API.
 * Requires zero external audio assets.
 */
export function playSynthesizedChime(frequency = 880, duration = 0.25) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("[SettingsContext] Web Audio chime unavailable:", e);
  }
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  const updateSettings = useCallback((partial: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const playAlertSound = useCallback(
    (frequency = 880, duration = 0.25) => {
      if (settings.soundAlerts) {
        playSynthesizedChime(frequency, duration);
      }
    },
    [settings.soundAlerts]
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        playAlertSound,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
};
