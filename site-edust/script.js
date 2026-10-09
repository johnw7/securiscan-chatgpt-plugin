// E-DUST Solutions — interactions du site
const I = (f) => `assets/img/${f}`;

// ---- Réalisations ----
const WORKS = [
  { c: 'visuels', img: 'v-smash-sq.jpg', t: 'Smash Club', s: 'Fast-food' },
  { c: 'avantapres', ba: 'barbier', t: 'Le Barbier du Coin', s: 'Barbier' },
  { c: 'sites', img: 'site-ama-d.jpg', t: 'La Table d’Ama', s: 'Site restaurant' },
  { c: 'visuels', img: 'v-eclat-st.jpg', t: 'Éclat d’Or', s: 'Bijouterie' },
  { c: 'logos', img: 'logo-01-smash.jpg', t: 'Smash Club', s: 'Logo rétro street' },
  { c: 'pitch', img: 'pitch-kalia-1.jpg', t: 'Kalia', s: 'Pitch deck fintech' },
  { c: 'visuels', img: 'v-napoli-sq.jpg', t: 'Napoli Express', s: 'Pizzeria' },
  { c: 'visuels', img: 'v-nova-st.jpg', t: 'Nøva Tech', s: 'High-tech' },
  { c: 'avantapres', ba: 'fournil', t: 'Maison Fournil', s: 'Boulangerie' },
  { c: 'logos', img: 'logo-02-eclat.jpg', t: 'Éclat d’Or', s: 'Logo luxe' },
  { c: 'sites', img: 'site-smash-d.jpg', t: 'Smash Club', s: 'Commande en ligne' },
  { c: 'visuels', img: 'v-sable-st.jpg', t: 'Maison Sable', s: 'Mode' },
  { c: 'pitch', img: 'pitch-solaria-1.jpg', t: 'Solaria', s: 'Pitch deck énergie' },
  { c: 'visuels', img: 'v-crispy-sq.jpg', t: 'Crispy Chick', s: 'Poulet frit' },
  { c: 'logos', img: 'logo-06-barbier.jpg', t: 'Le Barbier du Coin', s: 'Badge vintage' },
  { c: 'visuels', img: 'v-batisseurs-st.jpg', t: 'Bâtisseurs du Sud', s: 'BTP' },
  { c: 'avantapres', ba: 'petale', t: 'Pétale & Co', s: 'Fleuriste' },
  { c: 'sites', img: 'site-volt-d.jpg', t: 'Volt & Co', s: 'Site artisan' },
  { c: 'visuels', img: 'v-ama-st.jpg', t: 'La Table d’Ama', s: 'Restaurant' },
  { c: 'logos', img: 'logo-04-nova.jpg', t: 'Nøva Tech', s: 'Logo futuriste' },
  { c: 'pitch', img: 'pitch-vitalis-1.jpg', t: 'Vitalis', s: 'Pitch deck santé' },
  { c: 'visuels', img: 'v-taco-sq.jpg', t: 'Taco Loco', s: 'Tacos' },
  { c: 'visuels', img: 'v-aqua-st.jpg', t: 'Aqua Fix', s: 'Plomberie' },
  { c: 'avantapres', ba: 'garage', t: 'Garage Mécapro', s: 'Garage' },
  { c: 'logos', img: 'logo-07-fournil.jpg', t: 'Maison Fournil', s: 'Logo artisanal' },
  { c: 'sites', img: 'site-sable-d.jpg', t: 'Maison Sable', s: 'Boutique en ligne' },
  { c: 'visuels', img: 'v-eclat-sq.jpg', t: 'Éclat d’Or', s: 'Bijouterie' },
  { c: 'pitch', img: 'pitch-agrivia-1.jpg', t: 'Agrivia', s: 'Pitch deck agritech' },
  { c: 'visuels', img: 'v-chaleur-st.jpg', t: 'Chaleur Nord', s: 'Chauffage' },
  { c: 'logos', img: 'logo-12-ama.jpg', t: 'La Table d’Ama', s: 'Logo raffiné' },
  { c: 'avantapres', ba: 'lumiere', t: 'Studio Lumière', s: 'Institut de beauté' },
  { c: 'visuels', img: 'v-nova-sq.jpg', t: 'Nøva Tech', s: 'High-tech' },
  { c: 'sites', img: 'site-lumiere-d.jpg', t: 'Studio Lumière', s: 'Réservation de soins' },
  { c: 'visuels', img: 'v-verdure-st.jpg', t: 'Verdure & Sens', s: 'Paysagiste' },
  { c: 'logos', img: 'logo-11-volt.jpg', t: 'Volt & Co', s: 'Logo industriel' },
  { c: 'pitch', img: 'pitch-studia-1.jpg', t: 'Studia', s: 'Pitch deck edtech' },
  { c: 'visuels', img: 'v-clair-st.jpg', t: 'Clair Net', s: 'Nettoyage' },
  { c: 'avantapres', ba: 'truck', t: 'Le Camion Gourmand', s: 'Food truck' },
  { c: 'logos', img: 'logo-09-lumiere.jpg', t: 'Studio Lumière', s: 'Logo doux' },
  { c: 'visuels', img: 'v-volt-st.jpg', t: 'Volt & Co', s: 'Électricien' },
  { c: 'logos', img: 'logo-08-verdure.jpg', t: 'Verdure & Sens', s: 'Logo organique' },
  { c: 'pitch', img: 'pitch-rideo-1.jpg', t: 'Rideo', s: 'Pitch deck mobilité' },
  { c: 'visuels', img: 'v-batisseurs-sq.jpg', t: 'Bâtisseurs du Sud', s: 'BTP' },
  { c: 'logos', img: 'logo-05-btp.jpg', t: 'Bâtisseurs du Sud', s: 'Logo robuste' },
  { c: 'logos', img: 'logo-10-aqua.jpg', t: 'Aqua Fix', s: 'Logo sympathique' },
  { c: 'logos', img: 'logo-03-sable.jpg', t: 'Maison Sable', s: 'Logo minimal' },
];

