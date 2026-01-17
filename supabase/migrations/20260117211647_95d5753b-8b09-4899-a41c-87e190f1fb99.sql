-- Add profile fields for user information
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS driver_type VARCHAR(20) DEFAULT 'particular',
  ADD COLUMN IF NOT EXISTS member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.driver_type IS 'Type of driver: uber, 99, taxi, particular';
COMMENT ON COLUMN public.profiles.display_name IS 'User display name for the profile';
COMMENT ON COLUMN public.profiles.member_since IS 'Date when user joined the platform';