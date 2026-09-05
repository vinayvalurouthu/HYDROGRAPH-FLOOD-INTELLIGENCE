import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env from project root (one level up from backend/)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


# Force SQLite for now — absolute path to hydrograph.db in backend directory
_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "hydrograph.db"))
_DB_URL = f"sqlite+aiosqlite:///{_DB_PATH}"



class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # Database — hardcoded to SQLite (upgrade to PostgreSQL+PostGIS later)
    DATABASE_URL: str = _DB_URL

    # External APIs
    MAPTILER_API_KEY: str = os.getenv("VITE_MAPTILER_API_KEY", "")
    OWM_API_KEY: str = os.getenv("VITE_OWM_API_KEY", "")

    # Server
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))

    # CORS — allow frontend dev server
    CORS_ORIGINS: list[str] = [
        "http://localhost:8443",
        "http://localhost:5173",
        "http://127.0.0.1:8443",
        "http://127.0.0.1:5173",
    ]

    # Map defaults (Patna, Bihar — center of flood-prone Gangetic plains)
    DEFAULT_LAT: float = 25.6093
    DEFAULT_LNG: float = 85.1376
    DEFAULT_ZOOM: int = 13

    class Config:
        # Don't read DATABASE_URL from environment — we force SQLite
        env_prefix = "HYDROGRAPH_"


settings = Settings(DATABASE_URL=_DB_URL)
