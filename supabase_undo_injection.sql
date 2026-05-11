-- ==============================================================================
-- UNDO: Remove Enterprise Seed Data Injection
-- This ONLY deletes the fake injected orders (prefixed RX-VOL-)
-- Your real organic orders are completely safe.
-- Run in: Supabase Dashboard > SQL Editor
-- ==============================================================================

DO $$
DECLARE
    deleted_count INT;
BEGIN
    -- Delete ONLY the seeded orders (they all have order_number starting with 'RX-VOL-')
    DELETE FROM public.orders
    WHERE order_number LIKE 'RX-VOL-%';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RAISE NOTICE 'Done. % injected seed orders removed. All real orders are intact.', deleted_count;
END $$;
