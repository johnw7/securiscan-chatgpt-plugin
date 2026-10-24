// Exporte chaque slide de posts.html / stories.html en PNG : NODE_PATH=$(npm root -g) node render_slides.cjs <dossier sortie>
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +(process.env.VW || 1200), height: +(process.env.VH || 1400) } });
  await p.goto('http://127.0.0.1:8765/campagnes/portfolio_fictif/stories_secteurs/' + process.argv[3] + '', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
  const s = await p.$$('.slide');
  for (let i = 0; i < s.length; i++) await s[i].screenshot({ path: path.join(out, `${process.argv[3].replace('.html','')}_${String(i + 1).padStart(2, '0')}.png`) });
  console.log('slides', s.length); await b.close();
})();
