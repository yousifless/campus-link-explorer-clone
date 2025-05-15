-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for storing profile embeddings
CREATE TABLE IF NOT EXISTS profile_embeddings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  embedding VECTOR(1536), -- dimension for text-embedding-3-small
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Create index for faster similarity searches
CREATE INDEX IF NOT EXISTS profile_embeddings_user_id_idx ON profile_embeddings(user_id);

-- Add HNSW index for faster similarity searches
CREATE INDEX IF NOT EXISTS profile_embeddings_embedding_idx ON profile_embeddings USING hnsw (embedding vector_cosine_ops);

-- Create table for storing user matching preferences
CREATE TABLE IF NOT EXISTS user_match_preferences (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location REAL DEFAULT 0.2,
  interests REAL DEFAULT 0.25,
  languages REAL DEFAULT 0.15,
  goals REAL DEFAULT 0.1,
  availability REAL DEFAULT 0.1,
  personality REAL DEFAULT 0.1,
  network REAL DEFAULT 0.1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Helper function to match profiles by embedding similarity
CREATE OR REPLACE FUNCTION match_profiles_by_embedding(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_limit INT
)
RETURNS TABLE (
  id UUID,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    profiles.id,
    1 - (profile_embeddings.embedding <=> query_embedding) AS similarity
  FROM
    profile_embeddings
  JOIN
    profiles ON profiles.id = profile_embeddings.user_id
  WHERE
    1 - (profile_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY
    profile_embeddings.embedding <=> query_embedding
  LIMIT match_limit;
END;
$$;

-- Function to recalculate all embeddings (for admin use)
CREATE OR REPLACE FUNCTION recalculate_embeddings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_count INTEGER := 0;
BEGIN
  -- This is a placeholder. In a real implementation, you would:
  -- 1. Iterate through profiles
  -- 2. Call your embedding API for each profile
  -- 3. Update the profile_embeddings table
  
  RETURN profile_count;
END;
$$;

-- Insert some seed data for testing (only if table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_match_preferences LIMIT 1) THEN
    -- Insert sample matching preferences for existing users
    INSERT INTO user_match_preferences (user_id, location, interests, languages, goals)
    SELECT 
      id,
      0.2 + random() * 0.3, -- location weight between 0.2 and 0.5
      0.2 + random() * 0.3, -- interests weight between 0.2 and 0.5
      0.1 + random() * 0.2, -- languages weight between 0.1 and 0.3
      0.1 + random() * 0.2  -- goals weight between 0.1 and 0.3
    FROM profiles
    ORDER BY created_at
    LIMIT 10;
  END IF;
END $$; 