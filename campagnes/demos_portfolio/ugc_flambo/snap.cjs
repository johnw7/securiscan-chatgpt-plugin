// Exporte les visuels « photo » de FLAMBO BURGER (1080 x 1080) pour la conversation UGC.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1080 } });
  for (const v of ['burger', 'menu', 'combo']) {
    await p.goto('http://127.0.0.1:8765/campagnes/demos_portfolio/ugc_flambo/shots.html#' + v); await p.reload();
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.screenshot({ path: `${__dirname}/assets/${v}.jpg`, type: 'jpeg', quality: 92 });
  }
  await b.close();
})();
