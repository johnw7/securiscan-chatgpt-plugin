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
  organization_id  uuid not null references public.organizations (id),
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
  organization_id  uuid not null references public.organizations (id),
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
  organization_id  uuid not null references public.organizations (id),
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
  organization_id  uuid not null references public.organizations (id),
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
