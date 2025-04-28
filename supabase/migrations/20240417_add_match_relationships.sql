-- Add foreign key relationships between matches and profiles tables
ALTER TABLE matches
ADD CONSTRAINT matches_user1_id_fkey
FOREIGN KEY (user1_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE matches
ADD CONSTRAINT matches_user2_id_fkey
FOREIGN KEY (user2_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON matches(user2_id);

-- Add RLS policies for matches table
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matches"
ON matches FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create matches"
ON matches FOR INSERT
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their own matches"
ON matches FOR UPDATE
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete their own matches"
ON matches FOR DELETE
USING (auth.uid() = user1_id OR auth.uid() = user2_id); 