-- Update profiles table to ensure all fields are properly connected
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS cultural_insight TEXT,
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS year_of_study INTEGER,
ADD COLUMN IF NOT EXISTS student_type TEXT CHECK (student_type IN ('international', 'local')),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Create user_interests table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_interests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    interest_id UUID REFERENCES interests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, interest_id)
);

-- Create user_languages table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_languages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    language_id UUID REFERENCES languages(id) ON DELETE CASCADE,
    proficiency TEXT CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'native')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, language_id)
);

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create RLS policies for user_interests
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interests"
ON user_interests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own interests"
ON user_interests FOR ALL
USING (auth.uid() = user_id);

-- Create RLS policies for user_languages
ALTER TABLE user_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own languages"
ON user_languages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own languages"
ON user_languages FOR ALL
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest_id ON user_interests(interest_id);
CREATE INDEX IF NOT EXISTS idx_user_languages_user_id ON user_languages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_languages_language_id ON user_languages(language_id); 