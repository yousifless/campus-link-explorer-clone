-- Create a view that joins matches with profiles
CREATE OR REPLACE VIEW matches_with_profiles AS
SELECT 
  m.*,
  p1.first_name AS user1_first_name,
  p1.last_name AS user1_last_name,
  p1.avatar_url AS user1_avatar_url,
  p1.university AS user1_university,
  p1.student_type AS user1_student_type,
  p1.major AS user1_major,
  p1.bio AS user1_bio,
  p1.nationality AS user1_nationality,
  p1.is_verified AS user1_is_verified,
  p2.first_name AS user2_first_name,
  p2.last_name AS user2_last_name,
  p2.avatar_url AS user2_avatar_url,
  p2.university AS user2_university,
  p2.student_type AS user2_student_type,
  p2.major AS user2_major,
  p2.bio AS user2_bio,
  p2.nationality AS user2_nationality,
  p2.is_verified AS user2_is_verified
FROM 
  matches m
LEFT JOIN 
  profiles p1 ON m.user1_id = p1.id
LEFT JOIN 
  profiles p2 ON m.user2_id = p2.id;

-- Add RLS policies for the view
ALTER VIEW matches_with_profiles SET (security_invoker = on);

CREATE POLICY "Users can view their own matches with profiles"
  ON matches_with_profiles
  FOR SELECT
  USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id
  );

-- Grant access to the view
GRANT SELECT ON matches_with_profiles TO authenticated; 