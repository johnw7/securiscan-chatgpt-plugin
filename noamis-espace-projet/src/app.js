'use strict';
const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const { openDb } = require('./db');
const { authMiddleware, csrfCheck } = require('./auth');
const { createMailer, createNotifier } = require('./notify');
const { publicPage, appPage, html, icon } = require('./view');

function createApp(config) {
  const db = openDb(config.dbPath);
  fs.mkdirSync(config.storageDir, { recursive: true });
  const mailer = createMailer(config);
  const notifier = createNotifier(db, mailer, config.baseUrl);
  const ctx = { db, config, mailer, notifier };

  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);

  // En-têtes de sécurité.
  app.use((req, res, next) => {
    res.set({
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'",
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
      'X-Frame-Options': 'DENY',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    });
    if (config.secureCookies) res.set('Strict-Transport-Security', 'max-age=31536000');
    next();
  });

  app.use('/static', express.static(path.join(__dirname, '..', 'public'), { maxAge: '1h', index: false }));
  app.use(express.urlencoded({ extended: false, limit: '200kb' }));
  app.use(authMiddleware(db, { secure: config.secureCookies }));

  // Aides de rendu disponibles dans toutes les routes.
  app.use((req, res, next) => {
    if (req.user) req.user._csrf = req.csrfToken;
    res.page = (opts) => {
      const unread = req.user ? db.get('SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND read_at IS NULL', req.user.id).c : 0;
      res.type('html').send(appPage({ ...opts, user: req.user, unread, flash: opts.flash ?? (typeof req.query.ok === 'string' ? req.query.ok : '') }));
    };
    res.publicPage = (opts) => res.type('html').send(publicPage(opts));
    const errorPage = (status, title, text) => {
      const body = html`<section class="narrow"><h1>${title}</h1><p>${text}</p>
        <p><a class="btn btn-secondary" href="/">${icon('arrow')}<span>Retour à l’accueil</span></a></p></section>`;
      res.status(status);
      if (req.user) return res.page({ title, body, flash: '' });
      return res.publicPage({ title, body });
    };
    // Volontairement identique pour « inexistant » et « non autorisé » : on ne révèle pas l'existence d'un dossier.
    res.notFound = () => errorPage(404, 'Page introuvable', 'Cette page n’existe pas ou vous n’avez pas l’autorisation de la consulter.');
    res.denied = () => errorPage(403, 'Accès non autorisé', 'Votre compte ne permet pas d’accéder à cette page.');
    next();
  });

  // Seule la route de dépôt de fichiers accepte le multipart : elle vérifie le CSRF après analyse du corps.
  const UPLOAD_ROUTE = /^\/cabinet\/dossiers\/\d+\/documents$/;
  app.use((req, res, next) => (req.method === 'POST' && UPLOAD_ROUTE.test(req.path) && req.is('multipart/form-data') ? next() : csrfCheck(req, res, next)));

  app.use(require('./routes/public')(ctx));
  app.use(require('./routes/shared')(ctx));
  app.use('/espace', require('./routes/client')(ctx));
  app.use('/cabinet', require('./routes/cabinet')(ctx));

  app.use((req, res) => res.notFound());
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).type('text').send('Une erreur est survenue. Merci de réessayer.');
  });

  app.locals.ctx = ctx;
  return app;
}

function loadConfig(env = process.env) {
  const root = path.join(__dirname, '..');
  const port = Number(env.PORT || 3100);
  return {
    port,
    baseUrl: (env.APP_BASE_URL || env.RENDER_EXTERNAL_URL || `http://localhost:${port}`).replace(/\/$/, ''),
    dbPath: env.DATABASE_PATH || path.join(root, 'data', 'noamis.db'),
    storageDir: env.STORAGE_DIR || path.join(root, 'data', 'storage'),
    secureCookies: env.COOKIE_SECURE === 'true' || env.NODE_ENV === 'production',
    trustProxy: env.TRUST_PROXY === 'true',
    demoMode: env.DEMO_MODE !== 'false',
    logEmails: env.LOG_EMAILS !== 'false',
    cabinetEmail: env.CABINET_EMAIL || '',
    smtp: {
      host: env.SMTP_HOST || '',
      port: Number(env.SMTP_PORT || 587),
      user: env.SMTP_USER || '',
      pass: env.SMTP_PASS || '',
      from: env.SMTP_FROM || 'NOAMIS Espace Projet <no-reply@noamis.fr>',
    },
  };
}

module.exports = { createApp, loadConfig };
