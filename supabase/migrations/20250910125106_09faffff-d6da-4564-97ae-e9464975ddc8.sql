-- Create organizations table
CREATE TABLE IF NOT EXISTS public.orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create org members table for role-based access
CREATE TABLE IF NOT EXISTS public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- references auth.users(id)
  role TEXT NOT NULL CHECK (role IN ('reader', 'writer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (org_id, user_id)
);

-- Insert default organization
INSERT INTO public.orgs (slug, name) VALUES ('default', 'Default Organization') ON CONFLICT (slug) DO NOTHING;

-- Add org_id column to existing tables
ALTER TABLE public.big_jobs ADD COLUMN IF NOT EXISTS org_id UUID NOT NULL DEFAULT (SELECT id FROM public.orgs WHERE slug='default' LIMIT 1);
ALTER TABLE public.little_jobs ADD COLUMN IF NOT EXISTS org_id UUID NOT NULL DEFAULT (SELECT id FROM public.orgs WHERE slug='default' LIMIT 1);
ALTER TABLE public.outcomes ADD COLUMN IF NOT EXISTS org_id UUID NOT NULL DEFAULT (SELECT id FROM public.orgs WHERE slug='default' LIMIT 1);
ALTER TABLE public.surveys ADD COLUMN IF NOT EXISTS org_id UUID NOT NULL DEFAULT (SELECT id FROM public.orgs WHERE slug='default' LIMIT 1);
ALTER TABLE public.outcome_results ADD COLUMN IF NOT EXISTS org_id UUID NOT NULL DEFAULT (SELECT id FROM public.orgs WHERE slug='default' LIMIT 1);
ALTER TABLE public.change_logs ADD COLUMN IF NOT EXISTS org_id UUID NOT NULL DEFAULT (SELECT id FROM public.orgs WHERE slug='default' LIMIT 1);

-- Enable RLS on org tables
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT, org UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT role FROM public.org_members
    WHERE user_id = auth.uid() AND org_id = org
  )
  SELECT CASE
    WHEN required_role = 'reader' THEN EXISTS(SELECT 1 FROM me WHERE role IN ('reader','writer','admin'))
    WHEN required_role = 'writer' THEN EXISTS(SELECT 1 FROM me WHERE role IN ('writer','admin'))
    WHEN required_role = 'admin'  THEN EXISTS(SELECT 1 FROM me WHERE role = 'admin')
    ELSE FALSE
  END;
$$;

-- RLS Policies for orgs
CREATE POLICY "org_members_can_read_org" ON public.orgs
FOR SELECT USING (EXISTS(SELECT 1 FROM public.org_members WHERE org_id = id AND user_id = auth.uid()));

-- RLS Policies for org_members
CREATE POLICY "members_can_read_members" ON public.org_members
FOR SELECT USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

CREATE POLICY "admin_can_manage_members" ON public.org_members
FOR ALL USING (public.has_role('admin', org_id)) WITH CHECK (public.has_role('admin', org_id));

-- Update RLS policies for existing tables
-- Big Jobs
CREATE POLICY "read_big_jobs_by_org_members" ON public.big_jobs
FOR SELECT USING (public.has_role('reader', org_id));

CREATE POLICY "write_big_jobs_by_writers" ON public.big_jobs
FOR INSERT WITH CHECK (public.has_role('writer', org_id));

CREATE POLICY "update_big_jobs_by_writers" ON public.big_jobs
FOR UPDATE USING (public.has_role('writer', org_id)) WITH CHECK (public.has_role('writer', org_id));

CREATE POLICY "delete_big_jobs_by_admin" ON public.big_jobs
FOR DELETE USING (public.has_role('admin', org_id));

-- Little Jobs
CREATE POLICY "read_little_jobs_by_org_members" ON public.little_jobs
FOR SELECT USING (public.has_role('reader', org_id));

CREATE POLICY "write_little_jobs_by_writers" ON public.little_jobs
FOR INSERT WITH CHECK (public.has_role('writer', org_id));

CREATE POLICY "update_little_jobs_by_writers" ON public.little_jobs
FOR UPDATE USING (public.has_role('writer', org_id)) WITH CHECK (public.has_role('writer', org_id));

CREATE POLICY "delete_little_jobs_by_admin" ON public.little_jobs
FOR DELETE USING (public.has_role('admin', org_id));

-- Outcomes
CREATE POLICY "read_outcomes_by_org_members" ON public.outcomes
FOR SELECT USING (public.has_role('reader', org_id));

CREATE POLICY "write_outcomes_by_writers" ON public.outcomes
FOR INSERT WITH CHECK (public.has_role('writer', org_id));

CREATE POLICY "update_outcomes_by_writers" ON public.outcomes
FOR UPDATE USING (public.has_role('writer', org_id)) WITH CHECK (public.has_role('writer', org_id));

CREATE POLICY "delete_outcomes_by_admin" ON public.outcomes
FOR DELETE USING (public.has_role('admin', org_id));

-- Surveys
CREATE POLICY "read_surveys_by_org_members" ON public.surveys
FOR SELECT USING (public.has_role('reader', org_id));

CREATE POLICY "write_surveys_by_writers" ON public.surveys
FOR INSERT WITH CHECK (public.has_role('writer', org_id));

CREATE POLICY "update_surveys_by_writers" ON public.surveys
FOR UPDATE USING (public.has_role('writer', org_id)) WITH CHECK (public.has_role('writer', org_id));

CREATE POLICY "delete_surveys_by_admin" ON public.surveys
FOR DELETE USING (public.has_role('admin', org_id));

-- Outcome Results
CREATE POLICY "read_outcome_results_by_org_members" ON public.outcome_results
FOR SELECT USING (public.has_role('reader', org_id));

CREATE POLICY "write_outcome_results_by_writers" ON public.outcome_results
FOR INSERT WITH CHECK (public.has_role('writer', org_id));

CREATE POLICY "update_outcome_results_by_writers" ON public.outcome_results
FOR UPDATE USING (public.has_role('writer', org_id)) WITH CHECK (public.has_role('writer', org_id));

CREATE POLICY "delete_outcome_results_by_admin" ON public.outcome_results
FOR DELETE USING (public.has_role('admin', org_id));

-- Change Logs
CREATE POLICY "read_change_logs_by_org_members" ON public.change_logs
FOR SELECT USING (public.has_role('reader', org_id));

CREATE POLICY "write_change_logs_by_writers" ON public.change_logs
FOR INSERT WITH CHECK (public.has_role('writer', org_id));

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_org_members_org_user ON public.org_members(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_big_jobs_org ON public.big_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_little_jobs_org ON public.little_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_org ON public.outcomes(org_id);
CREATE INDEX IF NOT EXISTS idx_surveys_org ON public.surveys(org_id);
CREATE INDEX IF NOT EXISTS idx_outcome_results_org ON public.outcome_results(org_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_org ON public.change_logs(org_id);