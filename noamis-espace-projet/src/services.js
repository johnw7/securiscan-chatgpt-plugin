'use strict';
const { now } = require('./db');
const { LEVELS, DELIVERABLES } = require('./domain');

function logHistory(db, dossierId, userId, action, visibleClient = false) {
  db.run('INSERT INTO history (dossier_id, user_id, action, visible_client, created_at) VALUES (?,?,?,?,?)',
    dossierId, userId || null, action, visibleClient ? 1 : 0, now());
  db.run('UPDATE dossiers SET updated_at = ? WHERE id = ?', now(), dossierId);
}

function nextRef(db) {
  const year = new Date().getFullYear();
  const row = db.get("SELECT ref FROM dossiers WHERE ref LIKE ? ORDER BY ref DESC LIMIT 1", `NOA-${year}-%`);
  const n = row ? Number(row.ref.split('-')[2]) + 1 : 1;
  return `NOA-${year}-${String(n).padStart(3, '0')}`;
}

function createDossier(db, { title, clientId, level, zone, requestId, context, needs, constraints, objectives, nextAction }, userId) {
  return db.tx(() => {
    const t = now();
    const ref = nextRef(db);
    const r = db.run(`INSERT INTO dossiers (ref, title, client_id, request_id, level, zone, current_step, status, version, next_action,
      context, needs, constraints, objectives, created_at, updated_at) VALUES (?,?,?,?,?,?,1,'ouvert',1,?,?,?,?,?,?,?)`,
      ref, title, clientId, requestId || null, level, zone || null,
      nextAction || 'Le cabinet analyse votre besoin. Vous serez informé de la prochaine étape.',
      context || null, needs || null, constraints || null, objectives || null, t, t);
    const id = Number(r.lastInsertRowid);
    applyLevelDefaults(db, id, level, true);
    logHistory(db, id, userId, `Dossier ${ref} créé (${LEVELS[level].label}).`, true);
    return id;
  });
}

// Étapes et livrables par défaut selon le niveau d'accompagnement.
function applyLevelDefaults(db, dossierId, level, initial = false) {
  const def = LEVELS[level];
  for (const n of [1, 2, 3, 4, 5]) {
    const included = def.steps.includes(n) ? 1 : 0;
    const status = initial && n === 1 ? 'en_cours' : 'a_venir';
    db.run(`INSERT INTO dossier_steps (dossier_id, step, included, status) VALUES (?,?,?,?)
      ON CONFLICT(dossier_id, step) DO UPDATE SET included = excluded.included`, dossierId, n, included, status);
  }
  for (const d of DELIVERABLES) {
    if (def.deliverables.includes(d.key)) {
      db.run('INSERT OR IGNORE INTO deliverables (dossier_id, key, label, step) VALUES (?,?,?,?)', dossierId, d.key, d.label, d.step);
    } else if (!initial) {
      db.run("DELETE FROM deliverables WHERE dossier_id = ? AND key = ? AND status = 'prevu' AND document_id IS NULL", dossierId, d.key);
    }
  }
}

// Contrôle d'accès côté serveur : un client n'obtient que ses propres dossiers.
function dossierForUser(db, user, id) {
  const dossierId = Number(id);
  if (!user || !Number.isInteger(dossierId) || dossierId <= 0) return null;
  if (user.role === 'cabinet') return db.get('SELECT * FROM dossiers WHERE id = ?', dossierId) || null;
  if (user.role === 'client') return db.get('SELECT * FROM dossiers WHERE id = ? AND client_id = ?', dossierId, user.id) || null;
  return null;
}

function validationDocs(v) {
  try { return JSON.parse(v.documents_json) || []; } catch { return []; }
}

module.exports = { logHistory, nextRef, createDossier, applyLevelDefaults, dossierForUser, validationDocs };
