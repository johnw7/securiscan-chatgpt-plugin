'use strict';
// Scénario de démonstration complet + contrôles de cloisonnement, sur une base temporaire.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp, loadConfig } = require('../src/app');
const { seedIfEmpty, DEMO } = require('../scripts/seed');

let server; let base; let tmp; let ctx;

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'noamis-test-'));
  const config = { ...loadConfig({}), dbPath: path.join(tmp, 'test.db'), storageDir: path.join(tmp, 'storage'), logEmails: false };
  const app = createApp(config);
  ctx = app.locals.ctx;
  seedIfEmpty(ctx);
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
  config.baseUrl = base;
});
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

// Navigateur minimal : conserve les cookies, extrait le jeton CSRF.
function browser() {
  const jar = {};
  const cookieHeader = () => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
  const store = (res) => {
    for (const c of res.headers.getSetCookie()) {
      const [kv] = c.split(';'); const i = kv.indexOf('=');
      const k = kv.slice(0, i); const v = kv.slice(i + 1);
      if (/Expires=Thu, 01 Jan 1970/.test(c) || v === '') delete jar[k]; else jar[k] = v;
    }
  };
  const b = {
    async get(url) {
      const res = await fetch(base + url, { headers: { cookie: cookieHeader() }, redirect: 'manual' });
      store(res);
      return { status: res.status, location: res.headers.get('location'), text: await res.text(), headers: res.headers };
    },
    async post(url, data = {}) {
      if (!jar.noamis_csrf) await b.get('/connexion');
      const body = new URLSearchParams();
      body.append('_csrf', decodeURIComponent(jar.noamis_csrf));
      for (const [k, v] of Object.entries(data)) (Array.isArray(v) ? v : [v]).forEach((x) => body.append(k, String(x)));
      const res = await fetch(base + url, { method: 'POST', body, headers: { cookie: cookieHeader() }, redirect: 'manual' });
      store(res);
      return { status: res.status, location: res.headers.get('location'), text: await res.text() };
    },
    async upload(url, fields, filename, content) {
      const fd = new FormData();
      fd.append('_csrf', decodeURIComponent(jar.noamis_csrf));
      for (const [k, v] of Object.entries(fields)) fd.append(k, v);
      fd.append('file', new Blob([content], { type: 'application/pdf' }), filename);
      const res = await fetch(base + url, { method: 'POST', body: fd, headers: { cookie: cookieHeader() }, redirect: 'manual' });
      store(res);
      return { status: res.status, location: res.headers.get('location'), text: await res.text() };
    },
    async login(email, password) {
      await b.get('/connexion');
      const r = await b.post('/connexion', { email, password });
      assert.equal(r.status, 303, `connexion ${email}`);
      return r;
    },
  };
  return b;
}
const db = () => ctx.db;

test('la page de connexion affiche la signature et le logo', async () => {
  const r = await browser().get('/connexion');
  assert.equal(r.status, 200);
  assert.match(r.text, /NOAMIS — Votre projet de sécurité, notre accompagnement\./);
  assert.match(r.text, /noamis-logo\.png/);
});

test('mauvais mot de passe refusé, pages protégées redirigées', async () => {
  const b = browser();
  const r = await b.post('/connexion', { email: DEMO.client.email, password: 'faux' });
  assert.equal(r.status, 401);
  const g = await b.get('/espace');
  assert.equal(g.status, 302);
  assert.match(g.location, /^\/connexion/);
});

test('POST sans jeton CSRF refusé', async () => {
  const res = await fetch(`${base}/connexion`, { method: 'POST', body: new URLSearchParams({ email: 'x', password: 'y' }), redirect: 'manual' });
  assert.equal(res.status, 403);
});

