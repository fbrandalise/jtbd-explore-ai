-- Create RPC function for survey import
CREATE OR REPLACE FUNCTION public.rpc_import_survey(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  survey_data jsonb;
  rows_data jsonb[];
  row_item jsonb;
  survey_id uuid;
  outcome_record record;
  inserted_count integer := 0;
  updated_count integer := 0;
  error_count integer := 0;
  errors jsonb[] := '{}';
  org_uuid uuid;
BEGIN
  -- Extract data from payload
  survey_data := payload->'survey';
  rows_data := ARRAY(SELECT jsonb_array_elements(payload->'rows'));
  
  -- Get organization ID
  SELECT id INTO org_uuid FROM orgs WHERE slug = (payload->>'org_slug');
  IF org_uuid IS NULL THEN
    RAISE EXCEPTION 'Organization not found: %', payload->>'org_slug';
  END IF;
  
  -- Validate user has writer role
  IF NOT has_role('writer', org_uuid) THEN
    RAISE EXCEPTION 'User does not have permission to import surveys';
  END IF;
  
  -- Create survey
  INSERT INTO surveys (code, name, date, description, org_id)
  VALUES (
    survey_data->>'code',
    survey_data->>'name',
    (survey_data->>'date')::date,
    survey_data->>'description',
    org_uuid
  )
  RETURNING id INTO survey_id;
  
  -- Process each row
  FOREACH row_item IN ARRAY rows_data
  LOOP
    BEGIN
      -- Find outcome by slug first, then by name
      SELECT o.id INTO outcome_record.id
      FROM outcomes o
      WHERE o.org_id = org_uuid
        AND o.status = 'active'
        AND (o.slug = row_item->>'outcome' OR o.name = row_item->>'outcome')
      LIMIT 1;
      
      IF outcome_record.id IS NULL THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object(
          'outcome', row_item->>'outcome',
          'error', 'Outcome not found'
        );
        CONTINUE;
      END IF;
      
      -- Validate ranges
      IF (row_item->>'importance')::numeric < 0 OR (row_item->>'importance')::numeric > 10 THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object(
          'outcome', row_item->>'outcome',
          'error', 'Importance must be between 0 and 10'
        );
        CONTINUE;
      END IF;
      
      IF (row_item->>'satisfaction')::numeric < 0 OR (row_item->>'satisfaction')::numeric > 10 THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object(
          'outcome', row_item->>'outcome',
          'error', 'Satisfaction must be between 0 and 10'
        );
        CONTINUE;
      END IF;
      
      IF (row_item->>'opportunity_score')::numeric < 0 OR (row_item->>'opportunity_score')::numeric > 99.9 THEN
        error_count := error_count + 1;
        errors := errors || jsonb_build_object(
          'outcome', row_item->>'outcome',
          'error', 'Opportunity score must be between 0 and 99.9'
        );
        CONTINUE;
      END IF;
      
      -- Insert or update outcome result
      INSERT INTO outcome_results (survey_id, outcome_id, importance, satisfaction, opportunity_score, org_id)
      VALUES (
        survey_id,
        outcome_record.id,
        (row_item->>'importance')::numeric,
        (row_item->>'satisfaction')::numeric,
        (row_item->>'opportunity_score')::numeric,
        org_uuid
      )
      ON CONFLICT (survey_id, outcome_id)
      DO UPDATE SET
        importance = EXCLUDED.importance,
        satisfaction = EXCLUDED.satisfaction,
        opportunity_score = EXCLUDED.opportunity_score,
        updated_at = now();
      
      -- Check if it was an insert or update
      IF FOUND THEN
        -- This was an update
        updated_count := updated_count + 1;
      ELSE
        -- This was an insert
        inserted_count := inserted_count + 1;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      errors := errors || jsonb_build_object(
        'outcome', row_item->>'outcome',
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Log the import action
  INSERT INTO change_logs (entity, entity_id, action, actor, org_id, after)
  VALUES (
    'survey',
    survey_id,
    'import',
    auth.uid()::text,
    org_uuid,
    jsonb_build_object(
      'inserted', inserted_count,
      'updated', updated_count,
      'errors', error_count,
      'total_rows', array_length(rows_data, 1)
    )
  );
  
  RETURN jsonb_build_object(
    'survey_id', survey_id,
    'inserted', inserted_count,
    'updated', updated_count,
    'errors', error_count,
    'error_details', errors
  );
END;
$$;