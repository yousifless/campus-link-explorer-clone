# Supabase Storage RLS Troubleshooting Guide

## Common RLS Issues with Supabase Storage

### 1. Authentication Issues

**Symptoms:**
- "Unauthorized" errors when uploading files
- 403 Forbidden responses
- Authentication errors in the console

**Solutions:**
- Verify the user is properly authenticated
- Check that the session is valid and not expired
- Ensure the auth token is being properly passed to Supabase

### 2. Path Structure Issues

**Symptoms:**
- Uploads fail with RLS policy violations
- Error messages mentioning path structure

**Solutions:**
- Ensure the file path matches what the RLS policy expects
- For user-specific folders, the path should be: `userId/filename.ext`
- Check that the user ID in the path matches the authenticated user's ID

### 3. Bucket Configuration Issues

**Symptoms:**
- Cannot access the bucket
- Bucket not found errors

**Solutions:**
- Verify the bucket exists in Supabase
- Check that the bucket name is correct
- Ensure RLS is properly configured for the bucket

### 4. Policy Configuration Issues

**Symptoms:**
- Specific policy violation errors
- Cannot perform specific operations (upload, download, delete)

**Solutions:**
- Review the RLS policies for the storage.objects table
- Ensure policies exist for all required operations (INSERT, SELECT, UPDATE, DELETE)
- Check that the policy conditions match your application's requirements

## Step-by-Step Troubleshooting

### 1. Verify Authentication

```typescript
// Add this to your component
useEffect(() => {
  async function checkAuth() {
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log("Current auth user:", user);
    console.log("Auth error:", error);
    
    // Also check the session
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Current session:", session);
  }
  
  checkAuth();
}, []);
```

### 2. Check Bucket Configuration

```typescript
// Add this to your component
async function checkBucket() {
  const { data, error } = await supabase.storage.listBuckets();
  console.log("Buckets:", data);
  console.log("Bucket error:", error);
}
```

### 3. Test Simple Upload

```typescript
// Add this to your component
async function testUpload() {
  try {
    // Create a small test file
    const testBlob = new Blob(['test content'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // Try to upload with proper path structure
    const testPath = `${user.id}/test-${Date.now()}.txt`;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(testPath, testFile, {
        upsert: true
      });
      
    console.log('Test upload result:', data);
    console.log('Test upload error:', error);
  } catch (err) {
    console.error('Test error:', err);
  }
}
```

### 4. Check RLS Policies

Run the following SQL in the Supabase SQL Editor:

```sql
-- List all policies for the storage.objects table
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check if RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');
```

### 5. Create Appropriate RLS Policies

Run the following SQL in the Supabase SQL Editor:

```sql
-- Create a policy that allows users to upload to their own folder
CREATE POLICY "Allow users to upload to their own folder" 
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create a policy that allows users to read their own files
CREATE POLICY "Allow users to read their own files" 
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Common RLS Policy Patterns

### 1. User-Specific Folders

This policy ensures users can only access files in their own folder:

```sql
CREATE POLICY "User folder access" 
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 2. Public Read, Authenticated Write

This policy allows anyone to read files, but only authenticated users can write:

```sql
CREATE POLICY "Public read access" 
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated write access" 
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');
```

### 3. Team-Based Access

This policy allows users to access files in team folders:

```sql
CREATE POLICY "Team folder access" 
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'team_files' AND 
  (storage.foldername(name))[1] IN (
    SELECT team_id FROM user_teams WHERE user_id = auth.uid()
  )
);
```

## Temporary Workarounds (Development Only)

### 1. Disable RLS Temporarily

```sql
-- WARNING: Only use in development, NEVER in production
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Remember to re-enable it when done testing:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

### 2. Use Service Role for Testing

```typescript
// WARNING: Only use in secure server-side code, never in client-side code
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      persistSession: false,
    }
  }
);
```

## Best Practices

1. **Always use user-specific folders** for personal files
2. **Implement proper error handling** in your upload functions
3. **Log detailed information** about upload attempts and failures
4. **Test with the StorageTest component** before deploying to production
5. **Review RLS policies regularly** to ensure they match your security requirements
6. **Use the Supabase dashboard** to monitor storage usage and errors
7. **Implement file size and type validation** on the client side
8. **Consider using server-side uploads** for sensitive operations 