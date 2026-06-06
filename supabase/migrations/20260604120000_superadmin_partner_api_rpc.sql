-- Super Admin UI: issue / revoke Partner API keys (plaintext shown once from RPC return value)
-- Requires: partner_api_keys table (RUN_IN_SUPABASE_MULTI_TENANT_PLATFORM.sql or equivalent)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.issue_partner_api_key(
  p_brand_id uuid,
  p_label text DEFAULT 'default'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key text;
  v_prefix text;
  v_hash text;
  v_slug text;
  v_label text;
  v_row_id uuid;
BEGIN
  IF public.get_auth_role() <> 'super_admin' THEN
    RAISE EXCEPTION 'Only super_admin may issue partner API keys';
  END IF;

  IF p_brand_id IS NULL THEN
    RAISE EXCEPTION 'brand_id is required';
  END IF;

  v_label := coalesce(nullif(trim(p_label), ''), 'default');

  SELECT slug INTO v_slug FROM public.brands WHERE id = p_brand_id;
  IF v_slug IS NULL THEN
    RAISE EXCEPTION 'Brand not found';
  END IF;

  v_key := 'pk_live_' || encode(gen_random_bytes(24), 'hex');
  v_prefix := left(v_key, 12);
  v_hash := encode(digest(v_key, 'sha256'), 'hex');

  INSERT INTO public.partner_api_keys (brand_id, label, key_prefix, key_hash, status)
  VALUES (p_brand_id, v_label, v_prefix, v_hash, 'active')
  ON CONFLICT (brand_id, label) DO UPDATE SET
    key_prefix = EXCLUDED.key_prefix,
    key_hash = EXCLUDED.key_hash,
    status = 'active'
  RETURNING id INTO v_row_id;

  RETURN jsonb_build_object(
    'id', v_row_id,
    'api_key', v_key,
    'key_prefix', v_prefix,
    'brand_slug', v_slug,
    'label', v_label
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_partner_api_key(p_key_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_auth_role() <> 'super_admin' THEN
    RAISE EXCEPTION 'Only super_admin may revoke partner API keys';
  END IF;

  UPDATE public.partner_api_keys
  SET status = 'revoked'
  WHERE id = p_key_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_partner_api_key(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_partner_api_key(uuid) TO authenticated;

COMMENT ON FUNCTION public.issue_partner_api_key IS
  'Super Admin: generate partner API key (returned once). Stored as SHA-256 hash; partner-api validates against DB.';
