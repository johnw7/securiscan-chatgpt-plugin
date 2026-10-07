#!/usr/bin/env node
/**
 * Export de la vidéo de prévention en MP4 (H.264 + bande-son AAC) image par image, + sous-titres SRT.
 *
 * Prérequis : l'application lancée (npm run build && npm start), ffmpeg et Playwright
 * (npm i -D playwright, ou un Playwright global).
 *
 *   node scripts/render-prevention-video.mjs [--url http://localhost:3000] [--format 9x16|4x5|all]
 *                                            [--fps 30] [--out public/videos/prevention] [--no-subtitles]
 *
 * Le rendu est déterministe : la page /prevention?capture=1 expose window.__prevention.setTime(t).
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1]?.startsWith("--") || all[i + 1] === undefined ? "true" : all[i + 1]]);
    return acc;
  }, []),
);
const url = args.url ?? "http://localhost:3000";
const fps = Number(args.fps ?? 30);
const out = args.out ?? "public/videos/prevention";
const formats = (args.format ?? "all") === "all" ? ["9x16", "4x5"] : [args.format];
const subtitles = args["no-subtitles"] !== "true";
const SIZES = { "9x16": [1080, 1920], "4x5": [1080, 1350] };

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("Playwright introuvable : npm i -D playwright (ou npx playwright install chromium).");
  process.exit(1);
}

await mkdir(out, { recursive: true });
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);

for (const format of formats) {
  const [w, h] = SIZES[format];
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on("pageerror", (e) => console.error("[page]", e.message));
  await page.goto(`${url}/prevention?capture=1&format=${format}${subtitles ? "" : "&cc=0"}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__prevention);
  await page.evaluate(() => window.__prevention.ready);
  await page.evaluate(() => document.fonts.ready);
  const duration = await page.evaluate(() => window.__prevention.duration);

  const file = path.join(out, `prevention-chemin-ecole-${format}.mp4`);
  const ffmpeg = spawn(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
      "-i", "public/audio/prevention/bande-son.m4a", "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "160k", "-shortest",
      "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", file],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const done = new Promise((resolve, reject) => ffmpeg.on("close", (c) => (c === 0 ? resolve() : reject(new Error(`ffmpeg ${c}`)))));

  const frames = Math.round(duration * fps);
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.__prevention.setTime(t), i / fps);
    const img = await page.screenshot({ type: "jpeg", quality: 92 });
    if (!ffmpeg.stdin.write(img)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
    if (i % fps === 0) process.stdout.write(`\r${format} : ${Math.round((i / frames) * 100)} %`);
  }
  ffmpeg.stdin.end();
  await done;
  await page.close();
  console.log(`\r${format} : ${file}`);
}

// Sous-titres (identiques pour les deux formats), générés depuis la timeline du lecteur.
const page = await browser.newPage();
await page.goto(`${url}/prevention?capture=1`, { waitUntil: "networkidle" });
const srt = await page.evaluate(() => window.__prevention.srt);
await writeFile(path.join(out, "prevention-chemin-ecole.fr.srt"), srt, "utf8");
await browser.close();
console.log("Sous-titres : prevention-chemin-ecole.fr.srt");
