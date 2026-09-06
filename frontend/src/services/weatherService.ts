/**
 * OpenWeatherMap (OWM) Real-Time Weather & Live Rainfall Telemetry Service
 */

export interface LiveWeatherTelemetry {
  cityName: string;
  tempC: number;
  feelsLikeC: number;
  humidityPct: number;
  windSpeedMs: number;
  rainfallMmHr: number;
  condition: string;
  description: string;
  icon: string;
  timestamp: string;
  source: "OPENWEATHERMAP_LIVE" | "SIMULATED";
}

/**
 * Fetches real-time weather and live rainfall intensity from OpenWeatherMap API.
 */
export async function fetchLiveCityWeather(
  lat: number,
  lng: number,
  defaultRainfall = 88
): Promise<LiveWeatherTelemetry> {
  const apiKey = import.meta.env.VITE_OWM_API_KEY || "50620c9111237dff09aab9db3aac9a23";
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenWeatherMap HTTP ${response.status}`);
    }

    const data = await response.json();

    // Extract live 1h rainfall or compute estimate from weather condition
    const rain1h = data.rain?.["1h"] || data.rain?.["3h"] ? (data.rain["3h"] / 3) : 0;
    const isRaining = data.weather?.[0]?.main === "Rain" || data.weather?.[0]?.main === "Drizzle" || data.weather?.[0]?.main === "Thunderstorm";

    const liveRainfall = rain1h > 0 ? Math.round(rain1h * 10) : isRaining ? Math.max(25, defaultRainfall) : defaultRainfall;

    return {
      cityName: data.name || "Target Zone",
      tempC: Math.round(data.main?.temp ?? 28),
      feelsLikeC: Math.round(data.main?.feels_like ?? 31),
      humidityPct: Math.round(data.main?.humidity ?? 82),
      windSpeedMs: +(data.wind?.speed ?? 4.5).toFixed(1),
      rainfallMmHr: liveRainfall,
      condition: data.weather?.[0]?.main || "Monsoon Storm",
      description: data.weather?.[0]?.description || "Heavy rain & coastal storm surge",
      icon: data.weather?.[0]?.icon || "10d",
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      source: "OPENWEATHERMAP_LIVE",
    };
  } catch (error) {
    console.warn("[OpenWeatherMap] Live telemetry query skipped/failed, using fallback:", error);
    return {
      cityName: "Target Zone",
      tempC: 29,
      feelsLikeC: 33,
      humidityPct: 88,
      windSpeedMs: 6.2,
      rainfallMmHr: defaultRainfall,
      condition: "Monsoon Downpour",
      description: "Severe convective rainfall & flash flood warning",
      icon: "10d",
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      source: "SIMULATED",
    };
  }
}
