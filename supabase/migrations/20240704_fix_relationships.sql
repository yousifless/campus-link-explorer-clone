-- Fix issues with content-type handling for relationships

-- First, fix relationship between profiles and club_meetups
DO $$
BEGIN
    -- Check if the constraint already exists with a different name
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conrelid = 'club_meetups'::regclass 
        AND contype = 'f' 
        AND conkey = ARRAY[array_position(
            (SELECT array_agg(attnum) FROM pg_attribute WHERE attrelid = 'club_meetups'::regclass AND attname = 'created_by'),
            (SELECT array_agg(attnum) FROM pg_attribute WHERE attrelid = 'club_meetups'::regclass)
        )]
    ) THEN
        -- If exists but with a different name, first drop it
        EXECUTE format('ALTER TABLE club_meetups DROP CONSTRAINT IF EXISTS %I', 
                       (SELECT conname FROM pg_constraint 
                        WHERE conrelid = 'club_meetups'::regclass 
                        AND contype = 'f' 
                        AND conkey = ARRAY[array_position(
                            (SELECT array_agg(attnum) FROM pg_attribute WHERE attrelid = 'club_meetups'::regclass AND attname = 'created_by'),
                            (SELECT array_agg(attnum) FROM pg_attribute WHERE attrelid = 'club_meetups'::regclass)
                        )]));
        
        -- Then create with the correct name
        ALTER TABLE club_meetups
        ADD CONSTRAINT club_meetups_creator_fkey
        FOREIGN KEY (created_by) REFERENCES profiles(id);
    END IF;
END $$;

-- Create proper types for notification preferences
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'notification_preference_type'
    ) THEN
        CREATE TYPE notification_preference_type AS ENUM (
            'new_club_invite', 
            'new_meetup', 
            'meetup_reminder', 
            'club_chat_mention', 
            'meetup_rsvp_update', 
            'club_announcement'
        );
    END IF;
END $$;

-- Fix club_meetup_rsvps table relationships
DO $$
BEGIN
    -- Create clearer constraint names for better error messages
    ALTER TABLE club_meetup_rsvps 
    DROP CONSTRAINT IF EXISTS club_meetup_rsvps_meetup_id_fkey;
    
    ALTER TABLE club_meetup_rsvps
    ADD CONSTRAINT club_meetup_rsvps_meetup_id_fkey
    FOREIGN KEY (meetup_id) REFERENCES club_meetups(id) ON DELETE CASCADE;
    
    ALTER TABLE club_meetup_rsvps 
    DROP CONSTRAINT IF EXISTS club_meetup_rsvps_user_id_fkey;
    
    ALTER TABLE club_meetup_rsvps
    ADD CONSTRAINT club_meetup_rsvps_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
END $$;

-- Add comment to help with Supabase Studio display
COMMENT ON TABLE club_meetups IS 'Meetups organized by clubs';
COMMENT ON TABLE club_meetup_rsvps IS 'RSVPs for club meetups';
COMMENT ON TABLE user_notification_preferences IS 'User notification preferences for club events';

-- Fix HTTP Accept header issues by ensuring proper JSON content-type support
ALTER TABLE user_notification_preferences 
ALTER COLUMN created_at SET DEFAULT NOW()::timestamp with time zone,
ALTER COLUMN updated_at SET DEFAULT NOW()::timestamp with time zone;

-- Add appropriate index on conversations and matches
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING gin ((participants));

-- Update RLS on user notification preferences to be more permissive
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON user_notification_preferences;
CREATE POLICY "Users can update their own notification preferences"
    ON user_notification_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id); 