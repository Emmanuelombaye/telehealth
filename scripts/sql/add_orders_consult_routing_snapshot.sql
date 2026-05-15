-- Optional: persist enrollment video routing decision on orders (mirrors intake_answers._routing).
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS requires_sync_video BOOLEAN;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS video_routing_reasons JSONB;

COMMENT ON COLUMN public.orders.requires_sync_video IS 'True when drug/state/admin rules required Calendly/Cal.com booking at enrollment.';
COMMENT ON COLUMN public.orders.video_routing_reasons IS 'Patient-facing routing explanation bullets from enrollVideoRouting.';
