"""
API router for Historical Flood Event Replay & Model Validation Benchmarking.

Endpoints:
  GET /api/v1/replay/events      → List all archived flood replay events
  GET /api/v1/replay/events/{id} → Detailed time-series replay frames & ground-truth validation
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import HistoricalEvent
from schemas import (
    HistoricalEventOut,
    HistoricalEventDetailOut,
    HistoricalReplayStep,
)

router = APIRouter(prefix="/api/v1/replay", tags=["Historical Replay & Validation"])


def event_to_out(e: HistoricalEvent) -> HistoricalEventOut:
    """Convert SQLAlchemy model to Pydantic schema."""
    return HistoricalEventOut(
        id=e.id,
        name=e.name,
        date=e.date,
        duration=e.duration,
        peakDepthCm=e.peak_depth_cm,
        floodedRoads=e.flooded_roads,
        sosCount=e.sos_count,
        accuracy=e.accuracy,
        description=e.description,
    )


@router.get("/events", response_model=list[HistoricalEventOut])
async def get_historical_events(db: AsyncSession = Depends(get_db)):
    """Fetch catalog of past flood events archived for simulation playback and validation."""
    result = await db.execute(select(HistoricalEvent).order_by(HistoricalEvent.date.desc()))
    events = result.scalars().all()
    return [event_to_out(e) for e in events]


@router.get("/events/{event_id}", response_model=HistoricalEventDetailOut)
async def get_historical_event_detail(event_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch replay time-series frames with rainfall, depth, and model accuracy benchmarking."""
    result = await db.execute(select(HistoricalEvent).where(HistoricalEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail=f"Historical event {event_id} not found")

    timeline_frames = []
    if event.timeline_data and isinstance(event.timeline_data, list):
        for f in event.timeline_data:
            if isinstance(f, dict):
                timeline_frames.append(
                    HistoricalReplayStep(
                        time_offset=f.get("time_offset", "+00:00"),
                        rainfall_mm_hr=float(f.get("rainfall_mm_hr", 0.0)),
                        peak_depth_cm=float(f.get("peak_depth_cm", 0.0)),
                        flooded_roads_count=int(f.get("flooded_roads_count", 0)),
                        sos_count=int(f.get("sos_count", 0)),
                        model_accuracy_pct=float(f.get("model_accuracy_pct", 85.0)),
                        active_hazard_areas=f.get("active_hazard_areas", []),
                    )
                )

    return HistoricalEventDetailOut(
        id=event.id,
        name=event.name,
        date=event.date,
        duration=event.duration,
        peakDepthCm=event.peak_depth_cm,
        floodedRoads=event.flooded_roads,
        sosCount=event.sos_count,
        accuracy=event.accuracy,
        description=event.description,
        timeline=timeline_frames,
    )
