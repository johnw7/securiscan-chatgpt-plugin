import type { CategoryId, Extra, Product } from '../types';

/**
 * Visuels générés avec Canva (IA) et enregistrés dans public/images/.
 * BASE_URL vaut '/' en développement et './' pour la version statique.
 */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const img = (slug: string) => asset(`images/menu/${slug}.jpg`);

export const IMG = {
  hero: asset('images/site/hero.jpg'),
  promo: asset('images/site/promo.jpg'),
  kitchen: asset('images/site/kitchen.jpg'),
};

export const BRAND = {
  name: 'SMASH HOUSE',
  tagline: 'Smash burgers, tacos & frites maison',
  address: '24 rue de la Gourmandise, 75011 Paris',
  phone: '01 23 45 67 89',
  hours: [
    { days: 'Lun – Jeu', time: '11 h 30 – 23 h' },
    { days: 'Ven – Sam', time: '11 h 30 – 1 h' },
    { days: 'Dimanche', time: '12 h – 23 h' },
  ],
};

export const CATEGORIES: { id: CategoryId; label: string; emoji: string }[] = [
  { id: 'menus', label: 'Menus', emoji: '🍱' },
  { id: 'burgers', label: 'Burgers', emoji: '🍔' },
  { id: 'tacos', label: 'Tacos & Wraps', emoji: '🌯' },
  { id: 'sides', label: 'Accompagnements', emoji: '🍟' },
  { id: 'drinks', label: 'Boissons', emoji: '🥤' },
  { id: 'desserts', label: 'Desserts', emoji: '🍪' },
];

/** Suppléments burgers / tacos (centimes). */
export const EXTRAS: Extra[] = [
  { id: 'cheddar', label: 'Cheddar en plus', price: 80 },
  { id: 'bacon', label: 'Bacon croustillant', price: 120 },
  { id: 'steak', label: 'Steak smashé en plus', price: 250 },
  { id: 'oignons', label: 'Oignons caramélisés', price: 60 },
  { id: 'jalapenos', label: 'Jalapeños', price: 60 },
];

export const SAUCES = ['Smash (maison)', 'Ketchup', 'Mayo', 'Barbecue', 'Algérienne', 'Samouraï', 'Moutarde miel', 'Sans sauce'];
export const MENU_SUPPLEMENT = 350; // + frites + boisson
export const MENU_SIDES = ['Frites maison', 'Potatoes', 'Salade'];
export const MENU_DRINKS = ['Soda cola', 'Soda zéro', 'Thé glacé', 'Eau minérale', 'Limonade maison (+0,50 €)'];
export const XL_SUPPLEMENT = 150;

type Seed = Omit<Product, 'id' | 'image' | 'available'> & { slug: string };

