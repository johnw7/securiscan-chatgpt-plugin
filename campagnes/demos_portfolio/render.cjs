// Rendu image par image d'une démo.
//   PAGE=burger/burger.html node render.cjs <916|45|169> video <out.mp4> [fps]
//   PAGE=burger/burger.html node render.cjs <916|45> stills <dir> t1 t2 …
// Nécessite un serveur HTTP à la racine du dépôt : python3 -m http.server 8765
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const [aspect, mode, out, ...rest] = process.argv.slice(2);
const W = aspect === '169' ? 1920 : 1080, H = aspect === '45' ? 1350 : aspect === '169' ? 1080 : 1920;
const URL = 'http://127.0.0.1:8765/campagnes/demos_portfolio/' + process.env.PAGE;
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto(URL);
  const dur = await page.evaluate(a => window.init(a), aspect);
  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true });
    const tag = process.env.PAGE.split('/')[0];
    for (const t of rest) {
      await page.evaluate(x => window.render(x), +t);
      await page.screenshot({ path: `${out}/${tag}_${aspect}_${String(t).padStart(5, '0')}.png` });
    }
  } else {
    const fps = +(rest[0] || 30), n = Math.round(dur * fps);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < n; i++) {
      await page.evaluate(x => window.render(x), i / fps);
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    console.log('done', n);
  }
  await browser.close();
})();
