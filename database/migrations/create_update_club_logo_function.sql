-- Function to update a club's logo URL
CREATE OR REPLACE FUNCTION update_club_logo(club_id UUID, logo TEXT)
RETURNS VOID AS $$
DECLARE
    logo_column_exists BOOLEAN;
BEGIN
    -- Check if logo_url column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clubs' 
        AND column_name = 'logo_url'
    ) INTO logo_column_exists;
    
    -- Update the club's logo_url if the column exists
    IF logo_column_exists THEN
        UPDATE public.clubs
        SET logo_url = logo
        WHERE id = club_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 