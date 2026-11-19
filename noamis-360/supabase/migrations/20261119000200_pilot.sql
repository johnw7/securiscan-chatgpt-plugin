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
