-- Parking reservations table for Smart Parking
-- Run this in Supabase SQL Editor

create table if not exists public.parking_reservations (
  id bigserial primary key,
  slot_id integer not null references public.parking_slots(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'parking_reservations_status_check'
  ) then
    alter table public.parking_reservations
      add constraint parking_reservations_status_check
      check (status in ('active','cancelled'));
  end if;
end $$;

create index if not exists idx_reservations_slot_time on public.parking_reservations(slot_id, start_time, end_time);
create index if not exists idx_reservations_user_active on public.parking_reservations(user_id) where status = 'active';
