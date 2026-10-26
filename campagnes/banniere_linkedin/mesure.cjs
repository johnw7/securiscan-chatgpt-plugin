// Mesure la fin de « Votre marque mérite plus qu'un » et la largeur de « packshot. » (en px, repère de la section) → mesure.json
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1700, height: 1000 } });
  await p.goto('http://127.0.0.1:8765/campagnes/banniere_linkedin/banniere_correction.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
  const m = await p.evaluate(() => {
    const r = {};
    for (const n of ['profil', 'entreprise']) {
      const sec = document.getElementById(n).getBoundingClientRect();
      const mes = el => { const g = document.createRange(); g.selectNodeContents(el); return g.getBoundingClientRect(); };
      const d = mes(document.getElementById(n + '_debut')), k = mes(document.getElementById(n + '_pk'));
      r[n] = { fin: d.right - sec.left, pk_w: k.width };
    }
    return r;
  });
  fs.writeFileSync(__dirname + '/mesure.json', JSON.stringify(m)); console.log(m); await b.close();
})();
