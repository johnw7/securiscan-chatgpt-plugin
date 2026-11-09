'use strict';
// Rendu HTML côté serveur : échappement systématique, gabarits et composants partagés.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
class Safe { constructor(s) { this.s = s; } toString() { return this.s; } }
const raw = (s) => new Safe(String(s));
function esc(v) {
  if (v === null || v === undefined || v === false) return '';
  if (v instanceof Safe) return v.s;
  if (Array.isArray(v)) return v.map(esc).join('');
  return String(v).replace(/[&<>"']/g, (c) => ESC[c]);
}
function html(strings, ...vals) {
  let out = '';
  strings.forEach((s, i) => { out += s; if (i < vals.length) out += esc(vals[i]); });
  return new Safe(out);
}
const nl2br = (t) => raw(esc(t || '').replace(/\n/g, '<br>'));

// ---------- Dates ----------
const TZ = 'Europe/Paris';
const fmtDate = (iso) => iso ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }).format(new Date(iso)) : '—';
const fmtDateTime = (iso) => iso ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: TZ }).format(new Date(iso)).replace(' à ', ' à ') : '—';
const fmtDay = (d) => d ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`)) : '—';
const fmtSize = (n) => n < 1024 ? `${n} o` : n < 1048576 ? `${Math.round(n / 1024)} Ko` : `${(n / 1048576).toFixed(1).replace('.', ',')} Mo`;

// ---------- Icônes (décoratives : toujours accompagnées d'un libellé) ----------
const ICONS = {
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20v-4h-4"/>',
  circle: '<circle cx="12" cy="12" r="8"/>',
  progress: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
  inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
  archive: '<path d="M3 5h18v4H3z"/><path d="M5 9v10h14V9"/><path d="M10 13h4"/>',
  folder: '<path d="M3 6h7l2 2h9v11H3z"/>',
  lock: '<rect x="5" y="11" width="14" height="9"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
  download: '<path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/>',
  message: '<path d="M4 5h16v11H9l-5 4z"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.8 8.4 2 12 2 12s4 7 10 7a9.7 9.7 0 0 0 4.4-1"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20h4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  send: '<path d="M3 11l18-8-8 18-2-8z"/>',
  flag: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
};
const icon = (name, cls = '') => raw(`<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.circle}</svg>`);

// Badge de statut : icône + libellé explicite.
const badge = (def, extra = '') => def ? html`<span class="status ${extra}">${icon(def.icon)}<span>${def.label}</span></span>` : '';
const visibilityBadge = (shared) => shared
  ? html`<span class="status">${icon('eye')}<span>Visible par le client</span></span>`
  : html`<span class="status status-private">${icon('lock')}<span>Privé — cabinet uniquement</span></span>`;

// ---------- Formulaires ----------
const csrfField = (csrf) => html`<input type="hidden" name="_csrf" value="${csrf}">`;
function field({ name, label, type = 'text', value = '', required = false, hint = '', error = '', autocomplete = '', attrs = '' }) {
  const id = `f-${name}`;
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ');
  const common = html`id="${id}" name="${name}" ${required ? raw('required') : ''} ${describedBy ? html`aria-describedby="${describedBy}"` : ''} ${error ? raw('aria-invalid="true"') : ''} ${autocomplete ? html`autocomplete="${autocomplete}"` : ''} ${raw(attrs)}`;
  const control = type === 'textarea'
    ? html`<textarea ${common} rows="5">${value}</textarea>`
    : html`<input type="${type}" ${common} value="${value}">`;
  return html`<div class="field${error ? ' has-error' : ''}">
    <label for="${id}">${label}${required ? html` <span class="req">(obligatoire)</span>` : html` <span class="opt">(facultatif)</span>`}</label>
    ${hint ? html`<p class="hint" id="${id}-hint">${hint}</p>` : ''}
    ${error ? html`<p class="error-text" id="${id}-err">${icon('info')}<span>${error}</span></p>` : ''}
    ${control}
  </div>`;
}
function select({ name, label, options, value = '', required = false, error = '', placeholder = 'Sélectionnez…', hint = '' }) {
  const id = `f-${name}`;
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ');
  return html`<div class="field${error ? ' has-error' : ''}">
    <label for="${id}">${label}${required ? html` <span class="req">(obligatoire)</span>` : html` <span class="opt">(facultatif)</span>`}</label>
    ${hint ? html`<p class="hint" id="${id}-hint">${hint}</p>` : ''}
    ${error ? html`<p class="error-text" id="${id}-err">${icon('info')}<span>${error}</span></p>` : ''}
    <select id="${id}" name="${name}" ${required ? raw('required') : ''} ${describedBy ? html`aria-describedby="${describedBy}"` : ''} ${error ? raw('aria-invalid="true"') : ''}>
      ${placeholder !== null ? html`<option value="">${placeholder}</option>` : ''}
      ${opts.map((o) => html`<option value="${o.value}" ${String(o.value) === String(value) ? raw('selected') : ''}>${o.label}</option>`)}
    </select>
  </div>`;
}
function radios({ name, legend, options, value = '', required = false, error = '' }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return html`<fieldset class="field radios${error ? ' has-error' : ''}" ${error ? html`aria-describedby="f-${name}-err"` : ''}>
    <legend>${legend}${required ? html` <span class="req">(obligatoire)</span>` : html` <span class="opt">(facultatif)</span>`}</legend>
    ${error ? html`<p class="error-text" id="f-${name}-err">${icon('info')}<span>${error}</span></p>` : ''}
    ${opts.map((o, i) => html`<div class="radio">
      <input type="radio" id="f-${name}-${i}" name="${name}" value="${o.value}" ${String(o.value) === String(value) ? raw('checked') : ''} ${required ? raw('required') : ''}>
      <label for="f-${name}-${i}">${o.label}${o.desc ? html`<span class="radio-desc">${o.desc}</span>` : ''}</label>
    </div>`)}
  </fieldset>`;
}
function errorSummary(errors) {
  const keys = Object.keys(errors || {});
  if (!keys.length) return '';
  return html`<div class="alert alert-error" role="alert" tabindex="-1" id="erreurs">
    <h2 class="alert-title">${icon('info')}<span>Le formulaire contient ${keys.length} erreur${keys.length > 1 ? 's' : ''}</span></h2>
    <ul>${keys.map((k) => html`<li><a href="#f-${k}">${errors[k]}</a></li>`)}</ul>
  </div>`;
}

// ---------- Messages de confirmation (codes contrôlés, jamais de texte libre dans l'URL) ----------
const FLASH = {
  'demande-maj': 'La demande a été mise à jour.',
  'dossier-cree': 'Le dossier a été créé.',
  'dossier-maj': 'Le dossier a été mis à jour.',
  'version': 'Une nouvelle version du dossier a été enregistrée.',
  'etapes-maj': 'Les étapes et livrables ont été mis à jour.',
  'tache-ajoutee': 'La tâche a été ajoutée.',
  'tache-maj': 'La tâche a été mise à jour.',
  'doc-ajoute': 'Le document a été déposé. Il reste privé au cabinet tant qu’il n’est pas partagé.',
  'doc-partage': 'Le document est désormais visible par le client.',
  'doc-prive': 'Le document n’est plus visible par le client.',
  'note-ajoutee': 'La note a été enregistrée.',
  'note-publiee': 'Le compte rendu est désormais visible par le client.',
  'note-privee': 'La note n’est plus visible par le client.',
  'proposition-ajoutee': 'La proposition a été enregistrée. Elle reste privée tant qu’elle n’est pas partagée.',
  'proposition-maj': 'La proposition a été mise à jour.',
  'validation-soumise': 'La demande de validation a été soumise au client.',
  'validation-remplacee': 'Les pièces ou le destinataire ont changé : une nouvelle validation a été soumise au client.',
  'transmission': 'La transmission a été consignée dans le dossier.',
  'message-envoye': 'Votre message a été envoyé.',
  'decision': 'Votre décision a été enregistrée.',
  'dossier-clos': 'Le dossier a été clôturé.',
  'prestataire-ajoute': 'Le prestataire a été ajouté à l’annuaire.',
  'prestataire-maj': 'La fiche prestataire a été mise à jour.',
  'notifs-lues': 'Les notifications ont été marquées comme lues.',
  'mot-de-passe': 'Votre mot de passe a été défini. Bienvenue dans votre Espace Projet.',
  'deconnexion': 'Vous êtes déconnecté.',
  'erreur-fichier': 'Le fichier n’a pas pu être déposé (format non accepté ou taille supérieure à 15 Mo).',
  'erreur-champs': 'Certains champs obligatoires sont manquants.',
  'erreur-statut': 'Cette action n’est pas possible dans l’état actuel.',
};
const flashBox = (code) => FLASH[code]
  ? html`<div class="alert" role="status">${icon(code.startsWith('erreur') ? 'info' : 'check')}<span>${FLASH[code]}</span></div>` : '';

// ---------- Gabarits ----------
const SIGNATURE = 'NOAMIS — Votre projet de sécurité, notre accompagnement.';

function head(title) {
  return html`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${title} · NOAMIS — Espace Projet</title>
