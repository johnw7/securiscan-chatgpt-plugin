-- =============================================================================
-- NOAMIS 360° — Migration 0100 : fondations
-- Organisations, profils, adhésions (rôles), fonctions d'autorisation,
-- journal d'audit append-only, numérotation, horodatage automatique.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- Schéma privé : fonctions d'autorisation, non exposé par l'API REST.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, anon, service_role;

-- -----------------------------------------------------------------------------
-- Utilitaires génériques
-- -----------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Organisations (le cabinet NOAMIS ; structure multi-organisation prête)
-- -----------------------------------------------------------------------------
create table public.organizations (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 2 and 200),
  legal_name       text,
  legal_form       text,
  siren            text check (siren is null or siren ~ '^[0-9]{9}$'),
  siret            text check (siret is null or siret ~ '^[0-9]{14}$'),
  vat_number       text,
  vat_regime       text not null default 'franchise'
                     check (vat_regime in ('franchise', 'normal')),
  rcs              text,
  address_line     text,
  postal_code      text,
  city             text,
  country          text not null default 'France',
  email            text,
  phone            text,
  website          text,
  iban             text,
  bic              text,
  is_default       boolean not null default false,
  numbering        jsonb not null default '{
      "quote":   {"prefix": "DEV", "padding": 4},
      "invoice": {"prefix": "FAC", "padding": 4},
      "credit":  {"prefix": "AV",  "padding": 4},
      "mission": {"prefix": "MIS", "padding": 3},
      "audit":   {"prefix": "AUD", "padding": 3},
      "project": {"prefix": "PRJ", "padding": 3}
    }'::jsonb,
  invoice_settings jsonb not null default '{
      "payment_terms_days": 30,
      "late_penalty_rate": "3 fois le taux d''intérêt légal",
      "recovery_fee": 40,
      "early_payment_discount": "Pas d''escompte pour paiement anticipé"
    }'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index organizations_single_default on public.organizations (is_default) where is_default;
create trigger organizations_updated_at before update on public.organizations
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Profils (1-1 avec auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  phone       text,
  job_title   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- -----------------------------------------------------------------------------
-- Adhésions : rôle d'un utilisateur dans une organisation
--   super_admin | admin | collaborator | client
-- Un compte « client » est rattaché à une fiche client (client_id).
-- -----------------------------------------------------------------------------
create table public.memberships (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  role             text not null check (role in ('super_admin', 'admin', 'collaborator', 'client')),
  client_id        uuid,  -- FK ajoutée après création de public.clients
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, user_id),
  constraint memberships_client_role_requires_client
    check ((role = 'client') = (client_id is not null))
);
create index memberships_user_idx on public.memberships (user_id) where active;
create trigger memberships_updated_at before update on public.memberships
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Fonctions d'autorisation (SECURITY DEFINER, search_path vide)
-- Les administrateurs n'obtiennent leurs privilèges qu'avec une session MFA (aal2).
-- -----------------------------------------------------------------------------
create or replace function private.jwt_aal()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce((select auth.jwt()) ->> 'aal', 'aal1');
$$;

