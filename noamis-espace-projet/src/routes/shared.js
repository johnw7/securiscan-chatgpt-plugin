'use strict';
const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const { now } = require('../db');
const { dossierForUser } = require('../services');
const { html, icon, csrfField, fmtDateTime } = require('../view');

module.exports = ({ db, config }) => {
  const r = express.Router();
  const loggedIn = (req, res, next) => (req.user ? next() : res.redirect(`/connexion?suite=${encodeURIComponent(req.originalUrl)}`));

  // Téléchargement : contrôle d'accès à chaque requête.
  r.get('/documents/:id/telecharger', loggedIn, (req, res) => {
    const doc = db.get('SELECT * FROM documents WHERE id = ?', Number(req.params.id));
    if (!doc) return res.notFound();
    const dossier = dossierForUser(db, req.user, doc.dossier_id);
    if (!dossier) return res.notFound();
    if (req.user.role === 'client' && !doc.shared) return res.notFound();
    const file = path.join(config.storageDir, path.basename(doc.stored_name));
    if (!fs.existsSync(file)) return res.notFound();
    res.set('Cache-Control', 'private, no-store');
    res.download(file, doc.original_name, { headers: { 'Content-Type': doc.mime } });
  });

  r.get('/notifications', loggedIn, (req, res) => {
    const list = db.all('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50', req.user.id);
    const back = req.user.role === 'cabinet' ? '/cabinet' : '/espace';
    res.page({
      title: 'Notifications',
      body: html`<section>
        <div class="page-head"><h1>Notifications</h1>
          ${list.some((n) => !n.read_at) ? html`<form method="post" action="/notifications/lues">${csrfField(req.csrfToken)}<button class="btn btn-secondary">Tout marquer comme lu</button></form>` : ''}
        </div>
        <p>Les notifications signalent qu’une information est disponible. Les détails sont consultables uniquement dans l’application.</p>
        ${list.length ? html`<ul class="list">${list.map((n) => html`<li class="list-item">
          <span class="status">${icon(n.read_at ? 'check' : 'bell')}<span>${n.read_at ? 'Lue' : 'Non lue'}</span></span>
          <span class="grow">${n.text}<br><span class="small">${fmtDateTime(n.created_at)}</span></span>
          ${n.link ? html`<a class="btn btn-secondary btn-sm" href="${n.link}">Ouvrir</a>` : ''}
        </li>`)}</ul>` : html`<p class="empty">Aucune notification.</p>`}
        <p><a href="${back}">Retour au tableau de bord</a></p>
      </section>`,
    });
  });
  r.post('/notifications/lues', loggedIn, (req, res) => {
    db.run('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL', now(), req.user.id);
    res.redirect(303, '/notifications?ok=notifs-lues');
  });

  return r;
};
