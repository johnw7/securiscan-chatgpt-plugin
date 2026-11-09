'use strict';
const express = require('express');
const { now } = require('../db');
const { requireRole } = require('../auth');
const { STEPS, STEP_STATUS, stepLabel, DOSSIER_STATUS, VALIDATION_STATUS, TASK_STATUS } = require('../domain');
const { dossierForUser, logHistory } = require('../services');
const { html, icon, badge, nl2br, csrfField, field, radios, fmtDate, fmtDateTime, fmtDay, fmtSize } = require('../view');
const { stepsTimeline, deliverableItem, comparison, validationSummary, VALIDATION_NOTICE, levelBadge } = require('../components');

module.exports = ({ db, notifier }) => {
  const r = express.Router();
  r.use(requireRole('client'));

  const pendingCount = (id) => db.get("SELECT COUNT(*) c FROM validations WHERE dossier_id = ? AND status = 'en_attente'", id).c;

  function subNav(d, active) {
    const base = `/espace/dossiers/${d.id}`;
    return {
      label: `Rubriques du dossier ${d.ref}`,
      active,
      items: [
        { key: 'accueil', href: base, label: 'Tableau de bord' },
        { key: 'projet', href: `${base}/projet`, label: 'Mon projet' },
        { key: 'documents', href: `${base}/documents`, label: 'Documents' },
        { key: 'decisions', href: `${base}/decisions`, label: 'Décisions', count: pendingCount(d.id) },
        { key: 'messages', href: `${base}/messages`, label: 'Messages' },
      ],
    };
  }
  const nav = (req) => {
    const many = db.get('SELECT COUNT(*) c FROM dossiers WHERE client_id = ?', req.user.id).c > 1;
    return many ? [{ key: 'dossiers', href: '/espace', label: 'Mes dossiers' }] : [];
  };
  const dossierHead = (d) => html`<div class="dossier-head">
    <p class="eyebrow">Dossier ${d.ref}</p>
    <h1>${d.title}</h1>
    <p class="badges">${levelBadge(d.level)} ${badge(DOSSIER_STATUS[d.status])}</p>
  </div>`;

  // Chargement du dossier avec contrôle d'appartenance (404 sinon, même via lien direct).
  const withDossier = (handler) => (req, res) => {
    const d = dossierForUser(db, req.user, req.params.id);
    if (!d) return res.notFound();
    return handler(req, res, d);
  };

  r.get('/', (req, res) => {
    const list = db.all('SELECT * FROM dossiers WHERE client_id = ? ORDER BY status, updated_at DESC', req.user.id);
    if (list.length === 1 && !req.query.liste) return res.redirect(`/espace/dossiers/${list[0].id}${req.query.ok ? `?ok=${encodeURIComponent(req.query.ok)}` : ''}`);
    res.page({
      title: 'Mes dossiers', nav: nav(req), active: 'dossiers',
      body: html`<h1>Mes dossiers</h1>
        ${list.length ? html`<div class="cards">${list.map((d) => html`<article class="card">
          <p class="eyebrow">${d.ref}</p><h2><a href="/espace/dossiers/${d.id}">${d.title}</a></h2>
          <p class="badges">${levelBadge(d.level)} ${badge(DOSSIER_STATUS[d.status])}</p>
          <p>Étape en cours : ${d.current_step}. ${stepLabel(d.current_step)}</p>
          <p class="small">Dernière mise à jour : ${fmtDateTime(d.updated_at)}</p>
        </article>`)}</div>` : html`<p class="empty">Aucun dossier ne vous est attribué pour le moment. Le cabinet vous informera dès l’ouverture de votre dossier.</p>`}`,
    });
  });

  // ---------- Tableau de bord du dossier ----------
  r.get('/dossiers/:id', withDossier((req, res, d) => {
    const steps = db.all('SELECT * FROM dossier_steps WHERE dossier_id = ? ORDER BY step', d.id);
    const pending = db.all(`SELECT v.*, p.company FROM validations v JOIN providers p ON p.id = v.provider_id
      WHERE v.dossier_id = ? AND v.status = 'en_attente' ORDER BY v.created_at`, d.id);
    const lastVisible = db.get('SELECT * FROM history WHERE dossier_id = ? AND visible_client = 1 ORDER BY id DESC LIMIT 1', d.id);
    const activity = db.all('SELECT * FROM history WHERE dossier_id = ? AND visible_client = 1 ORDER BY id DESC LIMIT 6', d.id);
    const counts = {
      docs: db.get('SELECT COUNT(*) c FROM documents WHERE dossier_id = ? AND shared = 1', d.id).c,
      reports: db.get('SELECT COUNT(*) c FROM notes WHERE dossier_id = ? AND shared = 1', d.id).c,
      msgs: db.get('SELECT COUNT(*) c FROM messages WHERE dossier_id = ?', d.id).c,
      decisions: db.get("SELECT COUNT(*) c FROM validations WHERE dossier_id = ? AND status != 'remplacee'", d.id).c,
    };
    const step = STEPS.find((s) => s.n === d.current_step);
    const base = `/espace/dossiers/${d.id}`;
    res.page({
      title: `Tableau de bord — ${d.ref}`, nav: nav(req), sub: subNav(d, 'accueil'),
      body: html`${dossierHead(d)}
        <section aria-labelledby="etat-title" class="state">
          <h2 id="etat-title" class="sr-only">État du dossier</h2>
          <div class="cards cards-3">
            <article class="card card-highlight">
              <h3 class="card-label">Étape en cours</h3>
              <p class="big">${d.status === 'clos' ? 'Dossier clôturé' : `${step.n}. ${step.label}`}</p>
              <p>${d.status === 'clos' ? `Clôturé le ${fmtDate(d.closed_at)}.` : step.desc}</p>
            </article>
            <article class="card">
              <h3 class="card-label">Dernière mise à jour</h3>
              <p class="big">${fmtDate(lastVisible ? lastVisible.created_at : d.updated_at)}</p>
              <p>${lastVisible ? lastVisible.action : 'Création du dossier.'}</p>
            </article>
            <article class="card">
              <h3 class="card-label">Prochaine action attendue</h3>
              ${pending.length ? html`<p class="big">${badge(VALIDATION_STATUS.en_attente)}</p>
                <p>Une décision vous attend : ${pending[0].action.split('\n')[0]}</p>
                <p><a class="btn btn-primary" href="${base}/decisions/${pending[0].id}">Examiner la demande</a></p>`
              : html`<p>${d.status === 'clos' ? 'Aucune action attendue. Vos documents restent consultables.' : (d.next_action || 'Aucune action de votre part pour le moment.')}</p>`}
            </article>
          </div>
        </section>
        <section aria-labelledby="progress-title">
          <h2 id="progress-title">Avancement</h2>
          ${stepsTimeline(steps, { compact: true })}
        </section>
        <section aria-labelledby="rub-title">
          <h2 id="rub-title">Rubriques</h2>
          <div class="cards cards-4">
            <a class="card card-link" href="${base}/projet"><h3>Mon projet</h3><p>Étapes, livrables prévus et comparatif des propositions.</p></a>
            <a class="card card-link" href="${base}/documents"><h3>Documents</h3><p>${counts.docs} document${counts.docs > 1 ? 's' : ''} et ${counts.reports} compte${counts.reports > 1 ? 's' : ''} rendu${counts.reports > 1 ? 's' : ''} partagés.</p></a>
            <a class="card card-link" href="${base}/decisions"><h3>Décisions</h3><p>${pending.length ? `${pending.length} décision${pending.length > 1 ? 's' : ''} à prendre.` : `${counts.decisions} décision${counts.decisions > 1 ? 's' : ''} au total, aucune en attente.`}</p></a>
            <a class="card card-link" href="${base}/messages"><h3>Messages</h3><p>${counts.msgs} message${counts.msgs > 1 ? 's' : ''} échangé${counts.msgs > 1 ? 's' : ''} avec le cabinet.</p></a>
          </div>
        </section>
        <section aria-labelledby="act-title">
          <h2 id="act-title">Activité récente</h2>
          ${activity.length ? html`<ul class="list">${activity.map((h) => html`<li class="list-item"><span class="small date">${fmtDateTime(h.created_at)}</span><span class="grow">${h.action}</span></li>`)}</ul>` : html`<p class="empty">Aucune activité.</p>`}
        </section>`,
    });
  }));

  // ---------- Mon projet ----------
  r.get('/dossiers/:id/projet', withDossier((req, res, d) => {
    const steps = db.all('SELECT * FROM dossier_steps WHERE dossier_id = ? AND included = 1 ORDER BY step', d.id);
    const deliverables = db.all(`SELECT dl.*, doc.shared doc_shared FROM deliverables dl LEFT JOIN documents doc ON doc.id = dl.document_id
      WHERE dl.dossier_id = ? ORDER BY dl.step, dl.id`, d.id);
    const reports = db.all('SELECT * FROM notes WHERE dossier_id = ? AND shared = 1 ORDER BY created_at DESC', d.id);
    const tasks = db.all('SELECT * FROM tasks WHERE dossier_id = ? AND visible_client = 1 ORDER BY due_date IS NULL, due_date', d.id);
    const proposals = db.all(`SELECT pr.*, p.company, doc.shared doc_shared FROM proposals pr JOIN providers p ON p.id = pr.provider_id
      LEFT JOIN documents doc ON doc.id = pr.document_id WHERE pr.dossier_id = ? AND pr.shared = 1 ORDER BY pr.id`, d.id);
    res.page({
      title: `Mon projet — ${d.ref}`, nav: nav(req), sub: subNav(d, 'projet'),
      body: html`${dossierHead(d)}
        <p class="lead">Votre dossier suit la méthode NOAMIS. Seules les étapes et les livrables prévus pour votre mission sont affichés.</p>
        ${steps.map((s) => {
          const def = STEPS.find((x) => x.n === s.step);
          const dl = deliverables.filter((x) => x.step === s.step);
          const rp = reports.filter((x) => x.step === s.step);
          return html`<section class="card step-card is-${s.status}" aria-labelledby="step-${s.step}">
            <div class="step-head"><h2 id="step-${s.step}">${s.step}. ${def.label}</h2>${badge(STEP_STATUS[s.status])}</div>
            <p>${def.desc}</p>
            ${s.step === 1 && (d.context || d.needs || d.constraints || d.objectives) ? html`<dl class="dl">
              ${d.context ? html`<dt>Contexte</dt><dd>${nl2br(d.context)}</dd>` : ''}
              ${d.needs ? html`<dt>Besoins</dt><dd>${nl2br(d.needs)}</dd>` : ''}
              ${d.constraints ? html`<dt>Contraintes</dt><dd>${nl2br(d.constraints)}</dd>` : ''}
              ${d.objectives ? html`<dt>Objectifs</dt><dd>${nl2br(d.objectives)}</dd>` : ''}
            </dl>` : ''}
            ${dl.length ? html`<h3>Livrables prévus</h3><ul class="list">${dl.map((x) => deliverableItem(x, x.status === 'remis' && x.document_id && x.doc_shared))}</ul>` : ''}
            ${s.step === 3 ? html`<h3 id="comparatif">Comparatif des propositions</h3>${comparison(proposals, { forClient: true })}` : ''}
            ${s.step === 4 && tasks.length ? html`<h3>Actions convenues</h3><ul class="list">${tasks.map((t) => html`<li class="list-item">
              ${badge(TASK_STATUS[t.status])}<span class="grow">${t.title}</span><span class="small">Échéance : ${fmtDay(t.due_date)}</span></li>`)}</ul>` : ''}
            ${rp.length ? html`<h3>Comptes rendus</h3>${rp.map((n) => html`<article class="report"><h4>${n.title}</h4><p class="small">Publié le ${fmtDateTime(n.shared_at)}</p><p>${nl2br(n.body)}</p></article>`)}` : ''}
            ${s.step === 5 && d.closure_summary ? html`<h3>Synthèse de clôture</h3><p>${nl2br(d.closure_summary)}</p>` : ''}
          </section>`;
        })}
        <section class="card" aria-labelledby="role-title">
          <h2 id="role-title">Le rôle de NOAMIS</h2>
          <p>NOAMIS vous conseille, prépare votre dossier, identifie des professionnels spécialisés de son réseau, vous aide à comparer leurs propositions
          et peut coordonner le suivi organisationnel selon la mission convenue. Vous choisissez votre prestataire et contractualisez directement avec lui.
          Les prestations techniques et opérationnelles relèvent des professionnels qui les exécutent.</p>
        </section>`,
    });
  }));

  // ---------- Documents ----------
  r.get('/dossiers/:id/documents', withDossier((req, res, d) => {
    const docs = db.all('SELECT * FROM documents WHERE dossier_id = ? AND shared = 1 ORDER BY step, shared_at DESC', d.id);
    const reports = db.all('SELECT * FROM notes WHERE dossier_id = ? AND shared = 1 ORDER BY shared_at DESC', d.id);
    res.page({
      title: `Documents — ${d.ref}`, nav: nav(req), sub: subNav(d, 'documents'),
      body: html`${dossierHead(d)}
        <h2>Documents partagés</h2>
        <p>Les documents sont conservés dans un espace privé. Ils ne sont accessibles qu’après connexion.</p>
        ${docs.length ? html`<div class="table-wrap" role="region" aria-label="Documents partagés" tabindex="0"><table class="table-stack">
          <thead><tr><th scope="col">Document</th><th scope="col">Étape</th><th scope="col">Partagé le</th><th scope="col">Taille</th><th scope="col"><span class="sr-only">Action</span></th></tr></thead>
          <tbody>${docs.map((x) => html`<tr>
            <th scope="row" data-label="Document">${icon('file')}<span>${x.title}</span><br><span class="small">${x.original_name}</span></th>
            <td data-label="Étape">${x.step}. ${stepLabel(x.step)}</td>
            <td data-label="Partagé le">${fmtDateTime(x.shared_at)}</td>
            <td data-label="Taille">${fmtSize(x.size)}</td>
            <td><a class="btn btn-secondary btn-sm" href="/documents/${x.id}/telecharger">${icon('download')}<span>Télécharger<span class="sr-only"> ${x.title}</span></span></a></td>
          </tr>`)}</tbody></table></div>` : html`<p class="empty">Aucun document partagé pour le moment.</p>`}
        <h2>Comptes rendus</h2>
        ${reports.length ? reports.map((n) => html`<article class="card report"><h3>${n.title}</h3>
          <p class="small">Étape ${n.step}. ${stepLabel(n.step)} · publié le ${fmtDateTime(n.shared_at)}</p><p>${nl2br(n.body)}</p></article>`)
        : html`<p class="empty">Aucun compte rendu publié pour le moment.</p>`}`,
    });
  }));

  // ---------- Décisions ----------
  r.get('/dossiers/:id/decisions', withDossier((req, res, d) => {
    const list = db.all(`SELECT v.*, p.company FROM validations v JOIN providers p ON p.id = v.provider_id
      WHERE v.dossier_id = ? ORDER BY CASE v.status WHEN 'en_attente' THEN 0 ELSE 1 END, v.created_at DESC`, d.id);
    const pending = list.filter((v) => v.status === 'en_attente');
    const past = list.filter((v) => v.status !== 'en_attente');
    const users = Object.fromEntries(db.all('SELECT id, name FROM users').map((u) => [u.id, u.name]));
    const row = (v) => html`<li class="list-item">
      ${badge(VALIDATION_STATUS[v.status])}
      <span class="grow"><strong>${v.action.split('\n')[0]}</strong><br>
      <span class="small">Destinataire : ${v.company} · version ${v.dossier_version} · soumise le ${fmtDateTime(v.created_at)}
      ${v.decided_at ? ` · décision de ${users[v.decided_by] || 'client'} le ${fmtDateTime(v.decided_at)}` : ''}
      ${v.transmitted_at ? ` · transmis le ${fmtDateTime(v.transmitted_at)}` : ''}</span></span>
      <a class="btn ${v.status === 'en_attente' ? 'btn-primary' : 'btn-secondary'} btn-sm" href="/espace/dossiers/${d.id}/decisions/${v.id}">${v.status === 'en_attente' ? 'Examiner' : 'Consulter'}</a>
    </li>`;
    res.page({
      title: `Décisions — ${d.ref}`, nav: nav(req), sub: subNav(d, 'decisions'),
      body: html`${dossierHead(d)}
        <p class="lead">Avant toute transmission de votre dossier à un prestataire, le cabinet vous soumet l’action proposée pour accord.</p>
        <h2>À valider</h2>
        ${pending.length ? html`<ul class="list">${pending.map(row)}</ul>` : html`<p class="empty">Aucune décision en attente.</p>`}
        <h2>Historique des décisions</h2>
        ${past.length ? html`<ul class="list">${past.map(row)}</ul>` : html`<p class="empty">Aucune décision enregistrée.</p>`}`,
    });
  }));

  function decisionPage(req, res, d, v, errors = {}, values = {}) {
    const users = Object.fromEntries(db.all('SELECT id, name FROM users').map((u) => [u.id, u.name]));
    const canDecide = v.status === 'en_attente' && d.status === 'ouvert';
    res.status(Object.keys(errors).length ? 422 : 200).page({
      title: `Décision — ${d.ref}`, nav: nav(req), sub: subNav(d, 'decisions'),
      body: html`${dossierHead(d)}
        <section class="card" aria-labelledby="dec-title">
          <h2 id="dec-title">Demande de validation</h2>
          ${validationSummary(v, { forClient: true, users })}
        </section>
        <div class="alert alert-notice" role="note">${icon('info')}<p>${VALIDATION_NOTICE}</p></div>
        ${canDecide ? html`<form method="post" action="/espace/dossiers/${d.id}/decisions/${v.id}" class="card" novalidate>
          ${csrfField(req.csrfToken)}
          <input type="hidden" name="version" value="${v.dossier_version}">
          ${radios({ name: 'decision', legend: 'Votre décision', required: true, value: values.decision, error: errors.decision, options: [
            { value: 'valide', label: 'Valider', desc: 'J’autorise uniquement l’action décrite ci-dessus.' },
            { value: 'modification', label: 'Demander une modification', desc: 'Précisez ce qui doit être modifié.' },
            { value: 'refuse', label: 'Refuser', desc: 'L’action ne sera pas effectuée.' },
          ] })}
          ${field({ name: 'comment', label: 'Commentaire', type: 'textarea', value: values.comment, error: errors.comment, hint: 'Obligatoire pour une demande de modification ou un refus.', attrs: 'maxlength="2000"' })}
          <button type="submit" class="btn btn-primary">Enregistrer ma décision</button>
        </form>` : ''}
        <p><a href="/espace/dossiers/${d.id}/decisions">Retour aux décisions</a></p>`,
    });
  }
  const loadValidation = (d, id) => db.get(`SELECT v.*, p.company, p.specialties FROM validations v JOIN providers p ON p.id = v.provider_id
    WHERE v.id = ? AND v.dossier_id = ?`, Number(id), d.id);

  r.get('/dossiers/:id/decisions/:vid', withDossier((req, res, d) => {
    const v = loadValidation(d, req.params.vid);
    if (!v) return res.notFound();
    decisionPage(req, res, d, v);
  }));

  r.post('/dossiers/:id/decisions/:vid', withDossier(async (req, res, d) => {
    const v = loadValidation(d, req.params.vid);
    if (!v) return res.notFound();
    if (v.status !== 'en_attente' || d.status !== 'ouvert' || Number(req.body.version) !== v.dossier_version) {
      return res.redirect(303, `/espace/dossiers/${d.id}/decisions/${v.id}?ok=erreur-statut`);
    }
    const decision = req.body.decision;
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim().slice(0, 2000) : '';
    const errors = {};
    if (!['valide', 'modification', 'refuse'].includes(decision)) errors.decision = 'Choisissez une décision.';
    if ((decision === 'modification' || decision === 'refuse') && comment.length < 3) errors.comment = 'Précisez votre demande dans le commentaire.';
    if (Object.keys(errors).length) return decisionPage(req, res, d, v, errors, { decision, comment });
    const t = now();
    const res1 = db.run("UPDATE validations SET status = ?, decided_by = ?, decided_at = ?, decision_comment = ? WHERE id = ? AND status = 'en_attente'",
      decision, req.user.id, t, comment || null, v.id);
    if (res1.changes !== 1) return res.redirect(303, `/espace/dossiers/${d.id}/decisions/${v.id}?ok=erreur-statut`);
    logHistory(db, d.id, req.user.id, `Décision de ${req.user.name} : ${VALIDATION_STATUS[decision].label} — transmission à ${v.company} (version ${v.dossier_version}).`, true);
    await notifier.cabinet(d.id);
    res.redirect(303, `/espace/dossiers/${d.id}/decisions/${v.id}?ok=decision`);
  }));

  // ---------- Messages ----------
  function messagesPage(req, res, d, error = '') {
    const msgs = db.all('SELECT m.*, u.name, u.role FROM messages m JOIN users u ON u.id = m.author_id WHERE m.dossier_id = ? ORDER BY m.id', d.id);
    res.page({
      title: `Messages — ${d.ref}`, nav: nav(req), sub: subNav(d, 'messages'),
      body: html`${dossierHead(d)}
        <h2>Échanges avec le cabinet</h2>
        ${messageThread(msgs, req.user.id)}
        ${d.status === 'ouvert' ? html`<form method="post" action="/espace/dossiers/${d.id}/messages" class="card" novalidate>
          ${csrfField(req.csrfToken)}
          ${field({ name: 'body', label: 'Votre message', type: 'textarea', required: true, error, hint: 'Ne transmettez pas de codes d’accès ni de mots de passe par message.', attrs: 'maxlength="4000"' })}
          <button class="btn btn-primary" type="submit">${icon('send')}<span>Envoyer</span></button>
        </form>` : html`<p>Le dossier est clôturé : la messagerie est en lecture seule.</p>`}`,
    });
  }
  r.get('/dossiers/:id/messages', withDossier((req, res, d) => messagesPage(req, res, d)));
  r.post('/dossiers/:id/messages', withDossier(async (req, res, d) => {
    const body = typeof req.body.body === 'string' ? req.body.body.trim().slice(0, 4000) : '';
    if (d.status !== 'ouvert') return res.redirect(303, `/espace/dossiers/${d.id}/messages?ok=erreur-statut`);
    if (!body) return messagesPage(req, res, d, 'Le message est vide.');
    db.run('INSERT INTO messages (dossier_id, author_id, body, created_at) VALUES (?,?,?,?)', d.id, req.user.id, body, now());
    db.run('UPDATE dossiers SET updated_at = ? WHERE id = ?', now(), d.id);
    await notifier.cabinet(d.id);
    res.redirect(303, `/espace/dossiers/${d.id}/messages?ok=message-envoye`);
  }));

  return r;
};

function messageThread(msgs, meId) {
  if (!msgs.length) return html`<p class="empty">Aucun message pour le moment.</p>`;
  return html`<ol class="thread">${msgs.map((m) => html`<li class="msg ${m.author_id === meId ? 'msg-me' : ''}">
    <p class="msg-meta"><strong>${m.name}</strong> · ${m.role === 'cabinet' ? 'Cabinet NOAMIS' : 'Client'} · ${fmtDateTime(m.created_at)}</p>
    <p>${nl2br(m.body)}</p></li>`)}</ol>`;
}
module.exports.messageThread = messageThread;
