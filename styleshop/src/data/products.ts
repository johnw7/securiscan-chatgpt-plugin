import type { Category, ColorOption, Product, Review, Size } from '../types';

/**
 * Visuels générés avec Canva (IA) puis exportés en haute définition dans public/images/.
 * Chaque produit a une photo principale et une vue « détail » recadrée de la même photo.
 * Pour utiliser vos propres photos : remplacez les fichiers ou l'URL dans l'administration.
 * Si une image ne charge pas, <ProductImage> affiche automatiquement un visuel de remplacement.
 */
const img = (slug: string, detail = false) => `/images/products/${slug}${detail ? '-detail' : ''}.jpg`;

export const IMG = {
  hero: '/images/site/hero.jpg',
  tileHomme: '/images/site/tile-homme.jpg',
  tileFemme: '/images/site/tile-femme.jpg',
  catHomme: '/images/site/cat-homme.jpg',
  catFemme: '/images/site/cat-femme.jpg',
  catEnfant: '/images/site/cat-enfant.jpg',
  catAccessoires: '/images/site/cat-accessoires.jpg',
};

const C: Record<string, ColorOption> = {
  blanc: { name: 'Blanc', hex: '#ffffff' },
  noir: { name: 'Noir', hex: '#111111' },
  beige: { name: 'Beige', hex: '#d8c7ad' },
  camel: { name: 'Camel', hex: '#b08654' },
  gris: { name: 'Gris chiné', hex: '#a3a3a0' },
  marine: { name: 'Bleu marine', hex: '#1f2f4d' },
  denim: { name: 'Bleu denim', hex: '#4a6587' },
  kaki: { name: 'Kaki', hex: '#6b6a4b' },
  ecru: { name: 'Écru', hex: '#efe8da' },
  rose: { name: 'Rose poudré', hex: '#e7c4c0' },
  bordeaux: { name: 'Bordeaux', hex: '#6d1f2b' },
  marron: { name: 'Marron', hex: '#5b3a29' },
};

