import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CART_KEY = 'ecobite_cart_v1';
const CartContext = createContext(null);

const EMPTY_CART = { restaurant: null, items: [] };

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return EMPTY_CART;
    const parsed = JSON.parse(raw);
    if (!parsed?.restaurant || !Array.isArray(parsed.items)) return EMPTY_CART;
    return {
      restaurant: parsed.restaurant,
      items: parsed.items.filter((item) => item && item.id && item.quantity > 0),
    };
  } catch {
    return EMPTY_CART;
  }
}

const cartRestaurant = (restaurant) => ({
  id: restaurant.id,
  slug: restaurant.slug,
  name: restaurant.name,
  area: restaurant.area,
  image: restaurant.image,
  deliveryModes: restaurant.deliveryModes || ['standard'],
  packagingOptions: restaurant.packagingOptions || ['standard'],
  distanceKm: restaurant.distanceKm || 2.5,
  deliveryTimeMins: restaurant.deliveryTimeMins || 30,
});

const cartItem = (item) => ({
  id: item.id,
  name: item.name,
  price: item.price,
  image: item.image,
  isVeg: item.isVeg,
  category: item.category,
});

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const addItem = useCallback(
    (restaurant, item, quantity = 1) => {
      if (cart.items.length > 0 && String(cart.restaurant?.id) !== String(restaurant.id)) {
        return false;
      }

      setCart((previous) => {
        const existing = previous.items.find((entry) => entry.id === item.id);
        if (existing) {
          return {
            ...previous,
            items: previous.items.map((entry) =>
              entry.id === item.id
                ? { ...entry, quantity: Math.min(10, entry.quantity + quantity) }
                : entry
            ),
          };
        }
        return {
          restaurant: previous.restaurant || cartRestaurant(restaurant),
          items: [...previous.items, { ...cartItem(item), quantity: Math.min(10, quantity) }],
        };
      });
      return true;
    },
    [cart.items, cart.restaurant]
  );

  const replaceCart = useCallback((restaurant, item, quantity = 1) => {
    setCart({
      restaurant: cartRestaurant(restaurant),
      items: [{ ...cartItem(item), quantity }],
    });
  }, []);

  const setQuantity = useCallback((itemId, quantity) => {
    setCart((previous) => {
      if (quantity <= 0) {
        const items = previous.items.filter((item) => item.id !== itemId);
        return items.length ? { ...previous, items } : EMPTY_CART;
      }
      return {
        ...previous,
        items: previous.items.map((item) =>
          item.id === itemId ? { ...item, quantity: Math.min(10, quantity) } : item
        ),
      };
    });
  }, []);

  const removeItem = useCallback((itemId) => {
    setCart((previous) => {
      const items = previous.items.filter((item) => item.id !== itemId);
      return items.length ? { ...previous, items } : EMPTY_CART;
    });
  }, []);

  const clearCart = useCallback(() => setCart(EMPTY_CART), []);

  const { itemCount, itemTotal } = useMemo(() => {
    const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { itemCount: count, itemTotal: total };
  }, [cart.items]);

  const value = useMemo(
    () => ({
      cart,
      restaurant: cart.restaurant,
      items: cart.items,
      itemCount,
      itemTotal,
      addItem,
      replaceCart,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [cart, itemCount, itemTotal, addItem, replaceCart, setQuantity, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
