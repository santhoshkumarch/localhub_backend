-- Add profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS profile_type VARCHAR(20) DEFAULT 'individual' CHECK (profile_type IN ('individual', 'business')),
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();