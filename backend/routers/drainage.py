"""
API router for Urban Drainage Network Telemetry and Hydraulic Anomaly Detection.

Endpoints:
  GET /api/v1/drainage/status     → Overall network hydraulic load and node statuses
  GET /api/v1/drainage/anomalies  → Detected hydraulic bottlenecks, blockages, and backflow
  GET /api/v1/drainage/nodes/{id} → Single drainage junction telemetry
"""

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import DrainageNode, SOSIncident, RescueTeam, Alert
from schemas import DrainageNodeOut, DrainageStatusOut, DrainageAnomalyOut

router = APIRouter(prefix="/api/v1/drainage", tags=["Drainage & Hydraulic Telemetry"])



CITY_DRAINAGE_MAP = {
    "mumbai": [
        {
            "id": "DN-MB-01",
            "name": "Mithi River Central Sump (DN-MB-01)",
            "city_id": "mumbai",
            "utilization_pct": 97.0,
            "capacity_ls": 160.0,
            "flow_ls": 155.2,
            "status": "CRITICAL",
            "anomaly": "Tidal backwater flow resisting gravity discharge",
            "confidence_pct": 95.0,
            "lat": 19.0760,
            "lng": 72.8777,
            "x": 260.0,
            "y": 180.0,
        },
        {
            "id": "DN-MB-02",
            "name": "Hindmata Pumping Station (DN-MB-02)",
            "city_id": "mumbai",
            "utilization_pct": 91.0,
            "capacity_ls": 130.0,
            "flow_ls": 118.3,
            "status": "STRESSED",
            "anomaly": "Debris and plastic clogging at trash rack",
            "confidence_pct": 89.0,
            "lat": 19.0125,
            "lng": 72.8425,
            "x": 380.0,
            "y": 220.0,
        },
        {
            "id": "DN-MB-03",
            "name": "Milan Subway Storm Culvert (DN-MB-03)",
            "city_id": "mumbai",
            "utilization_pct": 86.0,
            "capacity_ls": 110.0,
            "flow_ls": 94.6,
            "status": "STRESSED",
            "anomaly": "Subway low-lying runoff accumulation",
            "confidence_pct": 84.0,
            "lat": 19.0912,
            "lng": 72.8475,
            "x": 450.0,
            "y": 290.0,
        },
        {
            "id": "DN-MB-04",
            "name": "Bandra Outfall Regulator (DN-MB-04)",
            "city_id": "mumbai",
            "utilization_pct": 52.0,
            "capacity_ls": 180.0,
            "flow_ls": 93.6,
            "status": "NORMAL",
            "anomaly": None,
            "confidence_pct": 92.0,
            "lat": 19.0544,
            "lng": 72.8402,
            "x": 160.0,
            "y": 120.0,
        },
    ],
    "vizag": [
        {
            "id": "DN-VZ-01",
            "name": "Meghadrigedda Intake Gate (DN-VZ-01)",
            "city_id": "vizag",
            "utilization_pct": 96.0,
            "capacity_ls": 150.0,
            "flow_ls": 144.0,
            "status": "CRITICAL",
            "anomaly": "Sand dune blockage at coastal intake channel",
            "confidence_pct": 94.0,
            "lat": 17.6868,
            "lng": 83.2185,
            "x": 280.0,
            "y": 200.0,
        },
        {
            "id": "DN-VZ-02",
            "name": "Lawson Bay Coastal Drain (DN-VZ-02)",
            "city_id": "vizag",
            "utilization_pct": 88.0,
            "capacity_ls": 100.0,
            "flow_ls": 88.0,
            "status": "STRESSED",
            "anomaly": "Elevated coastal storm surge resistance",
            "confidence_pct": 87.0,
            "lat": 17.7289,
            "lng": 83.3412,
            "x": 420.0,
            "y": 260.0,
        },
        {
            "id": "DN-VZ-03",
            "name": "RK Beach Outfall Sump (DN-VZ-03)",
            "city_id": "vizag",
            "utilization_pct": 45.0,
            "capacity_ls": 120.0,
            "flow_ls": 54.0,
            "status": "NORMAL",
            "anomaly": None,
            "confidence_pct": 93.0,
            "lat": 17.7142,
            "lng": 83.3235,
            "x": 180.0,
            "y": 110.0,
        },
    ],
    "chennai": [
        {
            "id": "DN-CH-01",
            "name": "Adyar River Regulator Sump (DN-CH-01)",
            "city_id": "chennai",
            "utilization_pct": 98.0,
            "capacity_ls": 200.0,
            "flow_ls": 196.0,
            "status": "CRITICAL",
            "anomaly": "Estuary siltation choking outflow volume",
            "confidence_pct": 96.0,
            "lat": 13.0067,
            "lng": 80.2571,
            "x": 300.0,
            "y": 190.0,
        },
        {
            "id": "DN-CH-02",
            "name": "Cooum Canal Intake Gate (DN-CH-02)",
            "city_id": "chennai",
            "utilization_pct": 87.0,
            "capacity_ls": 140.0,
            "flow_ls": 121.8,
            "status": "STRESSED",
            "anomaly": "Trash rack obstruction near Central Bridge",
            "confidence_pct": 88.0,
            "lat": 13.0827,
            "lng": 80.2707,
            "x": 420.0,
            "y": 250.0,
        },
        {
            "id": "DN-CH-03",
            "name": "Velachery Storm Trunk (DN-CH-03)",
            "city_id": "chennai",
            "utilization_pct": 56.0,
            "capacity_ls": 110.0,
            "flow_ls": 61.6,
            "status": "NORMAL",
            "anomaly": None,
            "confidence_pct": 91.0,
            "lat": 12.9759,
            "lng": 80.2206,
            "x": 190.0,
            "y": 120.0,
        },
    ],
    "kochi": [
        {
            "id": "DN-KC-01",
            "name": "Vembanad Backwater Outfall (DN-KC-01)",
            "city_id": "kochi",
            "utilization_pct": 95.0,
            "capacity_ls": 130.0,
            "flow_ls": 123.5,
            "status": "CRITICAL",
            "anomaly": "High tide backwater intrusion in lowlands",
            "confidence_pct": 94.0,
            "lat": 9.9312,
            "lng": 76.2673,
            "x": 290.0,
            "y": 210.0,
        },
        {
            "id": "DN-KC-02",
            "name": "Marine Drive Culvert Sump (DN-KC-02)",
            "city_id": "kochi",
            "utilization_pct": 81.0,
            "capacity_ls": 100.0,
            "flow_ls": 81.0,
            "status": "STRESSED",
            "anomaly": "Runoff surge from commercial zone",
            "confidence_pct": 86.0,
            "lat": 9.9790,
            "lng": 76.2762,
            "x": 410.0,
            "y": 270.0,
        },
    ],
    "kolkata": [
        {
            "id": "DN-KL-01",
            "name": "Hooghly River Pumping Station (DN-KL-01)",
            "city_id": "kolkata",
            "utilization_pct": 97.0,
            "capacity_ls": 220.0,
            "flow_ls": 213.4,
            "status": "CRITICAL",
            "anomaly": "Lock gate mechanical jamming under peak river swell",
            "confidence_pct": 97.0,
            "lat": 22.5726,
            "lng": 88.3639,
            "x": 310.0,
            "y": 200.0,
        },
        {
            "id": "DN-KL-02",
            "name": "East Wetlands Canal Sump (DN-KL-02)",
            "city_id": "kolkata",
            "utilization_pct": 84.0,
            "capacity_ls": 150.0,
            "flow_ls": 126.0,
            "status": "STRESSED",
            "anomaly": "High sediment level reducing effective pipe area",
            "confidence_pct": 88.0,
            "lat": 22.5411,
            "lng": 88.4112,
            "x": 430.0,
            "y": 260.0,
        },
    ],
    "guwahati": [
        {
            "id": "DN-GW-01",
            "name": "Bharalu River Sluice Gate (DN-GW-01)",
            "city_id": "guwahati",
            "utilization_pct": 99.0,
            "capacity_ls": 125.0,
            "flow_ls": 123.75,
            "status": "CRITICAL",
            "anomaly": "Heavy hill sediment clogging intake grates",
            "confidence_pct": 95.0,
            "lat": 26.1445,
            "lng": 91.7362,
            "x": 300.0,
            "y": 210.0,
        },
        {
            "id": "DN-GW-02",
            "name": "Zoo Road Trunk Drain (DN-GW-02)",
            "city_id": "guwahati",
            "utilization_pct": 82.0,
            "capacity_ls": 95.0,
            "flow_ls": 77.9,
            "status": "STRESSED",
            "anomaly": "Flash hill runoff overwhelming urban channel",
            "confidence_pct": 89.0,
            "lat": 26.1610,
            "lng": 91.7780,
            "x": 420.0,
            "y": 280.0,
        },
    ],
}


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
async def get_drainage_status(
    city_id: str | None = Query(None, description="City preset identifier"),
    db: AsyncSession = Depends(get_db),
):
    """Network-wide summary of drainage health and hydraulic loading for specified city."""
    cid = (city_id or "patna").lower()

    # 1. Query database for city nodes
    if cid == "patna":
        result = await db.execute(
            select(DrainageNode).where(
                (DrainageNode.city_id == "patna") | (DrainageNode.city_id.is_(None))
            ).order_by(DrainageNode.utilization_pct.desc())
        )
    else:
        result = await db.execute(
            select(DrainageNode).where(DrainageNode.city_id == cid).order_by(DrainageNode.utilization_pct.desc())
        )

    nodes = result.scalars().all()

    # 2. If no nodes exist in DB for this city, dynamically seed them into DB
    if not nodes and cid in CITY_DRAINAGE_MAP:
        for item in CITY_DRAINAGE_MAP[cid]:
            d_node = DrainageNode(
                id=item["id"],
                name=item["name"],
                city_id=cid,
                utilization_pct=item["utilization_pct"],
                capacity_ls=item["capacity_ls"],
                flow_ls=item["flow_ls"],
                status=item["status"],
                anomaly=item["anomaly"],
                confidence_pct=item["confidence_pct"],
                lat=item["lat"],
                lng=item["lng"],
                x=item["x"],
                y=item["y"],
                updated_at=datetime.utcnow(),
            )
            db.add(d_node)
        await db.commit()

        # Re-fetch from DB
        result = await db.execute(
            select(DrainageNode).where(DrainageNode.city_id == cid).order_by(DrainageNode.utilization_pct.desc())
        )
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
    
    node_name = node.name if node else f"Junction {node_id}"
    node_status = node.status if node else "CRITICAL"
    node_lat = node.lat if node else 25.606
    node_lng = node.lng if node else 85.152
    node_flow_ls = node.flow_ls if node else 120.0

    team_id = f"RT-{node_id}"
    sos_id = f"INSP-{node_id}"
    now_time = datetime.utcnow().strftime("%H:%M")

    # 1. Create or update emergency dispatch incident
    existing_sos = await db.execute(select(SOSIncident).where(SOSIncident.id == sos_id))
    sos = existing_sos.scalar_one_or_none()
    if not sos:
        sos = SOSIncident(
            id=sos_id,
            priority="CRITICAL" if node_status == "CRITICAL" else "HIGH",
            location=f"Drainage Junction {node_name}",
            lat=node_lat,
            lng=node_lng,
            people=0,
            children=0,
            elderly=0,
            medical=False,
            water_depth_m=round(node_flow_ls / 100.0, 2),
            waiting_min=1,
            status="ASSIGNED",
            flood_risk=node_status if node_status in ["LOW", "MODERATE", "HIGH", "SEVERE"] else "HIGH",
            assigned_team=team_id,
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
        sos.assigned_team = team_id
        sos.updated_at = datetime.utcnow()

    # 2. Create or update dedicated RescueTeam entry in rescue_teams table
    existing_team = await db.execute(select(RescueTeam).where(RescueTeam.id == team_id))
    team = existing_team.scalar_one_or_none()
    if not team:
        team = RescueTeam(
            id=team_id,
            name=f"Drainage Clearance Unit ({node.id})",
            status="EN_ROUTE",
            lat=node.lat,
            lng=node.lng,
            distance_km=2.1,
            eta_min=10,
            vehicle="Drainage Service Truck",
            capacity=4,
            route_safety="SAFE",
            assigned_sos=sos_id,
            contact_phone="+91 80020 99000",
            updated_at=datetime.utcnow(),
        )
        db.add(team)
    else:
        team.status = "EN_ROUTE"
        team.assigned_sos = sos_id
        team.eta_min = 10
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


