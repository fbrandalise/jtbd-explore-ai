-- Add any existing users to the default organization
DO $$
DECLARE
  user_record RECORD;
  default_org_id UUID;
  first_user BOOLEAN := TRUE;
BEGIN
  -- Get default org ID
  SELECT id INTO default_org_id FROM public.orgs WHERE slug = 'default' LIMIT 1;
  
  -- Add all existing users to the default org
  FOR user_record IN 
    SELECT id FROM auth.users 
    WHERE email_confirmed_at IS NOT NULL 
    AND id NOT IN (SELECT user_id FROM public.org_members)
  LOOP
    -- Make the first user admin, others writers
    INSERT INTO public.org_members (org_id, user_id, role)
    VALUES (
      default_org_id,
      user_record.id,
      CASE WHEN first_user THEN 'admin' ELSE 'writer' END
    );
    
    first_user := FALSE;
  END LOOP;
END $$;