-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create enums
create type public.activity_type as enum ('project', 'routine', 'simple', 'meeting', 'training', 'event');
create type public.frequency_type as enum ('once', 'daily', 'weekly', 'bi-weekly', 'monthly', 'custom');
create type public.interval_unit_type as enum ('days', 'weeks', 'months');
create type public.priority_type as enum ('low', 'medium', 'high');
create type public.activity_status as enum ('pending', 'completed', 'cancelled');

-- Create activities table
create table public.activities (
  id uuid not null default uuid_generate_v4() primary key,
  title text not null,
  description text,
  type public.activity_type not null,
  frequency public.frequency_type not null,
  interval_value integer,
  interval_unit public.interval_unit_type,
  priority public.priority_type not null default 'medium',
  planned_date date not null,
  realized_date date,
  status public.activity_status not null default 'pending',
  created_at timestamp with time zone not null default now(),
  sub_activities jsonb default '[]'::jsonb
);

-- Enable Row Level Security (RLS)
alter table public.activities enable row level security;

-- Create policy to allow all operations (Modify this if you add Authentication later)
create policy "Enable all access for all users" on public.activities
  for all using (true) with check (true);
