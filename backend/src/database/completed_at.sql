-- Add completed timestamp for finished orders
alter table public.orders add column if not exists completed_at timestamp with time zone;
