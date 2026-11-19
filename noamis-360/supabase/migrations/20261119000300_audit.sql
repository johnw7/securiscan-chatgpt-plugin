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
