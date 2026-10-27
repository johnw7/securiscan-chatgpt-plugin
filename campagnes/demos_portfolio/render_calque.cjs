// Rend le calque animé d'une page (fond transparent) et le superpose à une vidéo de base, en une passe :
//   PAGE=integration/video.html node render_calque.cjs <169|916> <base.mp4> <sortie.mp4> [fps]
// En 916, la base 16:9 est placée en bande (1080×608 à y=640) sur un fond flou de la même image.
const { chromium } = require('playwright'); const { spawn } = require('child_process');
const [aspect, base, out, fps0] = process.argv.slice(2); const fps = +(fps0 || 25);
const W = aspect === '169' ? 1920 : 1080, H = aspect === '169' ? 1080 : 1920;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:8765/campagnes/demos_portfolio/' + process.env.PAGE);
  const dur = await p.evaluate(a => window.init(a), aspect + 'o'), n = Math.round(dur * fps);
  const fond = aspect === '169' ? '[0:v]format=yuv420p[b]'
    : '[0:v]split[a][c];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=28:2,eq=brightness=-0.08[f];[c]scale=1080:608[g];[f][g]overlay=0:640,format=yuv420p[b]';
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-i', base, '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-filter_complex', fond + ';[b][1:v]overlay=0:0:format=auto,format=yuv420p[v]', '-map', '[v]', '-frames:v', String(n),
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) {
    await p.evaluate(x => window.render(x), i / fps);
    const buf = await p.screenshot({ type: 'png', omitBackground: true });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('done', n); await b.close();
})();
