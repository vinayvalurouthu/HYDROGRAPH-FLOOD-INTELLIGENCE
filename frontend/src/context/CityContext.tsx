import React, { createContext, useContext, useState, useCallback } from "react";
import { PRESET_CITIES } from "../services/cityDataGenerator";
import type { CityPreset } from "../services/cityDataGenerator";

export interface SelectedCityState extends CityPreset {
  radius: number; // radius in meters for bounding box query (default: 5000m)
}

interface CityContextType {
  selectedCity: SelectedCityState;
  setSelectedCity: (city: SelectedCityState) => void;
  selectCityByName: (cityName: string) => void;
  setCityRadius: (radius: number) => void;
  presetCities: CityPreset[];
}

const defaultCityState: SelectedCityState = {
  ...PRESET_CITIES[0], // Patna
  radius: 5000,
};

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState<SelectedCityState>(defaultCityState);

  const selectCityByName = useCallback((cityName: string) => {
    const found = PRESET_CITIES.find(
      (c) => c.name.toLowerCase() === cityName.toLowerCase() || c.id === cityName.toLowerCase()
    );
    if (found) {
      setSelectedCity((prev) => ({
        ...found,
        radius: prev.radius || 5000,
      }));
    }
  }, []);

  const setCityRadius = useCallback((radius: number) => {
    setSelectedCity((prev) => ({ ...prev, radius }));
  }, []);

  return (
    <CityContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        selectCityByName,
        setCityRadius,
        presetCities: PRESET_CITIES,
      }}
    >
      {children}
    </CityContext.Provider>
  );
};

export const useCityContext = () => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error("useCityContext must be used within a CityProvider");
  }
  return context;
};
