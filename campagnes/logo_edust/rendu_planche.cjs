// Rend les 5 pages de planche.html en PNG (out/planche_pXX.png) : NODE_PATH=$(npm root -g) node rendu_planche.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2000, height: 1200 } });
  await p.goto('file://' + __dirname + '/planche.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500);
  for (const e of await p.$$('.slide')) await e.screenshot({ path: __dirname + '/out/' + (await e.getAttribute('id')) + '.png' });
  console.log('ok'); await b.close();
})();
