"""
API router for Citizen SOS Distress Ingestion, Priority Triage, and Rescue Dispatch.

Endpoints:
  GET   /api/v1/sos           → List all SOS incidents (with optional status filter)
  GET   /api/v1/sos/priority  → Prioritized triage queue sorted by life-safety urgency
  GET   /api/v1/sos/{id}      → Full incident details with audit history
  POST  /api/v1/sos           → Intake citizen SOS distress alert
  PATCH /api/v1/sos/{id}      → Transition incident lifecycle status
  POST  /api/v1/rescue/assign → Dispatch/assign a rescue unit to an incident
"""

from datetime import datetime
import random
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import SOSIncident, RescueTeam, Alert
from schemas import (
    SOSIncidentOut,
    SOSCreateRequest,
    SOSStatusUpdateRequest,
    SOSAssignRequest,
    TimestampItem,
)

router = APIRouter(prefix="/api/v1", tags=["Emergency SOS & Dispatch"])


def sos_to_out(item: SOSIncident) -> SOSIncidentOut:
    """Convert SQLAlchemy model to Pydantic schema."""
    ts_list = []
    if item.timestamps and isinstance(item.timestamps, list):
        for t in item.timestamps:
            if isinstance(t, dict):
                ts_list.append(TimestampItem(status=t.get("status", ""), time=t.get("time", "")))

    return SOSIncidentOut(
        id=item.id,
        priority=item.priority,
        location=item.location,
        people=item.people,
        children=item.children,
        elderly=item.elderly,
        medical=item.medical,
        waterDepthM=item.water_depth_m,
        waitingMin=item.waiting_min,
        status=item.status,
        floodRisk=item.flood_risk,
        lat=item.lat,
        lng=item.lng,
        timestamps=ts_list,
        assignedTeam=item.assigned_team,
        contact_phone=item.contact_phone,
    )


def _id_variants(incident_id: str) -> list[str]:
    """Support both '#10284' and '10284' interchangeably."""
    cleaned = incident_id.replace("%23", "#").strip()
    with_hash = cleaned if cleaned.startswith("#") else f"#{cleaned}"
    without_hash = cleaned.lstrip("#")
    return list(set([cleaned, with_hash, without_hash]))


