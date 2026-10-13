import { chromium } from 'playwright-core';
const [D, OUT] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.SHELLBIN });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('requestfailed', (r) => errs.push('failed ' + r.url()));
await p.goto('file://' + D + '/portfolio.built.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
const pages = await p.locator('section.page').count();
// contrôle de débordement : éléments qui sortent de leur page
const overflow = await p.evaluate(() => [...document.querySelectorAll('section.page')].map((s, i) => {
  const r = s.getBoundingClientRect(); let bad = 0;
  s.querySelectorAll('h1,h2,h3,p,li,.card').forEach((e) => { const q = e.getBoundingClientRect(); if (q.bottom > r.bottom - 30 && q.height > 0 && !e.closest('.foot')) bad++; });
  return bad ? `page ${i + 1}: ${bad}` : null; }).filter(Boolean));
for (let i = 0; i < pages; i++) await p.locator('section.page').nth(i).screenshot({ path: `${D}/prev-${String(i + 1).padStart(2, '0')}.jpg`, quality: 70, type: 'jpeg' });
await p.pdf({ path: OUT, width: '1600px', height: '1000px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
console.log('pages', pages, 'débordements', overflow, 'erreurs', errs);
await b.close();
