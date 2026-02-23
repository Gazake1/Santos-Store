"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "./auth-context";

interface CartItem {
  product_id: string;
  quantity: number;
  name: string;
  price: number;
  category: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  count: number;
  total: number;
  add: (productId: string, info: { name: string; price: number; category: string }) => void;
  addMultiple: (productId: string, qty: number, info: { name: string; price: number; category: string }) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  openWhatsApp: (productName?: string, price?: number) => void;
  openWhatsAppBuild: (payload: string) => void;
}

const CartContext = createContext<CartContextType | null>(null);
const WA_NUMBER = "5516992070533";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { token } = useAuth();

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sg_cart");
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  // Persist to localStorage and sync to server
  const persist = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem("sg_cart", JSON.stringify(newItems));
    if (token) {
      fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: newItems }),
      }).catch(() => {});
    }
  }, [token]);

  const add = useCallback((productId: string, info: { name: string; price: number; category: string }) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === productId);
      let newItems;
      if (existing) {
        newItems = prev.map(i => i.product_id === productId ? { ...i, quantity: i.quantity + 1, name: info.name, price: info.price, category: info.category } : i);
      } else {
        newItems = [...prev, { product_id: productId, quantity: 1, ...info }];
      }
      localStorage.setItem("sg_cart", JSON.stringify(newItems));
      if (token) {
        fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ items: newItems }),
        }).catch(() => {});
      }
      return newItems;
    });
  }, [token]);

  const addMultiple = useCallback((productId: string, qty: number, info: { name: string; price: number; category: string }) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === productId);
      let newItems;
      if (existing) {
        newItems = prev.map(i => i.product_id === productId ? { ...i, quantity: i.quantity + qty, name: info.name, price: info.price, category: info.category } : i);
      } else {
        newItems = [...prev, { product_id: productId, quantity: qty, ...info }];
      }
      localStorage.setItem("sg_cart", JSON.stringify(newItems));
      if (token) {
        fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ items: newItems }),
        }).catch(() => {});
      }
      return newItems;
    });
  }, [token]);

  const remove = useCallback((productId: string) => {
    setItems(prev => {
      const newItems = prev.filter(i => i.product_id !== productId);
      persist(newItems);
      return newItems;
    });
  }, [persist]);

  const setQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      remove(productId);
      return;
    }
    setItems(prev => {
      const newItems = prev.map(i => i.product_id === productId ? { ...i, quantity: qty } : i);
      persist(newItems);
      return newItems;
    });
  }, [remove, persist]);

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  const count = items.reduce((a, i) => a + i.quantity, 0);
  const total = items.reduce((a, i) => a + i.price * i.quantity, 0);

  const openWhatsApp = useCallback((productName?: string, price?: number) => {
    let msg: string;
    if (productName && price) {
      msg = `Olá! 👋\nTenho interesse no produto:\n\n📦 *${productName}*\n💰 ${BRL.format(price)}\n\nPodemos negociar?`;
    } else {
      const lines = items.map(i => `• ${i.name} (x${i.quantity}) — ${BRL.format(i.price * i.quantity)}`);
      msg = `Olá! 👋\nGostaria de finalizar meu pedido:\n\n${lines.join("\n")}\n\n💰 *Total: ${BRL.format(total)}*`;
    }
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
    if (!productName) {
      // Save purchase history
      const history = JSON.parse(localStorage.getItem("sg_purchases") || "[]");
      history.unshift({ date: new Date().toISOString(), items: [...items], total });
      if (history.length > 50) history.length = 50;
      localStorage.setItem("sg_purchases", JSON.stringify(history));
      clear();
    }
  }, [items, total, clear]);

  const openWhatsAppBuild = useCallback((payload: string) => {
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(payload)}`, "_blank");
  }, []);

  return (
    <CartContext.Provider value={{
      items, isOpen, count, total,
      add, addMultiple, remove, setQty, clear,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      openWhatsApp,
      openWhatsAppBuild,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
