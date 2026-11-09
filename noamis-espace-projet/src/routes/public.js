'use strict';
const express = require('express');
const { now } = require('../db');
const auth = require('../auth');
const { PROFILES, CONTACT_PREFS, NEEDS, TIMELINES, LEVELS } = require('../domain');
const { html, raw, icon, field, select, radios, errorSummary, csrfField, logo, SIGNATURE } = require('../view');

const safeNext = (s) => (typeof s === 'string' && /^\/(?!\/)[\w\-/?=&.%]*$/.test(s) ? s : '');
const str = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

module.exports = ({ db, config, notifier }) => {
  const r = express.Router();
  const loginLimiter = auth.rateLimiter({ windowMs: 15 * 60e3, max: 10 });
  const formLimiter = auth.rateLimiter({ windowMs: 60 * 60e3, max: 10 });

  r.get('/', (req, res) => {
    if (!req.user) return res.redirect('/connexion');
    res.redirect(req.user.role === 'cabinet' ? '/cabinet' : '/espace');
  });

  // ---------- Connexion ----------
  function loginPage(res, { email = '', error = '', next = '', status = 200, info = '' } = {}) {
    res.status(status).publicPage({
      title: 'Connexion',
      body: html`<section class="login">
        <div class="login-brand">${logo('logo logo-lg')}<p class="eyebrow">Espace Projet</p></div>
        <div class="card login-card">
          <h1>Connexion à votre Espace Projet</h1>
          ${info ? html`<div class="alert" role="status">${icon('check')}<span>${info}</span></div>` : ''}
          ${error ? html`<div class="alert alert-error" role="alert">${icon('info')}<span>${error}</span></div>` : ''}
          <form method="post" action="/connexion" novalidate>
            ${csrfField(res.locals.csrf)}
            <input type="hidden" name="suite" value="${next}">
            ${field({ name: 'email', label: 'Adresse e-mail', type: 'email', value: email, required: true, autocomplete: 'username' })}
            ${field({ name: 'password', label: 'Mot de passe', type: 'password', required: true, autocomplete: 'current-password' })}
            <button type="submit" class="btn btn-primary btn-block">Se connecter</button>
          </form>
          <p class="small">L’accès est réservé aux clients invités par le cabinet et à l’équipe NOAMIS.
          Vous n’avez pas encore de dossier ? <a href="/presenter-mon-projet">Présentez votre projet</a>.</p>
        </div>
        ${config.demoMode ? html`<aside class="card demo-box" aria-labelledby="demo-title">
          <h2 id="demo-title">${icon('info')}<span>Comptes de démonstration (données fictives)</span></h2>
          <dl>
            <dt>Cabinet</dt><dd><code>cabinet@noamis.example</code> · mot de passe <code>Demo-Cabinet-2026</code></dd>
            <dt>Client</dt><dd><code>client@noamis.example</code> · mot de passe <code>Demo-Client-2026</code></dd>
          </dl>
        </aside>` : ''}
        <p class="signature">${SIGNATURE}</p>
      </section>`,
    });
  }

  r.get('/connexion', (req, res) => {
    if (req.user) return res.redirect('/');
    const info = req.query.ok === 'deconnexion' ? 'Vous êtes déconnecté.' : '';
    loginPage(res, { next: safeNext(req.query.suite), info });
  });

  r.post('/connexion', (req, res) => {
    const email = str(req.body.email, 200).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const next = safeNext(req.body.suite);
    const key = `${req.ip}|${email}`;
    if (!loginLimiter.hit(key)) {
      return loginPage(res, { email, next, status: 429, error: 'Trop de tentatives. Patientez quelques minutes avant de réessayer.' });
    }
    const user = db.get('SELECT * FROM users WHERE email = ? AND active = 1', email);
    if (!auth.verifyPassword(password, user && user.password_hash)) {
      return loginPage(res, { email, next, status: 401, error: 'Adresse e-mail ou mot de passe incorrect.' });
    }
    loginLimiter.reset(key);
    auth.createSession(db, res, user.id, config.secureCookies);
    const home = user.role === 'cabinet' ? '/cabinet' : '/espace';
    const target = next && next.startsWith(home) ? next : home;
    res.redirect(303, target);
  });

  r.post('/deconnexion', (req, res) => {
    auth.destroySession(db, req, res);
    res.redirect(303, '/connexion?ok=deconnexion');
  });

  // ---------- Invitation : le client définit son mot de passe ----------
  function invitePage(res, user, token, error = '') {
    res.publicPage({
      title: 'Activer votre accès',
      body: html`<section class="narrow">
        <h1>Bienvenue ${user.name}</h1>
        <p>Le cabinet NOAMIS vous a invité à rejoindre votre Espace Projet. Choisissez un mot de passe personnel pour activer votre accès.</p>
        ${error ? html`<div class="alert alert-error" role="alert">${icon('info')}<span>${error}</span></div>` : ''}
        <form method="post" action="/invitation/${token}" class="card" novalidate>
          ${csrfField(res.locals.csrf)}
          <p><strong>Identifiant :</strong> ${user.email}</p>
          ${field({ name: 'password', label: 'Mot de passe', type: 'password', required: true, autocomplete: 'new-password', hint: 'Au moins 12 caractères.' })}
          ${field({ name: 'password2', label: 'Confirmez le mot de passe', type: 'password', required: true, autocomplete: 'new-password' })}
          <button type="submit" class="btn btn-primary">Activer mon accès</button>
        </form>
      </section>`,
    });
  }
  const invalidInvite = (res) => res.status(404).publicPage({
    title: 'Invitation non valide',
    body: html`<section class="narrow"><h1>Invitation non valide</h1>
      <p>Ce lien d’invitation est expiré ou a déjà été utilisé. Contactez le cabinet NOAMIS pour recevoir une nouvelle invitation.</p>
      <p><a class="btn btn-secondary" href="/connexion">Aller à la connexion</a></p></section>`,
  });

  r.get('/invitation/:token', (req, res) => {
    const user = auth.findInvitation(db, req.params.token);
    if (!user) return invalidInvite(res);
    invitePage(res, user, req.params.token);
  });
  r.post('/invitation/:token', (req, res) => {
    const user = auth.findInvitation(db, req.params.token);
    if (!user) return invalidInvite(res);
    const p1 = typeof req.body.password === 'string' ? req.body.password : '';
    const p2 = typeof req.body.password2 === 'string' ? req.body.password2 : '';
    if (p1.length < 12) return invitePage(res, user, req.params.token, 'Le mot de passe doit contenir au moins 12 caractères.');
    if (p1 !== p2) return invitePage(res, user, req.params.token, 'Les deux mots de passe ne correspondent pas.');
    db.run('UPDATE users SET password_hash = ?, invite_token_hash = NULL, invite_expires_at = NULL, activated_at = ? WHERE id = ?',
      auth.hashPassword(p1), now(), user.id);
    db.run('DELETE FROM sessions WHERE user_id = ?', user.id);
    auth.createSession(db, res, user.id, config.secureCookies);
    res.redirect(303, `${user.role === 'cabinet' ? '/cabinet' : '/espace'}?ok=mot-de-passe`);
  });

  // ---------- Formulaire public « Présenter mon projet » ----------
  const levelOptions = [
    ...Object.entries(LEVELS).map(([k, v]) => ({ value: k, label: v.label, desc: v.desc })),
    { value: 'ne-sait-pas', label: 'Je ne sais pas encore', desc: 'Le cabinet vous orientera.' },
  ];

  function projectForm(res, values = {}, errors = {}, status = 200) {
    res.status(status).publicPage({
      title: 'Présenter mon projet',
      wide: true,
      body: html`<section class="form-page">
        <p class="eyebrow">Présenter mon projet</p>
        <h1>Parlez-nous de votre besoin</h1>
        <p class="lead">Décrivez votre projet en quelques lignes. Le cabinet examine chaque demande, puis vous recontacte selon le moyen que vous préférez.
        Si votre projet est retenu, un dossier est créé et vous êtes invité dans votre Espace Projet privé.</p>
        <div class="alert alert-notice" role="note">
          ${icon('shield')}
          <div><strong>Informations sensibles : à ne pas transmettre à ce stade.</strong>
          <p>Décrivez votre besoin de manière générale. N’indiquez ni plans, ni codes d’accès, ni adresse précise, ni horaires de présence,
          ni description détaillée de vos dispositifs de sécurité. Ces éléments seront échangés plus tard, dans un cadre adapté.</p></div>
        </div>
        ${errorSummary(errors)}
        <form method="post" action="/presenter-mon-projet" class="card form-grid" novalidate>
          ${csrfField(res.locals.csrf)}
          <div class="hp" aria-hidden="true"><label for="f-website">Ne pas remplir</label><input id="f-website" name="website" tabindex="-1" autocomplete="off"></div>
          <h2 class="form-section">Vous</h2>
          ${radios({ name: 'profile', legend: 'Votre profil', options: PROFILES, value: values.profile, required: true, error: errors.profile })}
          ${field({ name: 'name', label: 'Nom et prénom (ou raison sociale)', value: values.name, required: true, error: errors.name, autocomplete: 'name' })}
          <div class="two-col">
            ${field({ name: 'email', label: 'Adresse e-mail', type: 'email', value: values.email, required: true, error: errors.email, autocomplete: 'email' })}
            ${field({ name: 'phone', label: 'Téléphone', type: 'tel', value: values.phone, error: errors.phone, autocomplete: 'tel', required: values.contact_pref === 'Téléphone', hint: 'Obligatoire si vous préférez être contacté par téléphone.' })}
          </div>
          ${radios({ name: 'contact_pref', legend: 'Moyen de contact préféré', options: CONTACT_PREFS, value: values.contact_pref, required: true, error: errors.contact_pref })}
          <h2 class="form-section">Votre projet</h2>
          ${select({ name: 'need_type', label: 'Nature du besoin', options: NEEDS, value: values.need_type, required: true, error: errors.need_type })}
          <div class="two-col">
            ${field({ name: 'zone', label: 'Commune ou zone du projet', value: values.zone, required: true, error: errors.zone, hint: 'Par exemple : Paris 16e, Neuilly-sur-Seine, Île-de-France. Pas d’adresse précise.' })}
            ${select({ name: 'timeline', label: 'Délai souhaité', options: TIMELINES, value: values.timeline, required: true, error: errors.timeline })}
          </div>
          ${field({ name: 'description', label: 'Brève description du besoin', type: 'textarea', value: values.description, required: true, error: errors.description, hint: 'Quelques lignes suffisent (2 000 caractères maximum) : contexte général, objectif, contraintes éventuelles.', attrs: 'maxlength="2000"' })}
          ${radios({ name: 'level', legend: 'Niveau d’accompagnement envisagé', options: levelOptions, value: values.level, error: errors.level })}
          <div class="field checkbox${errors.consent ? ' has-error' : ''}">
            ${errors.consent ? html`<p class="error-text" id="f-consent-err">${icon('info')}<span>${errors.consent}</span></p>` : ''}
            <input type="checkbox" id="f-consent" name="consent" value="1" ${values.consent ? raw('checked') : ''} ${errors.consent ? raw('aria-describedby="f-consent-err" aria-invalid="true"') : ''}>
            <label for="f-consent">J’accepte que NOAMIS utilise ces informations pour examiner ma demande et me recontacter. <span class="req">(obligatoire)</span></label>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Envoyer ma demande</button>
            <a class="btn btn-secondary" href="https://www.noamis.fr">Retour au site</a>
          </div>
        </form>
      </section>`,
    });
  }

  r.get('/presenter-mon-projet', (req, res) => projectForm(res));

  r.post('/presenter-mon-projet', async (req, res) => {
    const b = req.body;
    const v = {
      profile: str(b.profile, 40), name: str(b.name, 160), email: str(b.email, 200).toLowerCase(), phone: str(b.phone, 40),
      contact_pref: str(b.contact_pref, 40), need_type: str(b.need_type, 120), zone: str(b.zone, 160),
      timeline: str(b.timeline, 60), description: str(b.description, 2000), level: str(b.level, 30), consent: b.consent === '1',
    };
    if (str(b.website)) return res.redirect(303, '/presenter-mon-projet/merci'); // pot de miel anti-robots
    const e = {};
    if (!PROFILES.includes(v.profile)) e.profile = 'Indiquez votre profil.';
    if (v.name.length < 2) e.name = 'Indiquez votre nom.';
    if (!EMAIL_RE.test(v.email)) e.email = 'Indiquez une adresse e-mail valide.';
    if (!CONTACT_PREFS.includes(v.contact_pref)) e.contact_pref = 'Indiquez votre moyen de contact préféré.';
    if (v.contact_pref === 'Téléphone' && !/^[+\d][\d\s.-]{7,}$/.test(v.phone)) e.phone = 'Indiquez un numéro de téléphone pour être rappelé.';
    else if (v.phone && !/^[+\d][\d\s.-]{7,}$/.test(v.phone)) e.phone = 'Le numéro de téléphone n’est pas valide.';
    if (!NEEDS.includes(v.need_type)) e.need_type = 'Choisissez la nature du besoin.';
    if (v.zone.length < 2) e.zone = 'Indiquez la commune ou la zone du projet.';
    if (!TIMELINES.includes(v.timeline)) e.timeline = 'Choisissez un délai.';
    if (v.description.length < 20) e.description = 'Décrivez votre besoin en quelques mots (20 caractères minimum).';
    if (v.level && !LEVELS[v.level] && v.level !== 'ne-sait-pas') e.level = 'Niveau non reconnu.';
    if (!v.consent) e.consent = 'Votre accord est nécessaire pour que nous traitions la demande.';
    if (Object.keys(e).length) return projectForm(res, v, e, 422);
    if (!formLimiter.hit(req.ip)) return projectForm(res, v, { name: 'Trop de demandes envoyées depuis cette connexion. Réessayez plus tard.' }, 429);

    db.run(`INSERT INTO requests (profile, name, email, phone, contact_pref, need_type, zone, timeline, description, level, status, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,'nouvelle',?)`,
    v.profile, v.name, v.email, v.phone || null, v.contact_pref, v.need_type, v.zone, v.timeline, v.description,
    LEVELS[v.level] ? v.level : null, now());
    await notifier.cabinet(null, 'demande');
    res.redirect(303, '/presenter-mon-projet/merci');
  });

  r.get('/presenter-mon-projet/merci', (req, res) => res.publicPage({
    title: 'Demande envoyée',
    body: html`<section class="narrow confirmation" aria-labelledby="conf-title">
      <p class="status status-lg">${icon('check')}<span>Demande envoyée</span></p>
      <h1 id="conf-title">Merci, votre demande a bien été transmise au cabinet NOAMIS.</h1>
      <p>Nous examinons votre besoin et revenons vers vous par le moyen de contact que vous avez indiqué.</p>
      <h2>La suite</h2>
      <ol class="steps-simple">
        <li>Le cabinet étudie votre demande.</li>
        <li>Si l’accompagnement est adapté, un dossier est créé à votre nom.</li>
        <li>Vous recevez une invitation personnelle pour accéder à votre Espace Projet privé.</li>
      </ol>
      <p>Rappel : n’envoyez pas de plans, codes d’accès ou informations sensibles par e-mail.</p>
      <p><a class="btn btn-secondary" href="https://www.noamis.fr">Retour au site noamis.fr</a></p>
    </section>`,
  }));

  return r;
};
