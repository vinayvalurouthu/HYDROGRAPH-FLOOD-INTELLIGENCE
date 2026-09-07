"""
CWC (Central Water Commission) River Boundary Conditions & Telemetry Service.

Queries internal CWC Flood Forecast API endpoints (ffs.india-water.gov.in / cwc.gov.in)
to fetch real-time upstream river stages (water levels), discharge (cumecs), and warning status
for Ganges (Ganga), Punpun, Sone, and Gandak river basins near pilot cities (Patna, etc.).
"""

import urllib3
import requests
from typing import List, Dict, Any

# Disable insecure HTTPS request warnings if CWC government SSL certificate is expired/untrusted
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

CWC_API_URL = "https://ffs.india-water.gov.in/api/flood-sites"
CWC_BULLETIN_URL = "https://cwc.gov.in/api/daily-flood-bulletin"

# Known CWC Gauge Stations for Ganges River Basin (Patna Pilot Zone)
PATNA_CWC_STATIONS = [
    {
        "station": "Patna (Gandhighat)",
        "basin": "Ganga",
        "state": "Bihar",
        "current_level": 49.65,
        "warning_level": 48.60,
        "danger_level": 49.50,
        "historical_max_level": 50.52,
        "discharge_cumecs": 42500,
        "trend": "RISING",
        "status": "ABOVE_DANGER_LEVEL"
    },
    {
        "station": "Patna (Dighaghat)",
        "basin": "Ganga",
        "state": "Bihar",
        "current_level": 50.20,
        "warning_level": 49.40,
        "danger_level": 50.40,
        "historical_max_level": 51.45,
        "discharge_cumecs": 44100,
        "trend": "RISING",
        "status": "ABOVE_WARNING_LEVEL"
    },
    {
        "station": "Sonepur (Gandak River)",
        "basin": "Gandak",
        "state": "Bihar",
        "current_level": 49.10,
        "warning_level": 48.20,
        "danger_level": 50.00,
        "historical_max_level": 51.20,
        "discharge_cumecs": 18200,
        "trend": "STATIONARY",
        "status": "ABOVE_WARNING_LEVEL"
    },
    {
        "station": "Sripalpur (Punpun River)",
        "basin": "Punpun",
        "state": "Bihar",
        "current_level": 52.80,
        "warning_level": 50.60,
        "danger_level": 51.60,
        "historical_max_level": 53.90,
        "discharge_cumecs": 8400,
        "trend": "RISING",
        "status": "CRITICAL_SEVERE"
    }
]


def fetch_cwc_telemetry(basin: str = "Ganga", city: str = "Patna") -> Dict[str, Any]:
    """
    Fetches real-time CWC upstream river telemetry (stage, discharge, warning levels).
    Includes automatic failover to historical/simulated Ganga telemetry when government portal is unreachable.
    """
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HydroGraph/2.4 (Contact: cwc-ingest@hydrograph.io)"}
    
    try:
        # Query CWC internal JSON API endpoint
        response = requests.get(CWC_API_URL, headers=headers, verify=False, timeout=5)
        if response.status_code == 200:
            raw_sites = response.json()
            filtered_sites = []
            
            for site in raw_sites:
                site_basin = site.get("basin") or site.get("river_name") or ""
                site_name = site.get("station") or site.get("station_name") or ""
                
                if basin.lower() in site_basin.lower() or city.lower() in site_name.lower():
                    cur_lvl = float(site.get("current_level") or site.get("water_level") or 0.0)
                    warn_lvl = float(site.get("warning_level") or 0.0)
                    dng_lvl = float(site.get("danger_level") or 0.0)
                    
                    is_crossed = cur_lvl >= warn_lvl if warn_lvl > 0 else False
                    
                    filtered_sites.append({
                        "station": site_name,
                        "basin": site_basin,
                        "state": site.get("state", "Bihar"),
                        "current_level": cur_lvl,
                        "warning_level": warn_lvl,
                        "danger_level": dng_lvl,
                        "discharge_cumecs": float(site.get("discharge") or 35000),
                        "trend": site.get("trend", "RISING"),
                        "warning_level_crossed": is_crossed,
                        "status": "CRITICAL" if cur_lvl >= dng_lvl else ("WARNING" if is_crossed else "NORMAL")
                    })
            
            if filtered_sites:
                return {
                    "source": "CWC Live Government Portal (ffs.india-water.gov.in)",
                    "basin": basin,
                    "city": city,
                    "active_alerts_count": sum(1 for s in filtered_sites if s.get("warning_level_crossed")),
                    "stations": filtered_sites
                }
    except Exception as err:
        print(f"[CWC Service] CWC Portal unreachable ({err}). Failing over to Ganges historical basin scenario.")

    # High-fidelity failover response matching Ganges basin CWC telemetries for Patna
    alerts_count = sum(1 for s in PATNA_CWC_STATIONS if s["current_level"] >= s["warning_level"])
    return {
        "source": "CWC Ganga Basin Boundary Conditions (Simulated Failover)",
        "basin": basin,
        "city": city,
        "active_alerts_count": alerts_count,
        "stations": PATNA_CWC_STATIONS
    }


if __name__ == "__main__":
    data = fetch_cwc_telemetry("Ganga", "Patna")
    print("CWC Telemetry Output:", data)
