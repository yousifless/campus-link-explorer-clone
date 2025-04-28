-- Add avatar_signed_url column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_signed_url TEXT;

-- Update existing profiles with signed URLs for their avatars
DO $$
DECLARE
    profile_record RECORD;
BEGIN
    FOR profile_record IN 
        SELECT id, avatar_url 
        FROM profiles 
        WHERE avatar_url IS NOT NULL 
        AND avatar_signed_url IS NULL
    LOOP
        -- Generate a signed URL for the avatar
        UPDATE profiles
        SET avatar_signed_url = (
            SELECT storage.create_signed_url(
                'avatars',
                split_part(avatar_url, '/', -1),
                3600
            )
        )
        WHERE id = profile_record.id;
    END LOOP;
END $$; 