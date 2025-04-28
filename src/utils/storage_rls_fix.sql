-- Storage RLS Troubleshooting and Fix Script
-- Run this in the Supabase SQL Editor

-- 1. Check if RLS is enabled on the storage.objects table
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');

-- 2. List all policies on the storage.objects table
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- 3. Check bucket configurations
SELECT * FROM storage.buckets;

-- 4. Create a more permissive policy for testing (REPLACE 'your_bucket_name' with your actual bucket name)
-- This policy allows authenticated users to upload to any path in the bucket
CREATE POLICY "Allow authenticated uploads to avatars" 
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 5. Create a policy that allows users to upload to their own folder
-- This policy ensures the first folder in the path matches the user's ID
CREATE POLICY "Allow users to upload to their own folder" 
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Create a policy that allows users to read their own files
CREATE POLICY "Allow users to read their own files" 
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. Create a policy that allows users to update their own files
CREATE POLICY "Allow users to update their own files" 
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

-- 8. Create a policy that allows users to delete their own files
CREATE POLICY "Allow users to delete their own files" 
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 9. If you need to temporarily disable RLS for testing (NOT RECOMMENDED FOR PRODUCTION)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 10. To re-enable RLS after testing
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 11. Check if the bucket exists and create it if it doesn't
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

-- 12. Verify the bucket configuration
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- 13. Check for any existing files in the bucket
SELECT * FROM storage.objects WHERE bucket_id = 'avatars' LIMIT 10;

-- 14. If needed, you can delete all files in the bucket (BE CAREFUL!)
-- DELETE FROM storage.objects WHERE bucket_id = 'avatars';

-- 15. Check for any errors in the storage.objects table
SELECT * FROM storage.objects WHERE bucket_id = 'avatars' AND metadata->>'error' IS NOT NULL; 