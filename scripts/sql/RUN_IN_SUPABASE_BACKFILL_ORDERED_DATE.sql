-- Backfill orders.ordered_date from created_at where missing (fixes admin analytics zeros).
-- SAFE TO RE-RUN.

UPDATE public.orders
SET ordered_date = to_char(created_at AT TIME ZONE 'UTC', 'Mon DD, YYYY')
WHERE (ordered_date IS NULL OR trim(ordered_date) = '')
  AND created_at IS NOT NULL;

SELECT 'backfill_ordered_date' AS check_name,
       count(*) FILTER (WHERE ordered_date IS NULL OR trim(ordered_date) = '') AS still_missing,
       count(*) AS total_orders
FROM public.orders;
