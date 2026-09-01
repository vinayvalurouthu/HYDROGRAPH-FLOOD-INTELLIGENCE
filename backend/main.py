"""
HydroGraph Backend — FastAPI Application Entry Point.

Serves the REST API for the flood intelligence command center.
Run: uvicorn main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db
from routers.flood_map import router as flood_map_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database on startup."""
    await init_db()
    print("[HYDRO] HydroGraph API started")
    print(f"   Map center: Patna, Bihar ({settings.DEFAULT_LAT}, {settings.DEFAULT_LNG})")
    print(f"   MapTiler key: {'[OK] configured' if settings.MAPTILER_API_KEY else '[X] missing'}")
    print(f"   OWM key: {'[OK] configured' if settings.OWM_API_KEY else '[X] missing'}")
    yield
    print("[HYDRO] HydroGraph API shutting down")


app = FastAPI(
    title="HydroGraph API",
    description="High-Resolution Urban Flood Nowcasting & Emergency Response",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(flood_map_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "HydroGraph API",
        "status": "operational",
        "version": "1.0.0",
        "location": "Patna, Bihar",
    }
