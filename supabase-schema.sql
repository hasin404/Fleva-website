-- ============================================================
-- FLEVA — Supabase database setup
-- Run this once in: Supabase dashboard → SQL Editor → New query → Run
-- ============================================================

-- Orders table: one row per order, tied to the logged-in user
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  customer_name text not null,
  phone text not null,
  email text not null,
  address text not null,
  city text not null,
  postal_code text not null,
  items jsonb not null,          -- [{ id, name, price, qty }, ...]
  subtotal numeric not null,
  delivery_fee numeric not null default 80,
  total numeric not null,
  payment_method text not null default 'cod',   -- 'cod' for now; 'bkash' / 'nagad' later
  status text not null default 'pending',        -- pending -> confirmed -> shipped -> delivered
  created_at timestamptz not null default now()
);

-- Turn on Row Level Security so users can only ever see/create their OWN orders
alter table orders enable row level security;

-- Policy: a logged-in user can insert an order for themselves
create policy "Users can create their own orders"
  on orders for insert
  with check (auth.uid() = user_id);

-- Policy: a logged-in user can view only their own orders
create policy "Users can view their own orders"
  on orders for select
  using (auth.uid() = user_id);

-- ============================================================
-- That's it. Your "orders" table is ready, and Supabase Auth
-- (email + password signup/login) is already built in — no
-- extra setup needed for that part.
-- ============================================================
