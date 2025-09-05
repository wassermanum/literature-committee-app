-- Initialize database for Literature Committee application
-- This file is executed when the PostgreSQL container starts

-- Create database if it doesn't exist (this is handled by POSTGRES_DB env var)
-- The database 'literature_committee_dev' will be created automatically

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone to Moscow (Siberia region)
SET timezone = 'Europe/Moscow';

-- Create a comment for the database
COMMENT ON DATABASE literature_committee_dev IS 'Literature Committee Management System Database';