@router.get("/sos", response_model=list[SOSIncidentOut])
async def get_sos_incidents(
    status: str | None = Query(None, description="Filter by status (RECEIVED, VERIFIED, EN_ROUTE, etc.)"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all SOS incidents with optional status filtering."""
    query = select(SOSIncident)
    if status:
        query = query.where(SOSIncident.status == status.upper())
    result = await db.execute(query.order_by(SOSIncident.created_at.desc()))
    incidents = result.scalars().all()
    return [sos_to_out(i) for i in incidents]


@router.get("/sos/priority", response_model=list[SOSIncidentOut])
async def get_sos_prioritized_queue(db: AsyncSession = Depends(get_db)):
    """
    Return active SOS queue ranked by urgency:
    Priority order: CRITICAL > HIGH > MODERATE, then by waiting time descending.
    """
    result = await db.execute(
        select(SOSIncident).where(SOSIncident.status != "CLOSED")
    )
    incidents = result.scalars().all()

    priority_weight = {"CRITICAL": 3, "HIGH": 2, "MODERATE": 1}

    sorted_incidents = sorted(
        incidents,
        key=lambda i: (
            priority_weight.get(i.priority, 0),
            i.medical,
            i.children + i.elderly,
            i.water_depth_m,
            i.waiting_min,
        ),
        reverse=True,
    )
    return [sos_to_out(i) for i in sorted_incidents]


@router.get("/sos/{incident_id}", response_model=SOSIncidentOut)
async def get_sos_detail(incident_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch complete details and audit trail for an SOS incident."""
    variants = _id_variants(incident_id)
    result = await db.execute(select(SOSIncident).where(SOSIncident.id.in_(variants)))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail=f"SOS Incident {incident_id} not found")
    return sos_to_out(incident)


@router.post("/sos", response_model=SOSIncidentOut)
async def create_sos_alert(body: SOSCreateRequest, db: AsyncSession = Depends(get_db)):
    """
    Citizen/Field intake: Submit a new SOS distress signal.
    Automatically assigns ID, calculates initial priority score, and logs system audit trail.
    """
    now_str = datetime.utcnow().strftime("%H:%M")
    rand_id = f"#{random.randint(10300, 10999)}"

    priority = "MODERATE"
    if body.medical or body.water_depth_m >= 1.0 or (body.children + body.elderly >= 2):
        priority = "CRITICAL"
    elif body.water_depth_m >= 0.5 or body.people >= 3 or body.children > 0 or body.elderly > 0:
        priority = "HIGH"

    flood_risk = "SEVERE" if body.water_depth_m >= 0.8 else "HIGH" if body.water_depth_m >= 0.4 else "MODERATE"

    initial_timestamps = [
        {"status": "SOS received", "time": now_str},
    ]

    new_sos = SOSIncident(
        id=rand_id,
        priority=priority,
        location=body.location,
        lat=body.lat,
        lng=body.lng,
        people=body.people,
        children=body.children,
        elderly=body.elderly,
        medical=body.medical,
        contact_phone=body.contact_phone,
        water_depth_m=body.water_depth_m,
        waiting_min=1,
        status="RECEIVED",
        flood_risk=flood_risk,
        assigned_team=None,
        timestamps=initial_timestamps,
    )
    db.add(new_sos)

    # Generate operational alert broadcast
    alert = Alert(
        id=f"a-{rand_id.lstrip('#')}",
        type="CRITICAL" if priority == "CRITICAL" else "WARNING",
        title=f"New SOS — {body.location} ({rand_id})",
        message=f"{body.people} people trapped (Water: {body.water_depth_m}m). Medical: {'YES' if body.medical else 'NO'}.",
        time=now_str,
        read=False,
    )
    db.add(alert)

    await db.commit()
    await db.refresh(new_sos)
    return sos_to_out(new_sos)


@router.patch("/sos/{incident_id}", response_model=SOSIncidentOut)
async def update_sos_status(
    incident_id: str,
    body: SOSStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Transition the lifecycle status of an SOS incident."""
    variants = _id_variants(incident_id)
    result = await db.execute(select(SOSIncident).where(SOSIncident.id.in_(variants)))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail=f"SOS Incident {incident_id} not found")

    new_status = body.status.upper()
    now_str = datetime.utcnow().strftime("%H:%M")

    # Update audit timestamps
    ts = list(incident.timestamps or [])
    status_label_map = {
        "VERIFIED": "Location verified",
        "ASSIGNED": "Team assigned",
        "EN_ROUTE": "Team en route",
        "ON_SCENE": "Team arrived on scene",
        "RESCUED": "Citizens rescued & safe",
        "CLOSED": "Incident resolved & closed",
    }
    label = body.note or status_label_map.get(new_status, f"Status updated to {new_status}")
    ts.append({"status": label, "time": now_str})

    incident.status = new_status
    incident.timestamps = ts
    incident.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(incident)
    return sos_to_out(incident)


@router.post("/rescue/assign")
async def assign_rescue_team(body: SOSAssignRequest, db: AsyncSession = Depends(get_db)):
    """Dispatch/assign a rescue response team to a target SOS incident."""
    variants = _id_variants(body.incident_id)
    sos_res = await db.execute(select(SOSIncident).where(SOSIncident.id.in_(variants)))
    sos = sos_res.scalar_one_or_none()
    if not sos:
        raise HTTPException(status_code=404, detail=f"SOS Incident {body.incident_id} not found")

    team_res = await db.execute(select(RescueTeam).where(RescueTeam.id == body.team_id))
    team = team_res.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail=f"Rescue Team {body.team_id} not found")

    now_str = datetime.utcnow().strftime("%H:%M")

    # Update SOS
    sos.assigned_team = team.id
    sos.status = "ASSIGNED"
    ts = list(sos.timestamps or [])
    ts.append({"status": f"Assigned to {team.name}", "time": now_str})
    sos.timestamps = ts

    # Update Team
    team.status = "EN_ROUTE"
    team.assigned_sos = sos.id
    team.updated_at = datetime.utcnow()

    await db.commit()

    return {
        "success": True,
        "message": f"{team.name} assigned to SOS {sos.id}",
        "sos_id": sos.id,
        "team_id": team.id,
        "team_status": team.status,
        "eta_min": team.eta_min,
    }
