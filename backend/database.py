from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from config import settings

# Async engine for SQLite (swap URL for PostgreSQL later)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    # SQLite-specific: allow multiple threads
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
)

# Session factory
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# Base class for all models
class Base(DeclarativeBase):
    pass


async def get_db():
    """Dependency that provides a database session per request."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Create all tables and seed initial records if database is empty."""
    import models  # Ensure all SQLAlchemy models are registered on Base.metadata

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Check if database needs initial seeding
    async with async_session() as session:
        from sqlalchemy import select
        result = await session.execute(select(models.Road))
        roads = result.scalars().all()
        if not roads:
            print("[HYDROGRAPH DB] Initializing empty database with seed data...")
            try:
                from seed import seed_all
                # We seed without dropping tables since create_all ran above
                async with async_session() as seed_session:
                    from seed import ROADS, DRAINAGE_NODES, FORECAST_TIMELINE, FLOOD_ZONES, SOS_INCIDENTS, RESCUE_TEAMS, SHELTERS, SYSTEM_SERVICES, ALERTS, HISTORICAL_EVENTS
                    for r_data in ROADS:
                        seed_session.add(models.Road(**r_data))
                    for d_data in DRAINAGE_NODES:
                        seed_session.add(models.DrainageNode(**d_data))
                    for f_data in FORECAST_TIMELINE:
                        seed_session.add(models.ForecastTimeline(**f_data))
                    for z_data in FLOOD_ZONES:
                        seed_session.add(models.FloodZone(**z_data))
                    for s_data in SOS_INCIDENTS:
                        seed_session.add(models.SOSIncident(**s_data))
                    for t_data in RESCUE_TEAMS:
                        seed_session.add(models.RescueTeam(**t_data))
                    for sh_data in SHELTERS:
                        seed_session.add(models.Shelter(**sh_data))
                    for svc_data in SYSTEM_SERVICES:
                        seed_session.add(models.SystemService(**svc_data))
                    for a_data in ALERTS:
                        seed_session.add(models.Alert(**a_data))
                    for h_data in HISTORICAL_EVENTS:
                        seed_session.add(models.HistoricalEvent(**h_data))
                    await seed_session.commit()
                print("[HYDROGRAPH DB] Initial database seed completed successfully.")
            except Exception as e:
                print(f"[HYDROGRAPH DB WARNING] Auto-seed error: {e}")

