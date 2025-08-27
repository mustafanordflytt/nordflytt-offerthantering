-- Create function for atomic lead creation with activities
CREATE OR REPLACE FUNCTION create_lead_with_transaction(
  lead_data jsonb,
  initial_note text DEFAULT NULL,
  source_tracking jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_lead_id bigint;
  result jsonb;
BEGIN
  -- Start transaction
  -- Insert lead
  INSERT INTO leads (
    lead_id,
    name,
    email,
    phone,
    company_name,
    source,
    status,
    priority,
    estimated_value,
    expected_close_date,
    assigned_to,
    notes,
    tags,
    metadata,
    created_by,
    updated_by
  )
  VALUES (
    (lead_data->>'lead_id')::text,
    (lead_data->>'name')::text,
    (lead_data->>'email')::text,
    (lead_data->>'phone')::text,
    (lead_data->>'company_name')::text,
    COALESCE((lead_data->>'source')::text, 'website'),
    COALESCE((lead_data->>'status')::text, 'new'),
    COALESCE((lead_data->>'priority')::text, 'medium'),
    COALESCE((lead_data->>'estimated_value')::numeric, 0),
    (lead_data->>'expected_close_date')::date,
    (lead_data->>'assigned_to')::uuid,
    (lead_data->>'notes')::text,
    COALESCE((lead_data->'tags')::text[], ARRAY[]::text[]),
    COALESCE(lead_data->'metadata', '{}'::jsonb),
    (lead_data->>'created_by')::uuid,
    (lead_data->>'updated_by')::uuid
  )
  RETURNING id INTO new_lead_id;

  -- Create initial activity if note provided
  IF initial_note IS NOT NULL THEN
    INSERT INTO lead_activities (
      lead_id,
      type,
      title,
      description,
      completed,
      created_by
    )
    VALUES (
      new_lead_id,
      'note',
      'Initial contact',
      initial_note,
      true,
      (lead_data->>'created_by')::uuid
    );
  END IF;

  -- Log source tracking if provided
  IF source_tracking IS NOT NULL THEN
    INSERT INTO lead_source_tracking (
      lead_id,
      source,
      medium,
      campaign,
      content,
      referrer_url,
      landing_page,
      utm_params
    )
    VALUES (
      new_lead_id,
      COALESCE((source_tracking->>'source')::text, (lead_data->>'source')::text, 'website'),
      (source_tracking->>'medium')::text,
      (source_tracking->>'campaign')::text,
      (source_tracking->>'content')::text,
      (source_tracking->>'referrer_url')::text,
      (source_tracking->>'landing_page')::text,
      source_tracking->'utm_params'
    );
  END IF;

  -- Prepare result
  SELECT jsonb_build_object(
    'success', true,
    'lead_id', id,
    'lead_number', lead_id
  ) INTO result
  FROM leads
  WHERE id = new_lead_id;

  RETURN result;

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Lead with this email already exists' USING ERRCODE = '23505';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create lead: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_lead_with_transaction TO authenticated;

-- Create function for updating lead with activities in transaction
CREATE OR REPLACE FUNCTION update_lead_with_transaction(
  p_lead_id bigint,
  lead_updates jsonb,
  activity_data jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Update lead
  UPDATE leads
  SET
    name = COALESCE((lead_updates->>'name')::text, name),
    email = COALESCE((lead_updates->>'email')::text, email),
    phone = COALESCE((lead_updates->>'phone')::text, phone),
    company_name = COALESCE((lead_updates->>'company_name')::text, company_name),
    source = COALESCE((lead_updates->>'source')::text, source),
    status = COALESCE((lead_updates->>'status')::text, status),
    priority = COALESCE((lead_updates->>'priority')::text, priority),
    estimated_value = COALESCE((lead_updates->>'estimated_value')::numeric, estimated_value),
    expected_close_date = COALESCE((lead_updates->>'expected_close_date')::date, expected_close_date),
    assigned_to = COALESCE((lead_updates->>'assigned_to')::uuid, assigned_to),
    notes = COALESCE((lead_updates->>'notes')::text, notes),
    tags = COALESCE((lead_updates->'tags')::text[], tags),
    metadata = COALESCE(lead_updates->'metadata', metadata),
    updated_by = (lead_updates->>'updated_by')::uuid,
    updated_at = NOW()
  WHERE id = p_lead_id;

  -- Create activity if provided
  IF activity_data IS NOT NULL THEN
    INSERT INTO lead_activities (
      lead_id,
      type,
      title,
      description,
      completed,
      created_by
    )
    VALUES (
      p_lead_id,
      COALESCE((activity_data->>'type')::text, 'note'),
      (activity_data->>'title')::text,
      (activity_data->>'description')::text,
      COALESCE((activity_data->>'completed')::boolean, false),
      (activity_data->>'created_by')::uuid
    );
  END IF;

  -- Return updated lead
  SELECT jsonb_build_object(
    'success', true,
    'lead', row_to_json(leads.*)
  ) INTO result
  FROM leads
  WHERE id = p_lead_id;

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update lead: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_lead_with_transaction TO authenticated;