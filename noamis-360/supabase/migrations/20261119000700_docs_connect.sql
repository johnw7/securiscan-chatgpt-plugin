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
  organization_id  uuid not null references public.organizations (id),
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
  organization_id  uuid not null references public.organizations (id),
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
  organization_id     uuid not null references public.organizations (id),
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
  new.sender_id := auth.uid();
  new.from_client := private.is_client_of(new.client_id);
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
  organization_id  uuid not null references public.organizations (id),
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