<link rel="icon" type="image/png" href="/static/img/favicon.png">
<link rel="stylesheet" href="/static/styles.css">
</head>`;
}

const logo = (cls = 'logo') => html`<img class="${cls}" src="/static/img/noamis-logo.png" width="1536" height="1024" alt="NOAMIS Sûreté Conseil">`;

function publicPage({ title, body, wide = false }) {
  return html`${head(title)}
<body class="public">
<a class="skip" href="#contenu">Aller au contenu</a>
<header class="public-header">
  <a href="/" class="brand" aria-label="NOAMIS — Espace Projet, accueil">${logo('logo logo-sm')}</a>
  <nav aria-label="Liens publics" class="public-nav">
    <a href="https://www.noamis.fr">Site noamis.fr</a>
    <a href="/presenter-mon-projet">Présenter mon projet</a>
    <a href="/connexion">Espace client</a>
  </nav>
</header>
<main id="contenu" class="public-main${wide ? ' wide' : ''}" tabindex="-1">${body}</main>
<footer class="site-footer"><p>${SIGNATURE}</p><p><a href="https://www.noamis.fr">www.noamis.fr</a></p></footer>
</body></html>`.s;
}

function appPage({ title, user, nav = [], active = '', body, flash = '', unread = 0, sub = null }) {
  const home = user.role === 'cabinet' ? '/cabinet' : '/espace';
  return html`${head(title)}
