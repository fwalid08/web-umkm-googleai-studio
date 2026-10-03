-- 018_add_marketplace_business_type.sql
-- Add 'marketplace', 'education', 'electronics', 'home' to business_type CHECK constraint
-- DEV/STAGING ONLY: Run after 017_seed_demo_users.sql

-- Drop existing CHECK constraint and add new one with additional types
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_business_type_check;
ALTER TABLE users ADD CONSTRAINT users_business_type_check 
  CHECK (business_type IN ('food','fashion','handicraft','retail','services','marketplace','education','electronics','home'));

-- Also update websites table if it has similar constraint
ALTER TABLE websites DROP CONSTRAINT IF EXISTS websites_business_type_check;
ALTER TABLE websites ADD CONSTRAINT websites_business_type_check 
  CHECK (business_type IN ('food','fashion','handicraft','retail','services','marketplace','education','electronics','home'));

-- Verify the change
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass AND contype = 'c';