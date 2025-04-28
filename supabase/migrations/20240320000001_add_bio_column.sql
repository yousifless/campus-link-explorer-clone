-- Add bio column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add comment to the column
COMMENT ON COLUMN profiles.bio IS 'User biography or description';

-- Update RLS policies to allow access to the new column
CREATE POLICY "Users can update their own bio"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO authenticated; 