"""
HydroGraph Flood-Aware Routing Engine.

Computes safe emergency evacuation routes and rescue transit paths across Patna,
dynamically penalizing roads based on water depth, flow velocity, and closure status.
"""

import math
from datetime import datetime
import networkx as nx

from schemas import (
    RouteRequest,
    RouteResponse,
    RouteOption,
    RouteStep,
)
from models import Road


# ─── Key Patna Transit Nodes / Junctions ──────────────────────────────────────
PATNA_NODES = {
    "PATNA_JN": {"name": "Patna Junction", "lat": 25.6020, "lng": 85.1376},
    "GANDHI_MAIDAN": {"name": "Gandhi Maidan", "lat": 25.6180, "lng": 85.1430},
    "BAILEY_RD_W": {"name": "Bailey Road West (Saguna More)", "lat": 25.6120, "lng": 85.0850},
    "BAILEY_RD_C": {"name": "Bailey Road Center (Dak Bungalow)", "lat": 25.6110, "lng": 85.1300},
    "BORING_RD": {"name": "Boring Road Crossing", "lat": 25.6160, "lng": 85.1150},
    "KANKARBAGH": {"name": "Kankarbagh Colony More", "lat": 25.5980, "lng": 85.1350},
    "RAJENDRA_NAGAR": {"name": "Rajendra Nagar Terminal", "lat": 25.5990, "lng": 85.1600},
    "ASHOK_RAJPATH": {"name": "Ashok Rajpath (PMCH)", "lat": 25.6210, "lng": 85.1550},
    "DIGHA_GHAT": {"name": "Digha Bridge Approach", "lat": 25.6450, "lng": 85.1020},
    "DANAPUR_JN": {"name": "Danapur Station", "lat": 25.6270, "lng": 85.0420},
    "KUMHRAR": {"name": "Kumhrar Heritage Area", "lat": 25.5950, "lng": 85.1850},
    "NH30_BYPASS": {"name": "NH-30 Bypass Crossing", "lat": 25.5800, "lng": 85.1400},
    "CANAL_RD_JN": {"name": "Canal Road Junction", "lat": 25.6050, "lng": 85.1100},
}

# ─── Road Network Topology (Corridors connecting nodes) ───────────────────────
ROAD_EDGES = [
    # (u, v, road_id, base_distance_km, base_speed_kmh)
    ("DANAPUR_JN", "BAILEY_RD_W", "NH-48", 4.5, 45),
    ("BAILEY_RD_W", "BORING_RD", "R-102", 3.2, 35),
    ("BAILEY_RD_W", "CANAL_RD_JN", "CR-07", 2.8, 30),
    ("CANAL_RD_JN", "PATNA_JN", "CR-07", 3.1, 30),
    ("BORING_RD", "BAILEY_RD_C", "R-102", 2.1, 35),
    ("BAILEY_RD_C", "GANDHI_MAIDAN", "MR-01", 1.8, 30),
    ("BAILEY_RD_C", "PATNA_JN", "MR-01", 1.5, 30),
    ("GANDHI_MAIDAN", "ASHOK_RAJPATH", "MR-01", 2.0, 25),
    ("ASHOK_RAJPATH", "RAJENDRA_NAGAR", "MR-01", 3.4, 25),
    ("PATNA_JN", "KANKARBAGH", "JN-14", 1.9, 30),
    ("KANKARBAGH", "RAJENDRA_NAGAR", "JN-14", 2.6, 35),
    ("KANKARBAGH", "NH30_BYPASS", "RD-23", 2.8, 45),
    ("RAJENDRA_NAGAR", "KUMHRAR", "RD-23", 3.0, 40),
    ("NH30_BYPASS", "KUMHRAR", "RD-23", 4.2, 50),
    ("DIGHA_GHAT", "BORING_RD", "MR-01", 3.8, 35),
    ("DIGHA_GHAT", "ASHOK_RAJPATH", "MR-01", 4.6, 30),
]


def haversine_distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate great circle distance between two points in km."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def find_nearest_node(lat: float, lng: float) -> str:
    """Find the closest topological node to given coordinates."""
    best_node = "PATNA_JN"
    min_dist = float("inf")
    for node_id, data in PATNA_NODES.items():
        dist = haversine_distance_km(lat, lng, data["lat"], data["lng"])
        if dist < min_dist:
            min_dist = dist
            best_node = node_id
    return best_node


