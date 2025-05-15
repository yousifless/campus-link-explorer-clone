-- Create referral_rewards table
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  discount_code TEXT NOT NULL UNIQUE,
  discount_amount DECIMAL(10, 2) NOT NULL,
  discount_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT check_either_referrer_or_referee_exists CHECK (referrer_id IS NOT NULL OR referee_id IS NOT NULL)
);

-- Add referral_code to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE;
    
    -- Backfill existing users with referral codes (using a simple hash function)
    UPDATE public.profiles 
    SET referral_code = 'CL' || SUBSTRING(MD5(id::text) FROM 1 FOR 8)
    WHERE referral_code IS NULL;
  END IF;
END $$;

-- Add referred_by column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Function to get referral stats
CREATE OR REPLACE FUNCTION public.get_referral_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  referral_count INTEGER;
  reward_count INTEGER;
  total_rewards DECIMAL(10, 2);
  result JSON;
BEGIN
  -- Count how many users this user has referred
  SELECT COUNT(*) INTO referral_count
  FROM profiles
  WHERE referred_by = user_id;
  
  -- Count how many rewards this user has
  SELECT COUNT(*), COALESCE(SUM(discount_amount), 0)
  INTO reward_count, total_rewards
  FROM referral_rewards
  WHERE referrer_id = user_id AND NOT discount_used;
  
  result := json_build_object(
    'referral_count', referral_count,
    'reward_count', reward_count,
    'total_rewards', total_rewards
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get referral leaderboard
CREATE OR REPLACE FUNCTION public.get_referral_leaderboard(
  limit_count INTEGER DEFAULT 10,
  include_campus BOOLEAN DEFAULT FALSE
)
RETURNS SETOF JSON AS $$
DECLARE
  query_text TEXT;
BEGIN
  query_text := '
    WITH referral_counts AS (
      SELECT 
        referred_by AS user_id, 
        COUNT(*) AS referral_count
      FROM profiles
      WHERE referred_by IS NOT NULL
      GROUP BY referred_by
    )
    SELECT 
      p.id,
      p.first_name,
      p.last_name,
      p.avatar_url,
      COALESCE(rc.referral_count, 0) AS referral_count';
      
  IF include_campus THEN
    query_text := query_text || ',
      (SELECT name FROM universities WHERE id = p.university_id) AS campus_name';
  END IF;
  
  query_text := query_text || '
    FROM profiles p
    LEFT JOIN referral_counts rc ON p.id = rc.user_id
    WHERE rc.referral_count > 0
    ORDER BY rc.referral_count DESC
    LIMIT ' || limit_count;
  
  RETURN QUERY EXECUTE query_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a user's referral rank
CREATE OR REPLACE FUNCTION public.get_user_referral_rank(
  user_id UUID,
  include_campus BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
  user_rank INTEGER;
  referral_count INTEGER;
  user_data JSON;
  query_text TEXT;
BEGIN
  -- Get user's referral count
  SELECT COUNT(*) INTO referral_count
  FROM profiles
  WHERE referred_by = user_id;
  
  -- Get user's rank
  SELECT 
    COUNT(*) + 1 INTO user_rank
  FROM (
    SELECT 
      referred_by, 
      COUNT(*) AS count
    FROM profiles
    WHERE referred_by IS NOT NULL
    GROUP BY referred_by
    HAVING COUNT(*) > referral_count
  ) AS better_referrers;
  
  -- Get user data
  query_text := '
    SELECT json_build_object(
      ''id'', p.id,
      ''first_name'', p.first_name,
      ''last_name'', p.last_name,
      ''avatar_url'', p.avatar_url,
      ''referral_count'', ' || referral_count || ',
      ''rank'', ' || user_rank;
      
  IF include_campus THEN
    query_text := query_text || ',
      ''campus_name'', (SELECT name FROM universities WHERE id = p.university_id)';
  END IF;
  
  query_text := query_text || '
    )
    FROM profiles p
    WHERE p.id = $1';
  
  EXECUTE query_text INTO user_data USING user_id;
  
  RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create row level security policies
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral rewards" 
ON public.referral_rewards
FOR SELECT 
TO authenticated
USING (
  auth.uid() = referrer_id OR 
  auth.uid() = referee_id
);

CREATE POLICY "Users cannot manipulate referral rewards" 
ON public.referral_rewards
FOR ALL 
TO authenticated
USING (false);

-- Make sure service role can manage all referral rewards
CREATE POLICY "Service role can manage all referral rewards" 
ON public.referral_rewards
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true); 