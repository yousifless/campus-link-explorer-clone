-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('match', 'message', 'meetup')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sender_id UUID REFERENCES auth.users(id),
    sender_name TEXT,
    sender_avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    read BOOLEAN DEFAULT FALSE NOT NULL,
    data JSONB
);

-- Create index for faster queries
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
    ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications"
    ON notifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create function to update read status
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE notifications
    SET read = TRUE
    WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 