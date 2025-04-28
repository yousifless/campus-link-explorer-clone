-- Add match_id column to coffee_meetups table
ALTER TABLE coffee_meetups
ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES matches(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_coffee_meetups_match_id ON coffee_meetups(match_id);

-- Update RLS policies to include match_id
DROP POLICY IF EXISTS "Users can view their own meetups" ON coffee_meetups;
CREATE POLICY "Users can view their own meetups"
    ON coffee_meetups
    FOR SELECT
    USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

DROP POLICY IF EXISTS "Users can create meetups" ON coffee_meetups;
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

DROP POLICY IF EXISTS "Users can update their own meetups" ON coffee_meetups;
CREATE POLICY "Users can update their own meetups"
    ON coffee_meetups
    FOR UPDATE
    USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    ); 