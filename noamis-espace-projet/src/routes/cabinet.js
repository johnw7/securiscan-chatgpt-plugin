'use strict';
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');
const { now } = require('../db');
const auth = require('../auth');
const D = require('../domain');
const S = require('../services');
const V = require('../view');
const C = require('../components');
const { messageThread } = require('./client');

const { html, raw, icon, badge, nl2br, csrfField, field, select, fmtDate, fmtDateTime, fmtDay, fmtSize, visibilityBadge } = V;
const str = (v, max = 4000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const arr = (v) => (Array.isArray(v) ? v : v === undefined ? [] : [v]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ALLOWED_EXT = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.odt', '.ods', '.pptx', '.jpg', '.jpeg', '.png', '.txt'];

Object.assign(V.FLASH, {
  'erreur-cloture': 'Des validations sont encore en attente : traitez-les avant de clôturer le dossier.',
  'erreur-version': 'La version du dossier a changé depuis la validation : soumettez une nouvelle validation avant toute transmission.',
  'erreur-pieces': 'Sélectionnez au moins une pièce et un destinataire.',
});

module.exports = ({ db, config, mailer, notifier }) => {
  const r = express.Router();
  r.use(auth.requireRole('cabinet'));

  const upload = multer({
    storage: multer.diskStorage({
      destination: config.storageDir,
      filename: (req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex')),
    }),
    limits: { fileSize: 15 * 1024 * 1024, files: 1, fields: 20 },
    fileFilter: (req, file, cb) => cb(null, ALLOWED_EXT.includes(path.extname(file.originalname).toLowerCase())),
  });

  const userNames = () => Object.fromEntries(db.all('SELECT id, name FROM users').map((u) => [u.id, u.name]));
  const counts = () => ({
    demandes: db.get("SELECT COUNT(*) c FROM requests WHERE status = 'nouvelle'").c,
  });
  const nav = () => {
    const c = counts();
    return [
      { key: 'accueil', href: '/cabinet', label: 'Tableau de bord' },
      { key: 'demandes', href: '/cabinet/demandes', label: 'Demandes', count: c.demandes },
      { key: 'dossiers', href: '/cabinet/dossiers', label: 'Dossiers' },
      { key: 'clients', href: '/cabinet/clients', label: 'Clients' },
      { key: 'prestataires', href: '/cabinet/prestataires', label: 'Prestataires' },
    ];
  };
  const page = (res, active, opts) => res.page({ nav: nav(), active, ...opts });
  const back = (res, d, tab, code) => res.redirect(303, `/cabinet/dossiers/${d.id}?onglet=${tab}${code ? `&ok=${code}` : ''}#contenu`);

  const withDossier = (handler) => (req, res, next) => {
    const d = S.dossierForUser(db, req.user, req.params.id);
    if (!d) return res.notFound();
    return handler(req, res, d, next);
  };

  // =================== Tableau de bord ===================
  r.get('/', (req, res) => {
    const newReqs = db.all("SELECT * FROM requests WHERE status IN ('nouvelle','en_examen') ORDER BY created_at DESC LIMIT 5");
    const awaitingClient = db.all(`SELECT v.*, d.ref, d.title FROM validations v JOIN dossiers d ON d.id = v.dossier_id WHERE v.status = 'en_attente' ORDER BY v.created_at`);
    const toProcess = db.all(`SELECT v.*, d.ref, d.title FROM validations v JOIN dossiers d ON d.id = v.dossier_id
      WHERE (v.status = 'valide' AND v.transmitted_at IS NULL) OR v.status = 'modification' ORDER BY v.decided_at DESC`);
    const tasks = db.all(`SELECT t.*, d.ref FROM tasks t JOIN dossiers d ON d.id = t.dossier_id
      WHERE t.status = 'a_faire' AND d.status = 'ouvert' ORDER BY t.due_date IS NULL, t.due_date LIMIT 8`);
    const open = db.get("SELECT COUNT(*) c FROM dossiers WHERE status = 'ouvert'").c;
    const today = new Date().toISOString().slice(0, 10);
    page(res, 'accueil', {
      title: 'Tableau de bord du cabinet',
      body: html`<h1>Tableau de bord du cabinet</h1>
        <div class="cards cards-4 stats">
          <a class="card card-link" href="/cabinet/demandes"><span class="card-label">Demandes à traiter</span><span class="big">${newReqs.length}</span></a>
          <a class="card card-link" href="/cabinet/dossiers"><span class="card-label">Dossiers ouverts</span><span class="big">${open}</span></a>
          <div class="card"><span class="card-label">Décisions attendues du client</span><span class="big">${awaitingClient.length}</span></div>
          <div class="card"><span class="card-label">Décisions reçues à traiter</span><span class="big">${toProcess.length}</span></div>
        </div>
        <div class="grid-2">
          <section class="card" aria-labelledby="t1"><h2 id="t1">Décisions reçues à traiter</h2>
            ${toProcess.length ? html`<ul class="list">${toProcess.map((v) => html`<li class="list-item">${badge(D.VALIDATION_STATUS[v.status])}
              <span class="grow"><a href="/cabinet/dossiers/${v.dossier_id}/validations/${v.id}">${v.ref} — ${v.action.split('\n')[0]}</a>
              <br><span class="small">${v.status === 'valide' ? 'Transmission à effectuer puis à consigner' : 'Modification à apporter'}</span></span></li>`)}</ul>`
            : html`<p class="empty">Rien à traiter.</p>`}</section>
          <section class="card" aria-labelledby="t2"><h2 id="t2">Nouvelles demandes</h2>
            ${newReqs.length ? html`<ul class="list">${newReqs.map((q) => html`<li class="list-item">${badge(D.REQUEST_STATUS[q.status])}
              <span class="grow"><a href="/cabinet/demandes/${q.id}">${q.name}</a><br><span class="small">${q.profile} · ${q.need_type} · ${fmtDate(q.created_at)}</span></span></li>`)}</ul>`
            : html`<p class="empty">Aucune nouvelle demande.</p>`}</section>
          <section class="card" aria-labelledby="t3"><h2 id="t3">Tâches et échéances</h2>
            ${tasks.length ? html`<ul class="list">${tasks.map((t) => html`<li class="list-item">
              ${t.due_date && t.due_date < today ? html`<span class="status">${icon('flag')}<span>En retard</span></span>` : badge(D.TASK_STATUS[t.status])}
              <span class="grow"><a href="/cabinet/dossiers/${t.dossier_id}?onglet=taches">${t.ref} — ${t.title}</a></span>
              <span class="small">Échéance : ${fmtDay(t.due_date)}</span></li>`)}</ul>` : html`<p class="empty">Aucune tâche ouverte.</p>`}</section>
          <section class="card" aria-labelledby="t4"><h2 id="t4">En attente du client</h2>
            ${awaitingClient.length ? html`<ul class="list">${awaitingClient.map((v) => html`<li class="list-item">${badge(D.VALIDATION_STATUS.en_attente)}
              <span class="grow"><a href="/cabinet/dossiers/${v.dossier_id}/validations/${v.id}">${v.ref} — ${v.action.split('\n')[0]}</a><br>
              <span class="small">Soumise le ${fmtDateTime(v.created_at)}</span></span></li>`)}</ul>` : html`<p class="empty">Aucune validation en attente.</p>`}</section>
        </div>
        ${!mailer.configured ? html`<div class="alert alert-notice" role="note">${icon('info')}<p><strong>Envoi d’e-mails non configuré.</strong>
          Les notifications restent visibles dans l’application et les liens d’invitation sont affichés au cabinet. Renseignez les variables SMTP pour activer l’envoi (voir README).</p></div>` : ''}`,
    });
  });

  // =================== Demandes ===================
  r.get('/demandes', (req, res) => {
    const status = D.REQUEST_STATUS[req.query.statut] ? req.query.statut : '';
    const list = status ? db.all('SELECT * FROM requests WHERE status = ? ORDER BY created_at DESC', status)
      : db.all('SELECT * FROM requests ORDER BY CASE status WHEN \'nouvelle\' THEN 0 WHEN \'en_examen\' THEN 1 ELSE 2 END, created_at DESC');
    page(res, 'demandes', {
      title: 'Demandes reçues',
      body: html`<h1>Demandes reçues</h1>
        <form method="get" class="filters" action="/cabinet/demandes">
          ${select({ name: 'statut', label: 'Filtrer par statut', options: Object.entries(D.REQUEST_STATUS).map(([k, v]) => ({ value: k, label: v.label })), value: status, placeholder: 'Tous les statuts' })}
          <button class="btn btn-secondary" type="submit">Filtrer</button>
        </form>
        ${list.length ? html`<div class="table-wrap" role="region" aria-label="Liste des demandes" tabindex="0"><table class="table-stack">
          <thead><tr><th scope="col">Demandeur</th><th scope="col">Profil</th><th scope="col">Besoin</th><th scope="col">Zone</th><th scope="col">Reçue le</th><th scope="col">Statut</th></tr></thead>
          <tbody>${list.map((q) => html`<tr>
            <th scope="row" data-label="Demandeur"><a href="/cabinet/demandes/${q.id}">${q.name}</a></th>
            <td data-label="Profil">${q.profile}</td><td data-label="Besoin">${q.need_type}</td><td data-label="Zone">${q.zone}</td>
            <td data-label="Reçue le">${fmtDate(q.created_at)}</td><td data-label="Statut">${badge(D.REQUEST_STATUS[q.status])}</td></tr>`)}
          </tbody></table></div>` : html`<p class="empty">Aucune demande.</p>`}`,
    });
  });

  function clientChoice(values = {}, errors = {}) {
    const clients = db.all("SELECT id, name, email FROM users WHERE role = 'client' ORDER BY name");
    return html`<fieldset class="field radios"><legend>Client du dossier <span class="req">(obligatoire)</span></legend>
      <div class="radio"><input type="radio" id="cm-new" name="client_mode" value="new" ${values.client_mode !== 'existing' ? raw('checked') : ''}>
        <label for="cm-new">Inviter un nouveau client<span class="radio-desc">Une invitation individuelle lui sera adressée pour activer son accès.</span></label></div>
      <div class="radio"><input type="radio" id="cm-existing" name="client_mode" value="existing" ${values.client_mode === 'existing' ? raw('checked') : ''}>
        <label for="cm-existing">Rattacher à un client existant</label></div>
    </fieldset>
    <div class="subfields">
      <h3 class="h-small">Nouveau client</h3>
      <div class="two-col">
        ${field({ name: 'client_name', label: 'Nom du client', value: values.client_name, error: errors.client_name })}
        ${field({ name: 'client_email', label: 'E-mail du client', type: 'email', value: values.client_email, error: errors.client_email })}
      </div>
      ${field({ name: 'client_phone', label: 'Téléphone', type: 'tel', value: values.client_phone })}
      <h3 class="h-small">Ou client existant</h3>
      ${select({ name: 'client_id', label: 'Client existant', options: clients.map((c) => ({ value: c.id, label: `${c.name} — ${c.email}` })), value: values.client_id, error: errors.client_id })}
    </div>`;
  }

  function dossierFields(values = {}, errors = {}) {
    return html`${field({ name: 'title', label: 'Intitulé du dossier', value: values.title, required: true, error: errors.title })}
      ${V.radios({ name: 'level', legend: 'Niveau d’accompagnement', required: true, value: values.level, error: errors.level,
        options: Object.entries(D.LEVELS).map(([k, v]) => ({ value: k, label: v.label, desc: v.desc })) })}
      ${field({ name: 'zone', label: 'Commune ou zone', value: values.zone })}`;
  }

  r.get('/demandes/:rid', (req, res) => requestPage(req, res));
  function requestPage(req, res, values = null, errors = {}) {
    const q = db.get('SELECT * FROM requests WHERE id = ?', Number(req.params.rid));
    if (!q) return res.notFound();
    const v = values || {
      title: `${q.need_type} — ${q.zone}`, level: q.level || 'projet', zone: q.zone,
      client_name: q.name, client_email: q.email, client_phone: q.phone || '', client_mode: 'new',
    };
    const existing = db.get('SELECT id FROM users WHERE email = ?', q.email);
    if (!values && existing) { v.client_mode = 'existing'; v.client_id = existing.id; }
    res.status(Object.keys(errors).length ? 422 : 200);
    page(res, 'demandes', {
      title: `Demande de ${q.name}`,
      body: html`<p><a href="/cabinet/demandes">← Toutes les demandes</a></p>
        <h1>Demande de ${q.name}</h1>
        <p class="badges">${badge(D.REQUEST_STATUS[q.status])}</p>
        <div class="grid-2">
          <section class="card"><h2>Demande</h2><dl class="dl">
            <dt>Profil</dt><dd>${q.profile}</dd>
            <dt>Coordonnées</dt><dd>${q.email}${q.phone ? html`<br>${q.phone}` : ''}</dd>
            <dt>Contact préféré</dt><dd>${q.contact_pref}</dd>
            <dt>Nature du besoin</dt><dd>${q.need_type}</dd>
            <dt>Commune ou zone</dt><dd>${q.zone}</dd>
            <dt>Délai souhaité</dt><dd>${q.timeline}</dd>
            <dt>Niveau envisagé</dt><dd>${q.level ? D.levelLabel(q.level) : 'Non précisé'}</dd>
            <dt>Description</dt><dd>${nl2br(q.description)}</dd>
            <dt>Reçue le</dt><dd>${fmtDateTime(q.created_at)}</dd>
          </dl></section>
          <section class="card"><h2>Suivi interne</h2>
            <p>${visibilityBadge(false)}</p>
            <form method="post" action="/cabinet/demandes/${q.id}/statut">
              ${csrfField(req.csrfToken)}
              ${select({ name: 'status', label: 'Statut', options: Object.entries(D.REQUEST_STATUS).filter(([k]) => k !== 'convertie' || q.status === 'convertie').map(([k, s]) => ({ value: k, label: s.label })), value: q.status, placeholder: null })}
              ${field({ name: 'internal_note', label: 'Note interne', type: 'textarea', value: q.internal_note || '' })}
              <button class="btn btn-secondary" type="submit">Enregistrer</button>
            </form>
          </section>
        </div>
        ${q.dossier_id ? html`<p class="alert">${icon('check')}<span>Un dossier a été créé pour cette demande : <a href="/cabinet/dossiers/${q.dossier_id}">ouvrir le dossier</a>.</span></p>`
        : html`<section class="card" aria-labelledby="create-title"><h2 id="create-title">Créer le dossier et inviter le client</h2>
          ${V.errorSummary(errors)}
          <form method="post" action="/cabinet/demandes/${q.id}/dossier" novalidate>
            ${csrfField(req.csrfToken)}
            ${dossierFields(v, errors)}
            ${clientChoice(v, errors)}
            <button class="btn btn-primary" type="submit">Créer le dossier</button>
          </form></section>`}`,
    });
  }

  r.post('/demandes/:rid/statut', (req, res) => {
    const q = db.get('SELECT * FROM requests WHERE id = ?', Number(req.params.rid));
    if (!q) return res.notFound();
    const status = D.REQUEST_STATUS[req.body.status] && (req.body.status !== 'convertie' || q.dossier_id) ? req.body.status : q.status;
    db.run('UPDATE requests SET status = ?, internal_note = ? WHERE id = ?', status, str(req.body.internal_note) || null, q.id);
    res.redirect(303, `/cabinet/demandes/${q.id}?ok=demande-maj`);
  });

  // Résout le client (existant ou nouvel invité). Retourne { clientId, inviteToken } ou { errors }.
  function resolveClient(b) {
    const errors = {};
    if (b.client_mode === 'existing') {
      const c = db.get("SELECT id FROM users WHERE id = ? AND role = 'client'", Number(b.client_id));
      if (!c) errors.client_id = 'Choisissez un client existant.';
      return Object.keys(errors).length ? { errors } : { clientId: c.id };
    }
    const name = str(b.client_name, 160); const email = str(b.client_email, 200).toLowerCase();
    if (name.length < 2) errors.client_name = 'Indiquez le nom du client.';
    if (!EMAIL_RE.test(email)) errors.client_email = 'Indiquez une adresse e-mail valide.';
    else if (db.get('SELECT id FROM users WHERE email = ?', email)) errors.client_email = 'Un compte existe déjà avec cette adresse : rattachez le dossier au client existant.';
    if (Object.keys(errors).length) return { errors };
    const rr = db.run("INSERT INTO users (email, name, phone, role, created_at) VALUES (?,?,?,'client',?)", email, name, str(b.client_phone, 40) || null, now());
    const clientId = Number(rr.lastInsertRowid);
    return { clientId, inviteToken: auth.createInvitation(db, clientId), isNew: true };
  }
  function validateDossier(b) {
    const errors = {};
    if (str(b.title).length < 3) errors.title = 'Indiquez un intitulé.';
    if (!D.LEVELS[b.level]) errors.level = 'Choisissez un niveau d’accompagnement.';
    return errors;
  }

  async function sendInvitation(res, req, clientId, token, dossierId) {
    const u = db.get('SELECT * FROM users WHERE id = ?', clientId);
    const link = `${config.baseUrl}/invitation/${token}`;
    const status = await mailer.send(db, u.email, 'NOAMIS — Invitation à votre Espace Projet', [
      `Bonjour ${u.name},`, '', 'Le cabinet NOAMIS vous invite à accéder à votre Espace Projet privé.',
      `Pour activer votre accès, choisissez votre mot de passe ici (lien personnel, valable ${auth.INVITE_DAYS} jours) :`, link, '',
      'NOAMIS — Votre projet de sécurité, notre accompagnement.'].join('\n'));
    page(res, 'clients', {
      title: 'Invitation créée',
      flash: '',
      body: html`<section class="narrow">
        <h1>Invitation créée</h1>
        <p class="status">${icon('send')}<span>Invitation individuelle pour ${u.name} (${u.email}) — statut de l’e-mail : ${status}</span></p>
        ${!mailer.configured ? html`<div class="alert alert-notice" role="note">${icon('info')}<div>
          <p><strong>SMTP non configuré :</strong> transmettez ce lien personnel au client par un canal sûr. Il est valable ${auth.INVITE_DAYS} jours, à usage unique, et ne sera plus affiché.</p>
          <p class="invite-link"><code>${link}</code></p></div></div>` : html`<p>Le client a reçu un e-mail contenant son lien d’activation personnel.</p>`}
        <p>${dossierId ? html`<a class="btn btn-primary" href="/cabinet/dossiers/${dossierId}?ok=dossier-cree">Ouvrir le dossier</a>` : ''}
        <a class="btn btn-secondary" href="/cabinet/clients">Voir les clients</a></p>
      </section>`,
    });
  }

  r.post('/demandes/:rid/dossier', async (req, res) => {
    const q = db.get('SELECT * FROM requests WHERE id = ?', Number(req.params.rid));
    if (!q) return res.notFound();
    if (q.dossier_id) return res.redirect(303, `/cabinet/dossiers/${q.dossier_id}`);
    const b = req.body || {};
    let errors = validateDossier(b);
    if (b.client_mode === 'existing' && !db.get("SELECT id FROM users WHERE id = ? AND role = 'client'", Number(b.client_id))) errors.client_id = 'Choisissez un client existant.';
    if (Object.keys(errors).length) return requestPage(req, res, b, errors);
    const c = resolveClient(b);
    if (c.errors) return requestPage(req, res, b, c.errors);
    const id = S.createDossier(db, {
      title: str(b.title, 200), clientId: c.clientId, level: b.level, zone: str(b.zone, 160), requestId: q.id,
      context: `${q.profile} — ${q.need_type}. Délai souhaité : ${q.timeline}.`, needs: q.description,
    }, req.user.id);
    db.run("UPDATE requests SET status = 'convertie', dossier_id = ? WHERE id = ?", id, q.id);
    if (c.inviteToken) {
      S.logHistory(db, id, req.user.id, 'Invitation envoyée au client.', false);
      return sendInvitation(res, req, c.clientId, c.inviteToken, id);
    }
    await notifier.client(id);
    res.redirect(303, `/cabinet/dossiers/${id}?ok=dossier-cree`);
  });

  // =================== Dossiers ===================
  r.get('/dossiers', (req, res) => {
    const status = ['ouvert', 'clos'].includes(req.query.statut) ? req.query.statut : '';
    const list = db.all(`SELECT d.*, u.name client_name,
      (SELECT COUNT(*) FROM validations v WHERE v.dossier_id = d.id AND v.status = 'en_attente') pending
      FROM dossiers d JOIN users u ON u.id = d.client_id ${status ? 'WHERE d.status = ?' : ''} ORDER BY d.status DESC, d.updated_at DESC`, ...(status ? [status] : []));
    page(res, 'dossiers', {
      title: 'Dossiers',
      body: html`<div class="page-head"><h1>Dossiers</h1><a class="btn btn-primary" href="/cabinet/dossiers/nouveau">Créer un dossier</a></div>
        <form method="get" class="filters" action="/cabinet/dossiers">
          ${select({ name: 'statut', label: 'Filtrer', options: [{ value: 'ouvert', label: 'Dossiers ouverts' }, { value: 'clos', label: 'Dossiers clôturés' }], value: status, placeholder: 'Tous les dossiers' })}
          <button class="btn btn-secondary" type="submit">Filtrer</button>
        </form>
        ${list.length ? html`<div class="table-wrap" role="region" aria-label="Liste des dossiers" tabindex="0"><table class="table-stack">
          <thead><tr><th scope="col">Dossier</th><th scope="col">Client</th><th scope="col">Niveau</th><th scope="col">Étape</th><th scope="col">Statut</th><th scope="col">Mise à jour</th></tr></thead>
          <tbody>${list.map((d) => html`<tr>
            <th scope="row" data-label="Dossier"><a href="/cabinet/dossiers/${d.id}">${d.ref}</a><br><span class="small">${d.title}</span></th>
            <td data-label="Client">${d.client_name}</td>
            <td data-label="Niveau">${D.levelLabel(d.level)}</td>
            <td data-label="Étape">${d.current_step}. ${D.stepLabel(d.current_step)}</td>
            <td data-label="Statut">${badge(D.DOSSIER_STATUS[d.status])}${d.pending ? html`<br>${badge({ icon: 'clock', label: `${d.pending} à valider par le client` })}` : ''}</td>
            <td data-label="Mise à jour">${fmtDate(d.updated_at)}</td></tr>`)}</tbody></table></div>` : html`<p class="empty">Aucun dossier.</p>`}`,
    });
  });

  function newDossierPage(req, res, values = {}, errors = {}) {
    res.status(Object.keys(errors).length ? 422 : 200);
    page(res, 'dossiers', {
      title: 'Créer un dossier',
      body: html`<p><a href="/cabinet/dossiers">← Dossiers</a></p><h1>Créer un dossier</h1>
        ${V.errorSummary(errors)}
        <form method="post" action="/cabinet/dossiers" class="card" novalidate>
          ${csrfField(req.csrfToken)}
          ${dossierFields({ level: 'projet', ...values }, errors)}
          ${clientChoice(values, errors)}
          <button class="btn btn-primary" type="submit">Créer le dossier</button>
        </form>`,
    });
  }
  r.get('/dossiers/nouveau', (req, res) => newDossierPage(req, res));
  r.post('/dossiers', async (req, res) => {
    const b = req.body || {};
    const errors = validateDossier(b);
    if (b.client_mode === 'existing' && !db.get("SELECT id FROM users WHERE id = ? AND role = 'client'", Number(b.client_id))) errors.client_id = 'Choisissez un client existant.';
    if (Object.keys(errors).length) return newDossierPage(req, res, b, errors);
    const c = resolveClient(b);
    if (c.errors) return newDossierPage(req, res, b, c.errors);
    const id = S.createDossier(db, { title: str(b.title, 200), clientId: c.clientId, level: b.level, zone: str(b.zone, 160) }, req.user.id);
    if (c.inviteToken) {
      S.logHistory(db, id, req.user.id, 'Invitation envoyée au client.', false);
      return sendInvitation(res, req, c.clientId, c.inviteToken, id);
    }
    await notifier.client(id);
    res.redirect(303, `/cabinet/dossiers/${id}?ok=dossier-cree`);
  });

  // ---------- Fiche dossier (onglets) ----------
  const TABS = [
    ['synthese', 'Synthèse'], ['etapes', 'Étapes et livrables'], ['taches', 'Tâches'], ['documents', 'Documents'],
    ['notes', 'Notes et comptes rendus'], ['propositions', 'Propositions'], ['validations', 'Validations'],
    ['messages', 'Messages'], ['historique', 'Historique'],
  ];

  r.get('/dossiers/:id', withDossier((req, res, d) => {
    const tab = TABS.some(([k]) => k === req.query.onglet) ? req.query.onglet : 'synthese';
    const client = db.get('SELECT * FROM users WHERE id = ?', d.client_id);
    const pending = db.get("SELECT COUNT(*) c FROM validations WHERE dossier_id = ? AND status = 'en_attente'", d.id).c;
    const sub = {
      label: `Onglets du dossier ${d.ref}`, active: tab,
      items: TABS.map(([k, l]) => ({ key: k, href: `/cabinet/dossiers/${d.id}?onglet=${k}`, label: l, count: k === 'validations' ? pending : 0 })),
    };
    const render = TABS_RENDER[tab];
    page(res, 'dossiers', {
      title: `${d.ref} — ${TABS.find(([k]) => k === tab)[1]}`, sub,
      body: html`<div class="dossier-head">
          <p class="eyebrow">Dossier ${d.ref} · client : ${client.name} (${client.email})${client.password_hash ? '' : ' — invitation non encore acceptée'}</p>
          <h1>${d.title}</h1>
          <p class="badges">${C.levelBadge(d.level)} ${badge(D.DOSSIER_STATUS[d.status])}
            <span class="status">${icon('flag')}<span>Étape ${d.current_step}. ${D.stepLabel(d.current_step)}</span></span>
            <span class="status">${icon('file')}<span>Version ${d.version} du dossier</span></span></p>
        </div>
        ${render(req, d, client)}`,
    });
  }));

  const closedNote = (d) => (d.status === 'clos' ? html`<p class="alert">${icon('lock')}<span>Dossier clôturé le ${fmtDate(d.closed_at)} : consultation seule.</span></p>` : '');

  const TABS_RENDER = {
    synthese(req, d) {
      const steps = db.all('SELECT * FROM dossier_steps WHERE dossier_id = ? ORDER BY step', d.id);
      const included = steps.filter((s) => s.included);
      const open = d.status === 'ouvert';
      return html`${closedNote(d)}
        <div class="grid-2">
          <section class="card"><h2>Avancement</h2>${C.stepsTimeline(steps, { compact: true })}
            ${open ? html`<form method="post" action="/cabinet/dossiers/${d.id}/etape" class="inline-form">
              ${csrfField(req.csrfToken)}
              ${select({ name: 'step', label: 'Étape en cours', options: included.map((s) => ({ value: s.step, label: `${s.step}. ${D.stepLabel(s.step)}` })), value: d.current_step, placeholder: null })}
              <button class="btn btn-secondary" type="submit">Mettre à jour l’étape</button>
            </form>
            <form method="post" action="/cabinet/dossiers/${d.id}/version" class="inline-form">
              ${csrfField(req.csrfToken)}
              <p class="small">Version actuelle : ${d.version}. Enregistrez une nouvelle version lorsque le contenu du dossier évolue. Les validations en cours portent sur une version précise.</p>
              <button class="btn btn-secondary" type="submit">Enregistrer une nouvelle version</button>
            </form>` : ''}
          </section>
          <section class="card"><h2>Informations du dossier</h2>
            <p>${visibilityBadge(true)}</p>
            <form method="post" action="/cabinet/dossiers/${d.id}/infos" novalidate>
              ${csrfField(req.csrfToken)}
              ${field({ name: 'title', label: 'Intitulé', value: d.title, required: true })}
              ${select({ name: 'level', label: 'Niveau d’accompagnement', options: Object.entries(D.LEVELS).map(([k, v]) => ({ value: k, label: v.label })), value: d.level, placeholder: null, hint: 'Changer de niveau ajuste les étapes et les livrables par défaut.' })}
              ${field({ name: 'zone', label: 'Commune ou zone', value: d.zone || '' })}
              ${field({ name: 'next_action', label: 'Prochaine action attendue (affichée au client)', type: 'textarea', value: d.next_action || '' })}
              <h3 class="h-small">1. Comprendre</h3>
              ${field({ name: 'context', label: 'Contexte', type: 'textarea', value: d.context || '' })}
              ${field({ name: 'needs', label: 'Besoins', type: 'textarea', value: d.needs || '' })}
              ${field({ name: 'constraints', label: 'Contraintes', type: 'textarea', value: d.constraints || '' })}
              ${field({ name: 'objectives', label: 'Objectifs', type: 'textarea', value: d.objectives || '' })}
              ${open ? html`<button class="btn btn-primary" type="submit">Enregistrer</button>` : ''}
            </form>
          </section>
        </div>
        ${open ? html`<section class="card" aria-labelledby="close-title"><h2 id="close-title">Clôturer la mission</h2>
          <p>La synthèse de clôture est publiée dans l’espace du client. Le dossier passe ensuite en consultation seule.</p>
          <form method="post" action="/cabinet/dossiers/${d.id}/cloture" novalidate>
            ${csrfField(req.csrfToken)}
            ${field({ name: 'closure_summary', label: 'Synthèse de clôture (visible par le client)', type: 'textarea', required: true })}
            <button class="btn btn-secondary" type="submit">Clôturer le dossier</button>
          </form></section>` : html`<section class="card"><h2>Synthèse de clôture</h2><p>${nl2br(d.closure_summary)}</p></section>`}`;
    },

    etapes(req, d) {
      const steps = db.all('SELECT * FROM dossier_steps WHERE dossier_id = ? ORDER BY step', d.id);
      const dels = db.all('SELECT * FROM deliverables WHERE dossier_id = ?', d.id);
      const docs = db.all('SELECT id, title FROM documents WHERE dossier_id = ? ORDER BY created_at DESC', d.id);
      const byKey = Object.fromEntries(dels.map((x) => [x.key, x]));
      return html`${closedNote(d)}
        <form method="post" action="/cabinet/dossiers/${d.id}/etapes" class="card">
          ${csrfField(req.csrfToken)}
          <p>Sélectionnez les étapes et les livrables prévus pour la mission (${D.levelLabel(d.level)}). Seuls les éléments cochés sont affichés au client.</p>
          ${D.STEPS.map((s) => {
            const st = steps.find((x) => x.step === s.n);
            return html`<fieldset class="step-fieldset"><legend>${s.n}. ${s.label}</legend>
              <div class="field checkbox"><input type="checkbox" id="st-${s.n}" name="steps" value="${s.n}" ${st && st.included ? raw('checked') : ''}>
                <label for="st-${s.n}">Étape prévue pour cette mission</label></div>
              ${badge(D.STEP_STATUS[st ? st.status : 'a_venir'])}
              <ul class="plain deliverable-select">${D.DELIVERABLES.filter((x) => x.step === s.n).map((x) => {
                const cur = byKey[x.key];
                return html`<li class="deliverable-row">
                  <div class="field checkbox"><input type="checkbox" id="dl-${x.key}" name="deliverables" value="${x.key}" ${cur ? raw('checked') : ''}>
                    <label for="dl-${x.key}">${x.label}</label></div>
                  ${select({ name: `dl_status_${x.key}`, label: `Statut — ${x.label}`, options: Object.entries(D.DELIVERABLE_STATUS).map(([k, v]) => ({ value: k, label: v.label })), value: cur ? cur.status : 'prevu', placeholder: null })}
                  ${select({ name: `dl_doc_${x.key}`, label: `Document lié — ${x.label}`, options: docs.map((o) => ({ value: o.id, label: o.title })), value: cur ? cur.document_id || '' : '', placeholder: 'Aucun document' })}
                </li>`;
              })}</ul>
            </fieldset>`;
          })}
          ${d.status === 'ouvert' ? html`<button class="btn btn-primary" type="submit">Enregistrer les étapes et livrables</button>` : ''}
        </form>`;
    },

    taches(req, d) {
      const tasks = db.all('SELECT * FROM tasks WHERE dossier_id = ? ORDER BY status, due_date IS NULL, due_date', d.id);
      return html`${closedNote(d)}
        ${tasks.length ? html`<ul class="list">${tasks.map((t) => html`<li class="list-item">
          ${badge(D.TASK_STATUS[t.status])}
          <span class="grow">${t.title}<br><span class="small">Étape ${t.step}. ${D.stepLabel(t.step)} · échéance : ${fmtDay(t.due_date)}</span></span>
          ${visibilityBadge(t.visible_client)}
          ${d.status === 'ouvert' ? html`<form method="post" action="/cabinet/dossiers/${d.id}/taches/${t.id}" class="inline">${csrfField(req.csrfToken)}
            <input type="hidden" name="status" value="${t.status === 'fait' ? 'a_faire' : 'fait'}">
            <button class="btn btn-secondary btn-sm" type="submit">${t.status === 'fait' ? 'Rouvrir' : 'Marquer comme faite'}<span class="sr-only"> : ${t.title}</span></button></form>` : ''}
        </li>`)}</ul>` : html`<p class="empty">Aucune tâche.</p>`}
        ${d.status === 'ouvert' ? html`<form method="post" action="/cabinet/dossiers/${d.id}/taches" class="card" novalidate>
          <h2>Ajouter une tâche ou une échéance</h2>
          ${csrfField(req.csrfToken)}
          ${field({ name: 'title', label: 'Intitulé', required: true })}
          <div class="two-col">
            ${select({ name: 'step', label: 'Étape', options: D.STEPS.map((s) => ({ value: s.n, label: `${s.n}. ${s.label}` })), value: d.current_step, placeholder: null })}
            ${field({ name: 'due_date', label: 'Échéance', type: 'date' })}
          </div>
          <div class="field checkbox"><input type="checkbox" id="f-visible" name="visible_client" value="1">
            <label for="f-visible">Action convenue visible par le client (sinon, tâche interne au cabinet)</label></div>
          <button class="btn btn-primary" type="submit">Ajouter</button>
        </form>` : ''}`;
    },

    documents(req, d) {
      const docs = db.all('SELECT doc.*, u.name uploader FROM documents doc LEFT JOIN users u ON u.id = doc.uploaded_by WHERE doc.dossier_id = ? ORDER BY doc.created_at DESC', d.id);
      return html`${closedNote(d)}
        <p>Les nouveaux documents restent privés au cabinet tant qu’ils ne sont pas explicitement partagés.</p>
        ${docs.length ? html`<div class="table-wrap" role="region" aria-label="Documents du dossier" tabindex="0"><table class="table-stack">
          <thead><tr><th scope="col">Document</th><th scope="col">Étape</th><th scope="col">Déposé</th><th scope="col">Visibilité</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
          <tbody>${docs.map((x) => html`<tr>
            <th scope="row" data-label="Document"><a href="/documents/${x.id}/telecharger">${x.title}</a><br><span class="small">${x.original_name} · ${fmtSize(x.size)}</span></th>
            <td data-label="Étape">${x.step}. ${D.stepLabel(x.step)}</td>
            <td data-label="Déposé">${fmtDateTime(x.created_at)}${x.uploader ? html`<br><span class="small">par ${x.uploader}</span>` : ''}</td>
            <td data-label="Visibilité">${visibilityBadge(x.shared)}</td>
            <td>${d.status === 'ouvert' ? html`<form method="post" action="/cabinet/dossiers/${d.id}/documents/${x.id}/partage" class="inline">${csrfField(req.csrfToken)}
              <input type="hidden" name="shared" value="${x.shared ? '0' : '1'}">
              <button class="btn btn-secondary btn-sm" type="submit">${x.shared ? 'Retirer le partage' : 'Partager avec le client'}<span class="sr-only"> : ${x.title}</span></button></form>` : ''}</td>
          </tr>`)}</tbody></table></div>` : html`<p class="empty">Aucun document.</p>`}
        ${d.status === 'ouvert' ? html`<form method="post" action="/cabinet/dossiers/${d.id}/documents" enctype="multipart/form-data" class="card">
          <h2>Déposer un document</h2>
          ${csrfField(req.csrfToken)}
          ${field({ name: 'title', label: 'Titre du document', required: true })}
          ${select({ name: 'step', label: 'Étape', options: D.STEPS.map((s) => ({ value: s.n, label: `${s.n}. ${s.label}` })), value: d.current_step, placeholder: null })}
          ${field({ name: 'file', label: 'Fichier', type: 'file', required: true, hint: `Formats acceptés : ${ALLOWED_EXT.join(', ')} — 15 Mo maximum.` })}
          <p>${visibilityBadge(false)}</p>
          <button class="btn btn-primary" type="submit">Déposer</button>
        </form>` : ''}`;
    },

    notes(req, d) {
      const notes = db.all('SELECT n.*, u.name author FROM notes n LEFT JOIN users u ON u.id = n.author_id WHERE n.dossier_id = ? ORDER BY n.created_at DESC', d.id);
      const item = (n) => html`<article class="card note ${n.shared ? '' : 'note-private'}">
        <div class="step-head"><h3>${n.title}</h3>${visibilityBadge(n.shared)}</div>
        <p class="small">${n.kind === 'compte_rendu' ? 'Compte rendu' : 'Note interne'} · étape ${n.step}. ${D.stepLabel(n.step)} · ${n.author || ''} · ${fmtDateTime(n.created_at)}</p>
        <p>${nl2br(n.body)}</p>
        ${n.kind === 'compte_rendu' && d.status === 'ouvert' ? html`<form method="post" action="/cabinet/dossiers/${d.id}/notes/${n.id}/partage" class="inline">${csrfField(req.csrfToken)}
          <input type="hidden" name="shared" value="${n.shared ? '0' : '1'}">
          <button class="btn btn-secondary btn-sm" type="submit">${n.shared ? 'Retirer la publication' : 'Publier pour le client'}<span class="sr-only"> : ${n.title}</span></button></form>` : ''}
      </article>`;
      return html`${closedNote(d)}
        <div class="grid-2">
          <section><h2>${icon('lock')}<span> Notes internes</span></h2><p>Réservées au cabinet, jamais affichées au client.</p>
            ${notes.filter((n) => n.kind === 'note').map(item)}${notes.some((n) => n.kind === 'note') ? '' : html`<p class="empty">Aucune note interne.</p>`}</section>
          <section><h2>${icon('eye')}<span> Comptes rendus</span></h2><p>Privés jusqu’à leur publication explicite.</p>
            ${notes.filter((n) => n.kind === 'compte_rendu').map(item)}${notes.some((n) => n.kind === 'compte_rendu') ? '' : html`<p class="empty">Aucun compte rendu.</p>`}</section>
        </div>
        ${d.status === 'ouvert' ? html`<form method="post" action="/cabinet/dossiers/${d.id}/notes" class="card" novalidate>
          <h2>Rédiger</h2>
          ${csrfField(req.csrfToken)}
          ${V.radios({ name: 'kind', legend: 'Type', required: true, value: 'note', options: [
            { value: 'note', label: 'Note interne', desc: 'Jamais visible par le client.' },
            { value: 'compte_rendu', label: 'Compte rendu', desc: 'Reste privé tant qu’il n’est pas publié.' }] })}
          ${field({ name: 'title', label: 'Titre', required: true })}
          ${select({ name: 'step', label: 'Étape', options: D.STEPS.map((s) => ({ value: s.n, label: `${s.n}. ${s.label}` })), value: d.current_step, placeholder: null })}
          ${field({ name: 'body', label: 'Contenu', type: 'textarea', required: true })}
          <div class="field checkbox"><input type="checkbox" id="f-publish" name="publish" value="1">
            <label for="f-publish">Publier immédiatement pour le client (comptes rendus uniquement)</label></div>
          <button class="btn btn-primary" type="submit">Enregistrer</button>
        </form>` : ''}`;
    },

    propositions(req, d) {
      const proposals = db.all(`SELECT pr.*, p.company, doc.shared doc_shared FROM proposals pr JOIN providers p ON p.id = pr.provider_id
        LEFT JOIN documents doc ON doc.id = pr.document_id WHERE pr.dossier_id = ? ORDER BY pr.id`, d.id);
      return html`${closedNote(d)}
        <h2>Comparatif (aperçu cabinet)</h2>
        ${C.comparison(proposals)}
        <h2>Propositions</h2>
        ${proposals.length ? html`<ul class="list">${proposals.map((p) => html`<li class="list-item">
          <span class="grow"><strong>${p.company}</strong> — ${p.amount}</span>${visibilityBadge(p.shared)}
          <a class="btn btn-secondary btn-sm" href="/cabinet/dossiers/${d.id}/propositions/${p.id}">Modifier<span class="sr-only"> la proposition de ${p.company}</span></a>
          ${d.status === 'ouvert' ? html`<form method="post" action="/cabinet/dossiers/${d.id}/propositions/${p.id}/partage" class="inline">${csrfField(req.csrfToken)}
            <input type="hidden" name="shared" value="${p.shared ? '0' : '1'}">
            <button class="btn btn-secondary btn-sm" type="submit">${p.shared ? 'Retirer du comparatif client' : 'Partager dans le comparatif client'}<span class="sr-only"> : ${p.company}</span></button></form>` : ''}
        </li>`)}</ul><p class="small">Partager une proposition partage aussi le devis qui y est joint.</p>` : ''}
        ${d.status === 'ouvert' ? proposalForm(req, d, {}) : ''}`;
    },

    validations(req, d) {
      const list = db.all(`SELECT v.*, p.company FROM validations v JOIN providers p ON p.id = v.provider_id WHERE v.dossier_id = ? ORDER BY v.id DESC`, d.id);
      return html`${closedNote(d)}
        <p>Avant toute transmission à un prestataire, le client doit valider l’action proposée, le destinataire, la version du dossier et les pièces concernées.
        Après validation, le cabinet effectue l’envoi puis consigne la transmission.</p>
        ${list.length ? html`<ul class="list">${list.map((v) => html`<li class="list-item">
          ${badge(D.VALIDATION_STATUS[v.status])}${v.transmitted_at ? html`<span class="status">${icon('send')}<span>Transmis</span></span>` : ''}
          <span class="grow"><a href="/cabinet/dossiers/${d.id}/validations/${v.id}">${v.action.split('\n')[0]}</a><br>
          <span class="small">Destinataire : ${v.company} · version ${v.dossier_version} · ${fmtDateTime(v.created_at)}</span></span>
        </li>`)}</ul>` : html`<p class="empty">Aucune demande de validation.</p>`}
        ${d.status === 'ouvert' ? validationForm(req, d, {}, `/cabinet/dossiers/${d.id}/validations`, 'Soumettre au client pour validation') : ''}`;
    },

    messages(req, d) {
      const msgs = db.all('SELECT m.*, u.name, u.role FROM messages m JOIN users u ON u.id = m.author_id WHERE m.dossier_id = ? ORDER BY m.id', d.id);
      return html`${closedNote(d)}<p>${visibilityBadge(true)}</p>${messageThread(msgs, req.user.id)}
        ${d.status === 'ouvert' ? html`<form method="post" action="/cabinet/dossiers/${d.id}/messages" class="card" novalidate>
          ${csrfField(req.csrfToken)}
          ${field({ name: 'body', label: 'Message au client', type: 'textarea', required: true })}
          <button class="btn btn-primary" type="submit">${icon('send')}<span>Envoyer</span></button></form>` : ''}`;
    },

    historique(req, d) {
      const names = userNames();
      const list = db.all('SELECT * FROM history WHERE dossier_id = ? ORDER BY id DESC', d.id);
      return html`<div class="table-wrap" role="region" aria-label="Historique du dossier" tabindex="0"><table class="table-stack">
        <thead><tr><th scope="col">Date</th><th scope="col">Action</th><th scope="col">Auteur</th><th scope="col">Visibilité</th></tr></thead>
        <tbody>${list.map((h) => html`<tr><td data-label="Date">${fmtDateTime(h.created_at)}</td><th scope="row" data-label="Action">${h.action}</th>
          <td data-label="Auteur">${names[h.user_id] || 'Système'}</td><td data-label="Visibilité">${visibilityBadge(h.visible_client)}</td></tr>`)}</tbody></table></div>`;
    },
  };

  function proposalForm(req, d, p, action = `/cabinet/dossiers/${d.id}/propositions`) {
    const providers = db.all('SELECT id, company FROM providers ORDER BY company');
    const docs = db.all('SELECT id, title FROM documents WHERE dossier_id = ? ORDER BY created_at DESC', d.id);
    return html`<form method="post" action="${action}" class="card" novalidate>
      <h2>${p.id ? 'Modifier la proposition' : 'Ajouter une proposition'}</h2>
      ${csrfField(req.csrfToken)}
      ${select({ name: 'provider_id', label: 'Prestataire (annuaire)', options: providers.map((x) => ({ value: x.id, label: x.company })), value: p.provider_id, required: true })}
      <fieldset class="group"><legend>${icon('file')}<span>Informations fournies par le prestataire</span></legend>
        ${field({ name: 'scope', label: 'Périmètre de l’intervention', type: 'textarea', value: p.scope, required: true })}
        <div class="two-col">
          ${field({ name: 'amount', label: 'Montant issu du devis', value: p.amount, required: true, hint: 'Tel qu’indiqué au devis, par exemple « 18 450 € HT ».' })}
          ${field({ name: 'quote_ref', label: 'Référence du devis', value: p.quote_ref })}
        </div>
        ${field({ name: 'delays', label: 'Délais', type: 'textarea', value: p.delays })}
        ${field({ name: 'guarantees', label: 'Garanties annoncées', type: 'textarea', value: p.guarantees })}
        ${select({ name: 'document_id', label: 'Devis joint', options: docs.map((x) => ({ value: x.id, label: x.title })), value: p.document_id || '', placeholder: 'Aucun document' })}
      </fieldset>
      <fieldset class="group"><legend>${icon('shield')}<span>Analyse NOAMIS</span></legend>
        ${field({ name: 'clarifications', label: 'Points à clarifier', type: 'textarea', value: p.clarifications })}
        ${field({ name: 'analysis', label: 'Observations', type: 'textarea', value: p.analysis })}
      </fieldset>
      <p>${visibilityBadge(p.shared)}</p>
      <button class="btn btn-primary" type="submit">Enregistrer</button>
    </form>`;
  }

  function validationForm(req, d, v, action, submitLabel) {
    const providers = db.all('SELECT id, company, specialties FROM providers ORDER BY company');
    const docs = db.all('SELECT id, title, original_name, shared FROM documents WHERE dossier_id = ? ORDER BY created_at DESC', d.id);
    const selected = new Set(v.id ? S.validationDocs(v).map((x) => x.id) : []);
    return html`<form method="post" action="${action}" class="card" novalidate>
      <h2>${v.id ? 'Modifier la demande de validation' : 'Nouvelle demande de validation'}</h2>
      ${v.id ? html`<p class="alert alert-notice">${icon('info')}<span>Toute modification crée une nouvelle demande de validation : la précédente est marquée « Remplacée » et le client doit se prononcer à nouveau.</span></p>` : ''}
      ${csrfField(req.csrfToken)}
      ${field({ name: 'action', label: 'Action proposée', type: 'textarea', value: v.action, required: true, hint: 'Exemple : transmettre le cahier des besoins pour obtenir un devis.' })}
      ${select({ name: 'provider_id', label: 'Destinataire', options: providers.map((x) => ({ value: x.id, label: `${x.company} — ${x.specialties}` })), value: v.provider_id, required: true })}
      <fieldset class="field"><legend>Pièces concernées <span class="req">(obligatoire)</span></legend>
        ${docs.length ? docs.map((x) => html`<div class="field checkbox"><input type="checkbox" id="vd-${x.id}" name="doc_ids" value="${x.id}" ${selected.has(x.id) ? raw('checked') : ''}>
          <label for="vd-${x.id}">${x.title} <span class="small">(${x.original_name}${x.shared ? '' : ' — privé, sera partagé avec le client'})</span></label></div>`)
        : html`<p class="empty">Déposez d’abord les pièces dans l’onglet Documents.</p>`}
      </fieldset>
      <p class="small">La demande portera sur la version ${d.version} du dossier. Les pièces sélectionnées seront partagées avec le client pour qu’il puisse les consulter.</p>
      <button class="btn btn-primary" type="submit">${submitLabel}</button>
    </form>`;
  }

  // ---------- Actions sur le dossier ----------
  const mustBeOpen = (handler) => withDossier((req, res, d) => (d.status !== 'ouvert' ? back(res, d, 'synthese', 'erreur-statut') : handler(req, res, d)));

  r.post('/dossiers/:id/infos', mustBeOpen(async (req, res, d) => {
    const b = req.body || {};
    const title = str(b.title, 200) || d.title;
    const level = D.LEVELS[b.level] ? b.level : d.level;
    db.run('UPDATE dossiers SET title = ?, level = ?, zone = ?, next_action = ?, context = ?, needs = ?, constraints = ?, objectives = ? WHERE id = ?',
      title, level, str(b.zone, 160) || null, str(b.next_action) || null, str(b.context) || null, str(b.needs) || null, str(b.constraints) || null, str(b.objectives) || null, d.id);
    if (level !== d.level) {
      S.applyLevelDefaults(db, d.id, level);
      S.logHistory(db, d.id, req.user.id, `Niveau d’accompagnement : ${D.levelLabel(level)}.`, true);
    } else S.logHistory(db, d.id, req.user.id, 'Informations du dossier mises à jour.', false);
    if ((str(b.next_action) || null) !== d.next_action) await notifier.client(d.id);
    back(res, d, 'synthese', 'dossier-maj');
  }));

  r.post('/dossiers/:id/etape', mustBeOpen(async (req, res, d) => {
    const step = Number(req.body.step);
    const st = db.get('SELECT * FROM dossier_steps WHERE dossier_id = ? AND step = ? AND included = 1', d.id, step);
    if (!st) return back(res, d, 'synthese', 'erreur-statut');
    db.tx(() => {
      db.run('UPDATE dossiers SET current_step = ? WHERE id = ?', step, d.id);
      db.run("UPDATE dossier_steps SET status = CASE WHEN step < ? THEN 'terminee' WHEN step = ? THEN 'en_cours' ELSE 'a_venir' END WHERE dossier_id = ?", step, step, d.id);
    });
    S.logHistory(db, d.id, req.user.id, `Étape en cours : ${step}. ${D.stepLabel(step)}.`, true);
    await notifier.client(d.id);
    back(res, d, 'synthese', 'dossier-maj');
  }));

  r.post('/dossiers/:id/version', mustBeOpen((req, res, d) => {
    db.run('UPDATE dossiers SET version = version + 1 WHERE id = ?', d.id);
    S.logHistory(db, d.id, req.user.id, `Nouvelle version du dossier : version ${d.version + 1}.`, true);
    back(res, d, 'synthese', 'version');
  }));

  r.post('/dossiers/:id/etapes', mustBeOpen((req, res, d) => {
    const b = req.body || {};
    const steps = new Set(arr(b.steps).map(Number));
    const keys = new Set(arr(b.deliverables));
    const docIds = new Set(db.all('SELECT id FROM documents WHERE dossier_id = ?', d.id).map((x) => x.id));
    db.tx(() => {
      for (const s of D.STEPS) db.run('UPDATE dossier_steps SET included = ? WHERE dossier_id = ? AND step = ?', steps.has(s.n) || s.n === d.current_step ? 1 : 0, d.id, s.n);
      for (const x of D.DELIVERABLES) {
        if (!keys.has(x.key)) { db.run('DELETE FROM deliverables WHERE dossier_id = ? AND key = ?', d.id, x.key); continue; }
        const status = D.DELIVERABLE_STATUS[b[`dl_status_${x.key}`]] ? b[`dl_status_${x.key}`] : 'prevu';
        const docId = docIds.has(Number(b[`dl_doc_${x.key}`])) ? Number(b[`dl_doc_${x.key}`]) : null;
        db.run(`INSERT INTO deliverables (dossier_id, key, label, step, status, document_id) VALUES (?,?,?,?,?,?)
          ON CONFLICT(dossier_id, key) DO UPDATE SET status = excluded.status, document_id = excluded.document_id`, d.id, x.key, x.label, x.step, status, docId);
      }
    });
    S.logHistory(db, d.id, req.user.id, 'Étapes et livrables de la mission mis à jour.', false);
    back(res, d, 'etapes', 'etapes-maj');
  }));

  r.post('/dossiers/:id/taches', mustBeOpen(async (req, res, d) => {
    const b = req.body || {};
    const title = str(b.title, 300);
    if (!title) return back(res, d, 'taches', 'erreur-champs');
    const step = D.STEPS.some((s) => s.n === Number(b.step)) ? Number(b.step) : d.current_step;
    const due = /^\d{4}-\d{2}-\d{2}$/.test(b.due_date || '') ? b.due_date : null;
    const visible = b.visible_client === '1';
    db.run('INSERT INTO tasks (dossier_id, title, step, due_date, visible_client, created_by, created_at) VALUES (?,?,?,?,?,?,?)', d.id, title, step, due, visible ? 1 : 0, req.user.id, now());
    S.logHistory(db, d.id, req.user.id, visible ? `Action convenue ajoutée : ${title}.` : `Tâche interne ajoutée : ${title}.`, visible);
    if (visible) await notifier.client(d.id);
    back(res, d, 'taches', 'tache-ajoutee');
  }));
  r.post('/dossiers/:id/taches/:tid', mustBeOpen((req, res, d) => {
    const t = db.get('SELECT * FROM tasks WHERE id = ? AND dossier_id = ?', Number(req.params.tid), d.id);
    if (!t) return res.notFound();
    const status = req.body.status === 'fait' ? 'fait' : 'a_faire';
    db.run('UPDATE tasks SET status = ?, done_at = ? WHERE id = ?', status, status === 'fait' ? now() : null, t.id);
    S.logHistory(db, d.id, req.user.id, `${t.visible_client ? 'Action convenue' : 'Tâche'} « ${t.title} » : ${D.TASK_STATUS[status].label}.`, Boolean(t.visible_client));
    back(res, d, 'taches', 'tache-maj');
  }));

  // Dépôt de document (multipart) : CSRF vérifié après analyse ; fichier supprimé en cas de refus.
  r.post('/dossiers/:id/documents', (req, res, next) => {
    const d = S.dossierForUser(db, req.user, req.params.id);
    if (!d) return res.notFound();
    upload.single('file')(req, res, (err) => {
      const cleanup = () => { if (req.file) fs.rm(req.file.path, { force: true }, () => {}); };
      const sent = req.body && req.body._csrf;
      const expected = req.cookies.noamis_csrf;
      if (!sent || !expected || sent.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(expected))) {
        cleanup(); return res.status(403).send('Jeton de sécurité invalide ou expiré.');
      }
      if (err || !req.file || d.status !== 'ouvert') { cleanup(); return back(res, d, 'documents', 'erreur-fichier'); }
      const title = str(req.body.title, 200) || req.file.originalname;
      const step = D.STEPS.some((s) => s.n === Number(req.body.step)) ? Number(req.body.step) : d.current_step;
      const original = path.basename(req.file.originalname).replace(/[^\p{L}\p{N} ._()-]/gu, '_').slice(0, 150);
      db.run('INSERT INTO documents (dossier_id, title, original_name, stored_name, mime, size, step, shared, uploaded_by, created_at) VALUES (?,?,?,?,?,?,?,0,?,?)',
        d.id, title, original, req.file.filename, req.file.mimetype || 'application/octet-stream', req.file.size, step, req.user.id, now());
      S.logHistory(db, d.id, req.user.id, `Document déposé (privé) : ${title}.`, false);
      back(res, d, 'documents', 'doc-ajoute');
    });
  });

  async function shareDocument(d, docId, shared, userId) {
    const doc = db.get('SELECT * FROM documents WHERE id = ? AND dossier_id = ?', docId, d.id);
    if (!doc || Boolean(doc.shared) === shared) return doc;
    db.run('UPDATE documents SET shared = ?, shared_at = ? WHERE id = ?', shared ? 1 : 0, shared ? now() : null, doc.id);
    S.logHistory(db, d.id, userId, shared ? `Document partagé avec le client : ${doc.title}.` : `Partage retiré : ${doc.title}.`, shared);
    return doc;
  }
  r.post('/dossiers/:id/documents/:did/partage', mustBeOpen(async (req, res, d) => {
    const shared = req.body.shared === '1';
    const doc = await shareDocument(d, Number(req.params.did), shared, req.user.id);
    if (!doc) return res.notFound();
    if (shared) await notifier.client(d.id);
    back(res, d, 'documents', shared ? 'doc-partage' : 'doc-prive');
  }));

  r.post('/dossiers/:id/notes', mustBeOpen(async (req, res, d) => {
    const b = req.body || {};
    const kind = b.kind === 'compte_rendu' ? 'compte_rendu' : 'note';
    const title = str(b.title, 200); const body = str(b.body, 10000);
    if (!title || !body) return back(res, d, 'notes', 'erreur-champs');
    const step = D.STEPS.some((s) => s.n === Number(b.step)) ? Number(b.step) : d.current_step;
    const publish = kind === 'compte_rendu' && b.publish === '1';
    db.run('INSERT INTO notes (dossier_id, kind, title, body, step, shared, shared_at, author_id, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      d.id, kind, title, body, step, publish ? 1 : 0, publish ? now() : null, req.user.id, now());
    S.logHistory(db, d.id, req.user.id, publish ? `Compte rendu publié : ${title}.` : `${kind === 'note' ? 'Note interne' : 'Compte rendu (privé)'} rédigé : ${title}.`, publish);
    if (publish) await notifier.client(d.id);
    back(res, d, 'notes', publish ? 'note-publiee' : 'note-ajoutee');
  }));
  r.post('/dossiers/:id/notes/:nid/partage', mustBeOpen(async (req, res, d) => {
    const n = db.get("SELECT * FROM notes WHERE id = ? AND dossier_id = ? AND kind = 'compte_rendu'", Number(req.params.nid), d.id);
    if (!n) return res.notFound();
    const shared = req.body.shared === '1';
    db.run('UPDATE notes SET shared = ?, shared_at = ? WHERE id = ?', shared ? 1 : 0, shared ? now() : null, n.id);
    S.logHistory(db, d.id, req.user.id, shared ? `Compte rendu publié : ${n.title}.` : `Publication retirée : ${n.title}.`, shared);
    if (shared) await notifier.client(d.id);
    back(res, d, 'notes', shared ? 'note-publiee' : 'note-privee');
  }));

  // ---------- Propositions ----------
  function proposalValues(b, d) {
    const provider = db.get('SELECT id FROM providers WHERE id = ?', Number(b.provider_id));
    const doc = db.get('SELECT id FROM documents WHERE id = ? AND dossier_id = ?', Number(b.document_id), d.id);
    const v = { provider_id: provider ? provider.id : null, scope: str(b.scope), amount: str(b.amount, 120), quote_ref: str(b.quote_ref, 120),
      delays: str(b.delays), guarantees: str(b.guarantees), document_id: doc ? doc.id : null, clarifications: str(b.clarifications), analysis: str(b.analysis) };
    return v.provider_id && v.scope && v.amount ? v : null;
  }
  r.post('/dossiers/:id/propositions', mustBeOpen((req, res, d) => {
    const v = proposalValues(req.body || {}, d);
    if (!v) return back(res, d, 'propositions', 'erreur-champs');
    db.run(`INSERT INTO proposals (dossier_id, provider_id, scope, amount, quote_ref, delays, guarantees, document_id, clarifications, analysis, shared, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?)`, d.id, v.provider_id, v.scope, v.amount, v.quote_ref || null, v.delays || null, v.guarantees || null, v.document_id,
    v.clarifications || null, v.analysis || null, now(), now());
    S.logHistory(db, d.id, req.user.id, 'Proposition enregistrée (privée).', false);
    back(res, d, 'propositions', 'proposition-ajoutee');
  }));
  const loadProposal = (d, pid) => db.get('SELECT * FROM proposals WHERE id = ? AND dossier_id = ?', Number(pid), d.id);
  r.get('/dossiers/:id/propositions/:pid', withDossier((req, res, d) => {
    const p = loadProposal(d, req.params.pid);
    if (!p) return res.notFound();
    page(res, 'dossiers', {
      title: `Proposition — ${d.ref}`,
      body: html`<p><a href="/cabinet/dossiers/${d.id}?onglet=propositions">← Propositions du dossier ${d.ref}</a></p>
        ${d.status === 'ouvert' ? proposalForm(req, d, p, `/cabinet/dossiers/${d.id}/propositions/${p.id}`) : closedNote(d)}`,
    });
  }));
  r.post('/dossiers/:id/propositions/:pid', mustBeOpen((req, res, d) => {
    const p = loadProposal(d, req.params.pid);
    if (!p) return res.notFound();
    const v = proposalValues(req.body || {}, d);
    if (!v) return back(res, d, 'propositions', 'erreur-champs');
    db.run(`UPDATE proposals SET provider_id = ?, scope = ?, amount = ?, quote_ref = ?, delays = ?, guarantees = ?, document_id = ?, clarifications = ?, analysis = ?, updated_at = ? WHERE id = ?`,
      v.provider_id, v.scope, v.amount, v.quote_ref || null, v.delays || null, v.guarantees || null, v.document_id, v.clarifications || null, v.analysis || null, now(), p.id);
    S.logHistory(db, d.id, req.user.id, 'Proposition mise à jour.', Boolean(p.shared));
    back(res, d, 'propositions', 'proposition-maj');
  }));
  r.post('/dossiers/:id/propositions/:pid/partage', mustBeOpen(async (req, res, d) => {
    const p = loadProposal(d, req.params.pid);
    if (!p) return res.notFound();
    const shared = req.body.shared === '1';
    db.run('UPDATE proposals SET shared = ?, updated_at = ? WHERE id = ?', shared ? 1 : 0, now(), p.id);
    if (shared && p.document_id) await shareDocument(d, p.document_id, true, req.user.id);
    const prov = db.get('SELECT company FROM providers WHERE id = ?', p.provider_id);
    S.logHistory(db, d.id, req.user.id, shared ? `Proposition de ${prov.company} ajoutée au comparatif.` : `Proposition de ${prov.company} retirée du comparatif.`, shared);
    if (shared) await notifier.client(d.id);
    back(res, d, 'propositions', 'proposition-maj');
  }));

  // ---------- Validations ----------
  function validationInput(b, d) {
    const action = str(b.action, 2000);
    const provider = db.get('SELECT id, company FROM providers WHERE id = ?', Number(b.provider_id));
    const ids = [...new Set(arr(b.doc_ids).map(Number))];
    const docs = ids.length ? db.all(`SELECT id, title, original_name FROM documents WHERE dossier_id = ? AND id IN (${ids.map(() => '?').join(',')}) ORDER BY id`, d.id, ...ids) : [];
    if (!action || !provider || !docs.length || docs.length !== ids.length) return null;
    return { action, provider, docs };
  }
  async function submitValidation(req, d, input, replaces = null) {
    const id = db.tx(() => {
      for (const doc of input.docs) {
        const cur = db.get('SELECT shared FROM documents WHERE id = ?', doc.id);
        if (!cur.shared) {
          db.run('UPDATE documents SET shared = 1, shared_at = ? WHERE id = ?', now(), doc.id);
          S.logHistory(db, d.id, req.user.id, `Document partagé avec le client : ${doc.title}.`, true);
        }
      }
      const rr = db.run(`INSERT INTO validations (dossier_id, action, provider_id, dossier_version, documents_json, status, created_by, created_at, replaces)
        VALUES (?,?,?,?,?,'en_attente',?,?,?)`, d.id, input.action, input.provider.id, d.version, JSON.stringify(input.docs), req.user.id, now(), replaces);
      const newId = Number(rr.lastInsertRowid);
      if (replaces) db.run("UPDATE validations SET status = 'remplacee', replaced_by = ? WHERE id = ?", newId, replaces);
      S.logHistory(db, d.id, req.user.id, `${replaces ? 'Nouvelle validation demandée (pièces, destinataire ou action modifiés)' : 'Validation demandée'} : transmission à ${input.provider.company} (version ${d.version}).`, true);
      return newId;
    });
    await notifier.client(d.id, 'decision');
    return id;
  }
  r.post('/dossiers/:id/validations', mustBeOpen(async (req, res, d) => {
    const input = validationInput(req.body || {}, d);
    if (!input) return back(res, d, 'validations', 'erreur-pieces');
    const id = await submitValidation(req, d, input);
    res.redirect(303, `/cabinet/dossiers/${d.id}/validations/${id}?ok=validation-soumise`);
  }));
  const loadValidation = (d, vid) => db.get(`SELECT v.*, p.company, p.specialties FROM validations v JOIN providers p ON p.id = v.provider_id
    WHERE v.id = ? AND v.dossier_id = ?`, Number(vid), d.id);

  r.get('/dossiers/:id/validations/:vid', withDossier((req, res, d) => {
    const v = loadValidation(d, req.params.vid);
    if (!v) return res.notFound();
    const editable = d.status === 'ouvert' && ['en_attente', 'valide', 'modification'].includes(v.status) && !v.transmitted_at;
    const transmissible = d.status === 'ouvert' && v.status === 'valide' && !v.transmitted_at;
    page(res, 'dossiers', {
      title: `Validation — ${d.ref}`,
      body: html`<p><a href="/cabinet/dossiers/${d.id}?onglet=validations">← Validations du dossier ${d.ref}</a></p>
        <h1>Demande de validation</h1>
        <section class="card">${C.validationSummary(v, { users: userNames() })}
          ${v.replaced_by ? html`<p><a href="/cabinet/dossiers/${d.id}/validations/${v.replaced_by}">Voir la demande qui la remplace</a></p>` : ''}
          ${v.replaces ? html`<p><a href="/cabinet/dossiers/${d.id}/validations/${v.replaces}">Voir la demande remplacée</a></p>` : ''}</section>
        ${transmissible ? (v.dossier_version !== d.version
          ? html`<p class="alert alert-error">${icon('info')}<span>${V.FLASH['erreur-version']}</span></p>`
          : html`<form method="post" action="/cabinet/dossiers/${d.id}/validations/${v.id}/transmission" class="card" novalidate>
            <h2>Consigner la transmission</h2>
            <p>Le client a validé cette action. Effectuez l’envoi au destinataire, puis consignez-le ici. La validation ne vaut ni commande, ni paiement, ni signature de devis.</p>
            ${csrfField(req.csrfToken)}
            ${field({ name: 'note', label: 'Modalités de l’envoi', type: 'textarea', required: true, hint: 'Exemple : envoi par messagerie sécurisée à l’interlocuteur commercial, accusé de réception demandé.' })}
            <button class="btn btn-primary" type="submit">Consigner la transmission</button>
          </form>`) : ''}
        ${editable ? validationForm(req, d, v, `/cabinet/dossiers/${d.id}/validations/${v.id}/modifier`, 'Soumettre la nouvelle version au client') : ''}`,
    });
  }));

  r.post('/dossiers/:id/validations/:vid/modifier', mustBeOpen(async (req, res, d) => {
    const v = loadValidation(d, req.params.vid);
    if (!v) return res.notFound();
    if (!['en_attente', 'valide', 'modification'].includes(v.status) || v.transmitted_at) return back(res, d, 'validations', 'erreur-statut');
    const input = validationInput(req.body || {}, d);
    if (!input) return res.redirect(303, `/cabinet/dossiers/${d.id}/validations/${v.id}?ok=erreur-pieces`);
    const id = await submitValidation(req, d, input, v.id);
    res.redirect(303, `/cabinet/dossiers/${d.id}/validations/${id}?ok=validation-remplacee`);
  }));

  r.post('/dossiers/:id/validations/:vid/transmission', mustBeOpen(async (req, res, d) => {
    const v = loadValidation(d, req.params.vid);
    if (!v) return res.notFound();
    const note = str(req.body.note, 2000);
    if (v.status !== 'valide' || v.transmitted_at) return res.redirect(303, `/cabinet/dossiers/${d.id}/validations/${v.id}?ok=erreur-statut`);
    if (v.dossier_version !== d.version) return res.redirect(303, `/cabinet/dossiers/${d.id}/validations/${v.id}?ok=erreur-version`);
    if (!note) return res.redirect(303, `/cabinet/dossiers/${d.id}/validations/${v.id}?ok=erreur-champs`);
    db.run('UPDATE validations SET transmitted_at = ?, transmitted_by = ?, transmission_note = ? WHERE id = ?', now(), req.user.id, note, v.id);
    S.logHistory(db, d.id, req.user.id, `Transmission effectuée par le cabinet à ${v.company} (version ${v.dossier_version}, ${S.validationDocs(v).length} pièce(s)), après validation du client.`, true);
    await notifier.client(d.id);
    res.redirect(303, `/cabinet/dossiers/${d.id}/validations/${v.id}?ok=transmission`);
  }));

  r.post('/dossiers/:id/messages', mustBeOpen(async (req, res, d) => {
    const body = str(req.body.body, 4000);
    if (!body) return back(res, d, 'messages', 'erreur-champs');
    db.run('INSERT INTO messages (dossier_id, author_id, body, created_at) VALUES (?,?,?,?)', d.id, req.user.id, body, now());
    db.run('UPDATE dossiers SET updated_at = ? WHERE id = ?', now(), d.id);
    await notifier.client(d.id);
    back(res, d, 'messages', 'message-envoye');
  }));

  r.post('/dossiers/:id/cloture', mustBeOpen(async (req, res, d) => {
    const summary = str(req.body.closure_summary, 10000);
    if (!summary) return back(res, d, 'synthese', 'erreur-champs');
    if (db.get("SELECT COUNT(*) c FROM validations WHERE dossier_id = ? AND status = 'en_attente'", d.id).c) return back(res, d, 'synthese', 'erreur-cloture');
    db.tx(() => {
      db.run("UPDATE dossiers SET status = 'clos', closed_at = ?, closure_summary = ?, current_step = 5, next_action = NULL WHERE id = ?", now(), summary, d.id);
      db.run("UPDATE dossier_steps SET status = 'terminee' WHERE dossier_id = ? AND included = 1", d.id);
      db.run("UPDATE dossier_steps SET included = 1, status = 'terminee' WHERE dossier_id = ? AND step = 5", d.id);
    });
    S.logHistory(db, d.id, req.user.id, 'Mission clôturée. La synthèse de clôture est disponible.', true);
    await notifier.client(d.id);
    back(res, d, 'synthese', 'dossier-clos');
  }));

  // =================== Clients ===================
  r.get('/clients', (req, res) => {
    const list = db.all(`SELECT u.*, (SELECT COUNT(*) FROM dossiers d WHERE d.client_id = u.id) n FROM users u WHERE role = 'client' ORDER BY name`);
    page(res, 'clients', {
      title: 'Clients',
      body: html`<div class="page-head"><h1>Clients</h1><a class="btn btn-primary" href="/cabinet/dossiers/nouveau">Créer un dossier et inviter un client</a></div>
        <p>Chaque client accède uniquement aux dossiers qui lui sont attribués, après activation de son invitation individuelle.</p>
        <div class="table-wrap" role="region" aria-label="Liste des clients" tabindex="0"><table class="table-stack">
          <thead><tr><th scope="col">Client</th><th scope="col">Dossiers</th><th scope="col">Accès</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
          <tbody>${list.map((u) => html`<tr>
            <th scope="row" data-label="Client">${u.name}<br><span class="small">${u.email}${u.phone ? ` · ${u.phone}` : ''}</span></th>
            <td data-label="Dossiers">${u.n}</td>
            <td data-label="Accès">${u.password_hash ? badge({ icon: 'check', label: `Compte activé le ${fmtDate(u.activated_at)}` })
              : badge({ icon: 'clock', label: u.invited_at ? `Invitation envoyée le ${fmtDate(u.invited_at)}` : 'Non invité' })}</td>
            <td>${u.password_hash ? '' : html`<form method="post" action="/cabinet/clients/${u.id}/invitation" class="inline">${csrfField(req.csrfToken)}
              <button class="btn btn-secondary btn-sm" type="submit">Renvoyer l’invitation<span class="sr-only"> à ${u.name}</span></button></form>`}</td>
          </tr>`)}</tbody></table></div>`,
    });
  });
  r.post('/clients/:uid/invitation', async (req, res) => {
    const u = db.get("SELECT * FROM users WHERE id = ? AND role = 'client' AND password_hash IS NULL", Number(req.params.uid));
    if (!u) return res.notFound();
    const token = auth.createInvitation(db, u.id);
    const d = db.get('SELECT id FROM dossiers WHERE client_id = ? ORDER BY id DESC LIMIT 1', u.id);
    return sendInvitation(res, req, u.id, token, d && d.id);
  });

  // =================== Annuaire des prestataires ===================
  const providerFields = (p = {}) => html`
    ${field({ name: 'company', label: 'Raison sociale', value: p.company, required: true })}
    ${field({ name: 'contact_name', label: 'Interlocuteur', value: p.contact_name })}
    ${field({ name: 'specialties', label: 'Spécialités', value: p.specialties, required: true, hint: 'Séparées par des virgules : vidéoprotection, contrôle d’accès…' })}
    ${field({ name: 'zones', label: 'Zones d’intervention', value: p.zones, required: true })}
    <div class="two-col">
      ${field({ name: 'email', label: 'E-mail professionnel', type: 'email', value: p.email })}
      ${field({ name: 'phone', label: 'Téléphone professionnel', type: 'tel', value: p.phone })}
    </div>
    ${field({ name: 'website', label: 'Site internet', value: p.website })}
    ${field({ name: 'internal_notes', label: 'Notes internes (jamais visibles par les clients)', type: 'textarea', value: p.internal_notes })}`;
  const providerValues = (b) => ({
    company: str(b.company, 200), contact_name: str(b.contact_name, 160), specialties: str(b.specialties, 400), zones: str(b.zones, 400),
    email: str(b.email, 200), phone: str(b.phone, 40), website: str(b.website, 300), internal_notes: str(b.internal_notes),
  });

  r.get('/prestataires', (req, res) => {
    const q = str(req.query.q, 100);
    const like = `%${q}%`;
    const list = q ? db.all('SELECT * FROM providers WHERE company LIKE ? OR specialties LIKE ? OR zones LIKE ? ORDER BY company', like, like, like)
      : db.all('SELECT * FROM providers ORDER BY company');
    page(res, 'prestataires', {
      title: 'Annuaire des prestataires',
      body: html`<h1>Annuaire interne des prestataires</h1>
        <p>${visibilityBadge(false)} Les prestataires n’ont pas de compte dans l’application.</p>
        <form method="get" action="/cabinet/prestataires" class="filters" role="search">
          ${field({ name: 'q', label: 'Rechercher (nom, spécialité, zone)', value: q })}
          <button class="btn btn-secondary" type="submit">Rechercher</button>
        </form>
        ${list.length ? html`<div class="cards">${list.map((p) => html`<article class="card">
          <h2 class="h-card"><a href="/cabinet/prestataires/${p.id}">${p.company}</a></h2>
          <dl class="dl">
            <dt>Spécialités</dt><dd>${p.specialties}</dd>
            <dt>Zones d’intervention</dt><dd>${p.zones}</dd>
            <dt>Coordonnées</dt><dd>${p.contact_name || ''}${p.email ? html`<br><a href="mailto:${p.email}">${p.email}</a>` : ''}${p.phone ? html`<br>${p.phone}` : ''}</dd>
          </dl></article>`)}</div>` : html`<p class="empty">Aucun prestataire trouvé.</p>`}
        <form method="post" action="/cabinet/prestataires" class="card" novalidate>
          <h2>Ajouter un prestataire</h2>
          ${csrfField(req.csrfToken)}
          ${providerFields()}
          <button class="btn btn-primary" type="submit">Ajouter à l’annuaire</button>
        </form>`,
    });
  });
  r.post('/prestataires', (req, res) => {
    const p = providerValues(req.body || {});
    if (!p.company || !p.specialties || !p.zones) return res.redirect(303, '/cabinet/prestataires?ok=erreur-champs');
    const rr = db.run('INSERT INTO providers (company, contact_name, specialties, zones, email, phone, website, internal_notes, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      p.company, p.contact_name || null, p.specialties, p.zones, p.email || null, p.phone || null, p.website || null, p.internal_notes || null, now());
    res.redirect(303, `/cabinet/prestataires/${rr.lastInsertRowid}?ok=prestataire-ajoute`);
  });
  r.get('/prestataires/:pid', (req, res) => {
    const p = db.get('SELECT * FROM providers WHERE id = ?', Number(req.params.pid));
    if (!p) return res.notFound();
    const usage = db.all(`SELECT DISTINCT d.id, d.ref, d.title FROM dossiers d WHERE d.id IN
      (SELECT dossier_id FROM proposals WHERE provider_id = ? UNION SELECT dossier_id FROM validations WHERE provider_id = ?)`, p.id, p.id);
    page(res, 'prestataires', {
      title: p.company,
      body: html`<p><a href="/cabinet/prestataires">← Annuaire</a></p><h1>${p.company}</h1>
        ${usage.length ? html`<section class="card"><h2>Dossiers concernés</h2><ul class="plain">${usage.map((u) => html`<li><a href="/cabinet/dossiers/${u.id}">${u.ref} — ${u.title}</a></li>`)}</ul></section>` : ''}
        <form method="post" action="/cabinet/prestataires/${p.id}" class="card" novalidate>
          ${csrfField(req.csrfToken)}${providerFields(p)}
          <button class="btn btn-primary" type="submit">Enregistrer</button>
        </form>`,
    });
  });
  r.post('/prestataires/:pid', (req, res) => {
    const cur = db.get('SELECT id FROM providers WHERE id = ?', Number(req.params.pid));
    if (!cur) return res.notFound();
    const p = providerValues(req.body || {});
    if (!p.company || !p.specialties || !p.zones) return res.redirect(303, `/cabinet/prestataires/${cur.id}?ok=erreur-champs`);
    db.run('UPDATE providers SET company = ?, contact_name = ?, specialties = ?, zones = ?, email = ?, phone = ?, website = ?, internal_notes = ? WHERE id = ?',
      p.company, p.contact_name || null, p.specialties, p.zones, p.email || null, p.phone || null, p.website || null, p.internal_notes || null, cur.id);
    res.redirect(303, `/cabinet/prestataires/${cur.id}?ok=prestataire-maj`);
  });

  return r;
};
