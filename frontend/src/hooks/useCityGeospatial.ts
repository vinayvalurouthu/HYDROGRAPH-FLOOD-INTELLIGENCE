import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchCityInfrastructure,
  type CityGeospatialResult,
} from "../services/overpassService";
import type { SelectedCityState } from "../context/CityContext";

export interface UseCityGeospatialReturn {
  geojson: CityGeospatialResult | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Custom hook to dynamically query OpenStreetMap Overpass API whenever selectedCity changes.
 */
export function useCityGeospatial(selectedCity: SelectedCityState): UseCityGeospatialReturn {
  const [geojson, setGeojson] = useState<CityGeospatialResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const lat = selectedCity.center ? selectedCity.center[0] : (selectedCity as any).lat || 25.6093;
  const lng = selectedCity.center ? selectedCity.center[1] : (selectedCity as any).lng || 85.1376;
  const radius = selectedCity.radius || 5000;

  const loadCityData = useCallback(async () => {
    // Cancel any previous in-flight Overpass request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchCityInfrastructure(lat, lng, radius, controller.signal);
      setGeojson(result);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("[useCityGeospatial Error]:", err);
        setError(err.message || "Failed to load city infrastructure data");
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [lat, lng, radius]);

  useEffect(() => {
    loadCityData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadCityData]);

  return {
    geojson,
    loading,
    error,
    reload: loadCityData,
  };
}
