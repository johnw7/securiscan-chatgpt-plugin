// Rend chaque SVG de out/ en PNG (×2) et compose une planche de présentation : NODE_PATH=$(npm root -g) node rendu.cjs
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 2 });
  for (const f of fs.readdirSync(__dirname + '/out').filter(f => f.endsWith('.svg'))) {
    const s = fs.readFileSync(__dirname + '/out/' + f, 'utf8'); const m = s.match(/viewBox="0 0 (\d+) (\d+)"/);
    await p.setViewportSize({ width: +m[1], height: +m[2] });
    await p.setContent(`<html><body style="margin:0;background:transparent">${s}</body></html>`);
    await p.screenshot({ path: __dirname + '/out/' + f.replace('.svg', '.png'), omitBackground: true, clip: { x: 0, y: 0, width: +m[1], height: +m[2] } });
  }
  console.log('png ok'); await b.close();
})();
