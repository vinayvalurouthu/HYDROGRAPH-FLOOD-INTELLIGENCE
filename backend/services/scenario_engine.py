"""
HydroGraph Hydrodynamic Scenario Simulation Engine.

Evaluates what-if urban flooding scenarios across rainfall intensifications,
drainage pump/inlet clogging failures, and Ganges river flood stages.
"""

from schemas import ScenarioRequest, ScenarioResultOut
from models import Road


BASELINE_FLOODED_AREA_PCT = 34
BASELINE_SOS_EXPOSURE_PCT = 42


def run_hydrodynamic_simulation(
    params: ScenarioRequest,
    roads: list[Road],
) -> ScenarioResultOut:
    """
    Run non-linear hydrodynamic simulation under perturbed atmospheric and hydrologic conditions.
    """
    rain_factor = params.rainfall_pct / 100.0
    drain_factor = 1.0 - (params.drainage_pct / 100.0)
    sluice_factor = 1.0 - (params.sluice_gate_open_pct / 100.0)

    river_multipliers = {
        "NORMAL": 1.0,
        "WARNING": 1.15,
        "DANGER": 1.30,
        "EXTREME": 1.55,
    }
    river_mult = river_multipliers.get(params.river_level.upper(), 1.0)

    # Composite deltas
    flooded_roads_delta = int(
        round((rain_factor - 1.0) * 10 + drain_factor * 7 + (river_mult - 1.0) * 8 + sluice_factor * 4)
    )
    peak_depth_delta_cm = int(
        round((rain_factor - 1.0) * 16 + drain_factor * 12 + (river_mult - 1.0) * 14 + sluice_factor * 6)
    )
    flooded_area_pct = min(
        95,
        max(
            5,
            int(
                round(
                    BASELINE_FLOODED_AREA_PCT
                    + flooded_roads_delta * 1.3
                    + peak_depth_delta_cm * 0.45
                )
            ),
        ),
    )
    time_to_flood_delta_min = int(
        round(-(rain_factor - 1.0) * 12 - drain_factor * 8 - (river_mult - 1.0) * 10)
    )
    affected_shelters_delta = max(0, int(round(flooded_roads_delta * 0.15 + (river_mult - 1.0) * 2)))
    sos_exposure_pct = min(
        98,
        max(
            10,
            int(
                round(
                    BASELINE_SOS_EXPOSURE_PCT
                    + flooded_roads_delta * 0.9
                    + peak_depth_delta_cm * 0.35
                )
            ),
        ),
    )

    # Determine which road segments become high risk under this scenario
    high_risk_roads = []
    for road in roads:
        simulated_depth = (
            road.depth_cm * rain_factor
            + (drain_factor * 15.0)
            + ((river_mult - 1.0) * 18.0)
        )
        if simulated_depth >= 30.0 or road.risk_level in ["HIGH", "SEVERE"]:
            high_risk_roads.append(road.id)

    # Narrative summary
    if flooded_roads_delta > 5 or river_mult > 1.2:
        severity_tag = "CRITICAL INUNDATION"
        summary = (
            f"Scenario predicts severe citywide inundation (+{flooded_roads_delta} flooded roads, "
            f"+{peak_depth_delta_cm}cm peak depth). Immediate pre-emptive evacuation and sluice activation recommended."
        )
    elif flooded_roads_delta > 0:
        severity_tag = "ELEVATED FLOOD RISK"
        summary = (
            f"Moderate water buildup (+{flooded_roads_delta} roads affected). "
            f"Pumping stations in Kankarbagh and Bailey Road should increase discharge."
        )
    else:
        severity_tag = "NOMINAL RESILIENCE"
        summary = (
            "System maintains stable drainage capacity with manageable surface runoff."
        )

    return ScenarioResultOut(
        floodedRoadsDelta=flooded_roads_delta,
        peakDepthDeltaCm=peak_depth_delta_cm,
        floodedAreaPct=flooded_area_pct,
        timeToFloodDeltaMin=time_to_flood_delta_min,
        affectedSheltersDelta=affected_shelters_delta,
        sosExposurePct=sos_exposure_pct,
        high_risk_roads=high_risk_roads[:8],
        impact_summary=f"[{severity_tag}] {summary}",
    )
