-- Create default organization if it doesn't exist
INSERT INTO public.orgs (slug, name) 
VALUES ('default', 'Organização Padrão')
ON CONFLICT (slug) DO NOTHING;

-- Update RLS policy for orgs to allow org members to read their org
DROP POLICY IF EXISTS "org_members_can_read_org" ON public.orgs;

CREATE POLICY "org_members_can_read_org" 
ON public.orgs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.org_members 
    WHERE org_members.org_id = orgs.id 
    AND org_members.user_id = auth.uid()
  )
);