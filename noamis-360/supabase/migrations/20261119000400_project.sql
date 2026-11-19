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
  organization_id  uuid not null references public.organizations (id),
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
  organization_id  uuid not null references public.organizations (id),
  project_id       uuid not null references public.projects (id) on delete cascade,
  label            text not null,
  weight           numeric(5, 2) not null check (weight > 0 and weight <= 100),
  position         int not null default 0
);

-- Offres reçues des prestataires ; scores : { "<criterion_id>": 0..10 }
create table public.vendor_offers (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id),
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
  organization_id  uuid not null references public.organizations (id),
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
  organization_id  uuid not null references public.organizations (id),
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
