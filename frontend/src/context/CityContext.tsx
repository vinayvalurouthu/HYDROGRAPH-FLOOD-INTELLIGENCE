import React, { createContext, useContext, useState, useCallback } from "react";
import { PRESET_CITIES, generatePresetCityData } from "../services/cityDataGenerator";
import type { CityPreset, CityFloodDataset } from "../services/cityDataGenerator";

export interface SelectedCityState extends CityPreset {
  radius: number; // radius in meters for bounding box query (default: 5000m)
  lat?: number;
  lng?: number;
}

interface CityContextType {
  selectedCity: SelectedCityState;
  setSelectedCity: (city: SelectedCityState) => void;
  cityDataset: CityFloodDataset;
  setCityDataset: React.Dispatch<React.SetStateAction<CityFloodDataset>>;
  selectCity: (city: CityPreset, customDataset?: CityFloodDataset) => void;
  selectCityByName: (cityName: string) => void;
  setCityRadius: (radius: number) => void;
  presetCities: CityPreset[];
}

const defaultCityState: SelectedCityState = {
  ...PRESET_CITIES[0], // Patna
  radius: 5000,
  lat: PRESET_CITIES[0].center[0],
  lng: PRESET_CITIES[0].center[1],
};

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState<SelectedCityState>(defaultCityState);
  const [cityDataset, setCityDataset] = useState<CityFloodDataset>(() =>
    generatePresetCityData(PRESET_CITIES[0])
  );

  const selectCity = useCallback((city: CityPreset, customDataset?: CityFloodDataset) => {
    const newCityState: SelectedCityState = {
      ...city,
      radius: 5000,
      lat: city.center[0],
      lng: city.center[1],
    };
    setSelectedCity(newCityState);
    const dataset = customDataset || generatePresetCityData(city);
    setCityDataset(dataset);
  }, []);

  const selectCityByName = useCallback(
    (cityName: string) => {
      const found = PRESET_CITIES.find(
        (c) => c.name.toLowerCase() === cityName.toLowerCase() || c.id === cityName.toLowerCase()
      );
      if (found) {
        selectCity(found);
      }
    },
    [selectCity]
  );

  const setCityRadius = useCallback((radius: number) => {
    setSelectedCity((prev) => ({ ...prev, radius }));
  }, []);

  return (
    <CityContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        cityDataset,
        setCityDataset,
        selectCity,
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

export const useCity = useCityContext;