test('cloisonnement : un client ne peut ouvrir ni le dossier ni les documents d’un autre client', async () => {
  const c = browser();
  await c.login(DEMO.client.email, DEMO.client.password);
  const own = db().get('SELECT d.id FROM dossiers d JOIN users u ON u.id = d.client_id WHERE u.email = ?', DEMO.client.email);
  const other = db().get("SELECT d.id FROM dossiers d JOIN users u ON u.id = d.client_id WHERE u.email = 'direction@orvalis.example'");
  assert.equal((await c.get(`/espace/dossiers/${own.id}`)).status, 200);
  for (const suffix of ['', '/projet', '/documents', '/decisions', '/messages']) {
    const r = await c.get(`/espace/dossiers/${other.id}${suffix}`);
    assert.equal(r.status, 404, `lien direct ${suffix}`);
    assert.doesNotMatch(r.text, /Orvalis/);
  }
  const otherDoc = db().get('SELECT id FROM documents WHERE dossier_id = ?', other.id);
  assert.equal((await c.get(`/documents/${otherDoc.id}/telecharger`)).status, 404);
  const otherVal = db().get('SELECT id FROM validations WHERE dossier_id = ?', other.id);
  assert.equal((await c.get(`/espace/dossiers/${other.id}/decisions/${otherVal.id}`)).status, 404);
  assert.equal((await c.get(`/espace/dossiers/${own.id}/decisions/${otherVal.id}`)).status, 404);
  const p = await c.post(`/espace/dossiers/${other.id}/decisions/${otherVal.id}`, { decision: 'valide', version: 1 });
  assert.equal(p.status, 404);
  assert.equal(db().get('SELECT status FROM validations WHERE id = ?', otherVal.id).status, 'en_attente');
  const m = await c.post(`/espace/dossiers/${other.id}/messages`, { body: 'intrusion' });
  assert.equal(m.status, 404);
  // Document privé de son propre dossier : invisible.
  const priv = db().get('SELECT id FROM documents WHERE dossier_id = ? AND shared = 0', own.id);
  assert.equal((await c.get(`/documents/${priv.id}/telecharger`)).status, 404);
  // Le client n'accède pas au tableau de bord du cabinet.
  assert.equal((await c.get('/cabinet')).status, 403);
  assert.equal((await c.get(`/cabinet/dossiers/${own.id}`)).status, 403);
  // Les notes internes n'apparaissent pas côté client.
  const projet = await c.get(`/espace/dossiers/${own.id}/projet`);
  assert.doesNotMatch(projet.text, /Point de vigilance/);
});

