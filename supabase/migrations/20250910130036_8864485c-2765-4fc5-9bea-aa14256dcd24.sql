-- Create function to automatically add new users to default org
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Add user to default organization with writer role
  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES (
    (SELECT id FROM public.orgs WHERE slug = 'default' LIMIT 1),
    NEW.id,
    'writer'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add users to org when they sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a default admin user (you can change the email/password)
-- This will be the initial admin user
DO $$
DECLARE
  admin_user_id UUID;
  default_org_id UUID;
BEGIN
  -- Get default org ID
  SELECT id INTO default_org_id FROM public.orgs WHERE slug = 'default' LIMIT 1;
  
  -- Check if we already have an admin
  IF NOT EXISTS (SELECT 1 FROM public.org_members WHERE role = 'admin') THEN
    -- Insert a placeholder admin entry that can be updated when a real user signs up
    -- For now, just ensure the trigger works for future users
    NULL; -- We'll manually promote the first user to admin
  END IF;
END $$;