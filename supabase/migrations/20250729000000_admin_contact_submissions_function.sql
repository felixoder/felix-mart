-- Create RPC function to get all contact submissions for admin users
-- This function bypasses RLS for admin users
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
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT 
    id,
    name,
    email,
    subject,
    message,
    status,
    created_at,
    updated_at
  FROM contact_submissions
  ORDER BY created_at DESC;
$$;

-- Grant execute permission to authenticated users (admin check will be done in the function if needed)
GRANT EXECUTE ON FUNCTION get_all_contact_submissions() TO authenticated;

-- Alternative: Create a more secure version that checks for admin status
CREATE OR REPLACE FUNCTION get_all_contact_submissions_secure()
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
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  -- Check if the current user is an admin
  SELECT COALESCE(profiles.is_admin, false) INTO is_admin_user
  FROM profiles
  WHERE profiles.id = auth.uid();
  
  -- Only return data if user is admin
  IF is_admin_user THEN
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
GRANT EXECUTE ON FUNCTION get_all_contact_submissions_secure() TO authenticated;
