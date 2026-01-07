-- Migration: Add address and gps_link fields to users table
-- Run this if the fields don't exist in your database

-- Add address column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'address'
    ) THEN
        ALTER TABLE users ADD COLUMN address TEXT;
    END IF;
END $$;

-- Add gps_link column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'gps_link'
    ) THEN
        ALTER TABLE users ADD COLUMN gps_link TEXT;
    END IF;
END $$;

-- Update existing users with NULL values for these fields
UPDATE users 
SET address = NULL, gps_link = NULL 
WHERE address IS NULL AND gps_link IS NULL;