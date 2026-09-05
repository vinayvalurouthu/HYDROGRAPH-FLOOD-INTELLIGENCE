"""
API router for Urban Drainage Network Telemetry and Hydraulic Anomaly Detection.

Endpoints:
  GET /api/v1/drainage/status     → Overall network hydraulic load and node statuses
  GET /api/v1/drainage/anomalies  → Detected hydraulic bottlenecks, blockages, and backflow
  GET /api/v1/drainage/nodes/{id} → Single drainage junction telemetry
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import DrainageNode, SOSIncident, RescueTeam, Alert
from schemas import (
    DrainageNodeOut,
    DrainageStatusOut,
    DrainageAnomalyOut,
)

router = APIRouter(prefix="/api/v1/drainage", tags=["Drainage & Hydraulic Telemetry"])


def node_to_out(node: DrainageNode) -> DrainageNodeOut:
    """Map SQLAlchemy model to Pydantic DrainageNodeOut."""
    return DrainageNodeOut(
        id=node.id,
        name=node.name,
        utilizationPct=node.utilization_pct,
        capacityLs=node.capacity_ls,
        flowLs=node.flow_ls,
        status=node.status,
        anomaly=node.anomaly,
        confidencePct=node.confidence_pct,
        lat=node.lat,
        lng=node.lng,
        x=node.x,
        y=node.y,
    )


@router.get("/status", response_model=DrainageStatusOut)
async def get_drainage_status(db: AsyncSession = Depends(get_db)):
    """Network-wide summary of drainage health and hydraulic loading."""
    result = await db.execute(select(DrainageNode).order_by(DrainageNode.utilization_pct.desc()))
    nodes = result.scalars().all()

    total = len(nodes)
    critical = sum(1 for n in nodes if n.status == "CRITICAL" or n.utilization_pct >= 95.0)
    stressed = sum(1 for n in nodes if n.status == "STRESSED" or (75.0 <= n.utilization_pct < 95.0))
    avg_util = sum(n.utilization_pct for n in nodes) / total if total > 0 else 0.0

    return DrainageStatusOut(
        total_nodes=total,
        critical_nodes=critical,
        stressed_nodes=stressed,
        avg_utilization_pct=round(avg_util, 1),
        nodes=[node_to_out(n) for n in nodes],
    )


@router.get("/anomalies", response_model=list[DrainageAnomalyOut])
async def get_drainage_anomalies(db: AsyncSession = Depends(get_db)):
    """Fetch all drainage nodes currently experiencing hydraulic anomalies."""
    result = await db.execute(
        select(DrainageNode).where(DrainageNode.anomaly.isnot(None))
    )
    nodes = result.scalars().all()

    anomalies = []
    for n in nodes:
        if n.anomaly:
            severity = "CRITICAL" if n.status == "CRITICAL" or n.utilization_pct >= 95.0 else "WARNING"
            anomaly_type = (
                "Capacity Exceeded" if n.utilization_pct >= 100.0 else
                "Inlet Clog / Sediment" if "clog" in n.anomaly.lower() or "reduction" in n.anomaly.lower() else
                "Hydraulic Backflow" if "backflow" in n.anomaly.lower() else "Hydraulic Stress"
            )
            anomalies.append(
                DrainageAnomalyOut(
                    node_id=n.id,
                    node_name=n.name,
                    severity=severity,
                    anomaly_type=anomaly_type,
                    description=n.anomaly,
                    utilization_pct=n.utilization_pct,
                    confidence_pct=n.confidence_pct,
                )
            )

    return sorted(anomalies, key=lambda a: a.utilization_pct, reverse=True)


@router.get("/nodes/{node_id}", response_model=DrainageNodeOut)
async def get_drainage_node(node_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch individual drainage monitoring junction profile."""
    result = await db.execute(select(DrainageNode).where(DrainageNode.id == node_id))
    node = result.scalar_one_or_none()
    if not node:
        raise HTTPException(status_code=404, detail=f"Drainage node {node_id} not found")
    return node_to_out(node)


@router.post("/nodes/{node_id}/inspect")
async def request_field_inspection(node_id: str, db: AsyncSession = Depends(get_db)):
    """Dispatch municipal field inspection team to clear drainage node."""
    result = await db.execute(select(DrainageNode).where(DrainageNode.id == node_id))
    node = result.scalar_one_or_none()
    if not node:
        raise HTTPException(status_code=404, detail=f"Drainage node {node_id} not found")

    sos_id = f"INSP-{node.id}"
    now_time = datetime.utcnow().strftime("%H:%M")

    # 1. Create or update an emergency dispatch incident for Rescue Teams
    existing_sos = await db.execute(select(SOSIncident).where(SOSIncident.id == sos_id))
    sos = existing_sos.scalar_one_or_none()
    if not sos:
        sos = SOSIncident(
            id=sos_id,
            priority="CRITICAL" if node.status == "CRITICAL" else "HIGH",
            location=f"Drainage Junction {node.name}",
            lat=node.lat,
            lng=node.lng,
            people=0,
            children=0,
            elderly=0,
            medical=False,
            water_depth_m=round(node.flow_ls / 100.0, 2),
            waiting_min=1,
            status="ASSIGNED",
            flood_risk=node.status if node.status in ["LOW", "MODERATE", "HIGH", "SEVERE"] else "HIGH",
            assigned_team="RT-04",
            timestamps=[
                {"status": "Drainage Inspection Dispatched", "time": now_time},
                {"status": "Clearance Team En Route", "time": now_time},
            ],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(sos)
    else:
        sos.status = "ASSIGNED"
        sos.assigned_team = "RT-04"
        sos.updated_at = datetime.utcnow()

    # 2. Dispatch available or dedicated rescue team (RT-04 / RT-01)
    team_result = await db.execute(
        select(RescueTeam).where(
            (RescueTeam.id == "RT-04") | (RescueTeam.status == "AVAILABLE")
        ).limit(1)
    )
    team = team_result.scalar_one_or_none()
    if team:
        team.status = "EN_ROUTE"
        team.assigned_sos = sos_id
        team.eta_min = 12
        team.updated_at = datetime.utcnow()

    # 3. Raise immediate operational alert
    import uuid
    alert_id = f"ALT-{uuid.uuid4().hex[:6]}"
    alert = Alert(
        id=alert_id,
        type="CRITICAL" if node.status == "CRITICAL" else "WARNING",
        title=f"URGENT DISPATCH: {node.name}",
        message=f"Rescue & Clearance Unit assigned to drainage junction {node.id}. Operational state: {node.status}.",
        time="Just now",
        read=False,
        created_at=datetime.utcnow(),
    )
    db.add(alert)

    await db.commit()

    return {
        "status": "success",
        "node_id": node.id,
        "node_name": node.name,
        "action": "FIELD_INSPECTION_DISPATCHED",
        "assigned_sos": sos_id,
        "assigned_team": team.id if team else "RT-04",
        "message": f"Field inspection team dispatched for junction {node.name} ({node.id}). Priority route assigned.",
    }


