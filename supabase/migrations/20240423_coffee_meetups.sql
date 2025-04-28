-- Create coffee_meetups table
CREATE TABLE IF NOT EXISTS coffee_meetups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) NOT NULL,
    match_id UUID REFERENCES matches(id) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'declined', 'rescheduled', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_coffee_meetups_users ON coffee_meetups(sender_id, receiver_id);
CREATE INDEX idx_coffee_meetups_match ON coffee_meetups(match_id);
CREATE INDEX idx_coffee_meetups_date ON coffee_meetups(date);

-- Enable RLS
ALTER TABLE coffee_meetups ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own meetups"
    ON coffee_meetups
    FOR SELECT
    USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

CREATE POLICY "Users can create meetups"
    ON coffee_meetups
    FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM matches
            WHERE id = match_id
            AND (user1_id = auth.uid() OR user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own meetups"
    ON coffee_meetups
    FOR UPDATE
    USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_coffee_meetups_updated_at
    BEFORE UPDATE ON coffee_meetups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 