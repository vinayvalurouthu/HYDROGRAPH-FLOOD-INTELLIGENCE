"""
API router for Urban Drainage Network Telemetry and Hydraulic Anomaly Detection.

Endpoints:
  GET /api/v1/drainage/status     → Overall network hydraulic load and node statuses
  GET /api/v1/drainage/anomalies  → Detected hydraulic bottlenecks, blockages, and backflow
  GET /api/v1/drainage/nodes/{id} → Single drainage junction telemetry
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import DrainageNode
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
