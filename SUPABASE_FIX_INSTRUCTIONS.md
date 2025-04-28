# Fixing "Invalid API Key" Error in CampusLink

This document provides step-by-step instructions to fix the "Invalid API Key" error in your CampusLink application.

## Step 1: Update Your Supabase API Key

1. Go to your Supabase dashboard: https://app.supabase.com/project/_/settings/api
2. Click "Rotate" next to your API keys to generate new ones
3. Copy the new "anon" key

## Step 2: Update Your Environment Variables

1. Open the `.env` file in your project root
2. Update the `VITE_SUPABASE_ANON_KEY` value with your new API key:

```
VITE_SUPABASE_URL=https://gdkvqvodqbzunzwfvcgh.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key-after-rotation
```

## Step 3: Add the avatar_signed_url Column to Your Database

1. Go to the Supabase SQL Editor: https://app.supabase.com/project/_/sql
2. Create a new query
3. Copy and paste the following SQL:

```sql
-- Add avatar_signed_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_signed_url TEXT;

-- Update RLS policies to allow access to the new column
CREATE POLICY IF NOT EXISTS "Users can update their own avatar_signed_url"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT UPDATE ON profiles TO authenticated;

-- Add comment to the column
COMMENT ON COLUMN profiles.avatar_signed_url IS 'Signed URL for the user avatar with longer expiration';
```

4. Run the query

## Step 4: Restart Your Development Server

1. Stop your development server
2. Start it again with `npm run dev` or equivalent

## Step 5: Verify the Fix

1. Navigate to your profile page
2. Check the browser console for any errors
3. Try uploading an avatar to verify that the fix worked

## Troubleshooting

If you still encounter issues:

1. Check the browser console for specific error messages
2. Verify that your Supabase URL and API key are correct
3. Make sure the `avatar_signed_url` column was added to your database
4. Check that your RLS policies are correctly configured

## Security Recommendations

Since you shared your API keys publicly:

1. Always rotate your API keys after they've been exposed
2. Add `.env` to your `.gitignore` file to prevent accidental commits
3. Consider using environment variables in your hosting platform for production deployments 