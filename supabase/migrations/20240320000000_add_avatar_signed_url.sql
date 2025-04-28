-- Add avatar_signed_url column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_signed_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN profiles.avatar_signed_url IS 'Signed URL for the avatar image with a longer expiration time';

-- Update RLS policies to allow access to the new column
CREATE POLICY "Users can update their own avatar_signed_url"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO authenticated; 