-- HydroGraph PRD Section 25 PostGIS Schema Definition
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. ROADS (Street Segments)
CREATE TABLE IF NOT EXISTS roads (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128),
    road_class VARCHAR(32),
    criticality VARCHAR(16) DEFAULT 'MEDIUM',
    geom GEOMETRY(LineString, 4326),
    status VARCHAR(16) DEFAULT 'OPEN'
);
CREATE INDEX IF NOT EXISTS roads_geom_idx ON roads USING GIST (geom);

-- 2. SHELTERS (Emergency Safe Havens)
CREATE TABLE IF NOT EXISTS shelters (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    capacity INT NOT NULL,
    occupancy INT DEFAULT 0,
    status VARCHAR(16) DEFAULT 'OPEN', -- OPEN, NEAR_FULL, FULL, FLOODED
    has_medical BOOLEAN DEFAULT FALSE,
    has_power BOOLEAN DEFAULT TRUE,
    has_food BOOLEAN DEFAULT TRUE,
    geom GEOMETRY(Point, 4326)
);
CREATE INDEX IF NOT EXISTS shelters_geom_idx ON shelters USING GIST (geom);

-- 3. FLOOD FORECASTS (Per-Segment Predictions)
CREATE TABLE IF NOT EXISTS flood_fcst (
    id SERIAL PRIMARY KEY,
    road_id VARCHAR(64) REFERENCES roads(id),
    valid_time TIMESTAMP WITH TIME ZONE NOT NULL,
    depth_cm FLOAT NOT NULL,
    velocity_ms FLOAT NOT NULL,
    time_to_flood_min INT,
    risk_level VARCHAR(16) NOT NULL, -- LOW, MODERATE, HIGH, SEVERE
    confidence FLOAT NOT NULL
);
CREATE INDEX IF NOT EXISTS flood_fcst_road_idx ON flood_fcst(road_id, valid_time);

-- 4. CITIZEN SOS REPORTS
CREATE TABLE IF NOT EXISTS sos_reports (
    id VARCHAR(32) PRIMARY KEY,
    victim_count INT NOT NULL DEFAULT 1,
    children_count INT DEFAULT 0,
    elderly_count INT DEFAULT 0,
    has_medical BOOLEAN DEFAULT FALSE,
    reported_water_depth_cm FLOAT,
    priority_score FLOAT NOT NULL,
    status VARCHAR(16) DEFAULT 'RECEIVED', -- RECEIVED, VERIFIED, ASSIGNED, EN_ROUTE, RESCUED, CLOSED
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sos_geom_idx ON sos_reports USING GIST (geom);
