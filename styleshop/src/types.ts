export type Category = 'homme' | 'femme' | 'enfant' | 'accessoires';
export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

export const ALL_SIZES: Size[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export interface ColorOption {
  name: string;
  hex: string;
}

export interface Review {
  author: string;
  rating: number;
  comment: string;
  date: string;
  /** Toujours true : les avis du catalogue de démo sont fictifs. */
  demo: true;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  type: string;
  /** Prix en centimes pour éviter les erreurs d'arrondi. */
  price: number;
  /** Prix barré (centimes) quand l'article est en promotion. */
  compareAtPrice?: number;
  description: string;
  details: string[];
  sizes: Size[];
  colors: ColorOption[];
  images: string[];
  stock: number;
  createdAt: string;
  sold: number;
  reviews: Review[];
}

export interface CartItem {
  productId: string;
  size: Size;
  color: string;
  quantity: number;
}

export type ShippingMethodId = 'standard' | 'express' | 'relais';

export interface ShippingMethod {
  id: ShippingMethodId;
  label: string;
  delay: string;
  price: number;
}

export interface Address {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
}

export type OrderStatus = 'en_attente' | 'payee' | 'en_preparation' | 'expediee' | 'livree' | 'annulee';

export interface OrderLine {
  productId: string;
  name: string;
  image: string;
  size: Size;
  color: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  email: string;
  customer: { firstName: string; lastName: string; phone: string };
  address: Omit<Address, 'id' | 'label' | 'firstName' | 'lastName' | 'phone'>;
  shippingMethod: ShippingMethodId;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  promoCode?: string;
  status: OrderStatus;
  /** 'simule' tant qu'aucun prestataire n'est connecté. */
  paymentMode: 'simule' | 'stripe';
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'client' | 'admin';
  addresses: Address[];
}
