-- Create a function for admins to get all contact submissions
CREATE OR REPLACE FUNCTION get_all_contact_submissions()
RETURNS TABLE (
    id uuid,
    name text,
    email text,
    subject text,
    message text,
    status text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the current user is an admin
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    ) THEN
        RETURN QUERY
        SELECT 
            cs.id,
            cs.name,
            cs.email,
            cs.subject,
            cs.message,
            cs.status,
            cs.created_at,
            cs.updated_at
        FROM contact_submissions cs
        ORDER BY cs.created_at DESC;
    ELSE
        -- Return empty result if not admin
        RETURN;
    END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_contact_submissions() TO authenticated;
