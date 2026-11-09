'use strict';
// Notifications : elles signalent qu'une mise à jour ou une décision est disponible,
// sans pièce jointe ni détail sensible. L'envoi d'e-mails nécessite un serveur SMTP (voir README).
const { now } = require('./db');

function createMailer(config) {
  let transport = null;
  if (config.smtp && config.smtp.host) {
    const nodemailer = require('nodemailer');
    transport = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  }
  return {
    configured: Boolean(transport),
    async send(db, to, subject, text) {
      let status = 'non envoyé — SMTP non configuré';
      if (transport) {
        try {
          await transport.sendMail({ from: config.smtp.from, to, subject, text });
          status = 'envoyé';
        } catch (e) {
          status = 'échec d’envoi';
          console.error('[e-mail] échec :', e.message);
        }
      } else if (config.logEmails) {
        console.log(`[e-mail non envoyé — SMTP non configuré] à ${to} : ${subject}`);
      }
      db.run('INSERT INTO outbox (to_email, subject, status, created_at) VALUES (?,?,?,?)', to, subject, status, now());
      return status;
    },
  };
}

const TEXTS = {
  maj: {
    notif: 'Une mise à jour est disponible dans votre dossier.',
    subject: 'NOAMIS — Une mise à jour est disponible dans votre Espace Projet',
  },
  decision: {
    notif: 'Une décision est attendue dans votre dossier.',
    subject: 'NOAMIS — Une décision vous attend dans votre Espace Projet',
  },
  cabinet: {
    notif: 'Nouvelle activité client sur un dossier.',
    subject: 'NOAMIS — Nouvelle activité dans l’Espace Projet',
  },
  demande: {
    notif: 'Une nouvelle demande a été reçue.',
    subject: 'NOAMIS — Nouvelle demande reçue',
  },
};

function mailBody(baseUrl) {
  return [
    'Bonjour,',
    '',
    'Une information est disponible dans l’Espace Projet NOAMIS.',
    `Connectez-vous pour la consulter : ${baseUrl}/connexion`,
    '',
    'Pour des raisons de confidentialité, ce message ne contient volontairement aucun détail ni pièce jointe.',
    '',
    'NOAMIS — Votre projet de sécurité, notre accompagnement.',
  ].join('\n');
}

function createNotifier(db, mailer, baseUrl) {
  async function notifyUser(user, kind, dossierId, link) {
    const t = TEXTS[kind];
    db.run('INSERT INTO notifications (user_id, dossier_id, text, link, created_at) VALUES (?,?,?,?,?)', user.id, dossierId || null, t.notif, link || null, now());
    if (user.password_hash) await mailer.send(db, user.email, t.subject, mailBody(baseUrl));
  }
  return {
    async client(dossierId, kind = 'maj') {
      const row = db.get('SELECT u.* FROM dossiers d JOIN users u ON u.id = d.client_id WHERE d.id = ?', dossierId);
      if (row) await notifyUser(row, kind, dossierId, `/espace/dossiers/${dossierId}`);
    },
    async cabinet(dossierId, kind = 'cabinet') {
      const team = db.all("SELECT * FROM users WHERE role = 'cabinet' AND active = 1");
      const link = dossierId ? `/cabinet/dossiers/${dossierId}` : '/cabinet/demandes';
      for (const u of team) await notifyUser(u, kind, dossierId, link);
    },
  };
}

module.exports = { createMailer, createNotifier, mailBody };
