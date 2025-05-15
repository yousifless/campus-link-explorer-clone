-- Add referral columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE, 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- Create referral rewards table
CREATE TABLE IF NOT EXISTS referral_rewards (
  id SERIAL PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) NOT NULL,
  referee_id UUID REFERENCES profiles(id) NOT NULL,
  points_awarded INT NOT NULL,
  discount_code TEXT NOT NULL,
  discount_amount INT NOT NULL, -- Percentage value (e.g., 10 for 10%)
  discount_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days')
);

-- Create referral badges table
CREATE TABLE IF NOT EXISTS referral_badges (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  required_referrals INT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user badges table to track which badges users have earned
CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  badge_id INT REFERENCES referral_badges(id) NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Insert default badges
INSERT INTO referral_badges (name, description, required_referrals, image_url)
VALUES 
  ('Bronze Ambassador', 'Referred 1 friend to CampusLink', 1, '/badges/bronze_ambassador.png'),
  ('Silver Ambassador', 'Referred 5 friends to CampusLink', 5, '/badges/silver_ambassador.png'),
  ('Gold Ambassador', 'Referred 10 friends to CampusLink', 10, '/badges/gold_ambassador.png'),
  ('Platinum Ambassador', 'Referred 25 friends to CampusLink', 25, '/badges/platinum_ambassador.png');

-- Create function to generate random referral code
CREATE OR REPLACE FUNCTION generate_referral_code() 
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate referral code on new user creation
CREATE OR REPLACE FUNCTION set_referral_code() 
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Generate a unique referral code
  LOOP
    new_code := generate_referral_code();
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;
    
    -- Exit loop if unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  -- Set the referral code
  NEW.referral_code := new_code;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to set referral code on new profile creation
DROP TRIGGER IF EXISTS set_profile_referral_code ON profiles;
CREATE TRIGGER set_profile_referral_code
BEFORE INSERT ON profiles
FOR EACH ROW
WHEN (NEW.referral_code IS NULL)
EXECUTE FUNCTION set_referral_code();

-- Function to award points when someone signs up with a referral
CREATE OR REPLACE FUNCTION process_referral(referrer_id UUID, referee_id UUID)
RETURNS VOID AS $$
DECLARE
  discount_code TEXT;
  points_to_award INT := 100; -- Default points per referral
BEGIN
  -- Generate unique discount code
  discount_code := 'CLINK' || substring(gen_random_uuid()::text, 1, 8);
  
  -- Add reward record
  INSERT INTO referral_rewards (
    referrer_id, 
    referee_id, 
    points_awarded, 
    discount_code,
    discount_amount
  )
  VALUES (
    referrer_id, 
    referee_id, 
    points_to_award, 
    discount_code,
    10 -- 10% discount
  );
  
  -- Update referrer's XP
  UPDATE profiles
  SET xp = COALESCE(xp, 0) + points_to_award
  WHERE id = referrer_id;
  
  -- Check if user has earned any new badges
  PERFORM award_referral_badges(referrer_id);
END;
$$ LANGUAGE plpgsql;

-- Function to check and award badges based on referral count
CREATE OR REPLACE FUNCTION award_referral_badges(user_id UUID)
RETURNS VOID AS $$
DECLARE
  referral_count INT;
  badge RECORD;
BEGIN
  -- Count user's referrals
  SELECT COUNT(*) INTO referral_count
  FROM profiles
  WHERE referred_by = user_id;
  
  -- Check each badge level
  FOR badge IN
    SELECT * FROM referral_badges 
    WHERE required_referrals <= referral_count
    ORDER BY required_referrals ASC
  LOOP
    -- Award badge if not already earned
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (user_id, badge.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get referral stats
CREATE OR REPLACE FUNCTION get_referral_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'referral_count', (SELECT COUNT(*) FROM profiles WHERE referred_by = user_id),
    'total_points', (SELECT SUM(points_awarded) FROM referral_rewards WHERE referrer_id = user_id),
    'badges', (
      SELECT json_agg(json_build_object(
        'id', rb.id,
        'name', rb.name,
        'description', rb.description,
        'image_url', rb.image_url,
        'earned_at', ub.earned_at
      ))
      FROM user_badges ub
      JOIN referral_badges rb ON rb.id = ub.badge_id
      WHERE ub.user_id = user_id
    ),
    'next_badge', (
      SELECT json_build_object(
        'id', rb.id,
        'name', rb.name,
        'description', rb.description,
        'required_referrals', rb.required_referrals,
        'image_url', rb.image_url
      )
      FROM referral_badges rb
      WHERE rb.required_referrals > (SELECT COUNT(*) FROM profiles WHERE referred_by = user_id)
      ORDER BY rb.required_referrals ASC
      LIMIT 1
    ),
    'referrals', (
      SELECT json_agg(json_build_object(
        'id', p.id,
        'name', CONCAT(p.first_name, ' ', p.last_name),
        'join_date', p.created_at,
        'reward', json_build_object(
          'points', rr.points_awarded,
          'discount_code', rr.discount_code,
          'discount_used', rr.discount_used,
          'created_at', rr.created_at
        )
      ))
      FROM profiles p
      JOIN referral_rewards rr ON rr.referee_id = p.id
      WHERE p.referred_by = user_id
      ORDER BY p.created_at DESC
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql; 