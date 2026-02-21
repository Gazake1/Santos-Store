"use client";

import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function CartDrawer() {
  const { items, isOpen, close, count, total, remove, setQty, openWhatsApp } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleCheckout = () => {
    if (!user) {
      localStorage.setItem("sg_redirect", "/vitrine");
      router.push("/login");
      close();
      return;
    }
    openWhatsApp();
    close();
  };

  return (
    <div className={`drawer${isOpen ? " is-open" : ""}`}>
      <div className="drawer__backdrop" onClick={close}></div>
      <div className="drawer__panel">
        <div className="drawer__head">
          <h3>Carrinho ({count})</h3>
          <button className="iconBtn" type="button" aria-label="Fechar carrinho" onClick={close}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="drawer__body">
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--muted)" }}>
              <p style={{ fontSize: 40, marginBottom: 8 }}>🛒</p>
              <p>Seu carrinho está vazio</p>
            </div>
          ) : items.map(item => (
            <div className="citem" key={item.product_id}>
              <div className="citem__top">
                <div>
                  <div className="citem__name">{item.name}</div>
                  <div className="citem__sub">{item.category} • {BRL.format(item.price)}</div>
                </div>
                <button className="iconBtn" style={{ width: 32, height: 32, borderRadius: 8 }} onClick={() => remove(item.product_id)} aria-label="Remover item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              <div className="qty">
                <button onClick={() => setQty(item.product_id, item.quantity - 1)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => setQty(item.product_id, item.quantity + 1)}>+</button>
                <span style={{ marginLeft: "auto", fontWeight: 700 }}>{BRL.format(item.price * item.quantity)}</span>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="drawer__foot">
            <div className="totals">
              <div className="totals__row">
                <span className="muted small">Subtotal</span>
                <span>{BRL.format(total)}</span>
              </div>
              <div className="totals__row">
                <strong>Total</strong>
                <strong>{BRL.format(total)}</strong>
              </div>
            </div>
            <button className="btn btn--solid btn--full btn--lg" onClick={handleCheckout}>
              Finalizar via WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
