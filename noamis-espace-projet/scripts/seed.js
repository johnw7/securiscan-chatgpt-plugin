'use strict';
// Données de démonstration — entièrement fictives (noms, sociétés, e-mails en .example, numéros fictifs).
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { hashPassword } = require('../src/auth');
const { applyLevelDefaults } = require('../src/services');

const DEMO = {
  cabinet: { email: 'cabinet@noamis.example', password: 'Demo-Cabinet-2026', name: 'Camille Laurent' },
  client: { email: 'client@noamis.example', password: 'Demo-Client-2026', name: 'Claire Martin' },
};

const ago = (days, hours = 0) => new Date(Date.now() - days * 86400e3 - hours * 3600e3).toISOString();
const inDays = (days) => new Date(Date.now() + days * 86400e3).toISOString().slice(0, 10);

// Génère un PDF minimal (texte seul) pour illustrer les documents.
function makePdf(title, lines) {
  const clean = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’]/g, "'").replace(/[—–]/g, '-').replace(/[^\x20-\x7e]/g, '').replace(/([()\\])/g, '\\$1');
  const all = [`NOAMIS - ${title}`, 'DOCUMENT DE DEMONSTRATION - DONNEES FICTIVES', '', ...lines];
  const content = `BT /F1 12 Tf 60 780 Td 16 TL ${all.map((l) => `(${clean(l)}) '`).join(' ')} ET`;
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let out = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

