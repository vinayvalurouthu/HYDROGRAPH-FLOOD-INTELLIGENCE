"""
API router for Rescue Teams, Field Units, and Vehicle Fleet tracking.

Endpoints:
  GET   /api/v1/rescue/teams       → List all rescue units (with status filter)
  GET   /api/v1/rescue/teams/{id}  → Single rescue team profile
  PATCH /api/v1/rescue/teams/{id}  → Update status, GPS coordinates, or assigned task
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import RescueTeam
from schemas import RescueTeamOut, RescueTeamUpdateRequest

router = APIRouter(prefix="/api/v1/rescue", tags=["Rescue Fleet & Teams"])


def team_to_out(team: RescueTeam) -> RescueTeamOut:
    """Map SQLAlchemy RescueTeam model to Pydantic schema."""
    return RescueTeamOut(
        id=team.id,
        name=team.name,
        status=team.status,
        distanceKm=team.distance_km,
        etaMin=team.eta_min,
        vehicle=team.vehicle,
        capacity=team.capacity,
        routeSafety=team.route_safety,
        assignedSOS=team.assigned_sos,
        lat=team.lat,
        lng=team.lng,
        contact_phone=team.contact_phone,
    )


@router.get("/teams", response_model=list[RescueTeamOut])
async def get_rescue_teams(
    status: str | None = Query(None, description="Filter by status (AVAILABLE, EN_ROUTE, ON_SCENE, etc.)"),
    db: AsyncSession = Depends(get_db),
):
    """List all deployed and standby rescue teams."""
    query = select(RescueTeam)
    if status:
        query = query.where(RescueTeam.status == status.upper())
    result = await db.execute(query.order_by(RescueTeam.eta_min.asc()))
    teams = result.scalars().all()
    return [team_to_out(t) for t in teams]


@router.get("/teams/{team_id}", response_model=RescueTeamOut)
async def get_rescue_team(team_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch details for a specific rescue unit."""
    result = await db.execute(select(RescueTeam).where(RescueTeam.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail=f"Rescue team {team_id} not found")
    return team_to_out(team)


@router.patch("/teams/{team_id}", response_model=RescueTeamOut)
async def update_rescue_team(
    team_id: str,
    body: RescueTeamUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update rescue team status, live location coordinates, or SOS assignment."""
    result = await db.execute(select(RescueTeam).where(RescueTeam.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail=f"Rescue team {team_id} not found")

    if body.status:
        team.status = body.status.upper()
    if body.lat is not None:
        team.lat = body.lat
    if body.lng is not None:
        team.lng = body.lng
    if body.assigned_sos is not None:
        team.assigned_sos = body.assigned_sos if body.assigned_sos != "" else None

    team.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(team)
    return team_to_out(team)
