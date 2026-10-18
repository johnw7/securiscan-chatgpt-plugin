// Outils partagés par les démos (rendu image par image : window.render(t))
const Q = s => document.querySelector(s), QA = s => [...document.querySelectorAll(s)];
const cl = x => Math.max(0, Math.min(1, x)), seg = (t, a, b) => cl((t - a) / (b - a)), mix = (a, b, p) => a + (b - a) * p;
const eo = x => 1 - Math.pow(1 - x, 3), eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eb = x => { const c1 = 2.2, c3 = c1 + 1; return x <= 0 ? 0 : x >= 1 ? 1 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const bounce = x => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + .75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + .9375; return n * (x -= 2.625 / d) * x + .984375; };
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
// opacité d'une fenêtre [a, b] avec fondus
function win(t, a, b, fi = .1, fo = .1) { return Math.min(fi ? seg(t, a, a + fi) : (t >= a ? 1 : 0), fo ? 1 - seg(t, b - fo, b) : (t < b ? 1 : 0)); }
// arrivée « frappée » : grande échelle -> 1
function slam(t, t0, from = 1.8, d = .26) { const p = seg(t, t0, t0 + d); return { o: t < t0 ? 0 : cl(p * 3), s: from + (1 - from) * eo(p) }; }
function set(el, o, tr) { el.style.opacity = o; if (tr !== undefined) el.style.transform = tr; }
// tremblement de caméra à partir d'une liste d'impacts [temps, intensité]
function shake(t, imp) { let s = 0; for (const [a, k] of imp) { const d = t - a; if (d >= 0 && d < .35) s += k * Math.exp(-d * 14); } return s; }
let U = 10, W = 0, H = 0, R45 = false;
function measure() { W = innerWidth; H = innerHeight; U = Math.min(W / 100, H * .7 / 100); }
async function init(aspect) {
  R45 = aspect === '45'; document.body.classList.toggle('r45', R45);
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; })));
  return window.DUR;
}
window.init = init;
