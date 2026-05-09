-- Pharmacy operator settings (per-user dispensary credentials and preferences).
-- Apply via the Supabase SQL editor.

create table if not exists public.pharmacy_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pharmacy_name text default '',
  npi text default '',
  dea_number text default '',
  license_number text default '',
  license_state text default '',
  default_carrier text default 'UPS',
  surescripts_account text default '',
  notify_email text default '',
  notify_low_stock boolean default true,
  auto_print_labels boolean default false,
  updated_at timestamptz default now()
);

alter table public.pharmacy_settings enable row level security;

drop policy if exists "pharmacy_settings_owner_rw" on public.pharmacy_settings;
create policy "pharmacy_settings_owner_rw"
  on public.pharmacy_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.touch_pharmacy_settings()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists pharmacy_settings_touch on public.pharmacy_settings;
create trigger pharmacy_settings_touch
  before update on public.pharmacy_settings
  for each row execute function public.touch_pharmacy_settings();