function seed({ db, config }) {
  const ins = (sql, ...p) => Number(db.run(sql, ...p).lastInsertRowid);
  const user = (email, name, role, password, phone, opts = {}) => ins(
    'INSERT INTO users (email, name, phone, role, password_hash, invited_at, activated_at, created_at) VALUES (?,?,?,?,?,?,?,?)',
    email, name, phone || null, role, password ? hashPassword(password) : null, opts.invited || ago(40), password ? ago(39) : null, ago(40));
  const hist = (d, u, action, visible, at) => db.run('INSERT INTO history (dossier_id, user_id, action, visible_client, created_at) VALUES (?,?,?,?,?)', d, u, action, visible ? 1 : 0, at);
  const doc = (d, title, file, step, shared, at, lines, by) => {
    const stored = crypto.randomBytes(16).toString('hex');
    const buf = makePdf(title, lines);
    fs.writeFileSync(path.join(config.storageDir, stored), buf);
    return ins('INSERT INTO documents (dossier_id, title, original_name, stored_name, mime, size, step, shared, shared_at, uploaded_by, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      d, title, file, stored, 'application/pdf', buf.length, step, shared ? 1 : 0, shared ? at : null, by, at);
  };

  db.tx(() => {
    const cab = user(DEMO.cabinet.email, DEMO.cabinet.name, 'cabinet', DEMO.cabinet.password, '01 99 00 10 00');
    const cli = user(DEMO.client.email, DEMO.client.name, 'client', DEMO.client.password, '06 39 98 00 01');
    // Second client (invitation non acceptée) : sert à vérifier le cloisonnement entre clients.
    const other = user('direction@orvalis.example', 'Société Orvalis (Hugo Bernard)', 'client', null, '01 99 00 20 00');

    // Annuaire des prestataires (fictifs).
    const p1 = ins('INSERT INTO providers (company, contact_name, specialties, zones, email, phone, website, internal_notes, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      'Alpha Protection Systèmes', 'Julien Morel', 'Vidéoprotection, alarme intrusion, contrôle d’accès', 'Paris, Hauts-de-Seine, Yvelines',
      'contact@alpha-protection.example', '01 99 00 31 10', 'alpha-protection.example', 'Réactif, bonne documentation technique. Vérifier systématiquement les délais d’approvisionnement.', ago(120));
    const p2 = ins('INSERT INTO providers (company, contact_name, specialties, zones, email, phone, website, internal_notes, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      'Veilleur Systèmes', 'Sarah Lefèvre', 'Alarme intrusion, télésurveillance, maintenance', 'Île-de-France',
      'devis@veilleur-systemes.example', '01 99 00 32 20', 'veilleur-systemes.example', 'Contrat de maintenance souvent imposé : à faire préciser.', ago(110));
    const p3 = ins('INSERT INTO providers (company, contact_name, specialties, zones, email, phone, website, internal_notes, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      'Serrurerie Delcourt', 'Marc Delcourt', 'Serrurerie haute sécurité, portes blindées, rideaux métalliques', 'Paris, petite couronne',
      'atelier@delcourt-serrurerie.example', '01 99 00 33 30', null, null, ago(100));
    ins('INSERT INTO providers (company, contact_name, specialties, zones, email, phone, website, internal_notes, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      'Garde & Escorte Conseil', 'Inès Garnier', 'Protection rapprochée, sûreté événementielle', 'France entière',
      'operations@garde-escorte.example', '01 99 00 34 40', null, 'Intervient uniquement sur mission formalisée.', ago(90));

    // Demandes reçues via le formulaire public.
    db.run(`INSERT INTO requests (profile, name, email, phone, contact_pref, need_type, zone, timeline, description, level, status, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, 'Particulier', 'Thomas Girard', 'thomas.girard@exemple-client.example', '06 39 98 00 22', 'Téléphone',
    'Sécurisation d’une résidence', 'Saint-Germain-en-Laye', 'Entre un et trois mois',
    'Maison familiale avec jardin. Nous souhaitons être conseillés sur la sécurisation des accès et savoir quels professionnels consulter.', 'conseil', 'nouvelle', ago(1, 3));
    db.run(`INSERT INTO requests (profile, name, email, phone, contact_pref, need_type, zone, timeline, description, level, status, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, 'Entreprise', 'Atelier Ribeiro', 'contact@atelier-ribeiro.example', null, 'E-mail',
    'Sûreté d’une entreprise ou d’un site', 'Montreuil', 'Pas encore défini',
    'Atelier de production de 600 m², deux accès. Nous voulons structurer notre démarche de sûreté avant de consulter des entreprises.', null, 'en_examen', ago(4));

    // ---------- Dossier principal du client de démonstration ----------
    const reqId = ins(`INSERT INTO requests (profile, name, email, phone, contact_pref, need_type, zone, timeline, description, level, status, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, 'Commerce', DEMO.client.name, DEMO.client.email, '06 39 98 00 01', 'E-mail',
    'Sécurisation d’un commerce', 'Paris 6e', 'Sous un mois',
    'Boutique de créateurs (bijoux) au rez-de-chaussée. Nous souhaitons revoir la protection de la boutique et être aidés pour choisir un installateur.', 'projet', 'convertie', ago(30));
    const d1 = ins(`INSERT INTO dossiers (ref, title, client_id, request_id, level, zone, current_step, status, version, next_action, context, needs, constraints, objectives, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, `NOA-${new Date().getFullYear()}-001`, 'Sécurisation de la boutique Maison Martin', cli, reqId, 'projet', 'Paris 6e', 3, 'ouvert', 2,
    'Examinez la demande de validation en attente, puis prenez connaissance du comparatif des deux propositions reçues.',
    'Boutique de créateurs (bijoux et accessoires) au rez-de-chaussée d’un immeuble ancien, ouverte du mardi au samedi.',
    'Protection des locaux hors horaires d’ouverture, dissuasion en journée, levée de doute en cas d’alarme.',
    'Façade protégée (accord de la copropriété nécessaire), budget à maîtriser, travaux à réaliser un lundi.',
    'Choisir un installateur sur la base de propositions comparables, avant la période des fêtes.', ago(28), ago(0, 5));
    db.run("UPDATE requests SET dossier_id = ? WHERE id = ?", d1, reqId);
    applyLevelDefaults(db, d1, 'projet', true);
    db.run("UPDATE dossier_steps SET status = CASE WHEN step < 3 THEN 'terminee' WHEN step = 3 THEN 'en_cours' ELSE 'a_venir' END WHERE dossier_id = ?", d1);

    const docFiche = doc(d1, 'Fiche de compréhension du besoin', 'NOAMIS-fiche-besoin.pdf', 1, true, ago(25), ['Contexte, besoins, contraintes et objectifs du projet.'], cab);
    const docCahier = doc(d1, 'Cahier des besoins — version 2', 'NOAMIS-cahier-des-besoins-v2.pdf', 2, true, ago(12), ['Besoins fonctionnels exprimes, sans donnees sensibles.'], cab);
    const docProjet = doc(d1, 'Dossier Projet NOAMIS — version 2', 'NOAMIS-dossier-projet-v2.pdf', 2, true, ago(2), ['Synthese du projet, perimetre de la consultation, criteres de choix.'], cab);
    const devisA = doc(d1, 'Devis Alpha Protection Systèmes', 'devis-alpha-protection.pdf', 3, true, ago(6), ['Devis transmis par le prestataire (fictif).'], cab);
    const devisV = doc(d1, 'Devis Veilleur Systèmes', 'devis-veilleur-systemes.pdf', 3, true, ago(5), ['Devis transmis par le prestataire (fictif).'], cab);
    doc(d1, 'Compte rendu de visite — notes de travail', 'notes-visite-interne.pdf', 1, false, ago(26), ['Notes internes au cabinet.'], cab);

    db.run("UPDATE deliverables SET status = 'remis', document_id = ? WHERE dossier_id = ? AND key = 'fiche-besoin'", docFiche, d1);
    db.run("UPDATE deliverables SET status = 'remis', document_id = ? WHERE dossier_id = ? AND key = 'cahier-besoins'", docCahier, d1);
    db.run("UPDATE deliverables SET status = 'remis', document_id = ? WHERE dossier_id = ? AND key = 'dossier-projet'", docProjet, d1);
    db.run("UPDATE deliverables SET status = 'en_cours' WHERE dossier_id = ? AND key IN ('liste-professionnels','comparatif')", d1);

    db.run('INSERT INTO notes (dossier_id, kind, title, body, step, shared, shared_at, author_id, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      d1, 'compte_rendu', 'Compte rendu de l’entretien de cadrage', 'Entretien du jour : objectifs confirmés, contraintes de copropriété identifiées. Prochaine étape : rédaction du cahier des besoins.', 1, 1, ago(24), cab, ago(24));
    db.run('INSERT INTO notes (dossier_id, kind, title, body, step, shared, shared_at, author_id, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      d1, 'note', 'Point de vigilance', 'La cliente souhaite conserver le prestataire de télésurveillance actuel si possible : à évoquer avec les installateurs.', 3, 0, null, cab, ago(6));

    db.run('INSERT INTO tasks (dossier_id, title, step, due_date, status, visible_client, created_by, created_at) VALUES (?,?,?,?,?,?,?,?)', d1, 'Relancer Alpha Protection Systèmes sur le délai d’approvisionnement', 3, inDays(2), 'a_faire', 0, cab, ago(3));
    db.run('INSERT INTO tasks (dossier_id, title, step, due_date, status, visible_client, created_by, created_at) VALUES (?,?,?,?,?,?,?,?)', d1, 'Préparer la note d’aide à la décision', 3, inDays(6), 'a_faire', 0, cab, ago(3));

    // Propositions (partagées dans le comparatif).
    db.run(`INSERT INTO proposals (dossier_id, provider_id, scope, amount, quote_ref, delays, guarantees, document_id, clarifications, analysis, shared, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,1,?,?)`, d1, p1,
    'Alarme intrusion avec détection périmétrique, 4 caméras intérieures, contrôle d’accès sur la porte de réserve, mise en service et formation.',
    '14 850 € HT', 'DEV-APS-0412', 'Installation sous 3 semaines après commande, intervention prévue un lundi.',
    'Garantie matériel 3 ans, intervention sous 24 h ouvrées pendant la garantie.', devisA,
    'Confirmer la compatibilité avec le télésurveilleur actuel. Préciser le coût de la maintenance après la garantie.',
    'Périmètre le plus complet. La proposition répond à l’ensemble des besoins du cahier, sous réserve des points à clarifier.', ago(6), ago(6));
    db.run(`INSERT INTO proposals (dossier_id, provider_id, scope, amount, quote_ref, delays, guarantees, document_id, clarifications, analysis, shared, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,1,?,?)`, d1, p2,
    'Alarme intrusion avec télésurveillance incluse 12 mois, 2 caméras intérieures. Contrôle d’accès non inclus.',
    '9 600 € HT + abonnement 49 € HT / mois', 'VS-2026-188', 'Installation sous 10 jours ouvrés.',
    'Garantie 2 ans pièces et main-d’œuvre. Contrat de maintenance de 36 mois proposé.', devisV,
    'Le contrat de maintenance de 36 mois est-il obligatoire ? Le contrôle d’accès peut-il faire l’objet d’une option chiffrée ?',
    'Proposition plus rapide et moins coûteuse à l’installation, mais périmètre réduit : le contrôle d’accès demandé n’est pas couvert.', ago(5), ago(5));

    // Validations : une validée et transmise, une en attente.
    const docsJson = (ids) => JSON.stringify(db.all(`SELECT id, title, original_name FROM documents WHERE id IN (${ids.join(',')}) ORDER BY id`));
    db.run(`INSERT INTO validations (dossier_id, action, provider_id, dossier_version, documents_json, status, created_by, created_at, decided_by, decided_at, decision_comment, transmitted_at, transmitted_by, transmission_note)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, d1, 'Transmettre le cahier des besoins pour obtenir un devis.', p1, 1, docsJson([docCahier]), 'valide', cab, ago(11), cli, ago(10), null, ago(9), cab,
    'Envoi par messagerie à l’interlocuteur commercial, accusé de réception obtenu.');
    db.run(`INSERT INTO validations (dossier_id, action, provider_id, dossier_version, documents_json, status, created_by, created_at)
      VALUES (?,?,?,?,?,?,?,?)`, d1, 'Transmettre le Dossier Projet NOAMIS (version 2) pour obtenir une proposition actualisée intégrant le contrôle d’accès.', p2, 2, docsJson([docProjet, docCahier]), 'en_attente', cab, ago(0, 5));

    db.run('INSERT INTO messages (dossier_id, author_id, body, created_at) VALUES (?,?,?,?)', d1, cli, 'Bonjour, pourriez-vous me confirmer que les travaux pourront avoir lieu un lundi ?', ago(7));
    db.run('INSERT INTO messages (dossier_id, author_id, body, created_at) VALUES (?,?,?,?)', d1, cab, 'Bonjour Madame Martin, c’est bien précisé dans le cahier des besoins. Les deux prestataires l’ont intégré à leur proposition.', ago(6, 20));

    hist(d1, cab, `Dossier NOA-${new Date().getFullYear()}-001 créé (NOAMIS PROJET).`, true, ago(28));
    hist(d1, cab, 'Compte rendu publié : Compte rendu de l’entretien de cadrage.', true, ago(24));
    hist(d1, cab, 'Étape en cours : 2. Préparer.', true, ago(20));
    hist(d1, cab, 'Document partagé avec le client : Cahier des besoins — version 2.', true, ago(12));
    hist(d1, cab, 'Validation demandée : transmission à Alpha Protection Systèmes (version 1).', true, ago(11));
    hist(d1, cli, `Décision de ${DEMO.client.name} : Validé — transmission à Alpha Protection Systèmes (version 1).`, true, ago(10));
    hist(d1, cab, 'Transmission effectuée par le cabinet à Alpha Protection Systèmes (version 1, 1 pièce(s)), après validation du client.', true, ago(9));
    hist(d1, cab, 'Étape en cours : 3. Rechercher.', true, ago(8));
    hist(d1, cab, 'Proposition de Alpha Protection Systèmes ajoutée au comparatif.', true, ago(6));
    hist(d1, cab, 'Proposition de Veilleur Systèmes ajoutée au comparatif.', true, ago(5));
    hist(d1, cab, 'Nouvelle version du dossier : version 2.', true, ago(2));
    hist(d1, cab, 'Validation demandée : transmission à Veilleur Systèmes (version 2).', true, ago(0, 5));
    db.run('INSERT INTO notifications (user_id, dossier_id, text, link, created_at) VALUES (?,?,?,?,?)', cli, d1, 'Une décision est attendue dans votre dossier.', `/espace/dossiers/${d1}`, ago(0, 5));

    // ---------- Dossier d'un autre client (cloisonnement) ----------
    const d2 = ins(`INSERT INTO dossiers (ref, title, client_id, level, zone, current_step, status, version, next_action, context, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, `NOA-${new Date().getFullYear()}-002`, 'Sûreté du siège Orvalis', other, 'integral', 'Nanterre', 2, 'ouvert', 1,
    'Le cabinet prépare le cahier des besoins.', 'Siège administratif de 80 collaborateurs.', ago(15), ago(3));
    applyLevelDefaults(db, d2, 'integral', true);
    db.run("UPDATE dossier_steps SET status = CASE WHEN step = 1 THEN 'terminee' WHEN step = 2 THEN 'en_cours' ELSE 'a_venir' END WHERE dossier_id = ?", d2);
    doc(d2, 'Note de cadrage Orvalis', 'orvalis-cadrage.pdf', 1, true, ago(10), ['Document confidentiel du client Orvalis (fictif).'], cab);
    db.run('INSERT INTO validations (dossier_id, action, provider_id, dossier_version, documents_json, status, created_by, created_at) VALUES (?,?,?,?,?,?,?,?)',
      d2, 'Transmettre la note de cadrage.', p3, 1, '[]', 'en_attente', cab, ago(3));
    hist(d2, cab, `Dossier NOA-${new Date().getFullYear()}-002 créé (NOAMIS ACCOMPAGNEMENT INTÉGRAL).`, true, ago(15));
  });
}

function seedIfEmpty(ctx) {
  const n = ctx.db.get('SELECT COUNT(*) c FROM users').c;
  if (n === 0) {
    seed(ctx);
    console.log('Données de démonstration créées (comptes : cabinet@noamis.example / client@noamis.example).');
  }
}

module.exports = { seed, seedIfEmpty, DEMO, makePdf };

if (require.main === module) {
  const { loadConfig } = require('../src/app');
  const { openDb } = require('../src/db');
  const config = loadConfig();
  if (process.argv.includes('--reset')) {
    for (const f of [config.dbPath, `${config.dbPath}-wal`, `${config.dbPath}-shm`]) fs.rmSync(f, { force: true });
    fs.rmSync(config.storageDir, { recursive: true, force: true });
    console.log('Base et stockage de démonstration réinitialisés.');
  }
  fs.mkdirSync(config.storageDir, { recursive: true });
  const db = openDb(config.dbPath);
  seedIfEmpty({ db, config });
  db.close();
}
