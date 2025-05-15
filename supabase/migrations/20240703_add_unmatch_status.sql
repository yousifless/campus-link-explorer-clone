-- Update the matches table to support unmatched status
-- Extend status type constraints to include "unmatched" option
CREATE TYPE match_status AS ENUM ('pending', 'accepted', 'rejected', 'unmatched');

-- Ensure match tables can use this status value
-- First, back up the existing matches to a temp table if data migration is needed
CREATE TABLE IF NOT EXISTS matches_backup AS SELECT * FROM matches;

-- Add a migration note
COMMENT ON TABLE matches_backup IS 'Backup of matches table before status enum update';

-- Update the status column in matches to use the enum type
-- This will convert the existing text status to the enum type
ALTER TABLE matches
  ALTER COLUMN status TYPE match_status 
  USING status::match_status,
  ALTER COLUMN user1_status TYPE match_status
  USING user1_status::match_status,
  ALTER COLUMN user2_status TYPE match_status
  USING user2_status::match_status;

-- Add a notification type for unmatching
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check,
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('match', 'message', 'meetup', 'match_accepted', 'match_rejected', 'match_request', 'unmatched'));

-- Add function to handle unmatch notifications
CREATE OR REPLACE FUNCTION create_unmatch_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a notification for both users when unmatched
  IF NEW.status = 'unmatched' AND OLD.status != 'unmatched' THEN
    INSERT INTO notifications (
      user_id, 
      type, 
      content,
      related_id,
      is_read
    ) VALUES
    (NEW.user1_id, 'unmatched', 'A match has been removed', NEW.id, false),
    (NEW.user2_id, 'unmatched', 'A match has been removed', NEW.id, false);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically create unmatch notifications
DROP TRIGGER IF EXISTS match_unmatch_notification ON matches;
CREATE TRIGGER match_unmatch_notification
  AFTER UPDATE OF status ON matches
  FOR EACH ROW
  WHEN (NEW.status = 'unmatched')
  EXECUTE FUNCTION create_unmatch_notification(); 