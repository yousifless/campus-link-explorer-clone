-- Function to get the referral leaderboard
CREATE OR REPLACE FUNCTION get_referral_leaderboard(
  limit_count INTEGER DEFAULT 10,
  include_campus BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  referral_count BIGINT,
  campus_name TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    COUNT(r.id) AS referral_count,
    CASE WHEN include_campus THEN c.name ELSE NULL END AS campus_name
  FROM 
    profiles p
  LEFT JOIN 
    profiles r ON r.referred_by = p.id
  LEFT JOIN
    campuses c ON c.id = p.campus_id
  GROUP BY 
    p.id, p.first_name, p.last_name, p.avatar_url, 
    CASE WHEN include_campus THEN c.name ELSE NULL END
  HAVING 
    COUNT(r.id) > 0
  ORDER BY 
    referral_count DESC, p.created_at ASC
  LIMIT limit_count;
END;
$$;

-- Function to get a specific user's rank in the leaderboard
CREATE OR REPLACE FUNCTION get_user_referral_rank(
  user_id UUID,
  include_campus BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  referral_count BIGINT,
  rank BIGINT,
  campus_name TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RankedUsers AS (
    SELECT 
      p.id,
      p.first_name,
      p.last_name,
      p.avatar_url,
      COUNT(r.id) AS referral_count,
      RANK() OVER (ORDER BY COUNT(r.id) DESC, p.created_at ASC) AS rank,
      CASE WHEN include_campus THEN c.name ELSE NULL END AS campus_name
    FROM 
      profiles p
    LEFT JOIN 
      profiles r ON r.referred_by = p.id
    LEFT JOIN
      campuses c ON c.id = p.campus_id
    GROUP BY 
      p.id, p.first_name, p.last_name, p.avatar_url,
      CASE WHEN include_campus THEN c.name ELSE NULL END
  )
  SELECT * FROM RankedUsers
  WHERE id = user_id;
END;
$$; 