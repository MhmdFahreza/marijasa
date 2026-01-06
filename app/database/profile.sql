-- Migration: Add profile fields to users table
-- Run this SQL in your PostgreSQL database

-- Add address column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add gps_link column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS gps_link TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.address IS 'Full address of the user';
COMMENT ON COLUMN users.gps_link IS 'Google Maps link for user location';

-- Update existing users to have null for new fields (if needed)
UPDATE users 
SET address = NULL, gps_link = NULL 
WHERE address IS NULL OR gps_link IS NULL;

-- Verify the migration
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('address', 'gps_link');