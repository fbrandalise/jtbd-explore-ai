-- Fix Security Definer View issue by using SECURITY INVOKER

-- Drop and recreate the view with security_invoker=on
DROP VIEW IF EXISTS vw_outcomes_long;

CREATE VIEW vw_outcomes_long 
WITH (security_invoker=on)
AS
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