-- Fix security issues by properly handling dependencies

-- 1. Drop all triggers that depend on set_updated_at function
DROP TRIGGER IF EXISTS t_bj_updated ON big_jobs;
DROP TRIGGER IF EXISTS t_lj_updated ON little_jobs;
DROP TRIGGER IF EXISTS t_oc_updated ON outcomes;
DROP TRIGGER IF EXISTS t_su_updated ON surveys;
DROP TRIGGER IF EXISTS t_or_updated ON outcome_results;

-- 2. Drop and recreate the function with proper search_path
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

-- 3. Recreate all the triggers
CREATE TRIGGER t_bj_updated 
  BEFORE UPDATE ON big_jobs 
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER t_lj_updated 
  BEFORE UPDATE ON little_jobs 
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER t_oc_updated 
  BEFORE UPDATE ON outcomes 
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER t_su_updated 
  BEFORE UPDATE ON surveys 
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER t_or_updated 
  BEFORE UPDATE ON outcome_results 
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at();

-- 4. Fix the view (recreate without security definer issues)
DROP VIEW IF EXISTS vw_outcomes_long;

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

-- 5. Grant appropriate permissions
GRANT SELECT ON vw_outcomes_long TO authenticated;
GRANT SELECT ON vw_outcomes_long TO anon;