<body class="app">
<a class="skip" href="#contenu">Aller au contenu</a>
<header class="app-header">
  <div class="app-header-inner">
    <a href="${home}" class="brand" aria-label="Accueil de l’Espace Projet">${logo('logo logo-xs')}</a>
    <div class="app-title"><span class="app-name">Espace Projet</span><span class="app-role">${user.role === 'cabinet' ? 'Cabinet' : 'Client'}</span></div>
    <div class="app-user">
      <a href="/notifications" class="notif-link">${icon('bell')}<span>Notifications${unread ? html` <span class="count">(${unread} non lue${unread > 1 ? 's' : ''})</span>` : ''}</span></a>
      <span class="user-name">${icon('user')}<span>${user.name}</span></span>
      <form method="post" action="/deconnexion" class="inline">${csrfField(user._csrf)}<button type="submit" class="btn btn-secondary btn-sm">Se déconnecter</button></form>
    </div>
  </div>
  ${nav.length ? html`<nav class="main-nav" aria-label="Navigation principale"><ul>
    ${nav.map((n) => html`<li><a href="${n.href}" ${n.key === active ? raw('aria-current="page"') : ''}>${n.label}${n.count ? html` <span class="count">(${n.count})</span>` : ''}</a></li>`)}
  </ul></nav>` : ''}
  ${sub ? html`<nav class="sub-nav" aria-label="${sub.label}"><ul>
    ${sub.items.map((n) => html`<li><a href="${n.href}" ${n.key === sub.active ? raw('aria-current="page"') : ''}>${n.label}${n.count ? html` <span class="count">(${n.count})</span>` : ''}</a></li>`)}
  </ul></nav>` : ''}
</header>
<main id="contenu" class="app-main" tabindex="-1">
${flashBox(flash)}
${body}
</main>
<footer class="site-footer"><p>${SIGNATURE}</p></footer>
</body></html>`.s;
}

module.exports = {
  html, raw, esc, nl2br, icon, badge, visibilityBadge, csrfField, field, select, radios, errorSummary,
  fmtDate, fmtDateTime, fmtDay, fmtSize, publicPage, appPage, logo, SIGNATURE, FLASH,
};