const SEEDS: Seed[] = [
  // Menus
  { slug: 'menu-smash', name: 'Menu Smash', category: 'menus', price: 1290, description: 'Le Smash Classique + frites maison + boisson au choix. Le combo qui ne déçoit jamais.', tags: ['best'], kcal: 1180, allergens: ['Gluten', 'Lait', 'Moutarde', 'Sésame'], options: 'menu', sold: 940 },
  { slug: 'menu-famille', name: 'Menu Famille', category: 'menus', price: 3990, description: '4 burgers au choix, 12 nuggets, 2 grandes frites, onion rings et 4 boissons. Pour 4 personnes.', tags: ['best'], kcal: 4800, allergens: ['Gluten', 'Lait', 'Œuf', 'Moutarde', 'Sésame'], options: 'menu', sold: 310 },
  // Burgers
  { slug: 'smash-classique', name: 'Smash Classique', category: 'burgers', price: 890, description: 'Deux steaks smashés aux bords croustillants, cheddar fondu, pickles, oignons et sauce Smash maison dans un bun brioché.', tags: ['best'], kcal: 720, allergens: ['Gluten', 'Lait', 'Moutarde', 'Sésame'], options: 'burger', sold: 1260 },
  { slug: 'double-cheese', name: 'Double Cheese', category: 'burgers', price: 990, description: 'Double steak, quatre tranches de cheddar qui coulent, bun sésame toasté. Pour les vrais fans de fromage.', tags: ['best'], kcal: 860, allergens: ['Gluten', 'Lait', 'Sésame'], options: 'burger', sold: 1010 },
  { slug: 'chicken-crispy', name: 'Chicken Crispy', category: 'burgers', price: 890, description: 'Filet de poulet pané ultra croustillant, coleslaw, mayo épicée et pickles.', tags: ['spicy'], kcal: 780, allergens: ['Gluten', 'Œuf', 'Lait', 'Moutarde'], options: 'burger', sold: 780 },
  { slug: 'bacon-bbq', name: 'Bacon BBQ', category: 'burgers', price: 1090, description: 'Steak smashé, bacon croustillant, onion rings, cheddar et sauce barbecue fumée.', tags: [], kcal: 940, allergens: ['Gluten', 'Lait', 'Moutarde'], options: 'burger', sold: 690 },
  { slug: 'veggie', name: 'Veggie Garden', category: 'burgers', price: 890, description: 'Galette végétale grillée, avocat, tomate, oignon rouge, salade et sauce végane, pain complet.', tags: ['veggie'], kcal: 610, allergens: ['Gluten', 'Soja', 'Sésame'], options: 'burger', sold: 320 },
  { slug: 'signature-truffe', name: 'Signature Truffe', category: 'burgers', price: 1390, description: 'Steak épais, raclette fondue, champignons poêlés, oignons confits et mayo à la truffe.', tags: ['new'], kcal: 980, allergens: ['Gluten', 'Lait', 'Œuf'], options: 'burger', sold: 240 },
  // Tacos & wraps
  { slug: 'tacos-xl', name: 'Tacos XL', category: 'tacos', price: 990, description: 'Galette grillée garnie de poulet mariné, frites et sauce fromagère maison. Généreux et fondant.', tags: ['best'], kcal: 1100, allergens: ['Gluten', 'Lait'], options: 'tacos', sold: 870 },
  { slug: 'wrap-poulet', name: 'Wrap Poulet', category: 'tacos', price: 790, description: 'Poulet grillé, salade, tomate, cheddar et sauce blanche dans une tortilla toastée.', tags: [], kcal: 560, allergens: ['Gluten', 'Lait'], options: 'tacos', sold: 410 },
  // Accompagnements
  { slug: 'frites-maison', name: 'Frites maison', category: 'sides', price: 350, description: 'Pommes de terre fraîches coupées chaque matin, double cuisson, fleur de sel.', tags: ['veggie', 'best'], kcal: 380, allergens: [], options: 'side', sold: 1500 },
  { slug: 'frites-cheddar-bacon', name: 'Frites Cheddar Bacon', category: 'sides', price: 590, description: 'Nos frites nappées de sauce cheddar, éclats de bacon et oignons nouveaux.', tags: ['new'], kcal: 640, allergens: ['Lait'], options: 'side', sold: 520 },
  { slug: 'onion-rings', name: 'Onion rings', category: 'sides', price: 450, description: 'Rondelles d’oignon en tempura dorée, sauce smoky.', tags: ['veggie'], kcal: 420, allergens: ['Gluten', 'Œuf'], options: 'side', sold: 460 },
  { slug: 'nuggets', name: 'Nuggets x9', category: 'sides', price: 590, description: '9 nuggets de poulet croustillants, 2 sauces au choix.', tags: [], kcal: 480, allergens: ['Gluten', 'Œuf'], options: 'side', sold: 830 },
  // Boissons
  { slug: 'soda', name: 'Soda bien frais', category: 'drinks', price: 290, description: 'Cola, cola zéro, orange ou thé glacé, 33 cl.', tags: [], kcal: 140, allergens: [], options: 'drink', sold: 1400 },
  { slug: 'milkshake', name: 'Milkshake Caramel', category: 'drinks', price: 490, description: 'Glace vanille, caramel beurre salé, chantilly et cerise.', tags: ['best'], kcal: 620, allergens: ['Lait'], options: 'drink', sold: 640 },
  { slug: 'limonade', name: 'Limonade maison', category: 'drinks', price: 390, description: 'Citrons pressés, menthe fraîche, une touche de sucre de canne.', tags: ['veggie'], kcal: 110, allergens: [], options: 'drink', sold: 380 },
  // Desserts
  { slug: 'cookie', name: 'Cookie fondant', category: 'desserts', price: 350, description: 'Gros cookie aux pépites de chocolat, cœur coulant, servi tiède.', tags: [], kcal: 420, allergens: ['Gluten', 'Lait', 'Œuf'], options: 'dessert', sold: 720 },
  { slug: 'sundae', name: 'Sundae Caramel', category: 'desserts', price: 390, description: 'Glace vanille, sauce caramel beurre salé et cacahuètes concassées.', tags: [], kcal: 380, allergens: ['Lait', 'Arachides'], options: 'dessert', sold: 410 },
  { slug: 'brownie', name: 'Brownie & glace', category: 'desserts', price: 450, description: 'Brownie fondant au chocolat noir, boule de vanille et sauce chocolat.', tags: ['new'], kcal: 560, allergens: ['Gluten', 'Lait', 'Œuf'], options: 'dessert', sold: 300 },
];

export const INITIAL_PRODUCTS: Product[] = SEEDS.map(({ slug, ...s }) => ({ ...s, id: slug, image: img(slug), available: true }));

export const TAG_LABELS: Record<string, { label: string; className: string }> = {
  best: { label: 'Best-seller', className: 'bg-mustard text-ink' },
  new: { label: 'Nouveau', className: 'bg-tomato text-white' },
  spicy: { label: 'Épicé 🌶', className: 'bg-ink text-white' },
  veggie: { label: 'Végé', className: 'bg-emerald-600 text-white' },
};