def calculate_edge_weight(
    u: str,
    v: str,
    road_id: str,
    base_dist_km: float,
    base_speed_kmh: float,
    roads_dict: dict[str, Road],
    avoid_flooded: bool = True,
    vehicle_type: str = "Rescue Van",
) -> tuple[float, float, float, str, bool]:
    """
    Calculate dynamic edge transit cost and flood hazard rating.
    Returns: (weight, travel_time_sec, water_depth_cm, risk_level, is_safe)
    """
    road = roads_dict.get(road_id)
    depth_cm = road.depth_cm if road else 0.0
    velocity_ms = road.velocity_ms if road else 0.0
    is_closed = road.is_closed if road else False
    risk_level = road.risk_level if road else "LOW"

    # Determine vehicle clearance threshold
    max_safe_depth_cm = 30.0
    if vehicle_type in ["Inflatable Boat", "Motor Boat"]:
        max_safe_depth_cm = 100.0  # Boats tolerate deep water
    elif vehicle_type in ["4x4", "Amphibious", "High-Clearance Truck"]:
        max_safe_depth_cm = 50.0
    elif vehicle_type in ["Light Vehicle", "Ambulance"]:
        max_safe_depth_cm = 20.0

    # Base travel time in seconds
    base_time_sec = (base_dist_km / base_speed_kmh) * 3600

    # Safety check
    is_safe = True
    if is_closed or depth_cm > max_safe_depth_cm:
        is_safe = False

    # Dynamic weight calculation (Penalized travel cost)
    if not avoid_flooded:
        weight = base_time_sec * (1.0 + (depth_cm / 50.0) * 0.5)
        return weight, base_time_sec, depth_cm, risk_level, is_safe

    # If avoiding flooded / closed roads:
    if is_closed:
        weight = base_time_sec * 1000.0  # Massive penalty
    elif depth_cm > max_safe_depth_cm:
        # Exponential penalty for water depth above safe threshold
        depth_overshoot = depth_cm - max_safe_depth_cm
        weight = base_time_sec * (20.0 + depth_overshoot * 5.0)
    elif depth_cm > 15.0:
        # Moderate slowdown for shallow water
        weight = base_time_sec * (1.5 + (depth_cm / 15.0) + (velocity_ms * 2.0))
    else:
        weight = base_time_sec

    return weight, base_time_sec, depth_cm, risk_level, is_safe


