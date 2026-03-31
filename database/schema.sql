-- PostgreSQL Database Schema for Medication Repository Service
-- This file contains the database schema definition

-- Create database (run this manually if needed)
-- CREATE DATABASE medication_repository;

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL CHECK (length(name) > 0),
    dosage VARCHAR(100) NOT NULL CHECK (length(dosage) > 0),
    schedule JSONB NOT NULL CHECK (jsonb_array_length(schedule) > 0),
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications("userId");
CREATE INDEX IF NOT EXISTS idx_medications_name_user ON medications(name, "userId");

-- Add constraint to validate schedule format
-- Note: More complex validation is handled in the application layer

-- Create function to update the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updatedAt
CREATE TRIGGER update_medications_updated_at 
    BEFORE UPDATE ON medications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
-- INSERT INTO medications (name, dosage, schedule, "userId") VALUES
-- ('Aspirin', '100mg', '["08:00", "20:00"]', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'),
-- ('Vitamin D', '1000 IU', '["09:00"]', 'f47ac10b-58cc-4372-a567-0e02b2c3d479');