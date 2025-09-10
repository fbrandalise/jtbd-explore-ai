-- Fix security issues

-- 1. Fix the set_updated_at function to have secure search_path
DROP FUNCTION IF EXISTS set_updated_at();

CREATE OR REPLACE FUNCTION set_updated_at() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END; 
$$;

-- 2. Ensure all views are created without SECURITY DEFINER (recreate if needed)
DROP VIEW IF EXISTS vw_outcomes_long;

-- Recreate the view without any security definer issues
CREATE VIEW vw_outcomes_long AS
SELECT
  su.code as survey_code,
  su.date as survey_date,
  bj.slug as big_job_slug, 
  bj.name as big_job_name,
  lj.slug as little_job_slug, 
  lj.name as little_job_name,
  oc.slug as outcome_slug, 
  oc.name as outcome_name,
  orr.importance, 
  orr.satisfaction, 
  orr.opportunity_score
FROM outcome_results orr
JOIN surveys su ON su.id = orr.survey_id
JOIN outcomes oc ON oc.id = orr.outcome_id
JOIN little_jobs lj ON lj.id = oc.little_job_id
JOIN big_jobs bj ON bj.id = lj.big_job_id;

-- Ensure proper permissions on the view
GRANT SELECT ON vw_outcomes_long TO authenticated;
GRANT SELECT ON vw_outcomes_long TO anon;