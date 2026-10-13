import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { INITIAL_PRODUCTS } from '../data/products';
import { load, save, STORAGE_KEYS } from '../lib/storage';
import { uid } from '../services/ids';
import type { Address, CartItem, Order, OrderStatus, Product, Size, User } from '../types';

/**
 * État global de la boutique en mode démonstration.
 *
 * - Panier et favoris : persistés dans localStorage (seul usage autorisé du stockage local).
 * - Produits, commandes et comptes : en mémoire uniquement (réinitialisés au rechargement).
 *   En production, ces données viennent de Supabase (voir supabase/schema.sql) avec
 *   authentification et contrôles d'accès (RLS) côté serveur.
 */

interface DemoAccount extends User {
  password: string;
}

/** Comptes fictifs. Les mots de passe en clair ne sont acceptables QUE parce que c'est une démo locale. */
const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'demo-client', firstName: 'Camille', lastName: 'Martin', email: 'client@styleshop.demo', password: 'demo1234',
    phone: '06 12 34 56 78', role: 'client',
    addresses: [{ id: 'adr-1', label: 'Domicile', firstName: 'Camille', lastName: 'Martin', street: '12 rue des Lilas', postalCode: '75011', city: 'Paris', country: 'France', phone: '06 12 34 56 78' }],
  },
  {
    id: 'demo-admin', firstName: 'Alex', lastName: 'Gérant', email: 'admin@styleshop.demo', password: 'admin1234',
    phone: '01 23 45 67 89', role: 'admin', addresses: [],
  },
];

interface Toast { id: string; message: string }

interface StoreValue {
  products: Product[];
  getProduct: (id: string) => Product | undefined;
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;

  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQuantity: (productId: string, size: Size, color: string, quantity: number) => void;
  removeFromCart: (productId: string, size: Size, color: string) => void;
  clearCart: () => void;
  promoCode: string;
  setPromoCode: (code: string) => void;

  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;

  orders: Order[];
  placeOrder: (order: Order) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;

  user: User | null;
  login: (email: string, password: string) => string | null;
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => string | null;
  logout: () => void;
  updateProfile: (data: Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>) => void;
  saveAddress: (a: Address) => void;
  deleteAddress: (id: string) => void;

  toasts: Toast[];
  notify: (message: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const sameLine = (a: CartItem, productId: string, size: Size, color: string) =>
  a.productId === productId && a.size === size && a.color === color;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>(() => load(STORAGE_KEYS.cart, []));
  const [favorites, setFavorites] = useState<string[]>(() => load(STORAGE_KEYS.favorites, []));
  const [orders, setOrders] = useState<Order[]>([]);
  const [accounts, setAccounts] = useState<DemoAccount[]>(DEMO_ACCOUNTS);
  const [userId, setUserId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [promoCode, setPromoCode] = useState('');

  useEffect(() => save(STORAGE_KEYS.cart, cart), [cart]);
  useEffect(() => save(STORAGE_KEYS.favorites, favorites), [favorites]);

  const notify = useCallback((message: string) => {
    const id = uid();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const value = useMemo<StoreValue>(() => {
    const account = accounts.find((a) => a.id === userId) ?? null;
    const user: User | null = account ? (({ password: _pw, ...rest }) => rest)(account) : null;
    const getProduct = (id: string) => products.find((p) => p.id === id);
    const patchAccount = (fn: (a: DemoAccount) => DemoAccount) =>
      setAccounts((list) => list.map((a) => (a.id === userId ? fn(a) : a)));

    return {
      products,
      getProduct,
      upsertProduct: (p) =>
        setProducts((list) => (list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [p, ...list])),
      deleteProduct: (id) => {
        setProducts((list) => list.filter((p) => p.id !== id));
        setCart((c) => c.filter((i) => i.productId !== id));
        setFavorites((f) => f.filter((x) => x !== id));
      },

      cart,
      addToCart: (item) => {
        const product = getProduct(item.productId);
        const max = product?.stock ?? 0;
        setCart((c) => {
          const existing = c.find((i) => sameLine(i, item.productId, item.size, item.color));
          if (existing) {
            return c.map((i) => (i === existing ? { ...i, quantity: Math.min(max, i.quantity + item.quantity) } : i));
          }
          return [...c, { ...item, quantity: Math.min(max, item.quantity) }];
        });
      },
      updateQuantity: (productId, size, color, quantity) => {
        const max = getProduct(productId)?.stock ?? 1;
        setCart((c) => c.map((i) => (sameLine(i, productId, size, color) ? { ...i, quantity: Math.max(1, Math.min(max, quantity)) } : i)));
      },
      removeFromCart: (productId, size, color) => setCart((c) => c.filter((i) => !sameLine(i, productId, size, color))),
      clearCart: () => setCart([]),
      promoCode,
      setPromoCode,

      favorites,
      toggleFavorite: (id) => {
        const on = favorites.includes(id);
        setFavorites((f) => (on ? f.filter((x) => x !== id) : [...f, id]));
        notify(on ? 'Retiré des favoris' : 'Ajouté aux favoris');
      },
      isFavorite: (id) => favorites.includes(id),

      orders,
      placeOrder: (order) => {
        setOrders((o) => [order, ...o]);
        // Décrémente le stock de démonstration
        setProducts((list) =>
          list.map((p) => {
            const qty = order.lines.filter((l) => l.productId === p.id).reduce((n, l) => n + l.quantity, 0);
            return qty ? { ...p, stock: Math.max(0, p.stock - qty), sold: p.sold + qty } : p;
          }),
        );
      },
      setOrderStatus: (id, status) => setOrders((o) => o.map((x) => (x.id === id ? { ...x, status } : x))),

      user,
      login: (email, password) => {
        const found = accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
        if (!found || found.password !== password) return 'E-mail ou mot de passe incorrect.';
        setUserId(found.id);
        return null;
      },
      register: ({ firstName, lastName, email, password }) => {
        if (accounts.some((a) => a.email.toLowerCase() === email.trim().toLowerCase())) return 'Un compte existe déjà avec cet e-mail.';
        if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
        const acc: DemoAccount = { id: uid(), firstName, lastName, email: email.trim(), password, phone: '', role: 'client', addresses: [] };
        setAccounts((l) => [...l, acc]);
        setUserId(acc.id);
        return null;
      },
      logout: () => setUserId(null),
      updateProfile: (data) => patchAccount((a) => ({ ...a, ...data })),
      saveAddress: (addr) =>
        patchAccount((a) => ({
          ...a,
          addresses: a.addresses.some((x) => x.id === addr.id) ? a.addresses.map((x) => (x.id === addr.id ? addr : x)) : [...a.addresses, addr],
        })),
      deleteAddress: (id) => patchAccount((a) => ({ ...a, addresses: a.addresses.filter((x) => x.id !== id) })),

      toasts,
      notify,
    };
  }, [products, cart, favorites, orders, accounts, userId, toasts, promoCode, notify]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore doit être utilisé dans <StoreProvider>');
  return ctx;
}
