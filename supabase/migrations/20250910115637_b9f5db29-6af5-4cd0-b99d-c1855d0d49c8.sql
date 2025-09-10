-- Adjust RLS policies to allow anonymous operations for demo purposes

-- Update policies to allow anonymous write operations
-- This is for demonstration purposes - in production you'd want proper auth

-- Big Jobs policies
DROP POLICY IF EXISTS "write_auth" ON big_jobs;
DROP POLICY IF EXISTS "write_auth_u" ON big_jobs;
DROP POLICY IF EXISTS "write_auth_d" ON big_jobs;

CREATE POLICY "allow_all_operations" ON big_jobs FOR ALL USING (true) WITH CHECK (true);

-- Little Jobs policies  
DROP POLICY IF EXISTS "write_auth" ON little_jobs;
DROP POLICY IF EXISTS "write_auth_u" ON little_jobs;
DROP POLICY IF EXISTS "write_auth_d" ON little_jobs;

CREATE POLICY "allow_all_operations" ON little_jobs FOR ALL USING (true) WITH CHECK (true);

-- Outcomes policies
DROP POLICY IF EXISTS "write_auth" ON outcomes;
DROP POLICY IF EXISTS "write_auth_u" ON outcomes;
DROP POLICY IF EXISTS "write_auth_d" ON outcomes;

CREATE POLICY "allow_all_operations" ON outcomes FOR ALL USING (true) WITH CHECK (true);

-- Surveys policies
DROP POLICY IF EXISTS "write_auth" ON surveys;
DROP POLICY IF EXISTS "write_auth_u" ON surveys;
DROP POLICY IF EXISTS "write_auth_d" ON surveys;

CREATE POLICY "allow_all_operations" ON surveys FOR ALL USING (true) WITH CHECK (true);

-- Outcome Results policies
DROP POLICY IF EXISTS "write_auth" ON outcome_results;
DROP POLICY IF EXISTS "write_auth_u" ON outcome_results;
DROP POLICY IF EXISTS "write_auth_d" ON outcome_results;

CREATE POLICY "allow_all_operations" ON outcome_results FOR ALL USING (true) WITH CHECK (true);

-- Change Logs policies
DROP POLICY IF EXISTS "write_auth" ON change_logs;

CREATE POLICY "allow_all_operations" ON change_logs FOR ALL USING (true) WITH CHECK (true);