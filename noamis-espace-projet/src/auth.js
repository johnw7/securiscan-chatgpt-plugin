'use strict';
const crypto = require('node:crypto');
const { now } = require('./db');

const SESSION_COOKIE = 'noamis_session';
const CSRF_COOKIE = 'noamis_csrf';
const SESSION_HOURS = 8;
const INVITE_DAYS = 7;

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}
function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('scrypt$')) {
    // Calcul factice pour un temps de réponse homogène.
    crypto.scryptSync(password, 'noamis-dummy-salt', 64);
    return false;
  }
  const [, saltB64, hashB64] = stored.split('$');
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(expected, actual);
}
const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
const randomToken = () => crypto.randomBytes(32).toString('base64url');

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    try { out[k] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* ignore */ }
  }
  return out;
}

function cookieOptions(secure, maxAgeMs, sameSite = 'lax') {
  return { httpOnly: true, sameSite, secure, path: '/', maxAge: maxAgeMs };
}

function createSession(db, res, userId, secure) {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_HOURS * 3600e3).toISOString();
  db.run('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?,?,?,?)', sha256(token), userId, now(), expires);
  res.cookie(SESSION_COOKIE, token, cookieOptions(secure, SESSION_HOURS * 3600e3));
}

function destroySession(db, req, res) {
  const token = req.cookies[SESSION_COOKIE];
  if (token) db.run('DELETE FROM sessions WHERE token_hash = ?', sha256(token));
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

// Middleware : cookies, utilisateur courant, jeton CSRF (double soumission).
function authMiddleware(db, { secure }) {
  return (req, res, next) => {
    req.cookies = parseCookies(req.headers.cookie);
    req.user = null;
    const token = req.cookies[SESSION_COOKIE];
    if (token) {
      const row = db.get(
        `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`, sha256(token), now());
      if (row) req.user = row;
    }
    let csrf = req.cookies[CSRF_COOKIE];
    if (!csrf || csrf.length < 20) {
      csrf = randomToken();
      res.cookie(CSRF_COOKIE, csrf, cookieOptions(secure, 24 * 3600e3, 'strict'));
    }
    req.csrfToken = csrf;
    res.locals.csrf = csrf;
    res.locals.user = req.user;
    next();
  };
}

function csrfCheck(req, res, next) {
  if (req.method !== 'POST') return next();
  const sent = (req.body && req.body._csrf) || req.headers['x-csrf-token'];
  const expected = req.cookies[CSRF_COOKIE];
  if (!sent || !expected || sent.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(expected))) {
    return res.status(403).send('Jeton de sécurité invalide ou expiré. Rechargez la page et recommencez.');
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.redirect(`/connexion?suite=${encodeURIComponent(req.originalUrl)}`);
    if (req.user.role !== role) return res.denied();
    next();
  };
}

// Limitation simple des tentatives (mémoire du processus).
function rateLimiter({ windowMs, max }) {
  const hits = new Map();
  return {
    hit(key) {
      const t = Date.now();
      const list = (hits.get(key) || []).filter((x) => t - x < windowMs);
      list.push(t);
      hits.set(key, list);
      return list.length <= max;
    },
    reset(key) { hits.delete(key); },
  };
}

function createInvitation(db, userId) {
  const token = randomToken();
  const expires = new Date(Date.now() + INVITE_DAYS * 86400e3).toISOString();
  db.run('UPDATE users SET invite_token_hash = ?, invite_expires_at = ?, invited_at = ? WHERE id = ?', sha256(token), expires, now(), userId);
  return token;
}
function findInvitation(db, token) {
  if (!token || token.length < 20) return null;
  return db.get('SELECT * FROM users WHERE invite_token_hash = ? AND invite_expires_at > ? AND active = 1', sha256(token), now()) || null;
}

module.exports = {
  hashPassword, verifyPassword, sha256, randomToken, createSession, destroySession,
  authMiddleware, csrfCheck, requireRole, rateLimiter, createInvitation, findInvitation, INVITE_DAYS,
};
