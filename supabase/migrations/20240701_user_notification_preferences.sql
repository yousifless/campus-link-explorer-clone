-- Create the user_notification_preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    new_club_invite BOOLEAN DEFAULT TRUE,
    new_meetup BOOLEAN DEFAULT TRUE,
    meetup_reminder BOOLEAN DEFAULT TRUE,
    club_chat_mention BOOLEAN DEFAULT TRUE,
    meetup_rsvp_update BOOLEAN DEFAULT TRUE,
    club_announcement BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_notification_preferences_user ON user_notification_preferences(user_id);

-- Enable RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notification preferences"
    ON user_notification_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification preferences"
    ON user_notification_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
    ON user_notification_preferences
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_notification_preferences_updated_at
BEFORE UPDATE ON user_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle upsert of user notification preferences with single value
CREATE OR REPLACE FUNCTION upsert_user_notification_preference(
    p_user_id UUID,
    p_preference_type TEXT,
    p_value BOOLEAN
)
RETURNS VOID AS $$
DECLARE
    upsert_data JSONB;
BEGIN
    -- Build a dynamic JSONB object with the preference type as a key
    upsert_data := jsonb_build_object(
        'user_id', p_user_id,
        p_preference_type, p_value,
        'updated_at', NOW()
    );
    
    -- Upsert the data
    EXECUTE format('
        INSERT INTO user_notification_preferences(user_id, %I, updated_at)
        VALUES($1, $2, $3)
        ON CONFLICT (user_id) 
        DO UPDATE SET %I = $2, updated_at = $3
    ', p_preference_type, p_preference_type) 
    USING p_user_id, p_value, NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the database types
COMMENT ON TABLE user_notification_preferences IS 'User notification preferences for various events'; 