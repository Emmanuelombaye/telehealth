-- Run in Supabase SQL editor if you have not applied migrations from supabase/migrations yet.
-- Mirrors: 20260515191000_orders_enrollment_video_required.sql

alter table public.orders
  add column if not exists enrollment_video_required boolean not null default false;

comment on column public.orders.enrollment_video_required is
  'True when patient enrollment required sync video (Path A). Distinct from clinician-requested video (5B).';