const gallery = document.getElementById('gallery');
const card = (w) => {
  const cap = `<figcaption><b>${w.t}</b><span>${w.s}</span></figcaption>`;
  if (w.ba) return `<figure class="it" data-c="${w.c}"><div class="cmp" style="--p:50%">
      <img src="${I(`ba-${w.ba}-avant.jpg`)}" alt="${w.t}, avant" loading="lazy">
      <img class="cmp__after" src="${I(`ba-${w.ba}-apres.jpg`)}" alt="${w.t}, après" loading="lazy">
      <span class="cmp__tag cmp__tag--a">AVANT</span><span class="cmp__tag cmp__tag--b">APRÈS</span><div class="cmp__bar"></div>
      <input type="range" min="0" max="100" value="50" aria-label="Comparer avant et après : ${w.t}"></div>${cap}</figure>`;
  return `<figure class="it" data-c="${w.c}"><img src="${I(w.img)}" alt="${w.t} : ${w.s}" loading="lazy" data-lb>${cap}</figure>`;
};
const more = document.getElementById('more');
function show(f, all = false) {
  const list = WORKS.filter((w) => f === 'all' || w.c === f);
  const cut = f === 'all' && !all ? 16 : list.length;
  gallery.innerHTML = list.slice(0, cut).map(card).join('');
  more.hidden = cut >= list.length;
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('is-on', t.dataset.f === f));
}
show('all');
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => show(t.dataset.f)));
more.addEventListener('click', () => show('all', true));
document.querySelectorAll('[data-go]').forEach((a) => a.addEventListener('click', () => show(a.dataset.go)));

// Comparateur avant / après (curseur)
gallery.addEventListener('input', (e) => {
  if (e.target.matches('.cmp input')) e.target.parentElement.style.setProperty('--p', e.target.value + '%');
});

// Visionneuse
const lb = document.getElementById('lb');
gallery.addEventListener('click', (e) => {
  const img = e.target.closest('[data-lb]');
  if (!img) return;
  lb.querySelector('img').src = img.src;
  lb.querySelector('p').textContent = img.alt;
  lb.hidden = false;
});
const closeLb = () => { lb.hidden = true; };
lb.addEventListener('click', (e) => { if (e.target !== lb.querySelector('img')) closeLb(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });

// ---- Vidéos ----
const REELS = [
  ['01-Smash-Club-burger', 'Smash Club', 'Le burger se monte couche par couche'],
  ['03-Avant-Apres', 'Avant / Après', 'Trois commerces transformés'],
  ['04-Eclat-dOr-bijoux', 'Éclat d’Or', 'Défilé de bijoux en vitrine'],
  ['05-Nova-Tech-high-tech', 'Nøva Tech', 'Révélation produit néon'],
  ['06-Maison-Sable-mode', 'Maison Sable', 'Lookbook éditorial'],
  ['07-Batisseurs-du-Sud-chantier', 'Bâtisseurs du Sud', 'Du plan à la maison'],
  ['02-Fast-food-4-enseignes', 'Fast-food', 'Quatre enseignes, quatre univers'],
  ['08-Sites-web-mobile', 'Sites web', 'Vos pages, comme sur mobile'],
];
const reels = document.getElementById('reels');
reels.innerHTML = REELS.map(([f, t, s]) => `<div class="reel"><div class="reel__ph">
  <img src="assets/video/${f}.jpg" alt="${t}" loading="lazy"><button class="reel__play" data-v="${f}" aria-label="Lire la vidéo ${t}"></button></div>
  <h3>${t}</h3><p>${s}</p></div>`).join('');
reels.addEventListener('click', (e) => {
  const b = e.target.closest('.reel__play');
  if (!b) return;
  reels.querySelectorAll('video').forEach((v) => v.pause());
  const ph = b.parentElement;
  ph.innerHTML = `<video src="assets/video/${b.dataset.v}.mp4" poster="assets/video/${b.dataset.v}.jpg" controls autoplay playsinline></video>`;
});

// ---- Menu mobile ----
const burger = document.querySelector('.burger'), menu = document.getElementById('menu');
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', open);
});
menu.addEventListener('click', (e) => { if (e.target.closest('a')) { menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', false); } });

// ---- Formulaire → WhatsApp ----
document.getElementById('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const d = new FormData(e.target);
  const txt = `Bonjour E-DUST Solutions, je suis ${d.get('nom')}${d.get('activite') ? ` (${d.get('activite')})` : ''}.\n` +
    `Je suis intéressé(e) par : ${d.get('service')}.\n${d.get('message') || ''}`;
  window.open('https://wa.me/33613249680?text=' + encodeURIComponent(txt.trim()), '_blank', 'noopener');
});

// ---- Apparition au défilement ----
const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } }), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
document.getElementById('y').textContent = new Date().getFullYear();
