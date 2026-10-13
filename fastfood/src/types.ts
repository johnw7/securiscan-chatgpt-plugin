export type CategoryId = 'menus' | 'burgers' | 'tacos' | 'sides' | 'drinks' | 'desserts';
export type Tag = 'best' | 'new' | 'spicy' | 'veggie';
/** Type d'options proposées dans la fenêtre de personnalisation. */
export type OptionKind = 'burger' | 'tacos' | 'side' | 'drink' | 'dessert' | 'menu';

export interface Product {
  id: string;
  name: string;
  category: CategoryId;
  /** Prix en centimes. */
  price: number;
  description: string;
  image: string;
  tags: Tag[];
  kcal: number;
  allergens: string[];
  available: boolean;
  options: OptionKind;
  sold: number;
}

export interface Extra { id: string; label: string; price: number }

export interface LineOptions {
  /** Formule menu : accompagnement + boisson. */
  menu?: { side: string; drink: string };
  extras: string[];
  sauce?: string;
  removed: string[];
  size?: 'normal' | 'xl';
  note?: string;
}

export interface CartLine {
  key: string;
  productId: string;
  quantity: number;
  options: LineOptions;
  /** Prix unitaire calculé (centimes) au moment de l'ajout. */
  unitPrice: number;
}

export type Mode = 'livraison' | 'emporter' | 'surplace';

export type OrderStatus = 'recue' | 'preparation' | 'prete' | 'livraison' | 'terminee' | 'annulee';

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  mode: Mode;
  slot: string;
  customer: { name: string; phone: string; email: string };
  address?: { street: string; postalCode: string; city: string; details: string };
  lines: (CartLine & { name: string })[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  promoCode?: string;
  payment: 'en_ligne_simule' | 'sur_place';
  status: OrderStatus;
  note?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'admin';
  address?: { street: string; postalCode: string; city: string; details: string };
}
