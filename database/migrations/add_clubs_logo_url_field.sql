-- Add logo_url column to clubs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clubs' 
        AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE public.clubs ADD COLUMN logo_url TEXT;
    END IF;
END $$;

-- Add banner_url column to clubs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clubs' 
        AND column_name = 'banner_url'
    ) THEN
        ALTER TABLE public.clubs ADD COLUMN banner_url TEXT;
    END IF;
END $$;

-- Create storage bucket for club images if it doesn't exist
DO $$
DECLARE
    bucket_exists BOOLEAN;
BEGIN
    -- Check if the bucket exists
    SELECT EXISTS (
        SELECT FROM storage.buckets WHERE name = 'club-images'
    ) INTO bucket_exists;

    -- Create the bucket if it doesn't exist
    IF NOT bucket_exists THEN
        -- Create the bucket
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('club-images', 'club-images', true);

        -- Set up RLS policies for the bucket
        -- Allow any authenticated user to read club images
        CREATE POLICY "Club images are publicly accessible."
        ON storage.objects FOR SELECT
        USING (bucket_id = 'club-images');

        -- Allow authenticated users to upload club images
        CREATE POLICY "Users can upload club images."
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'club-images');

        -- Allow users to update/delete their own images
        CREATE POLICY "Users can update their own club images."
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'club-images' AND owner = auth.uid());

        CREATE POLICY "Users can delete their own club images."
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'club-images' AND owner = auth.uid());
    END IF;
END $$; 