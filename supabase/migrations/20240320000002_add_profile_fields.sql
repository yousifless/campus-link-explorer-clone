-- Add additional profile fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS major TEXT,
ADD COLUMN IF NOT EXISTS graduation_year INTEGER;

-- Add comments to the columns
COMMENT ON COLUMN profiles.username IS 'User''s username';
COMMENT ON COLUMN profiles.university IS 'User''s university';
COMMENT ON COLUMN profiles.major IS 'User''s major';
COMMENT ON COLUMN profiles.graduation_year IS 'User''s expected graduation year';

-- Update RLS policies to allow access to the new columns
CREATE POLICY "Users can update their own profile fields"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO authenticated; 