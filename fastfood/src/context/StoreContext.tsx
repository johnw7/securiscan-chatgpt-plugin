import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { INITIAL_PRODUCTS } from '../data/menu';
import { load, save } from '../lib/storage';
import { stepsFor } from '../lib/orders';
import { uid } from '../services/ids';
import type { CartLine, Mode, Order, OrderStatus, Product, User } from '../types';

/**
 * État global en mode démonstration.
 * - Panier et mode de commande : localStorage (seul usage du stockage local).
 * - Produits, commandes et comptes : en mémoire, réinitialisés au rechargement.
 *   En production : Supabase (comptes, carte, commandes) + Stripe (paiement), contrôles côté serveur.
 */

interface DemoAccount extends User { password: string }

const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: 'demo-client', name: 'Camille Martin', email: 'client@smashhouse.demo', password: 'demo1234', phone: '06 12 34 56 78', role: 'client', address: { street: '12 rue des Lilas', postalCode: '75011', city: 'Paris', details: '3e étage, code 1234' } },
  { id: 'demo-admin', name: 'Gérant Smash House', email: 'admin@smashhouse.demo', password: 'admin1234', phone: '01 23 45 67 89', role: 'admin' },
];

const KEYS = { cart: 'smashhouse.cart.v1', mode: 'smashhouse.mode.v1' };

interface Toast { id: string; message: string }

interface StoreValue {
  products: Product[];
  getProduct: (id: string) => Product | undefined;
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;

  cart: CartLine[];
  addLine: (line: Omit<CartLine, 'key'>) => void;
  setQuantity: (key: string, q: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;

  mode: Mode;
  setMode: (m: Mode) => void;
  promoCode: string;
  setPromoCode: (c: string) => void;

  orders: Order[];
  placeOrder: (o: Order) => void;
  setOrderStatus: (id: string, s: OrderStatus) => void;

  user: User | null;
  login: (email: string, password: string) => string | null;
  register: (d: { name: string; email: string; password: string }) => string | null;
  logout: () => void;

  toasts: Toast[];
  notify: (m: string) => void;
}

const Ctx = createContext<StoreValue | null>(null);

/** Deux lignes sont identiques si même produit et mêmes options. */
const sameOptions = (a: Omit<CartLine, 'key'>, b: CartLine) =>
  a.productId === b.productId && JSON.stringify(a.options) === JSON.stringify(b.options);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartLine[]>(() => load(KEYS.cart, []));
  const [mode, setMode] = useState<Mode>(() => load(KEYS.mode, 'livraison'));
  const [cartOpen, setCartOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [accounts, setAccounts] = useState<DemoAccount[]>(DEMO_ACCOUNTS);
  const [userId, setUserId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => save(KEYS.cart, cart), [cart]);
  useEffect(() => save(KEYS.mode, mode), [mode]);

  // Suivi simulé : la commande avance d'une étape toutes les 20 s (démo uniquement).
  useEffect(() => {
    const t = setInterval(() => {
      setOrders((list) =>
        list.map((o) => {
          if (o.status === 'terminee' || o.status === 'annulee') return o;
          const steps = stepsFor(o.mode);
          const elapsed = (Date.now() - new Date(o.createdAt).getTime()) / 1000;
          const target = steps[Math.min(steps.length - 1, Math.floor(elapsed / 20))];
          return steps.indexOf(target) > steps.indexOf(o.status) ? { ...o, status: target } : o;
        }),
      );
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const notify = useCallback((message: string) => {
    const id = uid();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
  }, []);

  const value = useMemo<StoreValue>(() => {
    const acc = accounts.find((a) => a.id === userId);
    const user: User | null = acc ? (({ password: _p, ...u }) => u)(acc) : null;
    return {
      products,
      getProduct: (id) => products.find((p) => p.id === id),
      upsertProduct: (p) => setProducts((l) => (l.some((x) => x.id === p.id) ? l.map((x) => (x.id === p.id ? p : x)) : [...l, p])),
      deleteProduct: (id) => {
        setProducts((l) => l.filter((p) => p.id !== id));
        setCart((c) => c.filter((l) => l.productId !== id));
      },

      cart,
      addLine: (line) =>
        setCart((c) => {
          const same = c.find((l) => sameOptions(line, l));
          if (same) return c.map((l) => (l === same ? { ...l, quantity: Math.min(20, l.quantity + line.quantity) } : l));
          return [...c, { ...line, key: uid() }];
        }),
      setQuantity: (key, q) => setCart((c) => c.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, Math.min(20, q)) } : l))),
      removeLine: (key) => setCart((c) => c.filter((l) => l.key !== key)),
      clearCart: () => setCart([]),
      cartOpen,
      setCartOpen,

      mode,
      setMode,
      promoCode,
      setPromoCode,

      orders,
      placeOrder: (o) => {
        setOrders((l) => [o, ...l]);
        setProducts((list) =>
          list.map((p) => {
            const q = o.lines.filter((l) => l.productId === p.id).reduce((n, l) => n + l.quantity, 0);
            return q ? { ...p, sold: p.sold + q } : p;
          }),
        );
      },
      setOrderStatus: (id, status) => setOrders((l) => l.map((o) => (o.id === id ? { ...o, status } : o))),

      user,
      login: (email, password) => {
        const a = accounts.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (!a || a.password !== password) return 'E-mail ou mot de passe incorrect.';
        setUserId(a.id);
        return null;
      },
      register: ({ name, email, password }) => {
        if (accounts.some((a) => a.email.toLowerCase() === email.trim().toLowerCase())) return 'Un compte existe déjà avec cet e-mail.';
        if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
        const a: DemoAccount = { id: uid(), name, email: email.trim(), password, phone: '', role: 'client' };
        setAccounts((l) => [...l, a]);
        setUserId(a.id);
        return null;
      },
      logout: () => setUserId(null),

      toasts,
      notify,
    };
  }, [products, cart, cartOpen, mode, promoCode, orders, accounts, userId, toasts, notify]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore doit être utilisé dans <StoreProvider>');
  return c;
}