create or replace function private.user_role(p_org uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select m.role
  from public.memberships m
  where m.organization_id = p_org
    and m.user_id = (select auth.uid())
    and m.active
  limit 1;
$$;

create or replace function private.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.organization_id
  from public.memberships m
  where m.user_id = (select auth.uid()) and m.active
  order by m.created_at
  limit 1;
$$;

create or replace function private.is_admin(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.user_role(p_org) in ('super_admin', 'admin'), false)
     and private.jwt_aal() = 'aal2';
$$;

create or replace function private.is_super_admin(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.user_role(p_org) = 'super_admin', false)
     and private.jwt_aal() = 'aal2';
$$;

-- Personnel NOAMIS : collaborateur, ou administrateur authentifié en MFA.
create or replace function private.is_staff(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case private.user_role(p_org)
           when 'collaborator' then true
           when 'admin' then private.jwt_aal() = 'aal2'
           when 'super_admin' then private.jwt_aal() = 'aal2'
           else false
         end;
$$;

-- Fiches clients auxquelles l'utilisateur (rôle client) est rattaché.
create or replace function private.my_client_ids()
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(m.client_id), '{}')
  from public.memberships m
  where m.user_id = (select auth.uid())
    and m.role = 'client'
    and m.active;
$$;

create or replace function private.is_client_of(p_client uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_client is not null and p_client = any (private.my_client_ids());
$$;

-- -----------------------------------------------------------------------------
-- Journal d'audit (append-only)
-- -----------------------------------------------------------------------------
create table public.audit_logs (
  id               bigint generated always as identity primary key,
  organization_id  uuid references public.organizations (id) on delete set null,
  actor_id         uuid,
  action           text not null,
  entity_type      text not null,
  entity_id        uuid,
  changes          jsonb,
  created_at       timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_org_idx on public.audit_logs (organization_id, created_at desc);

create or replace function private.forbid_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Table % en ajout seul : modification interdite', tg_table_name
    using errcode = 'insufficient_privilege';
end;
$$;

create trigger audit_logs_append_only
  before update or delete on public.audit_logs
  for each row execute function private.forbid_mutation();

-- Champs jamais journalisés (secrets, contenus volumineux).
create or replace function private.redact(p jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select p - array['password', 'token', 'token_hash', 'secret', 'answers', 'body', 'specification', 'minutes', 'updated_at'];
$$;

create or replace function private.log_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_diff jsonb := '{}'::jsonb;
  v_key text;
  v_org uuid;
  v_id uuid;
begin
  if tg_op = 'INSERT' then
    v_new := private.redact(to_jsonb(new));
    v_diff := v_new;
    v_org := (to_jsonb(new) ->> 'organization_id')::uuid;
    v_id := (to_jsonb(new) ->> 'id')::uuid;
  elsif tg_op = 'UPDATE' then
    v_old := private.redact(to_jsonb(old));
    v_new := private.redact(to_jsonb(new));
    for v_key in select jsonb_object_keys(v_new) loop
      if v_new -> v_key is distinct from v_old -> v_key then
        v_diff := v_diff || jsonb_build_object(v_key, jsonb_build_object('from', v_old -> v_key, 'to', v_new -> v_key));
      end if;
    end loop;
    if v_diff = '{}'::jsonb then
      return new;
    end if;
    v_org := (to_jsonb(new) ->> 'organization_id')::uuid;
    v_id := (to_jsonb(new) ->> 'id')::uuid;
  else
    v_diff := private.redact(to_jsonb(old));
    v_org := (to_jsonb(old) ->> 'organization_id')::uuid;
    v_id := (to_jsonb(old) ->> 'id')::uuid;
  end if;

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, changes)
  values (v_org, auth.uid(), lower(tg_op), tg_table_name, v_id, v_diff);

  return coalesce(new, old);
end;
$$;

create trigger memberships_audit after insert or update or delete on public.memberships
  for each row execute function private.log_change();
create trigger organizations_audit after insert or update on public.organizations
  for each row execute function private.log_change();

-- -----------------------------------------------------------------------------
-- Numérotation configurable, séquentielle et sans trou (par type et par année)
-- -----------------------------------------------------------------------------
create table public.number_sequences (
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  kind             text not null,
  year             int  not null,
  last_value       int  not null default 0,
  primary key (organization_id, kind, year)
);

create or replace function private.next_number(p_org uuid, p_kind text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_year int := extract(year from now())::int;
  v_value int;
  v_cfg jsonb;
  v_prefix text;
  v_padding int;
begin
  select numbering -> p_kind into v_cfg from public.organizations where id = p_org;
  v_prefix := coalesce(v_cfg ->> 'prefix', upper(left(p_kind, 3)));
  v_padding := coalesce((v_cfg ->> 'padding')::int, 4);

  insert into public.number_sequences as s (organization_id, kind, year, last_value)
  values (p_org, p_kind, v_year, 1)
  on conflict (organization_id, kind, year)
  do update set last_value = s.last_value + 1
  returning last_value into v_value;

  return v_prefix || '-' || v_year || '-' || lpad(v_value::text, v_padding, '0');
end;
$$;

-- Attribue une référence à l'insertion si absente (missions, audits, projets, devis).
create or replace function private.assign_reference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_col text := tg_argv[0];
  v_kind text := tg_argv[1];
  v_current text;
begin
  v_current := to_jsonb(new) ->> v_col;
  if v_current is null or v_current = '' then
    new := jsonb_populate_record(new, jsonb_build_object(v_col, private.next_number(new.organization_id, v_kind)));
  end if;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Génération des politiques RLS standard « personnel NOAMIS »
-- -----------------------------------------------------------------------------
create or replace function private.apply_staff_policies(p_table text, p_mission_scoped boolean default false)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_cond text;
begin
  v_cond := 'private.is_staff(organization_id)';
  if p_mission_scoped then
    v_cond := v_cond || ' and private.can_access_mission(mission_id)';
  end if;

  execute format('alter table public.%I enable row level security', p_table);
  execute format('create policy %I on public.%I for select to authenticated using (%s)',
                 'staff_select', p_table, v_cond);
  execute format('create policy %I on public.%I for insert to authenticated with check (%s)',
                 'staff_insert', p_table, v_cond);
  execute format('create policy %I on public.%I for update to authenticated using (%s) with check (%s)',
                 'staff_update', p_table, v_cond, v_cond);
  execute format('create policy %I on public.%I for delete to authenticated using (private.is_admin(organization_id)%s)',
                 'admin_delete', p_table,
                 case when p_mission_scoped then ' and private.can_access_mission(mission_id)' else '' end);
end;
$$;

-- -----------------------------------------------------------------------------
-- RLS des tables de fondation
-- -----------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.audit_logs enable row level security;
alter table public.number_sequences enable row level security;

create policy org_select on public.organizations for select to authenticated
  using (private.user_role(id) is not null);
create policy org_update on public.organizations for update to authenticated
  using (private.is_admin(id)) with check (private.is_admin(id));

create policy profiles_select_self on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_select_staff on public.profiles for select to authenticated
  using (exists (
    select 1 from public.memberships m
    where m.user_id = profiles.id and private.is_staff(m.organization_id)
  ));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy memberships_select_self on public.memberships for select to authenticated
  using (user_id = (select auth.uid()));
create policy memberships_select_staff on public.memberships for select to authenticated
  using (private.is_staff(organization_id));
create policy memberships_admin_insert on public.memberships for insert to authenticated
  with check (private.is_admin(organization_id)
              and (role <> 'super_admin' or private.is_super_admin(organization_id)));
create policy memberships_admin_update on public.memberships for update to authenticated
  using (private.is_admin(organization_id)
         and (role <> 'super_admin' or private.is_super_admin(organization_id)))
  with check (private.is_admin(organization_id)
              and (role <> 'super_admin' or private.is_super_admin(organization_id)));

create policy audit_logs_admin_select on public.audit_logs for select to authenticated
  using (private.is_admin(organization_id));
-- Aucune politique d'insertion : seuls les déclencheurs SECURITY DEFINER écrivent.

-- number_sequences : aucune politique (accès uniquement via private.next_number).

-- Les visiteurs anonymes n'ont aucun accès direct aux tables.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from anon;