const ADULT: Size[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const KIDS: Size[] = ['XS', 'S', 'M', 'L'];
const UNIQUE: Size[] = ['M'];

const AUTHORS = ['Camille D.', 'Lucas M.', 'Inès B.', 'Hugo P.', 'Sarah K.', 'Thomas R.', 'Léa G.', 'Nathan V.'];
const COMMENTS = [
  'Très belle qualité, la coupe est parfaite.',
  'Taille normalement, je recommande.',
  'Matière agréable, livraison rapide.',
  'Joli rendu, conforme aux photos.',
  'Bon rapport qualité-prix, je recommanderai.',
  'Un peu grand pour moi, j’ai pris une taille en dessous.',
];

/** Avis fictifs, générés de façon déterministe et marqués « démonstration ». */
function demoReviews(seed: number): Review[] {
  return [0, 1, 2].map((i) => {
    const k = (seed * 7 + i * 3) % COMMENTS.length;
    return {
      author: AUTHORS[(seed + i * 5) % AUTHORS.length],
      rating: k === 5 ? 4 : 5 - ((seed + i) % 2),
      comment: COMMENTS[k],
      date: `2026-0${1 + ((seed + i) % 9)}-1${i}`,
      demo: true,
    };
  });
}

interface Seed {
  name: string;
  category: Category;
  type: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  details: string[];
  sizes: Size[];
  colors: ColorOption[];
  images: string[];
  stock: number;
  createdAt: string;
  sold: number;
}

const SEEDS: Seed[] = [
  // ——— FEMME ———
  { name: 'Robe midi fluide', category: 'femme', type: 'Robes', price: 4999, compareAtPrice: 6999, description: 'Robe midi en viscose fluide à la taille ceinturée. Son tombé léger accompagne chaque mouvement, du bureau au dîner.', details: ['100 % viscose', 'Ceinture amovible', 'Lavage à 30 °C'], sizes: ADULT, colors: [C.beige, C.noir], images: [img('robe-midi'), img('robe-midi', true)], stock: 12, createdAt: '2026-10-01', sold: 140 },
  { name: 'Robe d’été imprimée', category: 'femme', type: 'Robes', price: 3999, description: 'Robe courte à bretelles en coton léger, idéale pour les beaux jours.', details: ['100 % coton', 'Bretelles réglables', 'Doublée'], sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: [C.ecru, C.rose], images: [img('robe-ete'), img('robe-ete', true)], stock: 20, createdAt: '2026-09-12', sold: 85 },
  { name: 'Trench classique', category: 'femme', type: 'Vestes & manteaux', price: 11900, description: 'Trench mi-long en gabardine de coton déperlante, double boutonnage et ceinture. Un intemporel du vestiaire.', details: ['Gabardine de coton déperlante', 'Double boutonnage', 'Ceinture et pattes de poignet'], sizes: ADULT, colors: [C.beige, C.noir], images: [img('trench'), img('trench', true)], stock: 8, createdAt: '2026-10-05', sold: 210 },
  { name: 'Manteau en laine', category: 'femme', type: 'Vestes & manteaux', price: 14900, compareAtPrice: 18900, description: 'Manteau droit en laine mélangée, col tailleur et poches passepoilées. Chaud, structuré et élégant.', details: ['60 % laine, 40 % polyester', 'Doublure satinée', 'Nettoyage à sec'], sizes: ADULT, colors: [C.camel, C.gris, C.noir], images: [img('manteau-laine'), img('manteau-laine', true)], stock: 6, createdAt: '2026-10-08', sold: 96 },
  { name: 'Pull col roulé mérinos', category: 'femme', type: 'Pulls & sweats', price: 4500, description: 'Maille côtelée en laine mérinos mélangée, col roulé souple. Chaud sans être épais.', details: ['50 % mérinos', 'Maille côtelée', 'Lavage main'], sizes: ADULT, colors: [C.ecru, C.noir, C.gris], images: [img('pull-col-roule'), img('pull-col-roule', true)], stock: 0, createdAt: '2026-09-28', sold: 175 },
  { name: 'Chemise en satin', category: 'femme', type: 'Hauts', price: 3599, description: 'Chemise fluide au toucher satiné, col classique et boutons nacrés.', details: ['100 % polyester recyclé', 'Coupe ample', 'Lavage à 30 °C'], sizes: ADULT, colors: [C.ecru, C.noir], images: [img('chemise-satin'), img('chemise-satin', true)], stock: 30, createdAt: '2026-08-20', sold: 64 },
  { name: 'Pantalon tailleur large', category: 'femme', type: 'Pantalons', price: 5500, compareAtPrice: 7500, description: 'Pantalon taille haute à pinces, jambe large, tissu fluide infroissable. Élégant et confortable.', details: ['Taille haute', 'Pinces', 'Infroissable'], sizes: ADULT, colors: [C.noir, C.beige], images: [img('pantalon-tailleur'), img('pantalon-tailleur', true)], stock: 20, createdAt: '2026-07-15', sold: 120 },
  { name: 'Jean mom taille haute', category: 'femme', type: 'Jeans', price: 4999, description: 'Jean coupe mom en denim rigide, taille haute et jambe fuselée.', details: ['100 % coton', 'Cinq poches', 'Délavage clair'], sizes: ADULT, colors: [C.denim], images: [img('jean-mom'), img('jean-mom', true)], stock: 25, createdAt: '2026-09-02', sold: 190 },
  { name: 'Ensemble blazer et pantalon', category: 'femme', type: 'Ensembles', price: 12900, description: 'Ensemble deux pièces : blazer droit et pantalon assorti en crêpe de laine.', details: ['Blazer doublé', 'Pantalon à pinces', 'Vendu ensemble'], sizes: ADULT, colors: [C.beige, C.noir], images: [img('ensemble-blazer'), img('ensemble-blazer', true)], stock: 9, createdAt: '2026-10-10', sold: 40 },

  // ——— HOMME ———
  { name: 'T-shirt coton bio', category: 'homme', type: 'T-shirts', price: 1999, description: 'Essentiel en jersey de coton biologique 180 g/m², coupe droite et col rond côtelé.', details: ['100 % coton bio', 'Col rond côtelé', 'Lavage à 30 °C'], sizes: ADULT, colors: [C.blanc, C.noir, C.beige], images: [img('tshirt-coton-bio'), img('tshirt-coton-bio', true)], stock: 42, createdAt: '2026-10-02', sold: 420 },
  { name: 'T-shirt oversize', category: 'homme', type: 'T-shirts', price: 2499, compareAtPrice: 2999, description: 'T-shirt coupe ample en coton épais, épaules tombantes.', details: ['Coton 220 g/m²', 'Coupe oversize', 'Lavage à 30 °C'], sizes: ADULT, colors: [C.noir, C.blanc, C.kaki], images: [img('tshirt-oversize'), img('tshirt-oversize', true)], stock: 35, createdAt: '2026-08-10', sold: 260 },
  { name: 'Jean slim brut', category: 'homme', type: 'Jeans', price: 5999, description: 'Denim stretch, coupe slim et cinq poches. Délavage brut qui se patine au fil du temps.', details: ['98 % coton, 2 % élasthanne', 'Coupe slim', 'Cinq poches'], sizes: ADULT, colors: [C.denim, C.noir], images: [img('jean-slim'), img('jean-slim', true)], stock: 30, createdAt: '2026-06-20', sold: 310 },
  { name: 'Veste en jean', category: 'homme', type: 'Vestes & manteaux', price: 6999, compareAtPrice: 8999, description: 'Veste trucker en denim épais, boutons métal et deux poches poitrine.', details: ['100 % coton', 'Boutons métal', 'Coupe droite'], sizes: ADULT, colors: [C.denim], images: [img('veste-jean'), img('veste-jean', true)], stock: 18, createdAt: '2026-07-01', sold: 150 },
  { name: 'Blouson en cuir', category: 'homme', type: 'Vestes & manteaux', price: 19900, description: 'Blouson biker en cuir d’agneau souple, fermetures zippées asymétriques.', details: ['Cuir d’agneau', 'Doublure coton', 'Zips métal'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: [C.noir, C.marron], images: [img('blouson-cuir'), img('blouson-cuir', true)], stock: 5, createdAt: '2026-10-06', sold: 70 },
  { name: 'Sweat à capuche', category: 'homme', type: 'Pulls & sweats', price: 4499, description: 'Molleton gratté épais, capuche doublée et poche kangourou.', details: ['80 % coton, 20 % polyester', 'Poche kangourou', 'Bords côtes'], sizes: ADULT, colors: [C.noir, C.gris, C.ecru], images: [img('sweat-capuche'), img('sweat-capuche', true)], stock: 40, createdAt: '2026-09-18', sold: 280 },
  { name: 'Chino slim', category: 'homme', type: 'Pantalons', price: 4999, description: 'Pantalon chino en sergé de coton stretch, coupe slim.', details: ['97 % coton', 'Coupe slim', 'Poches italiennes'], sizes: ADULT, colors: [C.beige, C.marine, C.kaki], images: [img('chino'), img('chino', true)], stock: 22, createdAt: '2026-05-30', sold: 165 },
  { name: 'Costume deux pièces', category: 'homme', type: 'Ensembles', price: 22900, compareAtPrice: 27900, description: 'Costume ajusté en laine mélangée : veste deux boutons et pantalon assorti.', details: ['Laine mélangée', 'Veste doublée', 'Ourlet à faire'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: [C.marine, C.gris], images: [img('costume'), img('costume', true)], stock: 7, createdAt: '2026-10-09', sold: 55 },
  { name: 'Chemise en lin', category: 'homme', type: 'Chemises', price: 3999, description: 'Chemise en lin lavé, col boutonné, idéale par temps chaud.', details: ['100 % lin', 'Coupe droite', 'Lavage à 30 °C'], sizes: ADULT, colors: [C.blanc, C.beige], images: [img('chemise-lin'), img('chemise-lin', true)], stock: 26, createdAt: '2026-10-11', sold: 90 },

  // ——— ENFANT ———
  { name: 'Sweat à capuche enfant', category: 'enfant', type: 'Pulls & sweats', price: 2999, compareAtPrice: 3999, description: 'Molleton tout doux, capuche doublée et poche kangourou. Conçu pour bouger.', details: ['Coton majoritaire', 'Poche kangourou', 'Du 4 au 14 ans'], sizes: KIDS, colors: [C.gris, C.marine], images: [img('sweat-enfant'), img('sweat-enfant', true)], stock: 25, createdAt: '2026-08-25', sold: 130 },
  { name: 'Ensemble jogging enfant', category: 'enfant', type: 'Ensembles', price: 3499, description: 'Sweat zippé et pantalon assortis en molleton léger, bords côtes aux poignets et chevilles.', details: ['Molleton léger', 'Vendu ensemble', 'Du 4 au 14 ans'], sizes: KIDS, colors: [C.marine, C.gris], images: [img('jogging-enfant'), img('jogging-enfant', true)], stock: 15, createdAt: '2026-10-04', sold: 60 },
  { name: 'T-shirt enfant rayé', category: 'enfant', type: 'T-shirts', price: 1299, description: 'T-shirt marinière en coton bio, manches courtes.', details: ['100 % coton bio', 'Col rond', 'Du 4 au 14 ans'], sizes: KIDS, colors: [C.blanc, C.marine], images: [img('tshirt-raye-enfant'), img('tshirt-raye-enfant', true)], stock: 50, createdAt: '2026-07-22', sold: 145 },
  { name: 'Jean enfant regular', category: 'enfant', type: 'Jeans', price: 2799, description: 'Jean coupe droite avec taille réglable à l’intérieur.', details: ['Taille réglable', 'Denim résistant', 'Du 4 au 14 ans'], sizes: KIDS, colors: [C.denim], images: [img('jean-enfant'), img('jean-enfant', true)], stock: 32, createdAt: '2026-06-05', sold: 110 },
  { name: 'Doudoune enfant', category: 'enfant', type: 'Vestes & manteaux', price: 5999, compareAtPrice: 7499, description: 'Doudoune légère et chaude, capuche fixe et poches zippées.', details: ['Garnissage synthétique', 'Déperlante', 'Du 4 au 14 ans'], sizes: KIDS, colors: [C.marine, C.kaki], images: [img('doudoune-enfant'), img('doudoune-enfant', true)], stock: 11, createdAt: '2026-10-07', sold: 48 },
  { name: 'Robe enfant à volants', category: 'enfant', type: 'Robes', price: 2499, description: 'Robe en coton léger, volants aux épaules et boutons dans le dos.', details: ['100 % coton', 'Doublée', 'Du 4 au 14 ans'], sizes: KIDS, colors: [C.rose, C.ecru], images: [img('robe-enfant'), img('robe-enfant', true)], stock: 18, createdAt: '2026-09-15', sold: 72 },

  // ——— ACCESSOIRES & CHAUSSURES ———
  { name: 'Baskets cuir blanc', category: 'accessoires', type: 'Chaussures', price: 7999, description: 'Baskets minimalistes en cuir pleine fleur, semelle cousue. Pointures 36 à 46.', details: ['Cuir pleine fleur', 'Semelle caoutchouc', 'Correspondance : XS=36 … XXL=46'], sizes: ADULT, colors: [C.blanc], images: [img('baskets-cuir'), img('baskets-cuir', true)], stock: 40, createdAt: '2026-09-30', sold: 380 },
  { name: 'Sneakers running', category: 'accessoires', type: 'Chaussures', price: 9999, compareAtPrice: 12999, description: 'Sneakers légères à semelle amortissante, tige en mesh respirant.', details: ['Mesh respirant', 'Semelle amortissante', 'Correspondance : XS=36 … XXL=46'], sizes: ADULT, colors: [C.noir, C.blanc], images: [img('sneakers-running'), img('sneakers-running', true)], stock: 14, createdAt: '2026-08-14', sold: 240 },
  { name: 'Sac cabas en cuir', category: 'accessoires', type: 'Sacs', price: 8900, description: 'Cabas en cuir de vachette grainé, anses épaule et poche intérieure zippée.', details: ['Cuir de vachette', 'Format ordinateur 13"', 'Poche zippée'], sizes: UNIQUE, colors: [C.camel, C.noir], images: [img('sac-cabas'), img('sac-cabas', true)], stock: 5, createdAt: '2026-10-03', sold: 88 },
  { name: 'Sac bandoulière', category: 'accessoires', type: 'Sacs', price: 5900, description: 'Petit sac bandoulière structuré, fermoir aimanté et chaîne amovible.', details: ['Cuir synthétique', 'Bandoulière réglable', 'Fermoir aimanté'], sizes: UNIQUE, colors: [C.noir, C.beige], images: [img('sac-bandouliere'), img('sac-bandouliere', true)], stock: 16, createdAt: '2026-07-11', sold: 95 },
  { name: 'Casquette coton', category: 'accessoires', type: 'Casquettes', price: 1900, description: 'Casquette six pans en sergé de coton lavé, réglable à l’arrière.', details: ['100 % coton', 'Taille unique réglable', 'Visière incurvée'], sizes: UNIQUE, colors: [C.beige, C.noir], images: [img('casquette'), img('casquette', true)], stock: 50, createdAt: '2026-05-12', sold: 200 },
  { name: 'Lunettes de soleil', category: 'accessoires', type: 'Lunettes', price: 3500, compareAtPrice: 4500, description: 'Monture acétate, verres catégorie 3 avec protection UV400.', details: ['Monture acétate', 'Protection UV400', 'Étui inclus'], sizes: UNIQUE, colors: [C.noir, C.marron], images: [img('lunettes'), img('lunettes', true)], stock: 28, createdAt: '2026-06-28', sold: 160 },
  { name: 'Montre classique', category: 'accessoires', type: 'Montres', price: 12900, description: 'Montre à quartz, boîtier acier 40 mm et bracelet cuir.', details: ['Boîtier acier 40 mm', 'Bracelet cuir', 'Étanche 5 ATM'], sizes: UNIQUE, colors: [C.marron, C.noir], images: [img('montre'), img('montre', true)], stock: 10, createdAt: '2026-10-12', sold: 35 },
  { name: 'Écharpe en laine', category: 'accessoires', type: 'Écharpes', price: 2900, description: 'Grande écharpe en laine douce, finitions franges.', details: ['Laine mélangée', '180 × 35 cm', 'Lavage main'], sizes: UNIQUE, colors: [C.camel, C.gris, C.bordeaux], images: [img('echarpe'), img('echarpe', true)], stock: 3, createdAt: '2026-10-09', sold: 58 },
];

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const INITIAL_PRODUCTS: Product[] = SEEDS.map((s, i) => ({
  ...s,
  id: `${slugify(s.name)}-${i + 1}`,
  reviews: demoReviews(i),
}));

export const CATEGORY_LABELS: Record<Category, string> = {
  homme: 'Homme',
  femme: 'Femme',
  enfant: 'Enfant',
  accessoires: 'Accessoires',
};

export const CATEGORY_IMAGES: Record<Category, string> = {
  homme: IMG.catHomme,
  femme: IMG.catFemme,
  enfant: IMG.catEnfant,
  accessoires: IMG.catAccessoires,
};
