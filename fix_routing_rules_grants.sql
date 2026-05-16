-- =============================================================================
-- Fix: Grant INSERT/UPDATE/DELETE on consult_routing_rules to authenticated
-- The RLS policy "consult_routing_super_admin_all" already restricts write
-- operations to super_admin only, but the table-level GRANT was missing
-- INSERT/UPDATE/DELETE for the authenticated role.
-- =============================================================================

GRANT INSERT, UPDATE, DELETE ON TABLE public.consult_routing_rules TO authenticated;
