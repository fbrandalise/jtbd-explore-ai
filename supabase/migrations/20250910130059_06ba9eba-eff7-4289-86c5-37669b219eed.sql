-- Fix security issues by setting proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;