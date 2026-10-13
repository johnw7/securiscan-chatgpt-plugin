-- STYLESHOP — schéma Supabase (PostgreSQL) prêt pour la production.
-- À exécuter dans l'éditeur SQL de Supabase. Les prix sont en centimes.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  first_name text, last_name text, phone text,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  label text, first_name text, last_name text, street text not null,
  postal_code text not null, city text not null, country text not null, phone text
);

create table public.products (
  id text primary key,
  name text not null, category text not null check (category in ('homme','femme','enfant','accessoires')),
  type text not null, price integer not null check (price > 0), compare_at_price integer,
  description text not null, details text[] not null default '{}',
  sizes text[] not null, colors jsonb not null, images text[] not null,
  stock integer not null default 0 check (stock >= 0), sold integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text unique not null,
  user_id uuid references auth.users,
  email text not null, customer jsonb not null, address jsonb not null,
  shipping_method text not null, subtotal integer not null, discount integer not null,
  shipping integer not null, total integer not null, promo_code text,
  status text not null default 'en_attente'
    check (status in ('en_attente','payee','en_preparation','expediee','livree','annulee')),
  stripe_session_id text unique,
  created_at timestamptz not null default now()
);

create table public.order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  product_id text not null references public.products,
  name text not null, size text not null, color text not null,
  quantity integer not null check (quantity > 0), unit_price integer not null
);

-- Rôle admin vérifié côté serveur
create or replace function public.is_admin() returns boolean
language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_lines enable row level security;

-- Profils : chacun lit/modifie le sien (sans pouvoir changer son rôle), l'admin lit tout
create policy "profil: lecture" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profil: maj" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- Adresses : propriétaire uniquement
create policy "adresses: propriétaire" on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Produits : lecture publique, écriture admin
create policy "produits: lecture" on public.products for select using (true);
create policy "produits: admin" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- Commandes : le client lit les siennes ; seul l'admin modifie le statut.
-- La création et le passage à « payee » se font côté serveur (clé service_role, webhook Stripe).
create policy "commandes: lecture" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "commandes: admin maj" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "lignes: lecture" on public.order_lines for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
