"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { useRouter } from "next/navigation";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  sold?: number;
  tag?: string;
  image?: string;
  slug?: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const handleAdd = () => {
    if (!user) {
      localStorage.setItem("sg_redirect", window.location.pathname);
      router.push("/login");
      return;
    }
    add(product.id, { name: product.name, price: product.price, category: product.category });
    showToast(`${product.name} adicionado ao carrinho!`, "success");
  };

  const detailHref = product.slug ? `/produto/${product.slug}` : `/vitrine`;
  const hasImage = !!product.image;

  return (
    <article className="pcard">
      <Link href={detailHref} className={`pcard__img${hasImage ? " pcard__img--has-photo" : ""}`}>
        {hasImage ? (
          <img className="pcard__photo" src={product.image} alt={product.name} loading="lazy" />
        ) : (
          <span className="muted tiny">📦</span>
        )}
        {product.tag && (
          <span className={`badge ${product.tag === "🔥 Mais Vendido" ? "badge--hot" : "badge--soft"}`} style={{ position: "absolute", top: 10, left: 10 }}>
            {product.tag}
          </span>
        )}
      </Link>
      <div className="pcard__body">
        <div className="pcard__meta">
          <span>{product.category}</span>
          {product.sold !== undefined && <span>{product.sold} vendidos</span>}
        </div>
        <Link href={detailHref} className="pcard__title">{product.name}</Link>
        <div className="pcard__price">
          <strong>{BRL.format(product.price)}</strong>
          <span>ou até 6x de {BRL.format(product.price / 6)}</span>
        </div>
        <div className="pcard__actions">
          <button className="btn btn--outline" onClick={handleAdd}>Adicionar</button>
          <button className="btn btn--solid" onClick={() => {
            if (!user) { router.push("/login"); return; }
            add(product.id, { name: product.name, price: product.price, category: product.category });
            router.push("/vitrine");
            showToast("Produto adicionado!", "success");
          }}>Comprar</button>
        </div>
      </div>
    </article>
  );
}
