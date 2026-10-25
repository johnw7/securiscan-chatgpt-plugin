// Exporte chaque .slide d'une page en PNG nommé d'après son id : NODE_PATH=$(npm root -g) node render.cjs <page.html> <dossier sortie>
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const [pg, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 2000 } });
  await p.goto('http://127.0.0.1:8765/campagnes/portfolio_fictif/mains_artisans/' + pg, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
  const s = await p.$$('.slide');
  for (const e of s) await e.screenshot({ path: path.join(out, (await e.getAttribute('id')) + '.png') });
  console.log('slides', s.length); await b.close();
})();
