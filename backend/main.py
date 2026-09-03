"""
HydroGraph Backend — FastAPI Application Entry Point.

Serves the complete REST API for the flood intelligence & emergency response command center.
Run: python -m uvicorn main:app --reload --port 8000
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db
from routers.flood_map import router as flood_map_router
from routers.sos import router as sos_router
from routers.rescue import router as rescue_router
from routers.shelters import router as shelters_router
from routers.drainage import router as drainage_router
from routers.routing import router as routing_router
from routers.scenarios import router as scenarios_router
from routers.replay import router as replay_router
from routers.system import router as system_router
from routers.hotspots import router as hotspots_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database schema on startup."""
    await init_db()
    print("=" * 60)
    print("[HYDROGRAPH] AI Flood Intelligence Command API Online")
    print(f"   Operational Center : Patna, Bihar ({settings.DEFAULT_LAT}, {settings.DEFAULT_LNG})")
    print(f"   MapTiler API Key   : {'[OK] Active' if settings.MAPTILER_API_KEY else '[X] Not Configured'}")
    print(f"   OpenWeather API Key: {'[OK] Active' if settings.OWM_API_KEY else '[X] Using Simulated Fallback'}")
    print(f"   Listening Port     : {settings.BACKEND_PORT}")
    print("=" * 60)
    yield
    print("[HYDROGRAPH] HydroGraph API shutting down gracefully.")


app = FastAPI(
    title="HydroGraph Flood Intelligence API",
    description=(
        "High-Resolution Urban Flood Nowcasting, AI Hydrodynamic Prediction, "
        "Emergency SOS Triage, Evacuation Routing & Municipal Command Operations."
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow frontend dev server and production clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular API routers
app.include_router(hotspots_router)
app.include_router(flood_map_router)
app.include_router(sos_router)
app.include_router(rescue_router)
app.include_router(shelters_router)
app.include_router(drainage_router)
app.include_router(routing_router)
app.include_router(scenarios_router)
app.include_router(replay_router)
app.include_router(system_router)


@app.get("/", tags=["Health Check"])
async def root():
    """System health check and deployment status endpoint."""
    return {
        "service": "HydroGraph AI Flood Intelligence Command Platform",
        "status": "operational",
        "version": "2.0.0",
        "location": "Patna, Bihar (Ganges Basin)",
        "modules": [
            "Live Map & Forecasting",
            "Hotspot Intelligence",
            "Emergency SOS & Dispatch",
            "Rescue Fleet & Teams",
            "Evacuation Shelters",
            "Drainage & Hydraulic Telemetry",
            "Flood-Aware Routing",
            "Scenario Simulation",
            "Historical Replay & Validation",
            "System Health & Telemetry",
        ],
    }
