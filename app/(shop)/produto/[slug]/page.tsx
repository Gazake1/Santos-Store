"use client";

import "@/styles/produto.css";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface SpecItem { label: string; value: string }
interface SpecGroupData { group: string; specs: SpecItem[] }

interface ProductData {
  id: number;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  category: string;
  product_type: string;
  price: number;
  original_price: number;
  installment_count: number;
  accepts_card: number;
  accepts_pix: number;
  accepts_boleto: number;
  stock: number;
  sold: number;
  tag: string;
  images: string[];
  specs: SpecGroupData[] | Record<string, string>;
  active: number;
  featured: number;
}

const Star = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
);

export default function ProductPage({ params }: { params: { slug: string } }) {
  const { addMultiple, open: openCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const slug = params.slug;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [qty, setQty] = useState(1);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(data => {
        setProduct(data.product);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  const requireLogin = () => {
    if (!user) {
      localStorage.setItem("sg_redirect", window.location.pathname);
      router.push("/login");
      return false;
    }
    return true;
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <p style={{ fontSize: "1.1rem", color: "var(--muted)" }}>Carregando produto...</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h2 style={{ marginBottom: 12 }}>Produto não encontrado</h2>
        <p style={{ color: "var(--muted)", marginBottom: 24 }}>Este produto não existe ou foi removido.</p>
        <Link className="btn btn--solid" href="/vitrine">Voltar à vitrine</Link>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : ["/assets/img/placeholder.png"];
  const hasDiscount = product.original_price > 0 && product.original_price > product.price;
  const discount = hasDiscount ? Math.round((1 - product.price / product.original_price) * 100) : 0;
  const installments = product.installment_count || 6;

  const handleAdd = () => {
    if (!requireLogin()) return;
    addMultiple(`db-${product.id}`, qty, { name: product.title, price: product.price, category: product.category });
    showToast(`${product.title} — ${qty}x adicionado ao carrinho!`, "success");
  };

  const handleBuy = () => {
    if (!requireLogin()) return;
    addMultiple(`db-${product.id}`, qty, { name: product.title, price: product.price, category: product.category });
    openCart();
  };

  const specsEntries = product.specs && typeof product.specs === "object" ? Object.entries(product.specs) : [];

  // Determine if specs are in new grouped format (array) or legacy flat format (object)
  const isGroupedSpecs = Array.isArray(product.specs);
  const groupedSpecs: SpecGroupData[] = isGroupedSpecs
    ? (product.specs as SpecGroupData[]).filter(g => g.specs && g.specs.length > 0)
    : [];
  const flatSpecs = !isGroupedSpecs && product.specs && typeof product.specs === "object"
    ? Object.entries(product.specs).filter(([, v]) => v)
    : [];
  const hasSpecs = groupedSpecs.length > 0 || flatSpecs.length > 0;

  return (
    <>
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Navegação">
        <div className="container">
          <ol className="breadcrumb__list">
            <li><Link href="/">Início</Link></li>
            <li><Link href="/vitrine">Produtos</Link></li>
            {product.category && <li><Link href="/vitrine">{product.category}</Link></li>}
            <li aria-current="page">{product.title}</li>
          </ol>
        </div>
      </nav>

      {/* PDP */}
      <section className="pdp" aria-label="Detalhes do produto">
        <div className="container pdp__layout">
          {/* Gallery */}
          <div className="pdp__gallery">
            <div className="gallery">
              <div className="gallery__thumbs">
                {images.map((src, i) => (
                  <button key={i} className={`gallery__thumb${i === galleryIdx ? " is-active" : ""}`} type="button" onClick={() => setGalleryIdx(i)}>
                    <img src={src} alt={`Vista ${i + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>
              <div className="gallery__main" onClick={() => setLightbox(true)}>
                <img className="gallery__img" src={images[galleryIdx]} alt={product.title} />
                <button className="gallery__zoom" type="button" aria-label="Zoom na imagem" onClick={e => { e.stopPropagation(); setLightbox(true); }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="pdp__info">
            <div className="pdp__seller">
              <img className="pdp__seller-logo" src="/assets/logo-sg.png" alt="Santos Store" />
              <div>
                <span className="pdp__seller-name">Santos Store</span>
                <span className="pdp__seller-badge">Loja oficial</span>
              </div>
            </div>

            <div className="pdp__condition">
              <span>Novo</span>
              <span className="pdp__separator">|</span>
              <span>+{product.sold} vendidos</span>
            </div>

            <h1 className="pdp__title">{product.title}</h1>

            {product.tag && (
              <div style={{ marginBottom: 8 }}>
                <span className="badge badge--soft">{product.tag}</span>
              </div>
            )}

            <div className="pdp__rating">
              <span className="pdp__stars" aria-label="5 de 5 estrelas">
                {[...Array(5)].map((_, i) => <Star key={i} />)}
              </span>
              <span className="pdp__rating-score">5.0</span>
            </div>

            <div className="pdp__price-block">
              {hasDiscount && (
                <div className="pdp__price-old">{BRL.format(product.original_price)}</div>
              )}
              <div className="pdp__price-row">
                <span className="pdp__price">R$ {Math.floor(product.price)}<sup>,{String(Math.round((product.price % 1) * 100)).padStart(2, "0")}</sup></span>
                {hasDiscount && <span className="pdp__discount">{discount}% OFF</span>}
              </div>
              <div className="pdp__installments">
                <span>{installments}x de <strong>{BRL.format(product.price / installments)}</strong> sem juros</span>
              </div>
            </div>

            {product.short_description && (
              <p style={{ color: "var(--muted)", margin: "12px 0", fontSize: "0.95rem" }}>{product.short_description}</p>
            )}

            <div className="pdp__shipping">
              <div className="pdp__shipping-badge">FRETE GRÁTIS</div>
              <div className="pdp__shipping-info">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="22" height="12" rx="2"/><path d="M1 10h22"/></svg>
                <div>
                  <strong>Chegará grátis</strong> — entre 3 e 7 dias úteis
                  <br /><span className="muted small">Ribeirão Preto e região</span>
                </div>
              </div>
            </div>

            <div className="pdp__stock">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
              <span>{product.stock > 0 ? "Estoque disponível" : "Indisponível"}</span>
            </div>

            <div className="pdp__qty-row">
              <span className="pdp__qty-label">Quantidade:</span>
              <div className="pdp__qty">
                <button className="pdp__qty-btn" type="button" aria-label="Diminuir" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span className="pdp__qty-val">{qty}</span>
                <button className="pdp__qty-btn" type="button" aria-label="Aumentar" onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}>+</button>
              </div>
              <span className="muted small">({product.stock > 0 ? `${product.stock} disponíveis` : "sem estoque"})</span>
            </div>

            <div className="pdp__actions">
              <button className="btn btn--solid btn--lg btn--full pdp__buy" type="button" onClick={handleBuy} disabled={product.stock <= 0}>Comprar agora</button>
              <button className="btn btn--outline btn--lg btn--full" type="button" onClick={handleAdd} disabled={product.stock <= 0}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                Adicionar ao carrinho
              </button>
            </div>

            <div className="pdp__guarantees">
              <div className="pdp__guarantee">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <div><strong>Compra Garantida</strong><span className="muted small">Receba o produto que está esperando ou devolvemos o dinheiro</span></div>
              </div>
              <div className="pdp__guarantee">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                <div><strong>Devolução grátis</strong><span className="muted small">Você tem 30 dias a partir da data de recebimento</span></div>
              </div>
              <div className="pdp__guarantee">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3"/></svg>
                <div><strong>3 meses de garantia</strong><span className="muted small">Garantia de fábrica</span></div>
              </div>
            </div>

            {/* Payment methods */}
            <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {product.accepts_pix ? <span className="badge badge--soft">Pix</span> : null}
              {product.accepts_card ? <span className="badge badge--soft">Cartão</span> : null}
              {product.accepts_boleto ? <span className="badge badge--soft">Boleto</span> : null}
            </div>
          </div>
        </div>
      </section>

      {/* Specs */}
      {hasSpecs && (
        <section className="ml-section" id="caracteristicas">
          <div className="container">
            <div className="ml-card">
              <div className="ml-card__header"><h2 className="ml-card__title">Características do produto</h2></div>
              <div className="ml-specs">
                {groupedSpecs.length > 0 ? (
                  /* New grouped format */
                  groupedSpecs.map((group, gIdx) => (
                    <div key={gIdx} className="ml-specs__group">
                      <h3 className="ml-specs__subtitle">{group.group}</h3>
                      <table className="ml-specs__table"><tbody>
                        {group.specs.map((spec, sIdx) => (
                          <tr key={sIdx}><td>{spec.label}</td><td>{spec.value}</td></tr>
                        ))}
                      </tbody></table>
                      {gIdx < groupedSpecs.length - 1 && <div className="ml-specs__divider" />}
                    </div>
                  ))
                ) : (
                  /* Legacy flat format */
                  <div className="ml-specs__group">
                    <table className="ml-specs__table"><tbody>
                      {flatSpecs.map(([k, v], i) => <tr key={i}><td>{k}</td><td>{v}</td></tr>)}
                    </tbody></table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Description */}
      {product.description && (
        <section className="ml-section" id="descricao">
          <div className="container">
            <div className="ml-card">
              <div className="ml-card__header"><h2 className="ml-card__title">Descrição</h2></div>
              <div className="ml-card__body ml-description">
                <p style={{ whiteSpace: "pre-wrap" }}>{product.description}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox is-open" onClick={() => setLightbox(false)}>
          <button className="lightbox__close" aria-label="Fechar" type="button" onClick={() => setLightbox(false)}>&times;</button>
          <img className="lightbox__img" src={images[galleryIdx]} alt="Zoom" onClick={e => e.stopPropagation()} />
          <button className="lightbox__prev" type="button" aria-label="Anterior" onClick={e => { e.stopPropagation(); setGalleryIdx(g => ((g - 1) + images.length) % images.length); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button className="lightbox__next" type="button" aria-label="Próximo" onClick={e => { e.stopPropagation(); setGalleryIdx(g => (g + 1) % images.length); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      )}
    </>
  );
}
