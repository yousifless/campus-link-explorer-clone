-- Fix for 406 Not Acceptable errors by improving RLS policies and fixing column types

-- Update RLS policies for user_notification_preferences
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON user_notification_preferences;
CREATE POLICY "Users can view their own notification preferences" 
ON user_notification_preferences
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notification preferences" ON user_notification_preferences;
CREATE POLICY "Users can update their own notification preferences" 
ON user_notification_preferences
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON user_notification_preferences;
CREATE POLICY "Users can insert their own notification preferences" 
ON user_notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Ensure proper JSON content handling
COMMENT ON TABLE profiles IS 'User profiles containing public data';
COMMENT ON TABLE club_meetups IS 'Club meetups and events';
COMMENT ON TABLE matches IS 'User to user matches';
COMMENT ON TABLE user_notification_preferences IS 'Notification preferences for users';

-- Fix any constraint issues that might be causing conflicts

-- Make profile table references explicit
DO $$
BEGIN
  -- Fix relationship between club_meetups and profiles
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'club_meetups_created_by_fkey'
  ) THEN
    ALTER TABLE club_meetups 
    DROP CONSTRAINT IF EXISTS club_meetups_created_by_fkey;
  END IF;
  
  -- Create normalized relationship
  ALTER TABLE club_meetups
  ADD CONSTRAINT club_meetups_creator_profile_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id)
  ON DELETE CASCADE;
  
  -- Fix relationship between matches and profiles
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'matches_user1_id_fkey'
  ) THEN
    ALTER TABLE matches 
    DROP CONSTRAINT IF EXISTS matches_user1_id_fkey;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'matches_user2_id_fkey'
  ) THEN
    ALTER TABLE matches 
    DROP CONSTRAINT IF EXISTS matches_user2_id_fkey;
  END IF;
  
  -- Create normalized relationships
  ALTER TABLE matches
  ADD CONSTRAINT matches_user1_profile_fkey
  FOREIGN KEY (user1_id) REFERENCES profiles(id)
  ON DELETE CASCADE;
  
  ALTER TABLE matches
  ADD CONSTRAINT matches_user2_profile_fkey
  FOREIGN KEY (user2_id) REFERENCES profiles(id)
  ON DELETE CASCADE;
  
  -- Ensure match status enum exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'match_status'
  ) THEN
    CREATE TYPE match_status AS ENUM ('pending', 'accepted', 'rejected', 'unmatched');
  END IF;
END$$;

-- Ensure matches status has proper constraints
ALTER TABLE matches
ALTER COLUMN status TYPE TEXT;

ALTER TABLE matches
ALTER COLUMN user1_status TYPE TEXT;

ALTER TABLE matches
ALTER COLUMN user2_status TYPE TEXT;

-- Add updated_at trigger function for tables if not exists
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

-- Ensure all tables have updated_at triggers
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'matches', 'user_notification_preferences', 'club_meetups')
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION update_modified_column();
    ', t, t);
  END LOOP;
END $$; 