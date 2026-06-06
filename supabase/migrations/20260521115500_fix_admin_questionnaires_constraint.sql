-- =============================================================================
-- Peak Health — Fix admin_questionnaires status check constraint
-- The base schema had the wrong allowed status values.
-- =============================================================================

-- Drop the wrong check constraint (allows only patient response statuses)
ALTER TABLE public.admin_questionnaires
  DROP CONSTRAINT IF EXISTS admin_questionnaires_status_check;

-- No new constraint needed — status is free-form text for questionnaire templates
-- (e.g., 'draft', 'live', 'archived')
