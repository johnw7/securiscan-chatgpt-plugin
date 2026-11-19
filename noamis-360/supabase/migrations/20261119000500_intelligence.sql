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
