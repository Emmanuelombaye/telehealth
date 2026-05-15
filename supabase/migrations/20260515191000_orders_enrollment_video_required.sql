-- Aligns doctor queue & consult UI with patient step-8 (enrollment) vs clinician step-5B video.
-- Safe to run on existing DBs: additive only.

alter table public.orders
  add column if not exists enrollment_video_required boolean not null default false;

comment on column public.orders.enrollment_video_required is
  'True when patient enrollment required sync video (product/state/BMI-age rules). Distinct from clinician-requested video (5B).';
