create extension if not exists "uuid-ossp";

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  buyurtma_id text not null,
  stol integer not null,
  mijoz text not null,
  ofitsiant_id integer not null,
  vaqt timestamp with time zone not null,
  mahsulotlar jsonb not null,
  hisob_kitob jsonb not null,
  taxminiy_tolov_turi text not null,
  status text not null default 'NEW',
  created_at timestamp with time zone default now()
);

alter table public.orders enable row level security;

create policy "Allow read orders" on public.orders
  for select using (true);

create policy "Allow insert orders" on public.orders
  for insert with check (true);

create policy "Allow update orders" on public.orders
  for update using (true);

alter publication supabase_realtime add table public.orders;
