import { useSyncExternalStore } from "react";

export type CartLine = { menuItemId: string; name: string; priceInr: number; quantity: number };
export type Cart = { restaurantId: string | null; restaurantName: string; lines: CartLine[] };

const KEY = "ecobite-cart";
const EMPTY: Cart = { restaurantId: null, restaurantName: "", lines: [] };
let state: Cart = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw);
  } catch {}
}
function set(next: Cart) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

export function useCart() {
  return useSyncExternalStore(
    (cb) => {
      load();
      listeners.add(cb);
      cb();
      return () => listeners.delete(cb);
    },
    () => {
      load();
      return state;
    },
    () => EMPTY,
  );
}

export const cartActions = {
  add(rest: { id: string; name: string }, item: Omit<CartLine, "quantity">) {
    load();
    const base =
      state.restaurantId === rest.id
        ? state
        : { restaurantId: rest.id, restaurantName: rest.name, lines: [] as CartLine[] };
    const ex = base.lines.find((l) => l.menuItemId === item.menuItemId);
    const lines = ex
      ? base.lines.map((l) => (l === ex ? { ...l, quantity: Math.min(20, l.quantity + 1) } : l))
      : [...base.lines, { ...item, quantity: 1 }];
    set({ ...base, lines });
  },
  setQty(id: string, q: number) {
    const lines = state.lines
      .map((l) => (l.menuItemId === id ? { ...l, quantity: q } : l))
      .filter((l) => l.quantity > 0);
    set(lines.length ? { ...state, lines } : EMPTY);
  },
  clear() {
    set(EMPTY);
  },
};
export const cartSubtotal = (c: Cart) => c.lines.reduce((s, l) => s + l.priceInr * l.quantity, 0);
export const cartCount = (c: Cart) => c.lines.reduce((s, l) => s + l.quantity, 0);
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
