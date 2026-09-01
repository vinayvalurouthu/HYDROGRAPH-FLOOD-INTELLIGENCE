"""
API router for Flood-Aware Routing and Emergency Evacuation Navigation.

Endpoints:
  POST /api/v1/route           → Calculate safe, flood-penalized path between two coordinates
  GET  /api/v1/routes/presets  → Pre-configured emergency origin-destination scenarios
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Road
from schemas import RouteRequest, RouteResponse
from services.routing_engine import build_routing_response

router = APIRouter(prefix="/api/v1", tags=["Flood-Aware Routing"])


@router.post("/route", response_model=RouteResponse)
async def calculate_route(
    req: RouteRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Compute optimal safe emergency route avoiding high-water inundation zones and road closures.
    Returns primary safe path, alternative corridor, step-by-step turn guidance, and hazard warnings.
    """
    result = await db.execute(select(Road))
    roads = result.scalars().all()

    return build_routing_response(req, list(roads))


@router.get("/routes/presets")
async def get_routing_presets():
    """Return pre-configured emergency transit corridors for interactive demonstration."""
    return [
        {
            "id": "preset-1",
            "name": "Patna Junction to Sports Complex East Shelter",
            "origin": {"name": "Patna Junction", "lat": 25.6020, "lng": 85.1376},
            "destination": {"name": "Sports Complex East (SH-03)", "lat": 25.5990, "lng": 85.1600},
            "vehicle": "Rescue Van",
            "avoid_flooded": True,
        },
        {
            "id": "preset-2",
            "name": "Bailey Road Inundation Bypass to PMCH Hospital",
            "origin": {"name": "Bailey Road West", "lat": 25.6120, "lng": 85.0850},
            "destination": {"name": "PMCH Medical Center", "lat": 25.6210, "lng": 85.1550},
            "vehicle": "Ambulance",
            "avoid_flooded": True,
        },
        {
            "id": "preset-3",
            "name": "Danapur Station to Central School Relief Center",
            "origin": {"name": "Danapur Station", "lat": 25.6270, "lng": 85.0420},
            "destination": {"name": "Central School (SH-01)", "lat": 25.6110, "lng": 85.1300},
            "vehicle": "High-Clearance Truck",
            "avoid_flooded": True,
        },
    ]
