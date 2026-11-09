'use strict';
// Composants partagés entre l'espace client et le tableau de bord du cabinet.
const { STEPS, STEP_STATUS, DELIVERABLE_STATUS, VALIDATION_STATUS, levelLabel } = require('./domain');
const { html, raw, icon, badge, nl2br, fmtDateTime } = require('./view');
const { validationDocs } = require('./services');

function stepsTimeline(steps, { compact = false } = {}) {
  const included = steps.filter((s) => s.included);
  return html`<ol class="timeline${compact ? ' compact' : ''}" aria-label="Étapes de la méthode NOAMIS">
    ${included.map((s) => {
      const def = STEPS.find((x) => x.n === s.step);
      return html`<li class="timeline-item is-${s.status}" ${s.status === 'en_cours' ? raw('aria-current="step"') : ''}>
        <span class="timeline-num" aria-hidden="true">${s.step}</span>
        <span class="timeline-body"><span class="timeline-label">${s.step}. ${def.label}</span>
        ${badge(STEP_STATUS[s.status])}
        ${compact ? '' : html`<span class="timeline-desc">${def.desc}</span>`}</span>
      </li>`;
    })}
  </ol>`;
}

const deliverableItem = (d, docLink) => html`<li class="list-item">
  ${icon('file')}<span class="grow">${d.label}</span>
  ${badge(DELIVERABLE_STATUS[d.status])}
  ${docLink ? html`<a class="btn btn-secondary btn-sm" href="/documents/${d.document_id}/telecharger">${icon('download')}<span>Télécharger<span class="sr-only"> ${d.label}</span></span></a>` : ''}
</li>`;

// Comparatif : distingue les informations du prestataire de l'analyse NOAMIS.
function comparison(proposals, { forClient = false } = {}) {
  if (!proposals.length) return html`<p class="empty">Aucune proposition ${forClient ? 'partagée pour le moment' : 'enregistrée'}.</p>`;
  const docCell = (p) => (p.document_id && (!forClient || p.doc_shared)
    ? html`<a href="/documents/${p.document_id}/telecharger">${icon('download')}<span>Devis de ${p.company}</span></a>` : html`<span>Non joint</span>`);
  const provRows = [
    ['Périmètre d’intervention', (p) => nl2br(p.scope)],
    ['Montant indiqué au devis', (p) => p.amount],
    ['Référence du devis', (p) => p.quote_ref || '—'],
    ['Délais annoncés', (p) => nl2br(p.delays || '—')],
    ['Garanties annoncées', (p) => nl2br(p.guarantees || '—')],
    ['Document', docCell],
  ];
  const noamisRows = [
    ['Points à clarifier', (p) => nl2br(p.clarifications || '—')],
    ['Observations', (p) => nl2br(p.analysis || '—')],
  ];
  return html`<div class="comparison">
    <div class="table-wrap comparison-table" role="region" aria-labelledby="comp-caption" tabindex="0">
      <table>
        <caption id="comp-caption" class="sr-only">Comparatif des propositions (${proposals.length})</caption>
        <thead><tr><td></td>${proposals.map((p) => html`<th scope="col">${p.company}</th>`)}</tr></thead>
        <tbody>
          <tr class="group-row"><th scope="colgroup" colspan="${proposals.length + 1}">${icon('file')}<span>Informations fournies par le prestataire</span></th></tr>
          ${provRows.map(([label, fn]) => html`<tr><th scope="row">${label}</th>${proposals.map((p) => html`<td>${fn(p)}</td>`)}</tr>`)}
          <tr class="group-row"><th scope="colgroup" colspan="${proposals.length + 1}">${icon('shield')}<span>Analyse NOAMIS</span></th></tr>
          ${noamisRows.map(([label, fn]) => html`<tr class="analysis-row"><th scope="row">${label}</th>${proposals.map((p) => html`<td>${fn(p)}</td>`)}</tr>`)}
        </tbody>
      </table>
    </div>
    <div class="comparison-cards">
      ${proposals.map((p) => html`<article class="card proposal-card">
        <h3>${p.company}</h3>
        <h4 class="block-label">${icon('file')}<span>Informations fournies par le prestataire</span></h4>
        <dl class="dl">${provRows.map(([label, fn]) => html`<dt>${label}</dt><dd>${fn(p)}</dd>`)}</dl>
        <h4 class="block-label">${icon('shield')}<span>Analyse NOAMIS</span></h4>
        <dl class="dl analysis">${noamisRows.map(([label, fn]) => html`<dt>${label}</dt><dd>${fn(p)}</dd>`)}</dl>
      </article>`)}
    </div>
    <p class="small note">Les montants, délais et garanties sont repris des devis transmis par les prestataires. L’analyse NOAMIS est un avis d’aide à la décision.
    Le choix du prestataire vous appartient et vous contractualisez directement avec lui ; les prestations techniques et opérationnelles relèvent des professionnels qui les exécutent.</p>
  </div>`;
}

// Fiche d'une demande de validation : action, destinataire, version, pièces.
function validationSummary(v, { forClient = false, users = {} } = {}) {
  const docs = validationDocs(v);
  return html`<dl class="dl validation-dl">
    <dt>Action proposée</dt><dd>${nl2br(v.action)}</dd>
    <dt>Destinataire</dt><dd>${v.company}${v.specialties ? html`<br><span class="small">${v.specialties}</span>` : ''}</dd>
    <dt>Version du dossier</dt><dd>Version ${v.dossier_version}</dd>
    <dt>Pièces concernées</dt><dd>${docs.length ? html`<ul class="plain">${docs.map((d) => html`<li>${icon('file')}<a href="/documents/${d.id}/telecharger">${d.title}</a> <span class="small">(${d.original_name})</span></li>`)}</ul>` : 'Aucune pièce'}</dd>
    <dt>Statut</dt><dd>${badge(VALIDATION_STATUS[v.status])}${v.transmitted_at ? html` <span class="status">${icon('send')}<span>Transmis le ${fmtDateTime(v.transmitted_at)}</span></span>` : ''}</dd>
    ${v.decided_at ? html`<dt>Décision</dt><dd>${VALIDATION_STATUS[v.status] ? VALIDATION_STATUS[v.status].label : ''} par ${users[v.decided_by] || 'le client'}, le ${fmtDateTime(v.decided_at)}, pour la version ${v.dossier_version}${v.decision_comment ? html`<br>Commentaire : « ${v.decision_comment} »` : ''}</dd>` : ''}
    ${!forClient && v.transmission_note ? html`<dt>Transmission</dt><dd>${nl2br(v.transmission_note)}</dd>` : ''}
    <dt>Soumise le</dt><dd>${fmtDateTime(v.created_at)}</dd>
  </dl>`;
}

const VALIDATION_NOTICE = 'Une validation autorise uniquement l’action décrite à l’écran. Elle ne déclenche ni commande, ni paiement, ni signature de devis. Après votre validation, le cabinet effectue l’envoi et le consigne dans votre dossier. Toute modification des pièces ou du destinataire donnera lieu à une nouvelle demande de validation.';

const levelBadge = (level) => html`<span class="status">${icon('shield')}<span>${levelLabel(level)}</span></span>`;

module.exports = { stepsTimeline, deliverableItem, comparison, validationSummary, VALIDATION_NOTICE, levelBadge };
