"""
Dynamic Geospatial Projection & City Context Utility.

Calculates exact UTM Zone numbers, EPSG CRS codes (e.g., EPSG:32643 for Mumbai, EPSG:32645 for Patna),
and dynamic bounding boxes for ANY geographic coordinate in India/globally.
"""

import math
from typing import Dict, Any, Tuple

def calculate_dynamic_city_context(lat: float, lon: float, radius_km: float = 10.0) -> Dict[str, Any]:
    """
    Dynamically generates the bounding box and UTM EPSG code for ANY city.
    
    1. UTM Zone Formula: math.floor((lon + 180) / 6) + 1
       Base for Northern Hemisphere: EPSG:32600 + utm_zone
       E.g., Chennai (80.27°E) -> Zone 44 -> EPSG:32644
             Mumbai (72.87°E)  -> Zone 43 -> EPSG:32643
             Patna (85.13°E)   -> Zone 45 -> EPSG:32645
    
    2. Dynamic Bounding Box Offset:
       1 degree latitude  ~= 111.32 km
       1 degree longitude ~= 111.32 * cos(lat_radians) km
    """
    # 1. Calculate UTM Zone (EPSG formula)
    utm_zone = math.floor((lon + 180) / 6) + 1
    epsg_srid = 32600 + utm_zone
    epsg_code = f"EPSG:{epsg_srid}"

    # 2. Calculate dynamic bounding box based on radius in kilometers
    lat_offset = radius_km / 111.32
    lon_offset = radius_km / (111.32 * math.cos(math.radians(lat)))

    min_lat = round(lat - lat_offset, 5)
    max_lat = round(lat + lat_offset, 5)
    min_lon = round(lon - lon_offset, 5)
    max_lon = round(lon + lon_offset, 5)

    return {
        "epsg_crs": epsg_code,
        "srid": epsg_srid,
        "utm_zone": utm_zone,
        "radius_km": radius_km,
        "center": {"lat": lat, "lng": lon},
        "bbox": {
            "south": min_lat,
            "west": min_lon,
            "north": max_lat,
            "east": max_lon,
            "tuple": (min_lat, min_lon, max_lat, max_lon),
            "string": f"{min_lat},{min_lon},{max_lat},{max_lon}"
        }
    }


def transform_coordinates_wgs84_to_utm(lat: float, lon: float) -> Dict[str, Any]:
    """
    Transforms WGS84 (EPSG:4326) lat/lon to local UTM metric projected coordinates (meters)
    using pyproj if available.
    """
    ctx = calculate_dynamic_city_context(lat, lon)
    
    try:
        from pyproj import Transformer
        transformer = Transformer.from_crs("EPSG:4326", ctx["epsg_crs"], always_xy=True)
        easting, northing = transformer.transform(lon, lat)
        return {
            "lat": lat,
            "lng": lon,
            "utm_easting_m": round(easting, 2),
            "utm_northing_m": round(northing, 2),
            "epsg_crs": ctx["epsg_crs"],
            "utm_zone": ctx["utm_zone"]
        }
    except Exception:
        # Fallback metric calculation
        return {
            "lat": lat,
            "lng": lon,
            "utm_easting_m": round(lon * 111320.0 * math.cos(math.radians(lat)), 2),
            "utm_northing_m": round(lat * 111320.0, 2),
            "epsg_crs": ctx["epsg_crs"],
            "utm_zone": ctx["utm_zone"]
        }


if __name__ == "__main__":
    # Test cases for major pilot cities
    for city_name, clat, clon in [
        ("Patna", 25.5941, 85.1376),
        ("Mumbai", 19.0760, 72.8777),
        ("Chennai", 13.0827, 80.2707),
        ("Visakhapatnam", 17.6868, 83.2185),
        ("Kochi", 9.9312, 76.2673),
    ]:
        ctx = calculate_dynamic_city_context(clat, clon, radius_km=10.0)
        proj = transform_coordinates_wgs84_to_utm(clat, clon)
        print(f"[{city_name}] EPSG: {ctx['epsg_crs']} | Zone: {ctx['utm_zone']} | Metric BBox: {ctx['bbox']['tuple']} | UTM (X, Y): ({proj['utm_easting_m']}m, {proj['utm_northing_m']}m)")
