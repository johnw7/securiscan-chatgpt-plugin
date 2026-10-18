// Rendu image par image de film.html.
//   node render.cjs promo <916|45> video <out.mp4> [fps]  |  node render.cjs promo <916|45> stills <dir> t1 t2…
//   node render.cjs promo <916|45> video <out.mp4> [fps]  |  node render.cjs promo <916|45> stills <dir> t1 t2…
// Nécessite un serveur HTTP à la racine du dépôt : python3 -m http.server 8765
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');

const [cut, aspect, mode, out, ...rest] = process.argv.slice(2);
const W = 1080, H = aspect === '45' ? 1350 : 1920;
const URL = 'http://127.0.0.1:8765/campagnes/boost_rush/' + (process.env.PAGE || 'promo.html');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto(URL);
  const dur = await page.evaluate(([c, a]) => window.init(a), [cut, aspect]);
  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true });
    for (const t of rest) {
      await page.evaluate(x => window.render(x), +t);
      await page.screenshot({ path: `${out}/${cut}_${aspect}_${String(t).padStart(5, '0')}.png` });
    }
  } else {
    const fps = +(rest[0] || 30);
    const n = Math.round(dur * fps);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < n; i++) {
      await page.evaluate(x => window.render(x), i / fps);
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 300 === 0) console.log(`${cut} ${aspect} ${i}/${n}`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
  }
  await browser.close();
})();
