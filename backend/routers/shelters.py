"""
API router for Emergency Shelters, Relief Camps, and Capacity Monitoring.

Endpoints:
  GET   /api/v1/shelters                 → All evacuation shelters
  GET   /api/v1/shelters/safe            → Safe shelters with open capacity
  GET   /api/v1/shelters/{id}            → Shelter facility profile & supplies
  PATCH /api/v1/shelters/{id}/occupancy  → Update shelter occupancy headcount
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Shelter
from schemas import ShelterOut, ShelterOccupancyUpdateRequest

router = APIRouter(prefix="/api/v1/shelters", tags=["Evacuation Shelters"])


def shelter_to_out(s: Shelter) -> ShelterOut:
    """Convert SQLAlchemy Shelter model to Pydantic schema."""
    return ShelterOut(
        id=s.id,
        name=s.name,
        address=s.address,
        capacity=s.capacity,
        occupancy=s.occupancy,
        status=s.status,
        floodRisk=s.flood_risk,
        distanceKm=s.distance_km,
        etaMin=s.eta_min,
        medical=s.medical,
        food=s.food,
        water=s.water,
        power=s.power,
        accessibility=s.accessibility,
        lastUpdated=s.last_updated,
        recommended=s.recommended,
        lat=s.lat,
        lng=s.lng,
    )


@router.get("", response_model=list[ShelterOut])
async def get_all_shelters(db: AsyncSession = Depends(get_db)):
    """Fetch all registered flood relief shelters and capacity statuses."""
    result = await db.execute(select(Shelter).order_by(Shelter.distance_km.asc()))
    shelters = result.scalars().all()
    return [shelter_to_out(s) for s in shelters]


@router.get("/safe", response_model=list[ShelterOut])
async def get_safe_shelters(
    max_risk: str = Query("MODERATE", description="Max acceptable flood risk (LOW, MODERATE)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch only shelters that are safe from inundation with available capacity.
    Filtered by flood risk level and status != FULL / UNAVAILABLE.
    """
    acceptable_risks = ["LOW"] if max_risk.upper() == "LOW" else ["LOW", "MODERATE"]

    result = await db.execute(
        select(Shelter).where(
            Shelter.flood_risk.in_(acceptable_risks),
            Shelter.status.in_(["OPEN", "NEAR_FULL"]),
        ).order_by(Shelter.recommended.desc(), Shelter.distance_km.asc())
    )
    shelters = result.scalars().all()
    return [shelter_to_out(s) for s in shelters]


@router.get("/{shelter_id}", response_model=ShelterOut)
async def get_shelter(shelter_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch single shelter profile and life-support supply inventory."""
    result = await db.execute(select(Shelter).where(Shelter.id == shelter_id))
    shelter = result.scalar_one_or_none()
    if not shelter:
        raise HTTPException(status_code=404, detail=f"Shelter {shelter_id} not found")
    return shelter_to_out(shelter)


@router.patch("/{shelter_id}/occupancy", response_model=ShelterOut)
async def update_shelter_occupancy(
    shelter_id: str,
    body: ShelterOccupancyUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update live shelter headcount and recalculate status."""
    result = await db.execute(select(Shelter).where(Shelter.id == shelter_id))
    shelter = result.scalar_one_or_none()
    if not shelter:
        raise HTTPException(status_code=404, detail=f"Shelter {shelter_id} not found")

    shelter.occupancy = max(0, body.occupancy)

    # Automatic status calculation if not explicitly provided
    if body.status:
        shelter.status = body.status.upper()
    else:
        util_pct = (shelter.occupancy / shelter.capacity) * 100.0 if shelter.capacity > 0 else 100.0
        if util_pct >= 100.0:
            shelter.status = "FULL"
        elif util_pct >= 85.0:
            shelter.status = "NEAR_FULL"
        else:
            shelter.status = "OPEN"

    shelter.last_updated = "Just now"
    shelter.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(shelter)
    return shelter_to_out(shelter)