def build_routing_response(
    req: RouteRequest,
    roads_list: list[Road],
) -> RouteResponse:
    """Compute primary safe route and alternative detour route."""
    roads_dict = {r.id: r for r in roads_list}

    # Find nearest graph entry and exit nodes
    start_node = find_nearest_node(req.origin.lat, req.origin.lng)
    end_node = find_nearest_node(req.destination.lat, req.destination.lng)

    # 1. Build Flood-Aware Graph
    G_safe = nx.Graph()
    G_direct = nx.Graph()

    for u, v, road_id, dist_km, speed_kmh in ROAD_EDGES:
        weight_safe, t_sec, depth, risk, safe = calculate_edge_weight(
            u, v, road_id, dist_km, speed_kmh, roads_dict, avoid_flooded=True, vehicle_type=req.vehicle_type
        )
        weight_direct, _, _, _, _ = calculate_edge_weight(
            u, v, road_id, dist_km, speed_kmh, roads_dict, avoid_flooded=False, vehicle_type=req.vehicle_type
        )

        edge_attrs = {
            "road_id": road_id,
            "dist_km": dist_km,
            "base_time_sec": t_sec,
            "depth_cm": depth,
            "risk_level": risk,
            "is_safe": safe,
            "weight": weight_safe,
        }
        G_safe.add_edge(u, v, **edge_attrs)

        edge_attrs_direct = dict(edge_attrs)
        edge_attrs_direct["weight"] = weight_direct
        G_direct.add_edge(u, v, **edge_attrs_direct)

    # Calculate paths
    try:
        if start_node == end_node:
            path_safe = [start_node]
        else:
            path_safe = nx.shortest_path(G_safe, source=start_node, target=end_node, weight="weight")
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        path_safe = [start_node, end_node]

    try:
        if start_node == end_node:
            path_alt = [start_node]
        else:
            path_alt = nx.shortest_path(G_direct, source=start_node, target=end_node, weight="weight")
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        path_alt = path_safe

    # Helper to generate route option from node path
    def generate_option(path: list[str], title: str, is_primary: bool) -> RouteOption:
        coords: list[list[float]] = [[req.origin.lng, req.origin.lat]]
        steps: list[RouteStep] = []
        total_dist_km = 0.0
        total_time_s = 0.0
        max_depth = 0.0
        hazards = 0
        warnings: list[str] = []

        if len(path) == 1:
            node_data = PATNA_NODES[path[0]]
            coords.append([node_data["lng"], node_data["lat"]])
            coords.append([req.destination.lng, req.destination.lat])
            total_dist_km = haversine_distance_km(req.origin.lat, req.origin.lng, req.destination.lat, req.destination.lng)
            eta_min = max(1, int(total_dist_km * 2.5))
            steps.append(
                RouteStep(
                    instruction=f"Proceed directly to {node_data['name']}",
                    road_name=node_data["name"],
                    distance_m=round(total_dist_km * 1000, 1),
                    duration_s=round(eta_min * 60, 1),
                    depth_cm=0.0,
                    risk_level="LOW",
                    is_safe=True,
                )
            )
            return RouteOption(
                route_id="route_direct",
                title=title,
                total_distance_km=round(total_dist_km, 2),
                eta_min=eta_min,
                max_depth_cm=0.0,
                risk_level="LOW",
                safety_rating="SAFE",
                coordinates=coords,
                steps=steps,
                warnings=[],
            )

        for i in range(len(path) - 1):
            u_node = path[i]
            v_node = path[i + 1]
            u_data = PATNA_NODES[u_node]
            v_data = PATNA_NODES[v_node]

            edge_data = G_safe.get_edge_data(u_node, v_node) or {}
            road_id = edge_data.get("road_id", "CORRIDOR")
            road = roads_dict.get(road_id)
            road_name = road.name if road else f"{u_data['name']} to {v_data['name']}"
            depth = edge_data.get("depth_cm", 0.0)
            risk = edge_data.get("risk_level", "LOW")
            safe = edge_data.get("is_safe", True)
            d_km = edge_data.get("dist_km", 2.0)

            total_dist_km += d_km
            total_time_s += edge_data.get("base_time_sec", 180.0)
            if depth > max_depth:
                max_depth = depth

            if not safe:
                hazards += 1
                warnings.append(f"Caution: {road_name} has {depth:.0f}cm water depth ({risk} risk)")

            coords.append([u_data["lng"], u_data["lat"]])
            coords.append([v_data["lng"], v_data["lat"]])

            steps.append(
                RouteStep(
                    instruction=f"Take {road_name} towards {v_data['name']}",
                    road_name=road_name,
                    distance_m=round(d_km * 1000, 1),
                    duration_s=round(d_km * 100, 1),
                    depth_cm=round(depth, 1),
                    risk_level=risk,
                    is_safe=safe,
                )
            )

        coords.append([req.destination.lng, req.destination.lat])

        # Overall safety score
        if hazards > 0 or max_depth > 30:
            overall_safety = "HAZARDOUS" if max_depth > 40 else "CAUTION"
            overall_risk = "SEVERE" if max_depth > 40 else "HIGH"
        elif max_depth > 15:
            overall_safety = "CAUTION"
            overall_risk = "MODERATE"
        else:
            overall_safety = "SAFE"
            overall_risk = "LOW"

        eta_min = max(2, int(total_time_s / 60))

        return RouteOption(
            route_id=f"route_{'safe' if is_primary else 'alt'}",
            title=title,
            total_distance_km=round(total_dist_km, 2),
            eta_min=eta_min,
            max_depth_cm=round(max_depth, 1),
            risk_level=overall_risk,
            safety_rating=overall_safety,
            coordinates=coords,
            steps=steps,
            warnings=warnings,
        )

    primary = generate_option(path_safe, "Primary Safe Route (Flood-Avoidant)", True)
    alt = generate_option(path_alt, "Alternative Direct Corridor", False)

    return RouteResponse(
        primary_route=primary,
        alternative_route=alt if path_alt != path_safe else None,
        recommended_shelter_id="SH-03",
        calculated_at=datetime.utcnow().strftime("%H:%M:%S UTC"),
    )
