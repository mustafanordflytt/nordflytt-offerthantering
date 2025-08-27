-- Add missing function for checking calendar conflicts
-- This was referenced in the API but not created in the main migration

-- Drop function if it exists (to handle re-runs)
DROP FUNCTION IF EXISTS check_calendar_conflicts;

-- Create function to check for scheduling conflicts
CREATE OR REPLACE FUNCTION check_calendar_conflicts(
    p_start_datetime TIMESTAMP WITH TIME ZONE,
    p_end_datetime TIMESTAMP WITH TIME ZONE,
    p_assigned_staff UUID[],
    p_exclude_event_id UUID DEFAULT NULL
) RETURNS TABLE (
    conflicting_event_id UUID,
    event_title VARCHAR,
    event_type VARCHAR,
    start_datetime TIMESTAMP WITH TIME ZONE,
    end_datetime TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.id,
        ce.title,
        ce.event_type,
        ce.start_datetime,
        ce.end_datetime
    FROM calendar_events ce
    WHERE 
        ce.event_status != 'cancelled'
        AND (p_exclude_event_id IS NULL OR ce.id != p_exclude_event_id)
        AND ce.assigned_staff && p_assigned_staff -- Array overlap
        AND (
            (ce.start_datetime, ce.end_datetime) OVERLAPS (p_start_datetime, p_end_datetime)
        );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_calendar_conflicts TO authenticated;

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Calendar conflict checking function created successfully';
END $$;