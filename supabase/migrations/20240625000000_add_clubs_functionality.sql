-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clubs
CREATE TABLE IF NOT EXISTS clubs (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          text NOT NULL,
  description   text,
  tags          text[] DEFAULT '{}',
  course_code   text,               -- optional: affiliated course
  visibility    text DEFAULT 'public', -- 'public' or 'private'
  join_code     text,               -- for private clubs
  created_by    uuid REFERENCES profiles(id),
  created_at    timestamptz DEFAULT now()
);

-- Club Memberships
CREATE TABLE IF NOT EXISTS club_memberships (
  club_id  uuid REFERENCES clubs(id) ON DELETE CASCADE,
  user_id  uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role     text DEFAULT 'member', -- 'member' or 'admin'
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (club_id, user_id)
);

-- Club Group Meetups (Events)
CREATE TABLE IF NOT EXISTS club_meetups (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id      uuid REFERENCES clubs(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  date         date,
  time         text,
  location_name text,
  location_address text,
  location_lat float,
  location_lng float,
  created_by   uuid REFERENCES profiles(id),
  created_at   timestamptz DEFAULT now()
);

-- Club Meetup RSVPs
CREATE TABLE IF NOT EXISTS club_meetup_rsvps (
  meetup_id  uuid REFERENCES club_meetups(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status     text DEFAULT 'pending', -- 'pending','yes','no','maybe'
  responded_at timestamptz DEFAULT now(),
  PRIMARY KEY (meetup_id, user_id)
);

-- Club Chat Messages
CREATE TABLE IF NOT EXISTS club_messages (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id      uuid REFERENCES clubs(id) ON DELETE CASCADE,
  sender_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content      text NOT NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_club_memberships_user_id ON club_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_club_id ON club_memberships(club_id);
CREATE INDEX IF NOT EXISTS idx_club_meetups_club_id ON club_meetups(club_id);
CREATE INDEX IF NOT EXISTS idx_club_meetups_date ON club_meetups(date);
CREATE INDEX IF NOT EXISTS idx_club_meetup_rsvps_user_id ON club_meetup_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_club_meetup_rsvps_meetup_id ON club_meetup_rsvps(meetup_id);
CREATE INDEX IF NOT EXISTS idx_club_messages_club_id ON club_messages(club_id);
CREATE INDEX IF NOT EXISTS idx_club_messages_sender_id ON club_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_clubs_tags ON clubs USING GIN (tags);

-- Enable Row Level Security
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_meetup_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clubs
CREATE POLICY "Anyone can view public clubs"
  ON clubs FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Members can view private clubs they belong to"
  ON clubs FOR SELECT
  USING (
    visibility = 'private' AND
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = clubs.id
      AND club_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create clubs"
  ON clubs FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Only creators and admins can update clubs"
  ON clubs FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = clubs.id
      AND club_memberships.user_id = auth.uid()
      AND club_memberships.role = 'admin'
    )
  );

CREATE POLICY "Only creators and admins can delete clubs"
  ON clubs FOR DELETE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = clubs.id
      AND club_memberships.user_id = auth.uid()
      AND club_memberships.role = 'admin'
    )
  );

-- RLS Policies for club_memberships
CREATE POLICY "Anyone can view club memberships"
  ON club_memberships FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can join clubs"
  ON club_memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave clubs"
  ON club_memberships FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage memberships"
  ON club_memberships FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = club_memberships.club_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
    )
  );

-- RLS Policies for club_meetups
CREATE POLICY "Club members can view meetups"
  ON club_meetups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_meetups.club_id
      AND club_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create meetups"
  ON club_meetups FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_meetups.club_id
      AND club_memberships.user_id = auth.uid()
      AND (club_memberships.role = 'admin' OR club_memberships.role = 'member')
    )
  );

CREATE POLICY "Admins can update meetups"
  ON club_meetups FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_meetups.club_id
      AND club_memberships.user_id = auth.uid()
      AND club_memberships.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete meetups"
  ON club_meetups FOR DELETE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_meetups.club_id
      AND club_memberships.user_id = auth.uid()
      AND club_memberships.role = 'admin'
    )
  );

-- RLS Policies for club_meetup_rsvps
CREATE POLICY "Club members can view RSVPs"
  ON club_meetup_rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_meetups
      JOIN club_memberships ON club_meetups.club_id = club_memberships.club_id
      WHERE club_meetups.id = club_meetup_rsvps.meetup_id
      AND club_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can RSVP to meetups they're invited to"
  ON club_meetup_rsvps FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM club_meetups
      JOIN club_memberships ON club_meetups.club_id = club_memberships.club_id
      WHERE club_meetups.id = club_meetup_rsvps.meetup_id
      AND club_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own RSVPs"
  ON club_meetup_rsvps FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for club_messages
CREATE POLICY "Club members can view messages"
  ON club_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_messages.club_id
      AND club_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Club members can send messages"
  ON club_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_messages.club_id
      AND club_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can edit their own messages"
  ON club_messages FOR UPDATE
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
  ON club_messages FOR DELETE
  USING (auth.uid() = sender_id);

-- Function to automatically insert club creator as admin member
CREATE OR REPLACE FUNCTION club_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO club_memberships(club_id, user_id, role)
  VALUES(NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add creator as admin when club is created
CREATE TRIGGER club_creator_membership
AFTER INSERT ON clubs
FOR EACH ROW
EXECUTE FUNCTION club_creator_as_admin();

-- Function to generate a random join code for private clubs
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.visibility = 'private' AND (NEW.join_code IS NULL OR NEW.join_code = '') THEN
    -- Generate a 6-character alphanumeric code
    NEW.join_code := substr(md5(random()::text), 1, 6);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate join code for private clubs
CREATE TRIGGER club_join_code
BEFORE INSERT ON clubs
FOR EACH ROW
EXECUTE FUNCTION generate_join_code();

-- Create a view for club details with member count
CREATE OR REPLACE VIEW club_details AS
SELECT 
  c.*,
  p.first_name AS creator_first_name,
  p.last_name AS creator_last_name,
  p.avatar_url AS creator_avatar_url,
  COUNT(DISTINCT cm.user_id) AS member_count,
  (
    SELECT COUNT(*) 
    FROM club_meetups cm 
    WHERE cm.club_id = c.id AND cm.date >= CURRENT_DATE
  ) AS upcoming_meetups_count
FROM 
  clubs c
LEFT JOIN
  profiles p ON c.created_by = p.id
LEFT JOIN
  club_memberships cm ON c.id = cm.club_id
GROUP BY
  c.id, p.first_name, p.last_name, p.avatar_url;

-- Create a function to get clubs by user
CREATE OR REPLACE FUNCTION get_user_clubs(user_uuid UUID)
RETURNS TABLE (
  club_id UUID,
  club_name TEXT,
  club_description TEXT,
  club_tags TEXT[],
  club_visibility TEXT,
  user_role TEXT,
  member_count BIGINT,
  upcoming_meetups_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS club_id,
    c.name AS club_name,
    c.description AS club_description,
    c.tags AS club_tags,
    c.visibility AS club_visibility,
    cm.role AS user_role,
    cd.member_count,
    cd.upcoming_meetups_count
  FROM
    clubs c
  JOIN
    club_memberships cm ON c.id = cm.club_id
  JOIN
    club_details cd ON c.id = cd.id
  WHERE
    cm.user_id = user_uuid
  ORDER BY
    c.name;
END;
$$ LANGUAGE plpgsql; 