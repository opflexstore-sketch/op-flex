import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const CART_KEY = 'wtf_cart_v1';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Hydrate from localStorage so the cart survives reloads — including the
  // implicit reload that happens when a phone kills the tab while the user
  // is in a UPI app and switches back.
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((product) => {
    setItems((prev) => {
      const existing = prev.find((x) => x.id === product.id);
      if (existing) {
        return prev.map((x) => (x.id === product.id ? { ...x, qty: x.qty + 1 } : x));
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const updateQty = useCallback((id, qty) => {
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const totalQty = items.reduce((s, x) => s + x.qty, 0);
    const totalPrice = items.reduce((s, x) => s + x.price * x.qty, 0);
    return { items, totalQty, totalPrice, add, remove, updateQty, clear, open, setOpen };
  }, [items, open, add, remove, updateQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
