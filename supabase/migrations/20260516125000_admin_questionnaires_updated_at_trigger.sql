-- Keep admin_questionnaires.updated_at accurate on row updates (builder save/publish).

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_questionnaires_touch_updated_at ON public.admin_questionnaires;
CREATE TRIGGER admin_questionnaires_touch_updated_at
  BEFORE UPDATE ON public.admin_questionnaires
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();
