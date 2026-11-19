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
