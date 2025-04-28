-- Create personality_traits table
CREATE TABLE IF NOT EXISTS personality_traits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  openness DECIMAL(4,3) NOT NULL CHECK (openness >= 0 AND openness <= 1),
  conscientiousness DECIMAL(4,3) NOT NULL CHECK (conscientiousness >= 0 AND conscientiousness <= 1),
  extraversion DECIMAL(4,3) NOT NULL CHECK (extraversion >= 0 AND extraversion <= 1),
  agreeableness DECIMAL(4,3) NOT NULL CHECK (agreeableness >= 0 AND agreeableness <= 1),
  neuroticism DECIMAL(4,3) NOT NULL CHECK (neuroticism >= 0 AND neuroticism <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_personality_traits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_personality_traits_updated_at
  BEFORE UPDATE ON personality_traits
  FOR EACH ROW
  EXECUTE FUNCTION update_personality_traits_updated_at();

-- Add RLS policies
ALTER TABLE personality_traits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own personality traits"
  ON personality_traits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own personality traits"
  ON personality_traits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personality traits"
  ON personality_traits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personality traits"
  ON personality_traits FOR DELETE
  USING (auth.uid() = user_id); 