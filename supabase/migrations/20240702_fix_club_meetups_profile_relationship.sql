-- Fix the relationship between club_meetups and profiles
-- The issue is that we have ambiguous foreign key references

-- First, create an explicit distinct name for the creator relationship
ALTER TABLE club_meetups
RENAME CONSTRAINT "club_meetups_created_by_fkey" TO "club_meetups_creator_fkey";

-- Update any queries using the old reference to use the new explicit name
COMMENT ON CONSTRAINT "club_meetups_creator_fkey" ON club_meetups IS 'Explicit relationship between club_meetups and the creator profile';

-- Add comment to help with type generation
COMMENT ON TABLE club_meetups IS 'Meetups organized by clubs';
COMMENT ON COLUMN club_meetups.created_by IS 'The user who created the meetup';

-- This helps the Supabase type generator correctly handle the relationships 