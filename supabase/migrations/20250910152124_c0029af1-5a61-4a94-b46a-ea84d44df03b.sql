-- Fix super admin role - update to admin
UPDATE public.org_members 
SET role = 'admin'
FROM auth.users u
WHERE org_members.user_id = u.id 
AND u.email = 'admin@jtbd.app';

-- Verify the update
SELECT 
  u.email,
  om.role,
  o.slug as org_slug
FROM auth.users u
JOIN public.org_members om ON u.id = om.user_id
JOIN public.orgs o ON om.org_id = o.id
WHERE u.email = 'admin@jtbd.app';