test('scénario complet : demande → dossier → invitation → validation → comparatif → clôture', async () => {
  // 1. Le prospect présente son projet.
  const prospect = browser();
  const bad = await prospect.post('/presenter-mon-projet', { name: 'X' });
  assert.equal(bad.status, 422);
  const sent = await prospect.post('/presenter-mon-projet', {
    profile: 'Dirigeant', name: 'Paul Fictif', email: 'paul.fictif@exemple-client.example', phone: '06 39 98 00 55',
    contact_pref: 'E-mail', need_type: 'Protection d’un dirigeant ou d’une personnalité', zone: 'Paris 8e',
    timeline: 'Sous un mois', description: 'Déplacements professionnels fréquents, besoin d’un regard indépendant sur l’organisation.',
    level: 'integral', consent: '1',
  });
  assert.equal(sent.status, 303);
  assert.equal(sent.location, '/presenter-mon-projet/merci');
  assert.match((await prospect.get('/presenter-mon-projet/merci')).text, /bien été transmise/);
  const req = db().get("SELECT * FROM requests WHERE email = 'paul.fictif@exemple-client.example'");
  assert.equal(req.status, 'nouvelle');

  // 2. Le cabinet crée le dossier et invite le client.
  const cab = browser();
  await cab.login(DEMO.cabinet.email, DEMO.cabinet.password);
  assert.match((await cab.get('/cabinet/demandes')).text, /Paul Fictif/);
  const created = await cab.post(`/cabinet/demandes/${req.id}/dossier`, {
    title: 'Organisation de la sûreté des déplacements', level: 'integral', zone: 'Paris 8e',
    client_mode: 'new', client_name: 'Paul Fictif', client_email: 'paul.fictif@exemple-client.example',
  });
  assert.equal(created.status, 200);
  const link = created.text.match(/\/invitation\/([A-Za-z0-9_-]{30,})/);
  assert.ok(link, 'lien d’invitation affiché (SMTP non configuré)');
  const dossier = db().get('SELECT * FROM dossiers WHERE request_id = ?', req.id);
  assert.equal(dossier.level, 'integral');
  assert.equal(db().all('SELECT * FROM dossier_steps WHERE dossier_id = ? AND included = 1', dossier.id).length, 5);

  // 3. Le client active son accès.
  const client = browser();
  await client.get(`/invitation/${link[1]}`);
  const weak = await client.post(`/invitation/${link[1]}`, { password: 'court', password2: 'court' });
  assert.match(weak.text, /au moins 12 caractères/);
  const act = await client.post(`/invitation/${link[1]}`, { password: 'Un-Mot-De-Passe-Solide', password2: 'Un-Mot-De-Passe-Solide' });
  assert.equal(act.status, 303);
  assert.equal((await browser().get(`/invitation/${link[1]}`)).status, 404, 'invitation à usage unique');
  const dash = await client.get(`/espace/dossiers/${dossier.id}`);
  assert.equal(dash.status, 200);
  assert.match(dash.text, /Étape en cours/);
  assert.match(dash.text, /Prochaine action attendue/);

  // 4. Le cabinet dépose des documents (privés par défaut) et un compte rendu.
  const up = await cab.upload(`/cabinet/dossiers/${dossier.id}/documents`, { title: 'Dossier Projet — version 1', step: '2' }, 'dossier-projet.pdf', '%PDF-1.4 test');
  assert.equal(up.status, 303);
  const doc1 = db().get('SELECT * FROM documents WHERE dossier_id = ? ORDER BY id DESC', dossier.id);
  assert.equal(doc1.shared, 0);
  assert.equal((await client.get(`/documents/${doc1.id}/telecharger`)).status, 404, 'document privé non accessible');
  const badUpload = await cab.upload(`/cabinet/dossiers/${dossier.id}/documents`, { title: 'Script', step: '2' }, 'evil.exe', 'MZ');
  assert.match(badUpload.location, /erreur-fichier/);
  await cab.upload(`/cabinet/dossiers/${dossier.id}/documents`, { title: 'Devis A', step: '3' }, 'devis-a.pdf', '%PDF A');
  await cab.upload(`/cabinet/dossiers/${dossier.id}/documents`, { title: 'Devis B', step: '3' }, 'devis-b.pdf', '%PDF B');
  const [devisA, devisB] = db().all("SELECT * FROM documents WHERE dossier_id = ? AND title LIKE 'Devis%' ORDER BY id", dossier.id);
  await cab.post(`/cabinet/dossiers/${dossier.id}/notes`, { kind: 'note', title: 'Note secrète', body: 'Interne uniquement', step: 1 });
  await cab.post(`/cabinet/dossiers/${dossier.id}/notes`, { kind: 'compte_rendu', title: 'Compte rendu de cadrage', body: 'Objectifs validés.', step: 1, publish: '1' });
  const docsPage = await client.get(`/espace/dossiers/${dossier.id}/documents`);
  assert.match(docsPage.text, /Compte rendu de cadrage/);
  assert.doesNotMatch(docsPage.text, /Note secrète/);

  // 5. Soumission d'une version du dossier pour validation.
  const providers = db().all('SELECT id FROM providers ORDER BY id');
  const sub = await cab.post(`/cabinet/dossiers/${dossier.id}/validations`, {
    action: 'Transmettre le dossier projet pour devis.', provider_id: providers[0].id, doc_ids: [doc1.id],
  });
  assert.equal(sub.status, 303);
  const v1 = db().get('SELECT * FROM validations WHERE dossier_id = ? ORDER BY id DESC', dossier.id);
  assert.equal(v1.status, 'en_attente');
  assert.equal(v1.dossier_version, 1);
  assert.equal(db().get('SELECT shared FROM documents WHERE id = ?', doc1.id).shared, 1, 'pièce partagée pour consultation');
  // Transmission impossible avant validation.
  const early = await cab.post(`/cabinet/dossiers/${dossier.id}/validations/${v1.id}/transmission`, { note: 'trop tôt' });
  assert.match(early.location, /erreur-statut/);

  const decPage = await client.get(`/espace/dossiers/${dossier.id}/decisions/${v1.id}`);
  assert.match(decPage.text, /Action proposée/);
  assert.match(decPage.text, /Destinataire/);
  assert.match(decPage.text, /Version 1/);
  assert.match(decPage.text, /Dossier Projet — version 1/);
  assert.match(decPage.text, /ni commande, ni paiement, ni signature de devis/);
  // Demande de modification sans commentaire refusée.
  assert.equal((await client.post(`/espace/dossiers/${dossier.id}/decisions/${v1.id}`, { decision: 'modification', version: 1 })).status, 422);
  await client.post(`/espace/dossiers/${dossier.id}/decisions/${v1.id}`, { decision: 'modification', comment: 'Merci d’ajouter la feuille de route.', version: 1 });
  const v1b = db().get('SELECT * FROM validations WHERE id = ?', v1.id);
  assert.equal(v1b.status, 'modification');
  assert.ok(v1b.decided_by && v1b.decided_at);

  // 6. Le cabinet modifie les pièces → nouvelle validation obligatoire.
  await cab.post(`/cabinet/dossiers/${dossier.id}/version`);
  const mod = await cab.post(`/cabinet/dossiers/${dossier.id}/validations/${v1.id}/modifier`, {
    action: 'Transmettre le dossier projet (version 2) et le devis A pour actualisation.', provider_id: providers[0].id, doc_ids: [doc1.id, devisA.id],
  });
  assert.equal(mod.status, 303);
  const v2 = db().get('SELECT * FROM validations WHERE replaces = ?', v1.id);
  assert.equal(db().get('SELECT status FROM validations WHERE id = ?', v1.id).status, 'remplacee');
  assert.equal(v2.status, 'en_attente');
  assert.equal(v2.dossier_version, 2);
  await client.post(`/espace/dossiers/${dossier.id}/decisions/${v2.id}`, { decision: 'valide', version: 2 });
  assert.equal(db().get('SELECT status FROM validations WHERE id = ?', v2.id).status, 'valide');
  // Double décision impossible.
  await client.post(`/espace/dossiers/${dossier.id}/decisions/${v2.id}`, { decision: 'refuse', comment: 'non', version: 2 });
  assert.equal(db().get('SELECT status FROM validations WHERE id = ?', v2.id).status, 'valide');

  // Changement de destinataire après validation → nouvelle validation.
  const mod2 = await cab.post(`/cabinet/dossiers/${dossier.id}/validations/${v2.id}/modifier`, {
    action: 'Transmettre le dossier projet (version 2) et le devis A pour actualisation.', provider_id: providers[1].id, doc_ids: [doc1.id, devisA.id],
  });
  assert.equal(mod2.status, 303);
  const v3 = db().get('SELECT * FROM validations WHERE replaces = ?', v2.id);
  assert.equal(v3.status, 'en_attente');
  assert.equal(db().get('SELECT status FROM validations WHERE id = ?', v2.id).status, 'remplacee');
  await client.post(`/espace/dossiers/${dossier.id}/decisions/${v3.id}`, { decision: 'valide', version: 2 });

  // 7. Transmission consignée par le cabinet.
  const tr = await cab.post(`/cabinet/dossiers/${dossier.id}/validations/${v3.id}/transmission`, { note: 'Envoi par messagerie sécurisée.' });
  assert.match(tr.location, /ok=transmission/);
  assert.ok(db().get('SELECT transmitted_at FROM validations WHERE id = ?', v3.id).transmitted_at);
  const hist = db().all('SELECT action FROM history WHERE dossier_id = ? AND visible_client = 1', dossier.id).map((h) => h.action).join('\n');
  assert.match(hist, /Décision de Paul Fictif : Validé/);
  assert.match(hist, /Transmission effectuée par le cabinet/);

  // 8. Comparatif de deux propositions.
  await cab.post(`/cabinet/dossiers/${dossier.id}/propositions`, { provider_id: providers[0].id, scope: 'Audit organisationnel des déplacements', amount: '4 200 € HT', delays: '2 semaines', guarantees: 'Engagement de confidentialité', document_id: devisA.id, clarifications: 'Préciser le nombre de jours.', analysis: 'Périmètre complet.' });
  await cab.post(`/cabinet/dossiers/${dossier.id}/propositions`, { provider_id: providers[3].id, scope: 'Accompagnement ponctuel', amount: '3 100 € HT', delays: '1 mois', guarantees: '—', document_id: devisB.id, clarifications: 'Disponibilités ?', analysis: 'Moins complet.' });
  let compare = await client.get(`/espace/dossiers/${dossier.id}/projet`);
  assert.doesNotMatch(compare.text, /4 200 € HT/, 'propositions privées tant que non partagées');
  for (const p of db().all('SELECT id FROM proposals WHERE dossier_id = ?', dossier.id)) {
    await cab.post(`/cabinet/dossiers/${dossier.id}/propositions/${p.id}/partage`, { shared: '1' });
  }
  compare = await client.get(`/espace/dossiers/${dossier.id}/projet`);
  assert.match(compare.text, /4 200 € HT/);
  assert.match(compare.text, /3 100 € HT/);
  assert.match(compare.text, /Informations fournies par le prestataire/);
  assert.match(compare.text, /Analyse NOAMIS/);
  assert.equal((await client.get(`/documents/${devisB.id}/telecharger`)).status, 200, 'devis partagé avec la proposition');

  // 9. Messages et clôture.
  await client.post(`/espace/dossiers/${dossier.id}/messages`, { body: 'Merci pour le comparatif.' });
  assert.match((await cab.get(`/cabinet/dossiers/${dossier.id}?onglet=messages`)).text, /Merci pour le comparatif/);
  const close = await cab.post(`/cabinet/dossiers/${dossier.id}/cloture`, { closure_summary: 'Mission terminée : prestataire choisi par le client.' });
  assert.match(close.location, /dossier-clos/);
  const closed = db().get('SELECT * FROM dossiers WHERE id = ?', dossier.id);
  assert.equal(closed.status, 'clos');
  const final = await client.get(`/espace/dossiers/${dossier.id}`);
  assert.match(final.text, /Dossier clôturé/);
  assert.match((await client.get(`/espace/dossiers/${dossier.id}/projet`)).text, /prestataire choisi par le client/);

  // Le nouveau client ne voit pas le dossier du client de démonstration.
  const demoDossier = db().get('SELECT d.id FROM dossiers d JOIN users u ON u.id = d.client_id WHERE u.email = ?', DEMO.client.email);
  assert.equal((await client.get(`/espace/dossiers/${demoDossier.id}`)).status, 404);

  // Notifications génériques, sans détail sensible.
  const notifs = db().all('SELECT text FROM notifications WHERE user_id = (SELECT id FROM users WHERE email = ?)', 'paul.fictif@exemple-client.example');
  assert.ok(notifs.length > 0);
  for (const n of notifs) assert.match(n.text, /^Une (mise à jour|décision) est (disponible|attendue) dans votre dossier\.$/);
});
