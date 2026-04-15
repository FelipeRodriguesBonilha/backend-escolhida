-- Initial database setup for Backend Escolhida
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set default timezone
SET timezone = 'America/Sao_Paulo';
