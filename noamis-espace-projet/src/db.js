'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('cabinet','client')),
  password_hash TEXT,
  invite_token_hash TEXT,
  invite_expires_at TEXT,
  invited_at TEXT,
  activated_at TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY,
  profile TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  contact_pref TEXT NOT NULL,
  need_type TEXT NOT NULL,
  zone TEXT NOT NULL,
  timeline TEXT NOT NULL,
  description TEXT NOT NULL,
  level TEXT,
  status TEXT NOT NULL DEFAULT 'nouvelle',
  internal_note TEXT,
  dossier_id INTEGER,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS dossiers (
  id INTEGER PRIMARY KEY,
  ref TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  client_id INTEGER NOT NULL REFERENCES users(id),
  request_id INTEGER REFERENCES requests(id),
  level TEXT NOT NULL,
  zone TEXT,
  current_step INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ouvert',
  version INTEGER NOT NULL DEFAULT 1,
  next_action TEXT,
  context TEXT, needs TEXT, constraints TEXT, objectives TEXT,
  closure_summary TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  closed_at TEXT
);
CREATE TABLE IF NOT EXISTS dossier_steps (
  dossier_id INTEGER NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  included INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'a_venir',
  PRIMARY KEY (dossier_id, step)
);
CREATE TABLE IF NOT EXISTS deliverables (
  id INTEGER PRIMARY KEY,
  dossier_id INTEGER NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  step INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'prevu',
  document_id INTEGER,
  UNIQUE (dossier_id, key)
);
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  dossier_id INTEGER NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  step INTEGER NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'a_faire',
  visible_client INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER,
  created_at TEXT NOT NULL,
  done_at TEXT
);
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY,
  dossier_id INTEGER NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  step INTEGER NOT NULL,
  shared INTEGER NOT NULL DEFAULT 0,
  shared_at TEXT,
  uploaded_by INTEGER,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY,
  dossier_id INTEGER NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('note','compte_rendu')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  step INTEGER NOT NULL,
  shared INTEGER NOT NULL DEFAULT 0,
  shared_at TEXT,
  author_id INTEGER,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  dossier_id INTEGER NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS providers (
  id INTEGER PRIMARY KEY,
  company TEXT NOT NULL,
  contact_name TEXT,
  specialties TEXT NOT NULL,
  zones TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  internal_notes TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS proposals (
  id INTEGER PRIMARY KEY,
  dossier_id INTEGER NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  provider_id INTEGER NOT NULL REFERENCES providers(id),
  scope TEXT NOT NULL,
  amount TEXT NOT NULL,
  quote_ref TEXT,
  delays TEXT,
  guarantees TEXT,
  document_id INTEGER,
  clarifications TEXT,
  analysis TEXT,
  shared INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS validations (
  id INTEGER PRIMARY KEY,
  dossier_id INTEGER NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  provider_id INTEGER NOT NULL REFERENCES providers(id),
  dossier_version INTEGER NOT NULL,
  documents_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'en_attente',
  created_by INTEGER,
  created_at TEXT NOT NULL,
  decided_by INTEGER,
  decided_at TEXT,
  decision_comment TEXT,
  transmitted_at TEXT,
  transmitted_by INTEGER,
  transmission_note TEXT,
  replaced_by INTEGER,
  replaces INTEGER
);
CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY,
  dossier_id INTEGER NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  user_id INTEGER,
  action TEXT NOT NULL,
  visible_client INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dossier_id INTEGER,
  text TEXT NOT NULL,
  link TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dossiers_client ON dossiers(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_dossier ON documents(dossier_id);
CREATE INDEX IF NOT EXISTS idx_history_dossier ON history(dossier_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
`;

function openDb(dbPath) {
  if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  db.exec(SCHEMA);

  const cache = new Map();
  const stmt = (sql) => {
    if (!cache.has(sql)) cache.set(sql, db.prepare(sql));
    return cache.get(sql);
  };
  return {
    raw: db,
    get: (sql, ...p) => stmt(sql).get(...p),
    all: (sql, ...p) => stmt(sql).all(...p),
    run: (sql, ...p) => stmt(sql).run(...p),
    tx(fn) {
      db.exec('BEGIN');
      try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
    close: () => db.close(),
  };
}

const now = () => new Date().toISOString();

module.exports = { openDb, now };
