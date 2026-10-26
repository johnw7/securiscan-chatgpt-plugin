// Rend chaque SVG d'un dossier (out/ par défaut) en PNG (×2) : NODE_PATH=$(npm root -g) node rendu.cjs [out/ref]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const DIR = path.resolve(__dirname, process.argv[2] || 'out'), SC = +(process.env.SCALE || 2);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: SC });
  for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.svg'))) {
    const s = fs.readFileSync(DIR + '/' + f, 'utf8'); const m = s.match(/viewBox="0 0 (\d+) (\d+)"/);
    await p.setViewportSize({ width: +m[1], height: +m[2] });
    await p.setContent(`<html><body style="margin:0;background:transparent">${s}</body></html>`);
    await p.screenshot({ path: DIR + '/' + f.replace('.svg', '.png'), omitBackground: true, clip: { x: 0, y: 0, width: +m[1], height: +m[2] } });
  }
  console.log('png ok'); await b.close();
})();
