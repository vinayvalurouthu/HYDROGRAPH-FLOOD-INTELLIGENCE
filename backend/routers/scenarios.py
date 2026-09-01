"""
API router for Hydrodynamic Scenario Simulation & What-If Disaster Modeling.

Endpoints:
  POST /api/v1/scenario/run      → Run multi-factor hydrodynamic simulation
  GET  /api/v1/scenario/presets  → Standard benchmark scenario presets
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Road
from schemas import ScenarioRequest, ScenarioResultOut
from services.scenario_engine import run_hydrodynamic_simulation

router = APIRouter(prefix="/api/v1/scenario", tags=["Scenario Simulation"])


@router.post("/run", response_model=ScenarioResultOut)
async def run_scenario(
    body: ScenarioRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Simulate hydrodynamic propagation across Patna under altered hydrometeorological parameters.
    Calculates deltas for flooded roads, peak depth, inundated area %, shelter risk, and SOS exposure.
    """
    result = await db.execute(select(Road))
    roads = result.scalars().all()

    return run_hydrodynamic_simulation(body, list(roads))


@router.get("/presets")
async def get_scenario_presets():
    """Return pre-built disaster scenarios for rapid municipal tabletop exercises."""
    return [
        {
            "id": "preset_cloudburst",
            "name": "Intense Cloudburst (+50% Rainfall)",
            "description": "Sudden high-intensity convective rainfall exceeding 115 mm/hr across central Patna.",
            "params": {
                "rainfall_pct": 150,
                "drainage_pct": 100,
                "river_level": "WARNING",
                "sluice_gate_open_pct": 100,
            },
        },
        {
            "id": "preset_drain_failure",
            "name": "Drainage Pump Station Failure (50% Outfall)",
            "description": "Mechanical failure at Kankarbagh & Saidpur outfall pumping stations during peak storm.",
            "params": {
                "rainfall_pct": 100,
                "drainage_pct": 50,
                "river_level": "NORMAL",
                "sluice_gate_open_pct": 60,
            },
        },
        {
            "id": "preset_ganges_flood",
            "name": "Ganges River Extreme Stage + Backflow",
            "description": "Ganges river exceeds high danger mark (50.5m MSL), causing gravity drainage closure.",
            "params": {
                "rainfall_pct": 120,
                "drainage_pct": 70,
                "river_level": "EXTREME",
                "sluice_gate_open_pct": 20,
            },
        },
        {
            "id": "preset_catastrophic",
            "name": "Super Cyclone Residual (+80% Rain, Extreme River)",
            "description": "Compound catastrophic event: extreme precipitation coupled with river surge.",
            "params": {
                "rainfall_pct": 180,
                "drainage_pct": 40,
                "river_level": "EXTREME",
                "sluice_gate_open_pct": 30,
            },
        },
    ]
