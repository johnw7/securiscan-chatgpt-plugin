-- NOAMIS 360° — schéma complet (concaténation des migrations, à exécuter UNE fois dans Supabase → SQL Editor)

-- ===== 20261119000100_foundation.sql =====
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
  user_id          uuid not null references public.profiles (id) on delete cascade,
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

-- ===== 20261119000200_pilot.sql =====
-- =============================================================================
-- NOAMIS 360° — Migration 0200 : NOAMIS PILOT (CRM, missions, tâches)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Clients
-- -----------------------------------------------------------------------------
create table public.clients (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  name             text not null check (char_length(name) between 2 and 200),
  category         text not null default 'entreprise'
                     check (category in ('particulier', 'commerce', 'entreprise', 'dirigeant', 'vip', 'collectivite')),
  status           text not null default 'actif' check (status in ('prospect', 'actif', 'inactif')),
  siren            text check (siren is null or siren ~ '^[0-9]{9}$'),
  siret            text check (siret is null or siret ~ '^[0-9]{14}$'),
  vat_number       text,
  sector           text,
  address_line     text,
  postal_code      text,
  city             text,
  country          text not null default 'France',
  email            text,
  phone            text,
  website          text,
  notes            text,
  owner_id         uuid references public.profiles (id) on delete set null,
  created_by       uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
create index clients_org_idx on public.clients (organization_id) where deleted_at is null;
create index clients_name_trgm on public.clients using gin (to_tsvector('simple', name));
create trigger clients_updated_at before update on public.clients for each row execute function private.set_updated_at();
create trigger clients_audit after insert or update or delete on public.clients for each row execute function private.log_change();

alter table public.memberships
  add constraint memberships_client_fk foreign key (client_id) references public.clients (id) on delete cascade;

-- -----------------------------------------------------------------------------
-- Contacts
-- -----------------------------------------------------------------------------
create table public.contacts (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  client_id        uuid not null references public.clients (id) on delete cascade,
  first_name       text not null,
  last_name        text not null,
  job_title        text,
  email            text,
  phone            text,
  is_primary       boolean not null default false,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
create index contacts_client_idx on public.contacts (client_id) where deleted_at is null;
create trigger contacts_updated_at before update on public.contacts for each row execute function private.set_updated_at();
create trigger contacts_audit after insert or update or delete on public.contacts for each row execute function private.log_change();

-- -----------------------------------------------------------------------------
-- Prospects / pipeline commercial
-- -----------------------------------------------------------------------------
create table public.leads (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null default private.current_org_id() references public.organizations (id),
  title                text not null,
  company              text,
  contact_name         text,
  email                text,
  phone                text,
  category             text check (category in ('particulier', 'commerce', 'entreprise', 'dirigeant', 'vip', 'collectivite')),
  source               text not null default 'autre'
                         check (source in ('protect', 'site', 'recommandation', 'reseau', 'salon', 'autre')),
  stage                text not null default 'nouveau'
                         check (stage in ('nouveau', 'qualifie', 'proposition', 'negociation', 'gagne', 'perdu')),
  estimated_amount     numeric(12, 2) check (estimated_amount is null or estimated_amount >= 0),
  probability          int check (probability between 0 and 100),
  expected_close_date  date,
  owner_id             uuid references public.profiles (id) on delete set null,
  client_id            uuid references public.clients (id) on delete set null,
  message              text,
  consent_at           timestamptz,
  lost_reason          text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);
create index leads_stage_idx on public.leads (organization_id, stage) where deleted_at is null;
create trigger leads_updated_at before update on public.leads for each row execute function private.set_updated_at();
create trigger leads_audit after insert or update or delete on public.leads for each row execute function private.log_change();

-- -----------------------------------------------------------------------------
-- Missions
-- -----------------------------------------------------------------------------
create table public.missions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  reference        text not null default '',
  client_id        uuid not null references public.clients (id),
  service_type     text not null check (service_type in (
                     'audit_surete', 'amoa', 'risk_intelligence', 'solutions_securite',
                     'pilotage_projet', 'gestion_crise', 'prevention_cambriolage', 'autre')),
  title            text not null check (char_length(title) between 3 and 200),
  description      text,
  manager_id       uuid references public.profiles (id) on delete set null,
  start_date       date,
  end_date         date,
  budget           numeric(12, 2) check (budget is null or budget >= 0),
  status           text not null default 'brouillon'
                     check (status in ('brouillon', 'planifiee', 'en_cours', 'en_pause', 'terminee', 'annulee')),
  progress         int not null default 0 check (progress between 0 and 100),
  is_confidential  boolean not null default false,
  client_visible   boolean not null default true,
  created_by       uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  unique (organization_id, reference),
  constraint missions_dates check (end_date is null or start_date is null or end_date >= start_date)
);
create index missions_client_idx on public.missions (client_id) where deleted_at is null;
create index missions_status_idx on public.missions (organization_id, status) where deleted_at is null;
create trigger missions_reference before insert on public.missions
  for each row execute function private.assign_reference('reference', 'mission');
create trigger missions_updated_at before update on public.missions for each row execute function private.set_updated_at();
create trigger missions_audit after insert or update or delete on public.missions for each row execute function private.log_change();

create table public.mission_members (
  mission_id       uuid not null references public.missions (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  organization_id  uuid not null references public.organizations (id),
  created_at       timestamptz not null default now(),
  primary key (mission_id, user_id)
);
create trigger mission_members_audit after insert or delete on public.mission_members
  for each row execute function private.log_change();

-- Accès d'un membre du personnel à une mission (confidentialité).
create or replace function private.can_access_mission(p_mission uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_mission is null or exists (
    select 1 from public.missions m
    where m.id = p_mission
      and (
        private.is_admin(m.organization_id)
        or (private.is_staff(m.organization_id) and (
              not m.is_confidential
              or m.manager_id = (select auth.uid())
              or m.created_by = (select auth.uid())
              or exists (select 1 from public.mission_members mm
                         where mm.mission_id = m.id and mm.user_id = (select auth.uid()))
        ))
      )
  );
$$;

-- Mission visible par le client connecté.
create or replace function private.client_can_see_mission(p_mission uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.missions m
    where m.id = p_mission
      and m.client_visible
      and m.deleted_at is null
      and m.client_id = any (private.my_client_ids())
  );
$$;

-- -----------------------------------------------------------------------------
-- Tâches et échéances
-- -----------------------------------------------------------------------------
create table public.tasks (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  mission_id       uuid references public.missions (id) on delete cascade,
  project_id       uuid,  -- FK ajoutée dans la migration PROJECT
  client_id        uuid references public.clients (id) on delete cascade,
  title            text not null check (char_length(title) between 2 and 300),
  description      text,
  assignee_id      uuid references public.profiles (id) on delete set null,
  due_date         date,
  priority         text not null default 'normale' check (priority in ('basse', 'normale', 'haute', 'critique')),
  status           text not null default 'a_faire' check (status in ('a_faire', 'en_cours', 'terminee', 'annulee')),
  client_visible   boolean not null default false,
  completed_at     timestamptz,
  created_by       uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index tasks_due_idx on public.tasks (organization_id, due_date) where status in ('a_faire', 'en_cours');
create index tasks_mission_idx on public.tasks (mission_id);
create trigger tasks_updated_at before update on public.tasks for each row execute function private.set_updated_at();
create trigger tasks_audit after insert or update or delete on public.tasks for each row execute function private.log_change();

-- -----------------------------------------------------------------------------
-- Notes internes (jamais visibles par les clients)
-- -----------------------------------------------------------------------------
create table public.notes (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  client_id        uuid references public.clients (id) on delete cascade,
  mission_id       uuid references public.missions (id) on delete cascade,
  lead_id          uuid references public.leads (id) on delete cascade,
  body             text not null check (char_length(body) between 1 and 10000),
  author_id        uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index notes_client_idx on public.notes (client_id);
create index notes_mission_idx on public.notes (mission_id);
create trigger notes_updated_at before update on public.notes for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Calendrier
-- -----------------------------------------------------------------------------
create table public.calendar_events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  title            text not null,
  kind             text not null default 'rendez_vous'
                     check (kind in ('rendez_vous', 'visite_site', 'reunion', 'echeance', 'interne')),
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  location         text,
  description      text,
  client_id        uuid references public.clients (id) on delete set null,
  mission_id       uuid references public.missions (id) on delete cascade,
  owner_id         uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint calendar_events_dates check (ends_at >= starts_at)
);
create index calendar_events_range_idx on public.calendar_events (organization_id, starts_at);
create trigger calendar_events_updated_at before update on public.calendar_events for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Notifications (par utilisateur)
-- -----------------------------------------------------------------------------
create table public.notifications (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  title            text not null,
  body             text,
  link             text check (link is null or link ~ '^/[A-Za-z0-9/_?=&.#-]*$'),
  read_at          timestamptz,
  created_at       timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create or replace function private.notify(p_org uuid, p_user uuid, p_title text, p_body text, p_link text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (organization_id, user_id, title, body, link)
  select p_org, p_user, p_title, p_body, p_link
  where p_user is not null;
$$;

-- Notifie l'assigné d'une tâche.
create or replace function private.notify_task_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assignee_id is not null
     and new.assignee_id is distinct from auth.uid()
     and (tg_op = 'INSERT' or new.assignee_id is distinct from old.assignee_id) then
    perform private.notify(new.organization_id, new.assignee_id,
      'Nouvelle tâche assignée', new.title, '/pilot/tasks');
  end if;
  return new;
end;
$$;
create trigger tasks_notify after insert or update of assignee_id on public.tasks
  for each row execute function private.notify_task_assignee();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
select private.apply_staff_policies('clients');
select private.apply_staff_policies('contacts');
select private.apply_staff_policies('leads');
select private.apply_staff_policies('calendar_events', true);
select private.apply_staff_policies('notes', true);
select private.apply_staff_policies('tasks', true);

-- Missions : la confidentialité s'applique à la ligne elle-même.
alter table public.missions enable row level security;
-- Conditions écrites sur les colonnes de la ligne (et non via une relecture par id)
-- pour rester valides lors d'un INSERT … RETURNING.
create or replace function private.staff_mission_row_access(p_org uuid, p_id uuid, p_confidential boolean, p_manager uuid, p_creator uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin(p_org)
      or (private.is_staff(p_org) and (
            not p_confidential
            or p_manager = (select auth.uid())
            or p_creator = (select auth.uid())
            or exists (select 1 from public.mission_members mm where mm.mission_id = p_id and mm.user_id = (select auth.uid()))));
$$;
create policy staff_select on public.missions for select to authenticated
  using (private.staff_mission_row_access(organization_id, id, is_confidential, manager_id, created_by));
create policy staff_insert on public.missions for insert to authenticated
  with check (private.is_staff(organization_id));
create policy staff_update on public.missions for update to authenticated
  using (private.staff_mission_row_access(organization_id, id, is_confidential, manager_id, created_by))
  with check (private.is_staff(organization_id));
create policy admin_delete on public.missions for delete to authenticated
  using (private.is_admin(organization_id));
create policy client_select on public.missions for select to authenticated
  using (client_visible and deleted_at is null and private.is_client_of(client_id));

alter table public.mission_members enable row level security;
create policy staff_select on public.mission_members for select to authenticated
  using (private.can_access_mission(mission_id));
create policy manage_members on public.mission_members for insert to authenticated
  with check (private.is_admin(organization_id) or exists (
    select 1 from public.missions m where m.id = mission_id and m.manager_id = (select auth.uid())));
create policy remove_members on public.mission_members for delete to authenticated
  using (private.is_admin(organization_id) or exists (
    select 1 from public.missions m where m.id = mission_id and m.manager_id = (select auth.uid())));

-- Accès client en lecture seule.
create policy client_select on public.clients for select to authenticated
  using (deleted_at is null and private.is_client_of(id));
create policy client_select on public.tasks for select to authenticated
  using (client_visible and mission_id is not null and private.client_can_see_mission(mission_id));

-- Notifications : chacun ne voit et ne marque que les siennes.
alter table public.notifications enable row level security;
create policy own_select on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy own_update on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy staff_insert on public.notifications for insert to authenticated
  with check (private.is_staff(organization_id));

-- ===== 20261119000300_audit.sql =====
-- =============================================================================
-- NOAMIS 360° — Migration 0300 : NOAMIS AUDIT
-- =============================================================================

-- Modèles de questionnaires et méthode de cotation configurable.
-- questions : [{ "id": "ca-1", "category": "controle_acces", "label": "...", "type": "yes_no|scale|text", "weight": 1 }]
-- scoring   : { "likelihood": {"min":1,"max":4,"labels":[...]}, "impact": {...},
--               "levels": [{"min":1,"max":3,"label":"Faible"}, ...] }
create table public.audit_templates (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  name             text not null,
  description      text,
  version          int not null default 1,
  categories       jsonb not null default '[]'::jsonb,
  questions        jsonb not null default '[]'::jsonb,
  scoring          jsonb not null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint audit_templates_questions_array check (jsonb_typeof(questions) = 'array'),
  constraint audit_templates_scoring_object check (jsonb_typeof(scoring) = 'object')
);
create trigger audit_templates_updated_at before update on public.audit_templates for each row execute function private.set_updated_at();
create trigger audit_templates_audit after insert or update or delete on public.audit_templates for each row execute function private.log_change();

create table public.audits (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null default private.current_org_id() references public.organizations (id),
  reference         text not null default '',
  client_id         uuid not null references public.clients (id),
  mission_id        uuid references public.missions (id),
  template_id       uuid references public.audit_templates (id),
  title             text not null,
  site_name         text,
  site_address      text,
  audit_date        date,
  auditor_id        uuid references public.profiles (id) on delete set null,
  status            text not null default 'brouillon'
                      check (status in ('brouillon', 'en_cours', 'en_revue', 'valide', 'archive')),
  answers           jsonb not null default '{}'::jsonb,
  methodology       text,
  context           text,
  summary           text,
  scoring_snapshot  jsonb,
  draft_version     int not null default 1,
  validated_by      uuid references public.profiles (id) on delete set null,
  validated_at      timestamptz,
  created_by        uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  unique (organization_id, reference),
  constraint audits_validation_consistency check ((status = 'valide') <= (validated_by is not null and validated_at is not null))
);
create index audits_client_idx on public.audits (client_id) where deleted_at is null;
create trigger audits_reference before insert on public.audits
  for each row execute function private.assign_reference('reference', 'audit');
create trigger audits_updated_at before update on public.audits for each row execute function private.set_updated_at();
create trigger audits_audit after insert or update or delete on public.audits for each row execute function private.log_change();

-- Incrémente la version de brouillon à chaque sauvegarde (contrôle de concurrence optimiste).
create or replace function private.bump_draft_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.answers is distinct from old.answers then
    new.draft_version := old.draft_version + 1;
  end if;
  return new;
end;
$$;
create trigger audits_draft_version before update on public.audits for each row execute function private.bump_draft_version();

create table public.audit_observations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  audit_id         uuid not null references public.audits (id) on delete cascade,
  category         text not null,
  title            text not null,
  description      text,
  location         text,
  is_vulnerability boolean not null default false,
  photo_paths      text[] not null default '{}',
  position         int not null default 0,
  created_by       uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint audit_observations_photos_limit check (cardinality(photo_paths) <= 20)
);
create index audit_observations_audit_idx on public.audit_observations (audit_id, position);
create trigger audit_observations_updated_at before update on public.audit_observations for each row execute function private.set_updated_at();
create trigger audit_observations_audit after insert or update or delete on public.audit_observations for each row execute function private.log_change();

create table public.risk_assessments (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  audit_id         uuid not null references public.audits (id) on delete cascade,
  observation_id   uuid references public.audit_observations (id) on delete set null,
  category         text not null,
  threat           text not null,
  vulnerability    text,
  likelihood       int not null check (likelihood between 1 and 10),
  impact           int not null check (impact between 1 and 10),
  score            int generated always as (likelihood * impact) stored,
  level            text not null,
  justification    text not null check (char_length(justification) >= 10),
  criteria         jsonb not null default '{}'::jsonb,
  is_validated     boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index risk_assessments_audit_idx on public.risk_assessments (audit_id);
create trigger risk_assessments_updated_at before update on public.risk_assessments for each row execute function private.set_updated_at();
create trigger risk_assessments_audit after insert or update or delete on public.risk_assessments for each row execute function private.log_change();

create table public.recommendations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  audit_id         uuid not null references public.audits (id) on delete cascade,
  risk_id          uuid references public.risk_assessments (id) on delete set null,
  title            text not null,
  description      text,
  priority         text not null default 'P2' check (priority in ('P1', 'P2', 'P3', 'P4')),
  horizon          text check (horizon in ('immediat', '3_mois', '6_mois', '12_mois', 'long_terme')),
  estimated_cost   numeric(12, 2) check (estimated_cost is null or estimated_cost >= 0),
  owner            text,
  status           text not null default 'proposee'
                     check (status in ('proposee', 'acceptee', 'en_cours', 'realisee', 'rejetee')),
  due_date         date,
  completed_at     timestamptz,
  client_visible   boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index recommendations_audit_idx on public.recommendations (audit_id);
create trigger recommendations_updated_at before update on public.recommendations for each row execute function private.set_updated_at();
create trigger recommendations_audit after insert or update or delete on public.recommendations for each row execute function private.log_change();

-- Les observations / risques / recommandations héritent de l'organisation de l'audit.
create or replace function private.inherit_audit_org()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select a.organization_id into new.organization_id from public.audits a where a.id = new.audit_id;
  return new;
end;
$$;
create trigger audit_observations_org before insert on public.audit_observations for each row execute function private.inherit_audit_org();
create trigger risk_assessments_org before insert on public.risk_assessments for each row execute function private.inherit_audit_org();
create trigger recommendations_org before insert on public.recommendations for each row execute function private.inherit_audit_org();

-- Validation d'un audit par un consultant : fige la méthode et valide les cotations.
create or replace function public.validate_audit(p_audit uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_audit public.audits;
begin
  select * into v_audit from public.audits where id = p_audit and deleted_at is null;
  if not found or not private.is_staff(v_audit.organization_id) or not private.can_access_mission(v_audit.mission_id) then
    raise exception 'Audit introuvable ou accès refusé' using errcode = 'insufficient_privilege';
  end if;
  if v_audit.status = 'valide' then
    return;
  end if;
  if not exists (select 1 from public.risk_assessments where audit_id = p_audit) then
    raise exception 'Au moins une cotation de risque est requise avant validation' using errcode = 'check_violation';
  end if;

  update public.risk_assessments set is_validated = true where audit_id = p_audit;
  update public.audits
     set status = 'valide',
         validated_by = auth.uid(),
         validated_at = now(),
         scoring_snapshot = (select t.scoring from public.audit_templates t where t.id = v_audit.template_id)
   where id = p_audit;
end;
$$;
revoke execute on function public.validate_audit(uuid) from public, anon;
grant execute on function public.validate_audit(uuid) to authenticated;

-- Helper : audit accessible au personnel (confidentialité de la mission liée).
create or replace function private.staff_can_access_audit(p_audit uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.audits a
    where a.id = p_audit and private.is_staff(a.organization_id) and private.can_access_mission(a.mission_id)
  );
$$;

create or replace function private.client_can_see_audit(p_audit uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.audits a
    where a.id = p_audit and a.status = 'valide' and a.deleted_at is null
      and private.is_client_of(a.client_id)
  );
$$;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
select private.apply_staff_policies('audit_templates');
select private.apply_staff_policies('audits', true);

do $$
declare t text;
begin
  foreach t in array array['audit_observations', 'risk_assessments', 'recommendations'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy staff_all on public.%I for all to authenticated using (private.staff_can_access_audit(audit_id)) with check (private.staff_can_access_audit(audit_id))', t);
  end loop;
end $$;

-- Le client ne voit que les audits validés, et uniquement les recommandations
-- marquées visibles (pour le suivi des mesures correctives).
create policy client_select on public.audits for select to authenticated
  using (status = 'valide' and deleted_at is null and private.is_client_of(client_id));
create policy client_select on public.recommendations for select to authenticated
  using (client_visible and private.client_can_see_audit(audit_id));

-- ===== 20261119000400_project.sql =====
-- =============================================================================
-- NOAMIS 360° — Migration 0400 : NOAMIS PROJECT (AMOA et coordination)
-- =============================================================================

create table public.projects (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null default private.current_org_id() references public.organizations (id),
  reference         text not null default '',
  client_id         uuid not null references public.clients (id),
  mission_id        uuid references public.missions (id),
  name              text not null check (char_length(name) between 3 and 200),
  description       text,
  phase             text not null default 'cadrage' check (phase in (
                      'cadrage', 'analyse_risques', 'orientations', 'cahier_des_charges', 'consultation',
                      'analyse_offres', 'suivi_execution', 'reception', 'cloture')),
  status            text not null default 'actif' check (status in ('actif', 'en_pause', 'clos', 'abandonne')),
  budget            numeric(12, 2) check (budget is null or budget >= 0),
  start_date        date,
  end_date          date,
  specification     text,
  reception_date    date,
  reception_notes   text,
  closed_at         timestamptz,
  closure_notes     text,
  client_visible    boolean not null default true,
  created_by        uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  unique (organization_id, reference)
);
create trigger projects_reference before insert on public.projects
  for each row execute function private.assign_reference('reference', 'project');
create trigger projects_updated_at before update on public.projects for each row execute function private.set_updated_at();
create trigger projects_audit after insert or update or delete on public.projects for each row execute function private.log_change();

alter table public.tasks
  add constraint tasks_project_fk foreign key (project_id) references public.projects (id) on delete cascade;

create or replace function private.staff_can_access_project(p_project uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project and private.is_staff(p.organization_id) and private.can_access_mission(p.mission_id)
  );
$$;

create or replace function private.client_can_see_project(p_project uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project and p.client_visible and p.deleted_at is null and private.is_client_of(p.client_id)
  );
$$;

create or replace function private.inherit_project_org()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select p.organization_id into new.organization_id from public.projects p where p.id = new.project_id;
  return new;
end;
$$;

create table public.milestones (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  project_id       uuid not null references public.projects (id) on delete cascade,
  title            text not null,
  due_date         date,
  completed_at     timestamptz,
  status           text not null default 'a_venir' check (status in ('a_venir', 'en_cours', 'atteint', 'en_retard', 'annule')),
  position         int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index milestones_project_idx on public.milestones (project_id, position);

-- Prestataires (choisis et contractés directement par le client ; NOAMIS ne vend pas d'équipement)
create table public.vendors (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  name             text not null,
  specialty        text,
  siret            text check (siret is null or siret ~ '^[0-9]{14}$'),
  email            text,
  phone            text,
  address_line     text,
  city             text,
  certifications   text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

-- Critères de sélection pondérés (somme des poids = 100 recommandée)
create table public.selection_criteria (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  project_id       uuid not null references public.projects (id) on delete cascade,
  label            text not null,
  weight           numeric(5, 2) not null check (weight > 0 and weight <= 100),
  position         int not null default 0
);

-- Offres reçues des prestataires ; scores : { "<criterion_id>": 0..10 }
create table public.vendor_offers (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  project_id       uuid not null references public.projects (id) on delete cascade,
  vendor_id        uuid not null references public.vendors (id),
  amount_ht        numeric(12, 2) not null check (amount_ht >= 0),
  received_at      date,
  delay_weeks      int check (delay_weeks is null or delay_weeks >= 0),
  scope_notes      text,
  strengths        text,
  weaknesses       text,
  scores           jsonb not null default '{}'::jsonb,
  is_selected      boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (project_id, vendor_id)
);
create unique index vendor_offers_one_selected on public.vendor_offers (project_id) where is_selected;

create table public.project_meetings (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  project_id       uuid not null references public.projects (id) on delete cascade,
  title            text not null,
  held_at          timestamptz not null,
  location         text,
  attendees        text,
  minutes          text,
  client_visible   boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Décisions, actions correctives et réserves : historique conservé (pas de suppression).
create table public.project_decisions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  project_id       uuid not null references public.projects (id) on delete cascade,
  meeting_id       uuid references public.project_meetings (id) on delete set null,
  kind             text not null check (kind in ('decision', 'action_corrective', 'reserve')),
  title            text not null,
  description      text,
  decided_by       text,
  decided_at       date not null default current_date,
  owner            text,
  due_date         date,
  status           text not null default 'ouverte' check (status in ('ouverte', 'en_cours', 'levee', 'close')),
  resolved_at      timestamptz,
  created_by       uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index project_decisions_project_idx on public.project_decisions (project_id, decided_at desc);

do $$
declare t text;
begin
  foreach t in array array['milestones', 'selection_criteria', 'vendor_offers', 'project_meetings', 'project_decisions'] loop
    execute format('create trigger %I before insert on public.%I for each row execute function private.inherit_project_org()', t || '_org', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function private.log_change()', t || '_audit', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy staff_all on public.%I for all to authenticated using (private.staff_can_access_project(project_id)) with check (private.staff_can_access_project(project_id))', t);
  end loop;
  foreach t in array array['milestones', 'vendor_offers', 'project_meetings', 'project_decisions'] loop
    execute format('create trigger %I before update on public.%I for each row execute function private.set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;

-- Pas de suppression des décisions : historique intégral.
drop policy staff_all on public.project_decisions;
create policy staff_select on public.project_decisions for select to authenticated using (private.staff_can_access_project(project_id));
create policy staff_insert on public.project_decisions for insert to authenticated with check (private.staff_can_access_project(project_id));
create policy staff_update on public.project_decisions for update to authenticated
  using (private.staff_can_access_project(project_id)) with check (private.staff_can_access_project(project_id));

create trigger vendors_updated_at before update on public.vendors for each row execute function private.set_updated_at();
create trigger vendors_audit after insert or update or delete on public.vendors for each row execute function private.log_change();

select private.apply_staff_policies('projects', true);
select private.apply_staff_policies('vendors');

-- Accès client : projet, jalons, réunions marquées visibles, décisions et réserves.
create policy client_select on public.projects for select to authenticated
  using (client_visible and deleted_at is null and private.is_client_of(client_id));
create policy client_select on public.milestones for select to authenticated
  using (private.client_can_see_project(project_id));
create policy client_select on public.project_meetings for select to authenticated
  using (client_visible and private.client_can_see_project(project_id));
create policy client_select on public.project_decisions for select to authenticated
  using (private.client_can_see_project(project_id));

-- Clôture de projet.
create or replace function public.close_project(p_project uuid, p_notes text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.staff_can_access_project(p_project) then
    raise exception 'Accès refusé' using errcode = 'insufficient_privilege';
  end if;
  if exists (select 1 from public.project_decisions
             where project_id = p_project and kind = 'reserve' and status not in ('levee', 'close')) then
    raise exception 'Des réserves restent ouvertes : levez-les avant la clôture' using errcode = 'check_violation';
  end if;
  update public.projects
     set status = 'clos', phase = 'cloture', closed_at = now(), closure_notes = p_notes
   where id = p_project;
end;
$$;
revoke execute on function public.close_project(uuid, text) from public, anon;
grant execute on function public.close_project(uuid, text) to authenticated;

-- ===== 20261119000500_intelligence.sql =====
-- =============================================================================
-- NOAMIS 360° — Migration 0500 : NOAMIS INTELLIGENCE (veille et analyse)
-- =============================================================================

-- Répertoire de sources publiques. Fiabilité selon le code de l'Amirauté (A à F)
-- et crédibilité de l'information (1 à 6).
create table public.intelligence_sources (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  name             text not null,
  url              text not null check (url ~ '^https://'),
  feed_url         text check (feed_url is null or feed_url ~ '^https://'),
  kind             text not null default 'site'
                     check (kind in ('institutionnel', 'presse', 'specialise', 'flux_rss', 'reseau', 'autre')),
  themes           text[] not null default '{}',
  reliability      text not null default 'F' check (reliability in ('A', 'B', 'C', 'D', 'E', 'F')),
  access_terms     text,
  collection_allowed boolean not null default false,
  is_active        boolean not null default true,
  last_collected_at timestamptz,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
create trigger intelligence_sources_updated_at before update on public.intelligence_sources for each row execute function private.set_updated_at();
create trigger intelligence_sources_audit after insert or update or delete on public.intelligence_sources for each row execute function private.log_change();

-- Contenus collectés (titre, lien, date, extrait) — jamais de copie intégrale.
create table public.intelligence_items (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  source_id        uuid not null references public.intelligence_sources (id) on delete cascade,
  title            text not null,
  url              text not null check (url ~ '^https?://'),
  published_at     timestamptz,
  collected_at     timestamptz not null default now(),
  excerpt          text check (excerpt is null or char_length(excerpt) <= 1200),
  theme            text,
  credibility      int check (credibility between 1 and 6),
  status           text not null default 'nouveau' check (status in ('nouveau', 'retenu', 'ecarte', 'archive')),
  created_at       timestamptz not null default now(),
  unique (source_id, url)
);
create index intelligence_items_status_idx on public.intelligence_items (organization_id, status, published_at desc);

create or replace function private.inherit_source_org()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select s.organization_id into new.organization_id from public.intelligence_sources s where s.id = new.source_id;
  return new;
end;
$$;
create trigger intelligence_items_org before insert on public.intelligence_items for each row execute function private.inherit_source_org();

-- Fiches de veille, bulletins et alertes.
-- references : [{ "title": "...", "url": "https://...", "date": "2026-11-01", "source": "...", "reliability": "B", "credibility": 2 }]
create table public.intelligence_reports (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  kind             text not null check (kind in ('fiche', 'bulletin', 'alerte')),
  title            text not null,
  summary          text,
  body             text,
  themes           text[] not null default '{}',
  severity         text check (severity in ('information', 'vigilance', 'alerte')),
  source_refs      jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  ai_generated     boolean not null default false,
  status           text not null default 'brouillon'
                     check (status in ('brouillon', 'en_revue', 'valide', 'diffuse', 'archive')),
  validated_by     uuid references public.profiles (id) on delete set null,
  validated_at     timestamptz,
  published_at     timestamptz,
  author_id        uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Un contenu (notamment généré par IA) ne peut être diffusé sans validation humaine.
  constraint intelligence_reports_validated_before_diffusion
    check (status not in ('valide', 'diffuse') or (validated_by is not null and validated_at is not null))
);
create index intelligence_reports_status_idx on public.intelligence_reports (organization_id, status, created_at desc);
create trigger intelligence_reports_updated_at before update on public.intelligence_reports for each row execute function private.set_updated_at();
create trigger intelligence_reports_audit after insert or update or delete on public.intelligence_reports for each row execute function private.log_change();

-- Diffusion aux clients autorisés.
create table public.intelligence_report_recipients (
  report_id        uuid not null references public.intelligence_reports (id) on delete cascade,
  client_id        uuid not null references public.clients (id) on delete cascade,
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  sent_at          timestamptz not null default now(),
  primary key (report_id, client_id)
);

-- Toute modification de contenu d'un rapport validé le renvoie en brouillon.
create or replace function private.reset_report_validation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status in ('valide', 'diffuse')
     and (new.body is distinct from old.body or new.summary is distinct from old.summary
          or new.title is distinct from old.title or new.source_refs is distinct from old.source_refs) then
    new.status := 'brouillon';
    new.validated_by := null;
    new.validated_at := null;
  end if;
  return new;
end;
$$;
create trigger intelligence_reports_reset before update on public.intelligence_reports
  for each row execute function private.reset_report_validation();

select private.apply_staff_policies('intelligence_sources');
select private.apply_staff_policies('intelligence_reports');

alter table public.intelligence_items enable row level security;
create policy staff_all on public.intelligence_items for all to authenticated
  using (private.is_staff(organization_id)) with check (private.is_staff(organization_id));

alter table public.intelligence_report_recipients enable row level security;
create policy staff_all on public.intelligence_report_recipients for all to authenticated
  using (private.is_staff(organization_id)) with check (private.is_staff(organization_id));
create policy client_select on public.intelligence_report_recipients for select to authenticated
  using (private.is_client_of(client_id));

-- Le client ne voit que les rapports diffusés et qui lui sont destinés.
create policy client_select on public.intelligence_reports for select to authenticated
  using (status = 'diffuse' and exists (
    select 1 from public.intelligence_report_recipients r
    where r.report_id = intelligence_reports.id and private.is_client_of(r.client_id)));

-- Diffusion : uniquement un rapport validé, uniquement par le personnel.
create or replace function public.publish_intelligence_report(p_report uuid, p_clients uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.intelligence_reports;
begin
  select * into v from public.intelligence_reports where id = p_report;
  if not found or not private.is_staff(v.organization_id) then
    raise exception 'Accès refusé' using errcode = 'insufficient_privilege';
  end if;
  if v.status not in ('valide', 'diffuse') then
    raise exception 'Le rapport doit être validé avant diffusion' using errcode = 'check_violation';
  end if;
  insert into public.intelligence_report_recipients (report_id, client_id, organization_id)
  select p_report, c.id, v.organization_id
  from public.clients c
  where c.id = any (p_clients) and c.organization_id = v.organization_id and c.deleted_at is null
  on conflict do nothing;
  update public.intelligence_reports set status = 'diffuse', published_at = coalesce(published_at, now()) where id = p_report;
end;
$$;
revoke execute on function public.publish_intelligence_report(uuid, uuid[]) from public, anon;
grant execute on function public.publish_intelligence_report(uuid, uuid[]) to authenticated;

-- ===== 20261119000600_finance.sql =====
-- =============================================================================
-- NOAMIS 360° — Migration 0600 : NOAMIS FINANCE
-- Les montants sont recalculés en base (numeric) : la base est la source de vérité.
-- Règle d'arrondi (identique à src/features/finance/calc.ts) :
--   ligne HT = arrondi(qté × PU × (1 − remise ligne %), 2)
--   par taux de TVA : base = arrondi(Σ lignes × (1 − remise globale %), 2) ; TVA = arrondi(base × taux %, 2)
--   total HT = Σ bases ; total TVA = Σ TVA ; TTC = HT + TVA
-- =============================================================================

create table public.service_catalog (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  code             text not null,
  name             text not null,
  description      text,
  service_type     text,
  unit             text not null default 'forfait',
  unit_price       numeric(12, 2) not null check (unit_price >= 0),
  vat_rate         numeric(5, 2) not null default 20 check (vat_rate in (0, 2.1, 5.5, 10, 20)),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, code)
);
create trigger service_catalog_updated_at before update on public.service_catalog for each row execute function private.set_updated_at();
create trigger service_catalog_audit after insert or update or delete on public.service_catalog for each row execute function private.log_change();

-- -----------------------------------------------------------------------------
-- Calcul des totaux (fonction pure)
-- p_lines : [{ "quantity": n, "unit_price": n, "discount_rate": n, "vat_rate": n }]
-- -----------------------------------------------------------------------------
create or replace function private.compute_totals(p_lines jsonb, p_discount numeric)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  with lines as (
    select round((l ->> 'quantity')::numeric * (l ->> 'unit_price')::numeric
                 * (1 - coalesce((l ->> 'discount_rate')::numeric, 0) / 100), 2) as line_ht,
           coalesce((l ->> 'vat_rate')::numeric, 0) as vat_rate
    from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) l
  ),
  groups as (
    select vat_rate,
           sum(line_ht) as raw,
           round(sum(line_ht) * (1 - coalesce(p_discount, 0) / 100), 2) as base
    from lines
    group by vat_rate
  ),
  vat as (
    select vat_rate, raw, base, round(base * vat_rate / 100, 2) as vat_amount from groups
  )
  select jsonb_build_object(
    'subtotal_ht', coalesce((select sum(raw) from vat), 0),
    'total_ht', coalesce((select sum(base) from vat), 0),
    'discount_amount', coalesce((select sum(raw) - sum(base) from vat), 0),
    'total_vat', coalesce((select sum(vat_amount) from vat), 0),
    'total_ttc', coalesce((select sum(base) + sum(vat_amount) from vat), 0),
    'vat_breakdown', coalesce((select jsonb_agg(jsonb_build_object('rate', vat_rate, 'base', base, 'vat', vat_amount) order by vat_rate) from vat), '[]'::jsonb)
  );
$$;

-- -----------------------------------------------------------------------------
-- Devis
-- -----------------------------------------------------------------------------
create table public.quotes (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null default private.current_org_id() references public.organizations (id),
  number            text not null default '',
  client_id         uuid not null references public.clients (id),
  mission_id        uuid references public.missions (id),
  lead_id           uuid references public.leads (id) on delete set null,
  title             text not null,
  status            text not null default 'brouillon'
                      check (status in ('brouillon', 'envoye', 'accepte', 'refuse', 'expire', 'converti')),
  issue_date        date not null default current_date,
  valid_until       date,
  discount_rate     numeric(5, 2) not null default 0 check (discount_rate between 0 and 100),
  introduction      text,
  terms             text,
  payment_terms     text,
  subtotal_ht       numeric(12, 2) not null default 0,
  discount_amount   numeric(12, 2) not null default 0,
  total_ht          numeric(12, 2) not null default 0,
  total_vat         numeric(12, 2) not null default 0,
  total_ttc         numeric(12, 2) not null default 0,
  vat_breakdown     jsonb not null default '[]'::jsonb,
  sent_at           timestamptz,
  responded_at      timestamptz,
  response_comment  text,
  created_by        uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  unique (organization_id, number),
  constraint quotes_validity check (valid_until is null or valid_until >= issue_date)
);
create trigger quotes_number before insert on public.quotes
  for each row execute function private.assign_reference('number', 'quote');
create trigger quotes_updated_at before update on public.quotes for each row execute function private.set_updated_at();
create trigger quotes_audit after insert or update or delete on public.quotes for each row execute function private.log_change();

create table public.quote_items (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  quote_id         uuid not null references public.quotes (id) on delete cascade,
  position         int not null default 0,
  catalog_item_id  uuid references public.service_catalog (id) on delete set null,
  description      text not null check (char_length(description) between 1 and 2000),
  quantity         numeric(12, 3) not null check (quantity > 0),
  unit             text not null default 'forfait',
  unit_price       numeric(12, 2) not null check (unit_price >= 0),
  discount_rate    numeric(5, 2) not null default 0 check (discount_rate between 0 and 100),
  vat_rate         numeric(5, 2) not null default 20 check (vat_rate in (0, 2.1, 5.5, 10, 20)),
  total_ht         numeric(12, 2) generated always as (round(quantity * unit_price * (1 - discount_rate / 100), 2)) stored
);
create index quote_items_quote_idx on public.quote_items (quote_id, position);

-- -----------------------------------------------------------------------------
-- Factures et avoirs
-- -----------------------------------------------------------------------------
create table public.invoices (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null default private.current_org_id() references public.organizations (id),
  number               text,
  kind                 text not null default 'facture' check (kind in ('facture', 'avoir')),
  client_id            uuid not null references public.clients (id),
  mission_id           uuid references public.missions (id),
  quote_id             uuid references public.quotes (id),
  credited_invoice_id  uuid references public.invoices (id),
  title                text not null,
  status               text not null default 'brouillon'
                         check (status in ('brouillon', 'emise', 'partiellement_payee', 'payee', 'annulee')),
  issue_date           date,
  service_date         date,
  due_date             date,
  discount_rate        numeric(5, 2) not null default 0 check (discount_rate between 0 and 100),
  payment_terms        text,
  notes                text,
  subtotal_ht          numeric(12, 2) not null default 0,
  discount_amount      numeric(12, 2) not null default 0,
  total_ht             numeric(12, 2) not null default 0,
  total_vat            numeric(12, 2) not null default 0,
  total_ttc            numeric(12, 2) not null default 0,
  vat_breakdown        jsonb not null default '[]'::jsonb,
  amount_paid          numeric(12, 2) not null default 0,
  amount_credited      numeric(12, 2) not null default 0,
  seller_snapshot      jsonb,
  client_snapshot      jsonb,
  legal_mentions       jsonb,
  issued_at            timestamptz,
  issued_by            uuid references public.profiles (id) on delete set null,
  created_by           uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz,
  unique (organization_id, number),
  constraint invoices_issued_have_number check (status = 'brouillon' or (number is not null and issued_at is not null and issue_date is not null and seller_snapshot is not null and client_snapshot is not null)),
  constraint invoices_credit_ref check ((kind = 'avoir') = (credited_invoice_id is not null)),
  constraint invoices_deleted_only_drafts check (deleted_at is null or status = 'brouillon')
);
create index invoices_client_idx on public.invoices (client_id);
create index invoices_due_idx on public.invoices (organization_id, due_date) where status in ('emise', 'partiellement_payee');
create trigger invoices_updated_at before update on public.invoices for each row execute function private.set_updated_at();
create trigger invoices_audit after insert or update or delete on public.invoices for each row execute function private.log_change();

create table public.invoice_items (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  invoice_id       uuid not null references public.invoices (id) on delete cascade,
  position         int not null default 0,
  catalog_item_id  uuid references public.service_catalog (id) on delete set null,
  description      text not null check (char_length(description) between 1 and 2000),
  quantity         numeric(12, 3) not null check (quantity <> 0),
  unit             text not null default 'forfait',
  unit_price       numeric(12, 2) not null check (unit_price >= 0),
  discount_rate    numeric(5, 2) not null default 0 check (discount_rate between 0 and 100),
  vat_rate         numeric(5, 2) not null default 20 check (vat_rate in (0, 2.1, 5.5, 10, 20)),
  total_ht         numeric(12, 2) generated always as (round(quantity * unit_price * (1 - discount_rate / 100), 2)) stored
);
create index invoice_items_invoice_idx on public.invoice_items (invoice_id, position);

create table public.payments (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  invoice_id       uuid not null references public.invoices (id),
  amount           numeric(12, 2) not null check (amount > 0),
  paid_at          date not null default current_date,
  method           text not null default 'virement' check (method in ('virement', 'cheque', 'carte', 'especes', 'prelevement', 'autre')),
  reference        text,
  notes            text,
  created_by       uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now()
);
create index payments_invoice_idx on public.payments (invoice_id);
create trigger payments_audit after insert or update or delete on public.payments for each row execute function private.log_change();

create table public.payment_reminders (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  invoice_id       uuid not null references public.invoices (id),
  level            int not null check (level between 1 and 3),
  channel          text not null default 'email' check (channel in ('email', 'courrier', 'telephone', 'autre')),
  sent_at          timestamptz not null default now(),
  notes            text,
  created_by       uuid default auth.uid() references public.profiles (id) on delete set null
);
create trigger payment_reminders_audit after insert on public.payment_reminders for each row execute function private.log_change();

-- -----------------------------------------------------------------------------
-- Héritage d'organisation et recalcul des totaux
-- -----------------------------------------------------------------------------
create or replace function private.inherit_parent_org()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'quote_items' then
    select organization_id into new.organization_id from public.quotes where id = new.quote_id;
  else
    select organization_id into new.organization_id from public.invoices where id = new.invoice_id;
  end if;
  return new;
end;
$$;
create trigger quote_items_org before insert on public.quote_items for each row execute function private.inherit_parent_org();
create trigger invoice_items_org before insert on public.invoice_items for each row execute function private.inherit_parent_org();
create trigger payments_org before insert on public.payments for each row execute function private.inherit_parent_org();
create trigger payment_reminders_org before insert on public.payment_reminders for each row execute function private.inherit_parent_org();

create or replace function private.recompute_quote(p_quote uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_totals jsonb;
begin
  select private.compute_totals(
           (select coalesce(jsonb_agg(jsonb_build_object('quantity', i.quantity, 'unit_price', i.unit_price,
                    'discount_rate', i.discount_rate, 'vat_rate', i.vat_rate)), '[]'::jsonb)
            from public.quote_items i where i.quote_id = q.id),
           q.discount_rate)
    into v_totals
    from public.quotes q where q.id = p_quote;
  update public.quotes set
    subtotal_ht = (v_totals ->> 'subtotal_ht')::numeric,
    discount_amount = (v_totals ->> 'discount_amount')::numeric,
    total_ht = (v_totals ->> 'total_ht')::numeric,
    total_vat = (v_totals ->> 'total_vat')::numeric,
    total_ttc = (v_totals ->> 'total_ttc')::numeric,
    vat_breakdown = v_totals -> 'vat_breakdown'
  where id = p_quote;
end;
$$;

create or replace function private.recompute_invoice(p_invoice uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_totals jsonb;
begin
  select private.compute_totals(
           (select coalesce(jsonb_agg(jsonb_build_object('quantity', i.quantity, 'unit_price', i.unit_price,
                    'discount_rate', i.discount_rate, 'vat_rate', i.vat_rate)), '[]'::jsonb)
            from public.invoice_items i where i.invoice_id = v.id),
           v.discount_rate)
    into v_totals
    from public.invoices v where v.id = p_invoice and v.status = 'brouillon';
  if v_totals is null then
    return;
  end if;
  update public.invoices set
    subtotal_ht = (v_totals ->> 'subtotal_ht')::numeric,
    discount_amount = (v_totals ->> 'discount_amount')::numeric,
    total_ht = (v_totals ->> 'total_ht')::numeric,
    total_vat = (v_totals ->> 'total_vat')::numeric,
    total_ttc = (v_totals ->> 'total_ttc')::numeric,
    vat_breakdown = v_totals -> 'vat_breakdown'
  where id = p_invoice;
end;
$$;

-- Verrou : lignes de devis modifiables uniquement en brouillon.
create or replace function private.quote_items_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_quote uuid := coalesce(new.quote_id, old.quote_id);
begin
  select status into v_status from public.quotes where id = v_quote;
  if v_status is not null and v_status <> 'brouillon' then
    raise exception 'Devis % : seules les lignes d''un brouillon sont modifiables', v_status using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger quote_items_guard before insert or update or delete on public.quote_items
  for each row execute function private.quote_items_guard();

create or replace function private.quote_items_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.recompute_quote(coalesce(new.quote_id, old.quote_id));
  return null;
end;
$$;
create trigger quote_items_recompute after insert or update or delete on public.quote_items
  for each row execute function private.quote_items_changed();

create or replace function private.quote_discount_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.recompute_quote(new.id);
  return null;
end;
$$;
create trigger quotes_discount_recompute after update of discount_rate on public.quotes
  for each row execute function private.quote_discount_changed();

-- Verrou des factures émises : intégrité et historique.
create or replace function private.invoice_items_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  select status into v_status from public.invoices where id = coalesce(new.invoice_id, old.invoice_id);
  if v_status is not null and v_status <> 'brouillon' then
    raise exception 'Facture émise : ses lignes ne peuvent plus être modifiées (émettre un avoir)' using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger invoice_items_guard before insert or update or delete on public.invoice_items
  for each row execute function private.invoice_items_guard();

create or replace function private.invoice_items_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.recompute_invoice(coalesce(new.invoice_id, old.invoice_id));
  return null;
end;
$$;
create trigger invoice_items_recompute after insert or update or delete on public.invoice_items
  for each row execute function private.invoice_items_changed();

create or replace function private.invoice_discount_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'brouillon' then
    perform private.recompute_invoice(new.id);
  end if;
  return null;
end;
$$;
create trigger invoices_discount_recompute after update of discount_rate on public.invoices
  for each row execute function private.invoice_discount_changed();

create or replace function private.invoice_lock()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_allowed text[] := array['status', 'amount_paid', 'amount_credited', 'updated_at'];
begin
  if tg_op = 'DELETE' then
    if old.status <> 'brouillon' then
      raise exception 'Une facture émise ne peut pas être supprimée' using errcode = 'check_violation';
    end if;
    return old;
  end if;
  if old.status <> 'brouillon' then
    if (to_jsonb(new) - v_allowed) is distinct from (to_jsonb(old) - v_allowed) then
      raise exception 'Facture % émise : document verrouillé (seuls le statut et les règlements évoluent)', old.number
        using errcode = 'check_violation';
    end if;
    if new.status = 'brouillon' then
      raise exception 'Une facture émise ne peut pas redevenir un brouillon' using errcode = 'check_violation';
    end if;
  elsif new.status <> 'brouillon' and current_setting('noamis.issuing', true) is distinct from 'on' then
    raise exception 'L''émission d''une facture passe obligatoirement par la fonction issue_invoice' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger invoices_lock before update or delete on public.invoices
  for each row execute function private.invoice_lock();

-- Règlements : recalcul du montant payé et du statut ; pas de trop-perçu.
create or replace function private.payments_apply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoice public.invoices;
  v_paid numeric;
  v_due numeric;
  v_status text;
begin
  select * into v_invoice from public.invoices where id = coalesce(new.invoice_id, old.invoice_id) for update;
  if tg_op = 'INSERT' and (v_invoice.kind <> 'facture' or v_invoice.status not in ('emise', 'partiellement_payee')) then
    raise exception 'Un règlement ne peut être enregistré que sur une facture émise non soldée' using errcode = 'check_violation';
  end if;
  select coalesce(sum(amount), 0) into v_paid from public.payments where invoice_id = v_invoice.id;
  v_due := v_invoice.total_ttc - v_invoice.amount_credited;
  if v_paid > v_due then
    raise exception 'Montant supérieur au reste à payer (% €)', v_due - (v_paid - coalesce(new.amount, 0)) using errcode = 'check_violation';
  end if;
  v_status := case
    when v_invoice.status = 'annulee' then 'annulee'
    when v_paid >= v_due and v_due > 0 then 'payee'
    when v_paid > 0 then 'partiellement_payee'
    else 'emise' end;
  update public.invoices set amount_paid = v_paid, status = v_status where id = v_invoice.id;
  return null;
end;
$$;
create trigger payments_apply after insert or delete on public.payments
  for each row execute function private.payments_apply();
create trigger payments_no_update before update on public.payments
  for each row execute function private.forbid_mutation();

-- -----------------------------------------------------------------------------
-- Opérations métier (RPC)
-- -----------------------------------------------------------------------------

-- Émission : numéro séquentiel sans trou, instantanés vendeur/client, mentions légales.
create or replace function public.issue_invoice(p_invoice uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.invoices;
  v_org public.organizations;
  v_client public.clients;
  v_number text;
  v_issue date := current_date;
  v_terms int;
  v_is_b2b boolean;
  v_mentions jsonb;
begin
  select * into v from public.invoices where id = p_invoice for update;
  if not found or not private.is_admin(v.organization_id) then
    raise exception 'Seul un administrateur peut émettre une facture' using errcode = 'insufficient_privilege';
  end if;
  if v.status <> 'brouillon' or v.deleted_at is not null then
    raise exception 'Seul un brouillon peut être émis' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.invoice_items where invoice_id = p_invoice) then
    raise exception 'La facture ne comporte aucune ligne' using errcode = 'check_violation';
  end if;

  select * into v_org from public.organizations where id = v.organization_id;
  select * into v_client from public.clients where id = v.client_id;

  if v_org.siren is null and v_org.siret is null then
    raise exception 'Renseignez le SIREN/SIRET de l''organisation avant d''émettre une facture' using errcode = 'check_violation';
  end if;
  if v_org.address_line is null or v_org.city is null then
    raise exception 'Renseignez l''adresse de l''organisation avant d''émettre une facture' using errcode = 'check_violation';
  end if;
  if v_client.address_line is null or v_client.city is null then
    raise exception 'Renseignez l''adresse du client avant d''émettre une facture' using errcode = 'check_violation';
  end if;
  if v_org.vat_regime = 'franchise' and exists (
       select 1 from public.invoice_items where invoice_id = p_invoice and vat_rate <> 0) then
    raise exception 'Régime de franchise en base : le taux de TVA doit être 0 %%' using errcode = 'check_violation';
  end if;

  v_number := private.next_number(v.organization_id, case when v.kind = 'avoir' then 'credit' else 'invoice' end);
  v_terms := coalesce((v_org.invoice_settings ->> 'payment_terms_days')::int, 30);
  v_is_b2b := v_client.category not in ('particulier');

  v_mentions := jsonb_build_object(
    'vat', case when v_org.vat_regime = 'franchise' then 'TVA non applicable, art. 293 B du CGI' else null end,
    'late_penalty', 'Pénalités de retard : ' || coalesce(v_org.invoice_settings ->> 'late_penalty_rate', '3 fois le taux d''intérêt légal'),
    'recovery_fee', case when v_is_b2b then 'Indemnité forfaitaire pour frais de recouvrement : '
                          || coalesce(v_org.invoice_settings ->> 'recovery_fee', '40') || ' € (art. L441-10 et D441-5 du Code de commerce)' end,
    'early_payment', coalesce(v_org.invoice_settings ->> 'early_payment_discount', 'Pas d''escompte pour paiement anticipé'),
    'operation_category', 'Prestation de services',
    'credited_invoice', case when v.kind = 'avoir' then (select number from public.invoices where id = v.credited_invoice_id) end
  );

  perform set_config('noamis.issuing', 'on', true);
  update public.invoices set
    number = v_number,
    status = 'emise',
    issue_date = v_issue,
    service_date = coalesce(v.service_date, v_issue),
    due_date = case when v.kind = 'avoir' then v_issue else coalesce(v.due_date, v_issue + v_terms) end,
    issued_at = now(),
    issued_by = auth.uid(),
    seller_snapshot = jsonb_build_object(
      'name', v_org.name, 'legal_name', coalesce(v_org.legal_name, v_org.name), 'legal_form', v_org.legal_form,
      'siren', v_org.siren, 'siret', v_org.siret, 'vat_number', v_org.vat_number, 'rcs', v_org.rcs,
      'address_line', v_org.address_line, 'postal_code', v_org.postal_code, 'city', v_org.city, 'country', v_org.country,
      'email', v_org.email, 'phone', v_org.phone, 'iban', v_org.iban, 'bic', v_org.bic, 'vat_regime', v_org.vat_regime),
    client_snapshot = jsonb_build_object(
      'name', v_client.name, 'category', v_client.category, 'siren', v_client.siren, 'siret', v_client.siret,
      'vat_number', v_client.vat_number, 'address_line', v_client.address_line, 'postal_code', v_client.postal_code,
      'city', v_client.city, 'country', v_client.country, 'email', v_client.email),
    legal_mentions = v_mentions
  where id = p_invoice;
  perform set_config('noamis.issuing', 'off', true);

  -- Avoir : imputation sur la facture d'origine.
  if v.kind = 'avoir' then
    update public.invoices o set
      amount_credited = o.amount_credited + abs(v.total_ttc),
      status = case
        when o.amount_credited + abs(v.total_ttc) >= o.total_ttc then 'annulee'
        when o.amount_paid + o.amount_credited + abs(v.total_ttc) >= o.total_ttc then 'payee'
        else o.status end
    where o.id = v.credited_invoice_id;
  end if;

  return v_number;
end;
$$;

create or replace function public.convert_quote_to_invoice(p_quote uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.quotes;
  v_id uuid;
begin
  select * into q from public.quotes where id = p_quote for update;
  if not found or not private.is_staff(q.organization_id) or not private.can_access_mission(q.mission_id) then
    raise exception 'Accès refusé' using errcode = 'insufficient_privilege';
  end if;
  if q.status <> 'accepte' then
    raise exception 'Seul un devis accepté peut être converti en facture' using errcode = 'check_violation';
  end if;
  insert into public.invoices (organization_id, client_id, mission_id, quote_id, title, discount_rate, payment_terms)
  values (q.organization_id, q.client_id, q.mission_id, q.id, q.title, q.discount_rate, q.payment_terms)
  returning id into v_id;
  insert into public.invoice_items (invoice_id, position, catalog_item_id, description, quantity, unit, unit_price, discount_rate, vat_rate)
  select v_id, position, catalog_item_id, description, quantity, unit, unit_price, discount_rate, vat_rate
  from public.quote_items where quote_id = p_quote order by position;
  update public.quotes set status = 'converti' where id = p_quote;
  return v_id;
end;
$$;

create or replace function public.create_credit_note(p_invoice uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.invoices;
  v_id uuid;
begin
  select * into v from public.invoices where id = p_invoice;
  if not found or not private.is_admin(v.organization_id) then
    raise exception 'Seul un administrateur peut créer un avoir' using errcode = 'insufficient_privilege';
  end if;
  if v.kind <> 'facture' or v.status in ('brouillon', 'annulee') then
    raise exception 'Un avoir ne peut porter que sur une facture émise non annulée' using errcode = 'check_violation';
  end if;
  insert into public.invoices (organization_id, kind, client_id, mission_id, credited_invoice_id, title, discount_rate)
  values (v.organization_id, 'avoir', v.client_id, v.mission_id, v.id, 'Avoir sur facture ' || v.number, v.discount_rate)
  returning id into v_id;
  insert into public.invoice_items (invoice_id, position, description, quantity, unit, unit_price, discount_rate, vat_rate)
  select v_id, position, description, -quantity, unit, unit_price, discount_rate, vat_rate
  from public.invoice_items where invoice_id = p_invoice order by position;
  return v_id;
end;
$$;

-- Réponse du client à un devis (portail CONNECT).
create or replace function public.client_respond_quote(p_quote uuid, p_accept boolean, p_comment text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.quotes;
begin
  select * into q from public.quotes where id = p_quote for update;
  if not found or not private.is_client_of(q.client_id) then
    raise exception 'Accès refusé' using errcode = 'insufficient_privilege';
  end if;
  if q.status <> 'envoye' then
    raise exception 'Ce devis n''est plus en attente de réponse' using errcode = 'check_violation';
  end if;
  if q.valid_until is not null and q.valid_until < current_date then
    update public.quotes set status = 'expire' where id = p_quote;
    raise exception 'Ce devis a expiré' using errcode = 'check_violation';
  end if;
  update public.quotes set
    status = case when p_accept then 'accepte' else 'refuse' end,
    responded_at = now(),
    response_comment = left(p_comment, 2000)
  where id = p_quote;
  perform private.notify(q.organization_id, q.created_by,
    case when p_accept then 'Devis accepté' else 'Devis refusé' end,
    q.number || ' — ' || q.title, '/finance/quotes/' || q.id);
end;
$$;

do $$
declare f text;
begin
  foreach f in array array['issue_invoice(uuid)', 'convert_quote_to_invoice(uuid)', 'create_credit_note(uuid)', 'client_respond_quote(uuid, boolean, text)'] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.service_catalog enable row level security;
create policy staff_select on public.service_catalog for select to authenticated using (private.is_staff(organization_id));
create policy admin_insert on public.service_catalog for insert to authenticated with check (private.is_admin(organization_id));
create policy admin_update on public.service_catalog for update to authenticated using (private.is_admin(organization_id)) with check (private.is_admin(organization_id));
create policy admin_delete on public.service_catalog for delete to authenticated using (private.is_admin(organization_id));

alter table public.quotes enable row level security;
create policy staff_select on public.quotes for select to authenticated
  using (private.is_staff(organization_id) and private.can_access_mission(mission_id));
create policy staff_insert on public.quotes for insert to authenticated
  with check (private.is_staff(organization_id) and private.can_access_mission(mission_id) and status = 'brouillon');
create policy staff_update on public.quotes for update to authenticated
  using (private.is_staff(organization_id) and private.can_access_mission(mission_id))
  with check (private.is_staff(organization_id) and private.can_access_mission(mission_id));
create policy admin_delete on public.quotes for delete to authenticated
  using (private.is_admin(organization_id) and status = 'brouillon');
create policy client_select on public.quotes for select to authenticated
  using (status <> 'brouillon' and deleted_at is null and private.is_client_of(client_id));

alter table public.quote_items enable row level security;
create policy staff_all on public.quote_items for all to authenticated
  using (exists (select 1 from public.quotes q where q.id = quote_id and private.is_staff(q.organization_id) and private.can_access_mission(q.mission_id)))
  with check (exists (select 1 from public.quotes q where q.id = quote_id and private.is_staff(q.organization_id) and private.can_access_mission(q.mission_id)));
create policy client_select on public.quote_items for select to authenticated
  using (exists (select 1 from public.quotes q where q.id = quote_id and q.status <> 'brouillon' and q.deleted_at is null and private.is_client_of(q.client_id)));

alter table public.invoices enable row level security;
create policy staff_select on public.invoices for select to authenticated
  using (private.is_staff(organization_id) and private.can_access_mission(mission_id));
create policy staff_insert on public.invoices for insert to authenticated
  with check (private.is_staff(organization_id) and private.can_access_mission(mission_id) and status = 'brouillon' and kind = 'facture');
create policy staff_update on public.invoices for update to authenticated
  using (private.is_staff(organization_id) and private.can_access_mission(mission_id) and status = 'brouillon')
  with check (private.is_staff(organization_id) and status = 'brouillon');
create policy client_select on public.invoices for select to authenticated
  using (status <> 'brouillon' and private.is_client_of(client_id));

alter table public.invoice_items enable row level security;
create policy staff_all on public.invoice_items for all to authenticated
  using (exists (select 1 from public.invoices v where v.id = invoice_id and private.is_staff(v.organization_id) and private.can_access_mission(v.mission_id)))
  with check (exists (select 1 from public.invoices v where v.id = invoice_id and private.is_staff(v.organization_id) and private.can_access_mission(v.mission_id)));
create policy client_select on public.invoice_items for select to authenticated
  using (exists (select 1 from public.invoices v where v.id = invoice_id and v.status <> 'brouillon' and private.is_client_of(v.client_id)));

alter table public.payments enable row level security;
create policy staff_select on public.payments for select to authenticated using (private.is_staff(organization_id));
create policy admin_insert on public.payments for insert to authenticated
  with check (exists (select 1 from public.invoices v where v.id = invoice_id and private.is_admin(v.organization_id)));
create policy admin_delete on public.payments for delete to authenticated using (private.is_admin(organization_id));
create policy client_select on public.payments for select to authenticated
  using (exists (select 1 from public.invoices v where v.id = invoice_id and private.is_client_of(v.client_id)));

alter table public.payment_reminders enable row level security;
create policy staff_select on public.payment_reminders for select to authenticated using (private.is_staff(organization_id));
create policy staff_insert on public.payment_reminders for insert to authenticated
  with check (exists (select 1 from public.invoices v where v.id = invoice_id and private.is_staff(v.organization_id)));

-- ===== 20261119000700_docs_connect.sql =====
-- =============================================================================
-- NOAMIS 360° — Migration 0700 : NOAMIS DOCS et NOAMIS CONNECT
-- Les fichiers sont stockés dans des buckets PRIVÉS sans aucune politique d'accès
-- direct : tout téléversement / téléchargement passe par le serveur, qui vérifie
-- les droits (RLS sur public.documents) puis émet une URL signée de courte durée.
-- =============================================================================

create table public.documents (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  client_id        uuid references public.clients (id),
  mission_id       uuid references public.missions (id),
  project_id       uuid references public.projects (id),
  audit_id         uuid references public.audits (id),
  title            text not null check (char_length(title) between 1 and 300),
  category         text not null default 'autre' check (category in (
                     'rapport_audit', 'livrable', 'cahier_des_charges', 'devis_prestataire', 'compte_rendu',
                     'contrat', 'facture', 'plan', 'photo', 'veille', 'piece_client', 'autre')),
  description      text,
  tags             text[] not null default '{}',
  confidentiality  text not null default 'interne' check (confidentiality in ('interne', 'client', 'restreint')),
  client_visible   boolean not null default false,
  current_version  int not null default 0,
  uploaded_by_client boolean not null default false,
  archived_at      timestamptz,
  created_by       uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  constraint documents_visibility check (not client_visible or (client_id is not null and confidentiality = 'client'))
);
create index documents_client_idx on public.documents (client_id) where deleted_at is null;
create index documents_mission_idx on public.documents (mission_id) where deleted_at is null;
create index documents_search_idx on public.documents
  using gin (to_tsvector('french', coalesce(title, '') || ' ' || coalesce(description, '')));
create index documents_tags_idx on public.documents using gin (tags);
create trigger documents_updated_at before update on public.documents for each row execute function private.set_updated_at();
create trigger documents_audit after insert or update or delete on public.documents for each row execute function private.log_change();

create table public.document_versions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  document_id      uuid not null references public.documents (id) on delete cascade,
  version          int not null,
  storage_bucket   text not null default 'documents',
  storage_path     text not null unique,
  file_name        text not null check (char_length(file_name) between 1 and 255),
  mime_type        text not null,
  size_bytes       bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  sha256           text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  comment          text,
  uploaded_by      uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  unique (document_id, version)
);
create trigger document_versions_audit after insert on public.document_versions for each row execute function private.log_change();
create trigger document_versions_immutable before update on public.document_versions for each row execute function private.forbid_mutation();

create or replace function private.document_version_assign()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_next int;
begin
  select organization_id, current_version + 1 into new.organization_id, v_next
  from public.documents where id = new.document_id for update;
  new.version := v_next;
  update public.documents set current_version = v_next where id = new.document_id;
  return new;
end;
$$;
create trigger document_versions_assign before insert on public.document_versions
  for each row execute function private.document_version_assign();

-- Accès d'un membre du personnel à un document.
create or replace function private.staff_can_access_document(p_doc uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.documents d
    where d.id = p_doc
      and private.is_staff(d.organization_id)
      and private.can_access_mission(d.mission_id)
      and (d.confidentiality <> 'restreint' or private.is_admin(d.organization_id) or d.created_by = (select auth.uid()))
  );
$$;

create or replace function private.client_can_see_document(p_doc uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.documents d
    where d.id = p_doc
      and d.client_visible
      and d.deleted_at is null
      and private.is_client_of(d.client_id)
      and (d.mission_id is null or private.client_can_see_mission(d.mission_id))
  );
$$;

-- Liens de partage temporaires (le jeton n'est jamais stocké en clair).
create table public.document_shares (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  document_id      uuid not null references public.documents (id) on delete cascade,
  token_hash       text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  recipient        text,
  expires_at       timestamptz not null,
  max_downloads    int not null default 5 check (max_downloads between 1 and 50),
  download_count   int not null default 0,
  revoked_at       timestamptz,
  created_by       uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  constraint document_shares_max_ttl check (expires_at > created_at and expires_at <= created_at + interval '7 days')
);
create trigger document_shares_audit after insert or update on public.document_shares for each row execute function private.log_change();

create or replace function private.document_share_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  d public.documents;
begin
  select * into d from public.documents where id = new.document_id;
  new.organization_id := d.organization_id;
  if d.category = 'rapport_audit' or d.confidentiality = 'restreint' or d.audit_id is not null then
    raise exception 'Les rapports de sûreté et documents restreints ne peuvent pas être partagés par lien' using errcode = 'check_violation';
  end if;
  if d.deleted_at is not null or d.archived_at is not null then
    raise exception 'Document archivé ou supprimé' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger document_shares_guard before insert on public.document_shares
  for each row execute function private.document_share_guard();

-- Consommation d'un lien (appelée par le serveur avec la clé de service uniquement).
create or replace function public.consume_document_share(p_token_hash text)
returns table (document_id uuid, storage_bucket text, storage_path text, file_name text, mime_type text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.document_shares;
begin
  select * into s from public.document_shares where token_hash = p_token_hash for update;
  if not found or s.revoked_at is not null or s.expires_at <= now() or s.download_count >= s.max_downloads then
    return;
  end if;
  update public.document_shares set download_count = download_count + 1 where id = s.id;
  return query
    select v.document_id, v.storage_bucket, v.storage_path, v.file_name, v.mime_type
    from public.document_versions v
    join public.documents d on d.id = v.document_id
    where v.document_id = s.document_id and v.version = d.current_version
      and d.deleted_at is null and d.archived_at is null;
end;
$$;
revoke execute on function public.consume_document_share(text) from public, anon, authenticated;
grant execute on function public.consume_document_share(text) to service_role;

-- -----------------------------------------------------------------------------
-- CONNECT : messagerie et validations client
-- -----------------------------------------------------------------------------
create table public.messages (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null default private.current_org_id() references public.organizations (id),
  client_id           uuid not null references public.clients (id) on delete cascade,
  mission_id          uuid references public.missions (id) on delete set null,
  sender_id           uuid not null default auth.uid() references public.profiles (id),
  from_client         boolean not null default false,
  body                text not null check (char_length(body) between 1 and 5000),
  read_by_staff_at    timestamptz,
  read_by_client_at   timestamptz,
  created_at          timestamptz not null default now()
);
create index messages_client_idx on public.messages (client_id, created_at desc);

create or replace function private.messages_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select organization_id into new.organization_id from public.clients where id = new.client_id;
  -- Un utilisateur connecté ne peut jamais usurper l'expéditeur ; seules les
  -- opérations serveur (clé de service, sans utilisateur) fixent sender_id.
  if auth.uid() is not null then
    new.sender_id := auth.uid();
    new.from_client := private.is_client_of(new.client_id);
  else
    new.from_client := exists (select 1 from public.memberships m
                               where m.user_id = new.sender_id and m.client_id = new.client_id and m.role = 'client');
  end if;
  new.read_by_staff_at := null;
  new.read_by_client_at := null;
  return new;
end;
$$;
create trigger messages_before_insert before insert on public.messages
  for each row execute function private.messages_before_insert();

create or replace function private.messages_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  if new.from_client then
    select owner_id into v_owner from public.clients where id = new.client_id;
    if v_owner is not null then
      perform private.notify(new.organization_id, v_owner, 'Nouveau message client', left(new.body, 140), '/connect/messages?client=' || new.client_id);
    end if;
  else
    insert into public.notifications (organization_id, user_id, title, body, link)
    select new.organization_id, m.user_id, 'Nouveau message de NOAMIS', left(new.body, 140), '/portal/messages'
    from public.memberships m where m.client_id = new.client_id and m.role = 'client' and m.active;
  end if;
  return null;
end;
$$;
create trigger messages_notify after insert on public.messages
  for each row execute function private.messages_notify();

create or replace function public.mark_messages_read(p_client uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from public.clients where id = p_client;
  if private.is_client_of(p_client) then
    update public.messages set read_by_client_at = now()
    where client_id = p_client and not from_client and read_by_client_at is null;
  elsif private.is_staff(v_org) then
    update public.messages set read_by_staff_at = now()
    where client_id = p_client and from_client and read_by_staff_at is null;
  else
    raise exception 'Accès refusé' using errcode = 'insufficient_privilege';
  end if;
end;
$$;
revoke execute on function public.mark_messages_read(uuid) from public, anon;
grant execute on function public.mark_messages_read(uuid) to authenticated;

create table public.client_approvals (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null default private.current_org_id() references public.organizations (id),
  client_id        uuid not null references public.clients (id) on delete cascade,
  mission_id       uuid references public.missions (id) on delete cascade,
  document_id      uuid references public.documents (id) on delete set null,
  title            text not null,
  description      text,
  status           text not null default 'en_attente' check (status in ('en_attente', 'approuve', 'refuse')),
  requested_by     uuid default auth.uid() references public.profiles (id) on delete set null,
  responded_by     uuid references public.profiles (id) on delete set null,
  responded_at     timestamptz,
  response_comment text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create or replace function private.inherit_client_org()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select organization_id into new.organization_id from public.clients where id = new.client_id;
  return new;
end;
$$;
create trigger client_approvals_org before insert on public.client_approvals
  for each row execute function private.inherit_client_org();
create trigger client_approvals_updated_at before update on public.client_approvals
  for each row execute function private.set_updated_at();
create trigger client_approvals_audit after insert or update on public.client_approvals
  for each row execute function private.log_change();

create or replace function private.client_approvals_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (organization_id, user_id, title, body, link)
  select new.organization_id, m.user_id, 'Validation demandée', new.title, '/portal/approvals'
  from public.memberships m where m.client_id = new.client_id and m.role = 'client' and m.active;
  return null;
end;
$$;
create trigger client_approvals_notify after insert on public.client_approvals
  for each row execute function private.client_approvals_notify();

create or replace function public.client_respond_approval(p_approval uuid, p_approve boolean, p_comment text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.client_approvals;
begin
  select * into a from public.client_approvals where id = p_approval for update;
  if not found or not private.is_client_of(a.client_id) then
    raise exception 'Accès refusé' using errcode = 'insufficient_privilege';
  end if;
  if a.status <> 'en_attente' then
    raise exception 'Cette demande a déjà reçu une réponse' using errcode = 'check_violation';
  end if;
  update public.client_approvals set
    status = case when p_approve then 'approuve' else 'refuse' end,
    responded_by = auth.uid(),
    responded_at = now(),
    response_comment = left(p_comment, 2000)
  where id = p_approval;
  perform private.notify(a.organization_id, a.requested_by,
    case when p_approve then 'Validation client obtenue' else 'Validation client refusée' end,
    a.title, '/connect/approvals');
end;
$$;
revoke execute on function public.client_respond_approval(uuid, boolean, text) from public, anon;
grant execute on function public.client_respond_approval(uuid, boolean, text) to authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.documents enable row level security;
create policy staff_select on public.documents for select to authenticated
  using (private.is_staff(organization_id) and private.can_access_mission(mission_id)
         and (confidentiality <> 'restreint' or private.is_admin(organization_id) or created_by = (select auth.uid())));
create policy staff_insert on public.documents for insert to authenticated
  with check (private.is_staff(organization_id) and private.can_access_mission(mission_id) and not uploaded_by_client);
create policy staff_update on public.documents for update to authenticated
  using (private.is_staff(organization_id) and private.can_access_mission(mission_id)
         and (confidentiality <> 'restreint' or private.is_admin(organization_id) or created_by = (select auth.uid())))
  with check (private.is_staff(organization_id) and private.can_access_mission(mission_id));
create policy client_select on public.documents for select to authenticated
  using (client_visible and deleted_at is null and private.is_client_of(client_id)
         and (mission_id is null or private.client_can_see_mission(mission_id)));
-- Un client peut déposer une pièce sur SON dossier uniquement.
create policy client_insert on public.documents for insert to authenticated
  with check (uploaded_by_client and client_visible and confidentiality = 'client'
              and private.is_client_of(client_id)
              and (mission_id is null or private.client_can_see_mission(mission_id))
              and project_id is null and audit_id is null);

alter table public.document_versions enable row level security;
create policy staff_select on public.document_versions for select to authenticated
  using (private.staff_can_access_document(document_id));
create policy staff_insert on public.document_versions for insert to authenticated
  with check (private.staff_can_access_document(document_id));
create policy client_select on public.document_versions for select to authenticated
  using (private.client_can_see_document(document_id));
create policy client_insert on public.document_versions for insert to authenticated
  with check (exists (select 1 from public.documents d where d.id = document_id and d.uploaded_by_client
                      and d.created_by = (select auth.uid()) and private.client_can_see_document(d.id)));

alter table public.document_shares enable row level security;
create policy staff_select on public.document_shares for select to authenticated
  using (private.staff_can_access_document(document_id));
create policy staff_insert on public.document_shares for insert to authenticated
  with check (private.staff_can_access_document(document_id));
create policy staff_revoke on public.document_shares for update to authenticated
  using (private.staff_can_access_document(document_id)) with check (private.staff_can_access_document(document_id));

alter table public.messages enable row level security;
create policy staff_select on public.messages for select to authenticated using (private.is_staff(organization_id));
create policy staff_insert on public.messages for insert to authenticated
  with check (exists (select 1 from public.clients c where c.id = client_id and private.is_staff(c.organization_id)));
create policy client_select on public.messages for select to authenticated using (private.is_client_of(client_id));
create policy client_insert on public.messages for insert to authenticated
  with check (private.is_client_of(client_id) and (mission_id is null or private.client_can_see_mission(mission_id)));

alter table public.client_approvals enable row level security;
create policy staff_select on public.client_approvals for select to authenticated using (private.is_staff(organization_id));
create policy staff_insert on public.client_approvals for insert to authenticated
  with check (exists (select 1 from public.clients c where c.id = client_id and private.is_staff(c.organization_id)));
create policy client_select on public.client_approvals for select to authenticated using (private.is_client_of(client_id));

-- -----------------------------------------------------------------------------
-- Stockage : buckets privés, types et tailles contrôlés, aucun accès direct.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('documents', 'documents', false, 26214400, array[
     'application/pdf', 'image/png', 'image/jpeg', 'image/webp',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
     'application/vnd.openxmlformats-officedocument.presentationml.presentation',
     'text/plain', 'text/csv']),
  ('audit-photos', 'audit-photos', false, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
-- Aucune politique sur storage.objects pour anon/authenticated : accès refusé par défaut.

-- ===== 20261119000800_protect_search.sql =====
-- =============================================================================
-- NOAMIS 360° — Migration 0800 : NOAMIS PROTECT et recherche globale
-- =============================================================================

-- Diagnostic préliminaire public : aucune adresse précise n'est collectée
-- (département uniquement) ; les coordonnées ne sont stockées que dans le
-- prospect créé, et seulement avec consentement explicite.
create table public.protect_assessments (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations (id),
  audience           text not null check (audience in ('particulier', 'commerce', 'petite_entreprise')),
  answers            jsonb not null check (jsonb_typeof(answers) = 'object'),
  score              int not null check (score between 0 and 100),
  level              text not null check (level in ('a_renforcer', 'intermediaire', 'satisfaisant')),
  department         text check (department is null or department ~ '^([0-9]{2}|2A|2B|97[1-6])$'),
  contact_requested  boolean not null default false,
  consent_at         timestamptz,
  lead_id            uuid references public.leads (id) on delete set null,
  ip_hash            text check (ip_hash is null or ip_hash ~ '^[0-9a-f]{64}$'),
  created_at         timestamptz not null default now(),
  constraint protect_contact_requires_consent check (not contact_requested or consent_at is not null)
);
create index protect_assessments_created_idx on public.protect_assessments (organization_id, created_at desc);
create index protect_assessments_ip_idx on public.protect_assessments (ip_hash, created_at desc);

alter table public.leads add column protect_assessment_id uuid references public.protect_assessments (id) on delete set null;

alter table public.protect_assessments enable row level security;
create policy staff_select on public.protect_assessments for select to authenticated using (private.is_staff(organization_id));
create policy admin_delete on public.protect_assessments for delete to authenticated using (private.is_admin(organization_id));

-- Enregistrement (appelé par le serveur avec la clé de service, après calcul du score côté serveur).
create or replace function public.submit_protect_assessment(
  p_audience text,
  p_answers jsonb,
  p_score int,
  p_level text,
  p_department text,
  p_ip_hash text,
  p_contact jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_id uuid;
  v_lead uuid;
  v_recent int;
  v_name text;
  v_email text;
  v_phone text;
begin
  select id into v_org from public.organizations where is_default limit 1;
  if v_org is null then
    raise exception 'Organisation par défaut non configurée';
  end if;

  if p_ip_hash is not null then
    select count(*) into v_recent from public.protect_assessments
    where ip_hash = p_ip_hash and created_at > now() - interval '1 hour';
    if v_recent >= 10 then
      raise exception 'Trop de diagnostics envoyés : réessayez plus tard' using errcode = 'P0429';
    end if;
  end if;

  if pg_column_size(p_answers) > 8192 then
    raise exception 'Réponses trop volumineuses' using errcode = 'check_violation';
  end if;

  insert into public.protect_assessments (organization_id, audience, answers, score, level, department, ip_hash,
                                          contact_requested, consent_at)
  values (v_org, p_audience, p_answers, p_score, p_level, nullif(p_department, ''), p_ip_hash,
          p_contact is not null, case when p_contact is not null then now() end)
  returning id into v_id;

  if p_contact is not null then
    if coalesce((p_contact ->> 'consent')::boolean, false) is not true then
      raise exception 'Consentement requis pour être recontacté' using errcode = 'check_violation';
    end if;
    v_name := left(trim(p_contact ->> 'name'), 120);
    v_email := left(lower(trim(p_contact ->> 'email')), 254);
    v_phone := left(trim(p_contact ->> 'phone'), 30);
    if coalesce(v_name, '') = '' or (coalesce(v_email, '') = '' and coalesce(v_phone, '') = '') then
      raise exception 'Nom et moyen de contact requis' using errcode = 'check_violation';
    end if;
    insert into public.leads (organization_id, title, contact_name, email, phone, category, source, stage,
                              message, consent_at, protect_assessment_id)
    values (v_org,
            'Diagnostic NOAMIS PROTECT — ' || case p_audience when 'particulier' then 'Particulier'
                                                               when 'commerce' then 'Commerce'
                                                               else 'Petite entreprise' end,
            v_name, nullif(v_email, ''), nullif(v_phone, ''),
            case p_audience when 'particulier' then 'particulier' when 'commerce' then 'commerce' else 'entreprise' end,
            'protect', 'nouveau',
            left(p_contact ->> 'message', 2000)
              || case when coalesce((p_contact ->> 'wants_appointment')::boolean, false)
                      then E'\n[Demande de rendez-vous' || coalesce(' : ' || left(p_contact ->> 'availability', 200), '') || ']' else '' end,
            now(), v_id)
    returning id into v_lead;
    update public.protect_assessments set lead_id = v_lead where id = v_id;

    insert into public.notifications (organization_id, user_id, title, body, link)
    select v_org, m.user_id, 'Nouveau prospect NOAMIS PROTECT', v_name, '/pilot/leads'
    from public.memberships m where m.organization_id = v_org and m.role in ('super_admin', 'admin') and m.active;
  end if;

  return v_id;
end;
$$;
revoke execute on function public.submit_protect_assessment(text, jsonb, int, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.submit_protect_assessment(text, jsonb, int, text, text, text, jsonb) to service_role;

-- Purge RGPD : diagnostics anonymes de plus de 12 mois.
create or replace function public.purge_protect_assessments()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  if auth.uid() is not null and not exists (
       select 1 from public.memberships m
       where m.user_id = auth.uid() and private.is_admin(m.organization_id)) then
    raise exception 'Accès refusé' using errcode = 'insufficient_privilege';
  end if;
  delete from public.protect_assessments
  where lead_id is null and created_at < now() - interval '12 months';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke execute on function public.purge_protect_assessments() from public, anon;
grant execute on function public.purge_protect_assessments() to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Recherche globale (SECURITY INVOKER : la RLS de chaque table s'applique)
-- -----------------------------------------------------------------------------
create or replace function public.global_search(p_query text)
returns table (kind text, id uuid, title text, subtitle text, link text)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (select '%' || replace(replace(replace(left(trim(p_query), 100), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern)
  select * from (
    select 'client'::text, c.id, c.name, coalesce(c.city, c.category), '/pilot/clients/' || c.id
      from public.clients c, q where c.deleted_at is null and (c.name ilike q.pattern or c.email ilike q.pattern) limit 8
  ) a
  union all select * from (
    select 'contact', ct.id, ct.first_name || ' ' || ct.last_name, ct.email, '/pilot/clients/' || ct.client_id
      from public.contacts ct, q where ct.deleted_at is null
       and (ct.last_name ilike q.pattern or ct.first_name ilike q.pattern or ct.email ilike q.pattern) limit 8
  ) b
  union all select * from (
    select 'mission', m.id, m.reference || ' — ' || m.title, m.status, '/pilot/missions/' || m.id
      from public.missions m, q where m.deleted_at is null and (m.title ilike q.pattern or m.reference ilike q.pattern) limit 8
  ) c
  union all select * from (
    select 'prospect', l.id, l.title, coalesce(l.company, l.contact_name), '/pilot/leads'
      from public.leads l, q where l.deleted_at is null
       and (l.title ilike q.pattern or l.company ilike q.pattern or l.contact_name ilike q.pattern) limit 8
  ) d
  union all select * from (
    select 'audit', au.id, au.reference || ' — ' || au.title, au.status, '/audit/' || au.id
      from public.audits au, q where au.deleted_at is null and (au.title ilike q.pattern or au.reference ilike q.pattern) limit 8
  ) e
  union all select * from (
    select 'projet', p.id, p.reference || ' — ' || p.name, p.phase, '/project/' || p.id
      from public.projects p, q where p.deleted_at is null and (p.name ilike q.pattern or p.reference ilike q.pattern) limit 8
  ) f
  union all select * from (
    select 'document', dc.id, dc.title, dc.category, '/docs/' || dc.id
      from public.documents dc, q where dc.deleted_at is null and (dc.title ilike q.pattern or array_to_string(dc.tags, ' ') ilike q.pattern) limit 8
  ) g
  union all select * from (
    select 'devis', qu.id, qu.number || ' — ' || qu.title, qu.status, '/finance/quotes/' || qu.id
      from public.quotes qu, q where qu.deleted_at is null and (qu.number ilike q.pattern or qu.title ilike q.pattern) limit 5
  ) h
  union all select * from (
    select 'facture', i.id, coalesce(i.number, 'Brouillon') || ' — ' || i.title, i.status, '/finance/invoices/' || i.id
      from public.invoices i, q where i.deleted_at is null and (i.number ilike q.pattern or i.title ilike q.pattern) limit 5
  ) i;
$$;
revoke execute on function public.global_search(text) from public, anon;
grant execute on function public.global_search(text) to authenticated;

-- ===== 20261119000900_protect_contact.sql =====
-- =============================================================================
-- NOAMIS 360° — Migration 0900 : rattachement d'une demande de contact à un
-- diagnostic PROTECT existant (évite les doublons statistiques).
-- Appelée uniquement par le serveur (clé de service), dans l'heure suivant le
-- diagnostic, et une seule fois.
-- =============================================================================
create or replace function public.attach_protect_contact(p_assessment uuid, p_contact jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.protect_assessments;
  v_lead uuid;
  v_name text := left(trim(p_contact ->> 'name'), 120);
  v_email text := left(lower(trim(p_contact ->> 'email')), 254);
  v_phone text := left(trim(p_contact ->> 'phone'), 30);
begin
  select * into a from public.protect_assessments where id = p_assessment for update;
  if not found or a.lead_id is not null or a.created_at < now() - interval '1 hour' then
    raise exception 'Diagnostic expiré : merci de le refaire avant de demander un contact' using errcode = 'check_violation';
  end if;
  if coalesce((p_contact ->> 'consent')::boolean, false) is not true then
    raise exception 'Consentement requis pour être recontacté' using errcode = 'check_violation';
  end if;
  if coalesce(v_name, '') = '' or (coalesce(v_email, '') = '' and coalesce(v_phone, '') = '') then
    raise exception 'Nom et moyen de contact requis' using errcode = 'check_violation';
  end if;

  insert into public.leads (organization_id, title, contact_name, email, phone, category, source, stage, message, consent_at, protect_assessment_id, estimated_amount)
  values (a.organization_id,
          'Diagnostic NOAMIS PROTECT — ' || case a.audience when 'particulier' then 'Particulier' when 'commerce' then 'Commerce' else 'Petite entreprise' end
            || ' (score ' || a.score || '/100)',
          v_name, nullif(v_email, ''), nullif(v_phone, ''),
          case a.audience when 'particulier' then 'particulier' when 'commerce' then 'commerce' else 'entreprise' end,
          'protect', 'nouveau',
          left(p_contact ->> 'message', 2000)
            || case when coalesce((p_contact ->> 'wants_appointment')::boolean, false)
                    then E'\n[Demande de rendez-vous' || coalesce(' : ' || left(p_contact ->> 'availability', 200), '') || ']' else '' end,
          now(), a.id, null)
  returning id into v_lead;

  update public.protect_assessments set lead_id = v_lead, contact_requested = true, consent_at = now() where id = a.id;

  insert into public.notifications (organization_id, user_id, title, body, link)
  select a.organization_id, m.user_id, 'Nouveau prospect NOAMIS PROTECT', v_name, '/pilot/leads'
  from public.memberships m where m.organization_id = a.organization_id and m.role in ('super_admin', 'admin') and m.active;

  return v_lead;
end;
$$;
revoke execute on function public.attach_protect_contact(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.attach_protect_contact(uuid, jsonb) to service_role;
