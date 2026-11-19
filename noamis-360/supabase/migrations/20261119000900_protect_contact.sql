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
