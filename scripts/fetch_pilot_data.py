import json
import requests
import sys
from typing import Dict, Any, List
from shapely.geometry import Point, LineString, mapping

# --- CONFIGURATION ---
PILOT_CITY = "Patna"
BBOX = (25.56, 85.08, 25.65, 85.20)  # min_lat, min_lon, max_lat, max_lon
DB_CONN = "dbname=hydrograph user=postgres password=postgres host=localhost port=5432"

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

def fetch_osm_data() -> Dict[str, Any]:
    min_lat, min_lon, max_lat, max_lon = BBOX
    query = f"""
    [out:json][timeout:60];
    (
      // Primary, secondary, tertiary roads
      way["highway"~"primary|secondary|tertiary|trunk"]({min_lat},{min_lon},{max_lat},{max_lon});
      // Candidate shelter facilities (Schools, Colleges, Community Centers)
      node["amenity"~"school|college|community_centre|hospital"]({min_lat},{min_lon},{max_lat},{max_lon});
      way["amenity"~"school|college|community_centre|hospital"]({min_lat},{min_lon},{max_lat},{max_lon});
      // Open drains and canal networks
      way["waterway"~"drain|canal|ditch"]({min_lat},{min_lon},{max_lat},{max_lon});
    );
    out body;
    >;
    out skel qt;
    """
    print(f"Fetching real infrastructure for {PILOT_CITY} from OpenStreetMap...")
    headers = {"User-Agent": "HydroGraph-Flood-Intelligence/1.0 (Contact: admin@hydrograph.io)"}
    response = requests.post(OVERPASS_URL, data={"data": query}, headers=headers)
    response.raise_for_status()
    return response.json()

def process_osm_to_geojson(osm_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Converts raw Overpass elements (nodes and ways) into a valid GeoJSON FeatureCollection
    using Shapely geometries.
    """
    elements = osm_payload.get("elements", [])
    nodes_map: Dict[int, tuple] = {}
    features: List[Dict[str, Any]] = []

    # First pass: map all nodes to (lon, lat)
    for elem in elements:
        if elem.get("type") == "node":
            node_id = elem["id"]
            lat = elem.get("lat")
            lon = elem.get("lon")
            if lat is not None and lon is not None:
                nodes_map[node_id] = (lon, lat)
                
                # Check if node itself has amenity tags
                tags = elem.get("tags", {})
                if "amenity" in tags:
                    pt = Point(lon, lat)
                    features.append({
                        "type": "Feature",
                        "id": f"node-{node_id}",
                        "geometry": mapping(pt),
                        "properties": {
                            "osm_id": node_id,
                            "type": "amenity",
                            "amenity": tags.get("amenity"),
                            "name": tags.get("name", f"Facility {node_id}"),
                            **tags
                        }
                    })

    # Second pass: reconstruct ways into LineStrings or Polygons
    for elem in elements:
        if elem.get("type") == "way":
            way_id = elem["id"]
            tags = elem.get("tags", {})
            way_nodes = elem.get("nodes", [])
            coords = [nodes_map[nid] for nid in way_nodes if nid in nodes_map]

            if len(coords) >= 2:
                line = LineString(coords)
                feature_type = "road" if "highway" in tags else ("drainage" if "waterway" in tags else "facility")
                features.append({
                    "type": "Feature",
                    "id": f"way-{way_id}",
                    "geometry": mapping(line),
                    "properties": {
                        "osm_id": way_id,
                        "feature_type": feature_type,
                        "highway": tags.get("highway"),
                        "waterway": tags.get("waterway"),
                        "amenity": tags.get("amenity"),
                        "name": tags.get("name", f"OSM Way {way_id}"),
                        **tags
                    }
                })

    geojson = {
        "type": "FeatureCollection",
        "city": PILOT_CITY,
        "bbox": BBOX,
        "features": features
    }
    return geojson

def save_to_geojson(data: Dict[str, Any], output_file: str = "pilot_data.geojson"):
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Saved real-world pilot data ({len(data.get('features', []))} features) to {output_file}")

if __name__ == "__main__":
    osm_payload = fetch_osm_data()
    geojson_data = process_osm_to_geojson(osm_payload)
    save_to_geojson(geojson_data, "pilot_data.geojson")
