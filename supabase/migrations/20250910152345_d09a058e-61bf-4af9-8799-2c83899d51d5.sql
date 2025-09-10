-- Fix infinite recursion in org_members RLS policies
-- Remove existing problematic policies
DROP POLICY IF EXISTS "members_can_read_members" ON public.org_members;
DROP POLICY IF EXISTS "admin_can_manage_members" ON public.org_members;

-- Create new policies that don't cause recursion
-- Allow users to read their own membership
CREATE POLICY "users_can_read_own_membership" ON public.org_members
FOR SELECT USING (user_id = auth.uid());

-- Allow users to read other members in the same organization
CREATE POLICY "users_can_read_org_members" ON public.org_members
FOR SELECT USING (
  org_id IN (
    SELECT om.org_id 
    FROM public.org_members om 
    WHERE om.user_id = auth.uid()
  )
);

-- Allow admins to insert/update/delete members (simpler check)
CREATE POLICY "admins_can_manage_members" ON public.org_members
FOR ALL USING (
  EXISTS (
    SELECT 1 
    FROM public.org_members admin_check 
    WHERE admin_check.user_id = auth.uid() 
    AND admin_check.org_id = org_members.org_id 
    AND admin_check.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.org_members admin_check 
    WHERE admin_check.user_id = auth.uid() 
    AND admin_check.org_id = org_members.org_id 
    AND admin_check.role = 'admin'
  )
);

-- Update has_role function to be simpler and avoid recursion
CREATE OR REPLACE FUNCTION public.has_role(required_role text, org uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = auth.uid() 
    AND org_id = org
    AND (
      CASE
        WHEN required_role = 'reader' THEN role IN ('reader','writer','admin')
        WHEN required_role = 'writer' THEN role IN ('writer','admin')
        WHEN required_role = 'admin'  THEN role = 'admin'
        ELSE FALSE
      END
    )
  );
$$;