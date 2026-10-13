/**
 * localStorage n'est utilisé QUE pour le panier et les favoris (mode démonstration).
 * Les lectures/écritures sont protégées : navigation privée ou stockage bloqué ne cassent pas l'app.
 */
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible : on continue en mémoire */
  }
}

export const STORAGE_KEYS = { cart: 'styleshop.cart.v1', favorites: 'styleshop.favorites.v1' } as const;
