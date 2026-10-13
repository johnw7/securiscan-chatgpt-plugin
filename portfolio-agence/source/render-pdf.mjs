// Génère le PDF du portfolio agence : node render-pdf.mjs <dossier source> <fichier pdf>
// Nécessite playwright-core et un Chromium (chemin dans SHELLBIN).
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';
const [D, OUT] = process.argv.slice(2);
const stamps = Array.from({ length: 10 }, (_, i) => `<span style="aspect-ratio:1; border-radius:50%; border:2px dashed #17110e; display:grid; place-items:center; ${i < 6 ? 'background:#ffc22b;' : ''} font-size:20px">${i < 6 ? '🍔' : ''}</span>`).join('');
const html = readFileSync(`${D}/portfolio-agence.html`, 'utf8').replace('%%STAMPS%%', stamps);
writeFileSync(`${D}/.built.html`, html);
const b = await chromium.launch({ executablePath: process.env.SHELLBIN });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('requestfailed', (r) => errs.push('failed ' + r.url()));
await p.goto('file://' + D + '/.built.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
const n = await p.locator('section.page').count();
const overflow = await p.evaluate(() => [...document.querySelectorAll('section.page')].map((s, i) => {
  const r = s.getBoundingClientRect(); let bad = 0;
  s.querySelectorAll('h1,h2,h3,p,li,.card,.shot,.phone').forEach((e) => { const q = e.getBoundingClientRect(); if (q.height > 0 && !e.closest('.foot') && (q.bottom > r.bottom - 20)) bad++; });
  return bad ? `page ${i + 1}: ${bad}` : null; }).filter(Boolean));
if (process.env.PREVIEW) for (let i = 0; i < n; i++) await p.locator('section.page').nth(i).screenshot({ path: `${process.env.PREVIEW}/ag-${String(i + 1).padStart(2, '0')}.jpg`, quality: 75, type: 'jpeg' });
await p.pdf({ path: OUT, width: '1600px', height: '1000px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
console.log('pages', n, 'débordements', overflow, 'erreurs', errs);
await b.close();
