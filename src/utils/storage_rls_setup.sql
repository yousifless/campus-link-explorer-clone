-- Storage RLS Policy Setup for Avatars
-- Run this script in the Supabase SQL Editor to set up RLS policies for the avatar bucket

-- 1. Check if RLS is enabled on the storage.objects table
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');

-- 2. Enable RLS if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. List existing policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- 4. Drop existing policies if needed (uncomment if you want to start fresh)
-- DROP POLICY IF EXISTS "Allow users to upload their own avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow users to view their own avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow users to update their own avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow users to delete their own avatars" ON storage.objects;

-- 5. Create policies for the avatars bucket

-- Policy for uploading avatars (INSERT)
CREATE POLICY "Allow users to upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for viewing avatars (SELECT)
CREATE POLICY "Allow users to view their own avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for updating avatars (UPDATE)
CREATE POLICY "Allow users to update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for deleting avatars (DELETE)
CREATE POLICY "Allow users to delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Alternative: Make the bucket public for read access only
-- This allows anyone to view avatars but only authenticated users can upload/update/delete
CREATE POLICY "Allow public read access to avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 7. Verify the policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- 8. Check bucket configuration
SELECT * FROM storage.buckets WHERE name = 'avatars';

-- 9. Update bucket to be public (if needed)
-- UPDATE storage.buckets SET public = true WHERE name = 'avatars';

-- 10. Test the policies by checking if a user can access their own files
-- Replace 'user-id-here' with an actual user ID
-- SELECT * FROM storage.objects 
-- WHERE bucket_id = 'avatars' 
-- AND (storage.foldername(name))[1] = 'user-id-here'; 