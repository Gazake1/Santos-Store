"use client";

import "@/styles/produto.css";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/* This is a demo product detail page. In production, data would come from an API route.
   For now we hardcode the mousepad product as the original site did. */
const PRODUCT = {
  id: "mousepad-fallen",
  name: "Mousepad Gamer Fallen Ace Speed++ Estampado Antiderrapante Borda Costurada Grande 45x45cm",
  category: "Acessórios",
  price: 197.9,
  oldPrice: 290.0,
  sold: 3100,
  rating: 4.9,
  reviewCount: 268,
  stock: 10,
  shipping: "Frete grátis — entre 3 e 7 dias úteis",
};

const GALLERY = [
  "/assets/img/Mousepad fallen.webp",
  "/assets/img/Mousepad.png",
  "/assets/img/Mousepad2.png",
  "/assets/img/sla.webp",
  "/assets/img/sla2.webp",
  "/assets/img/sla3.webp",
];

const SPECS = [
  { group: "Características principais", rows: [["Marca","Fallen"],["Linha","Ace"],["Modelo","Speed++ Grande"],["Cor","Estampado"],["Tamanho","Grande"],["Desenho impresso","Kawaii Ace"]] },
  { group: "Dimensões", rows: [["Largura","45 cm"],["Altura","45 cm"],["Espessura","4 mm"],["Peso","320 g"]] },
];

const Star = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
);

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { add, addMultiple, open: openCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [qty, setQty] = useState(1);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);

  const requireLogin = () => {
    if (!user) { localStorage.setItem("sg_redirect", window.location.pathname); router.push("/login"); return false; }
    return true;
  };

  const handleAdd = () => {
    if (!requireLogin()) return;
    addMultiple(PRODUCT.id, qty, { name: PRODUCT.name, price: PRODUCT.price, category: PRODUCT.category });
    showToast(`${PRODUCT.name} — ${qty}x adicionado ao carrinho!`, "success");
  };

  const handleBuy = () => {
    if (!requireLogin()) return;
    addMultiple(PRODUCT.id, qty, { name: PRODUCT.name, price: PRODUCT.price, category: PRODUCT.category });
    openCart();
  };

  const discount = Math.round((1 - PRODUCT.price / PRODUCT.oldPrice) * 100);

  return (
    <>
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Navegação">
        <div className="container">
          <ol className="breadcrumb__list">
            <li><Link href="/">Início</Link></li>
            <li><Link href="/vitrine">Produtos</Link></li>
            <li><Link href="/vitrine">{PRODUCT.category}</Link></li>
            <li aria-current="page">Mousepad Gamer Fallen</li>
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
                {GALLERY.map((src, i) => (
                  <button key={i} className={`gallery__thumb${i === galleryIdx ? " is-active" : ""}`} type="button" onClick={() => setGalleryIdx(i)}>
                    <img src={src} alt={`Vista ${i + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>
              <div className="gallery__main" onClick={() => setLightbox(true)}>
                <img className="gallery__img" src={GALLERY[galleryIdx]} alt={PRODUCT.name} />
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
              <span>+{PRODUCT.sold} vendidos</span>
            </div>

            <h1 className="pdp__title">{PRODUCT.name}</h1>

            <div className="pdp__rating">
              <span className="pdp__stars" aria-label={`${PRODUCT.rating} de 5 estrelas`}>
                {[...Array(5)].map((_, i) => <Star key={i} />)}
              </span>
              <span className="pdp__rating-score">{PRODUCT.rating}</span>
              <a className="pdp__rating-count" href="#avaliacoes">({PRODUCT.reviewCount} avaliações)</a>
            </div>

            <div className="pdp__price-block">
              <div className="pdp__price-old">{BRL.format(PRODUCT.oldPrice)}</div>
              <div className="pdp__price-row">
                <span className="pdp__price">R$ {Math.floor(PRODUCT.price)}<sup>,{String(Math.round((PRODUCT.price % 1) * 100)).padStart(2, "0")}</sup></span>
                <span className="pdp__discount">{discount}% OFF</span>
              </div>
              <div className="pdp__installments">
                <span>6x de <strong>{BRL.format(PRODUCT.price / 6)}</strong> sem juros</span>
              </div>
              <a className="pdp__payment-link" href="#meios-pagamento">Ver os meios de pagamento</a>
            </div>

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
              <span>Estoque disponível</span>
            </div>

            <div className="pdp__qty-row">
              <span className="pdp__qty-label">Quantidade:</span>
              <div className="pdp__qty">
                <button className="pdp__qty-btn" type="button" aria-label="Diminuir" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span className="pdp__qty-val">{qty}</span>
                <button className="pdp__qty-btn" type="button" aria-label="Aumentar" onClick={() => setQty(Math.min(PRODUCT.stock, qty + 1))}>+</button>
              </div>
              <span className="muted small">(+{PRODUCT.stock} disponíveis)</span>
            </div>

            <div className="pdp__actions">
              <button className="btn btn--solid btn--lg btn--full pdp__buy" type="button" onClick={handleBuy}>Comprar agora</button>
              <button className="btn btn--outline btn--lg btn--full" type="button" onClick={handleAdd}>
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
          </div>
        </div>
      </section>

      {/* Specs */}
      <section className="ml-section" id="caracteristicas">
        <div className="container">
          <div className="ml-card">
            <div className="ml-card__header"><h2 className="ml-card__title">Características do produto</h2></div>
            <div className="ml-specs">
              {SPECS.map((s, si) => (
                <div key={si}>
                  {si > 0 && <div className="ml-specs__divider" />}
                  <div className="ml-specs__group">
                    <h3 className="ml-specs__subtitle">{s.group}</h3>
                    <table className="ml-specs__table"><tbody>
                      {s.rows.map(([k, v], ri) => <tr key={ri}><td>{k}</td><td>{v}</td></tr>)}
                    </tbody></table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="ml-section" id="descricao">
        <div className="container">
          <div className="ml-card">
            <div className="ml-card__header"><h2 className="ml-card__title">Descrição</h2></div>
            <div className="ml-card__body ml-description">
              <p><strong>Mousepad Gamer Fallen Ace Speed++</strong> é a escolha perfeita para quem busca controle total nos games. Com superfície Speed otimizada, proporciona movimentos rápidos com excelente frenagem. Borda costurada premium que evita desfiamento. Base antiderrapante de borracha natural que se adapta a qualquer superfície.</p>
              <ul>
                <li>Superfície Speed++ otimizada para FPS</li>
                <li>Borda costurada premium reforçada</li>
                <li>Base antiderrapante de borracha natural</li>
                <li>Tamanho grande (45×45cm) — ideal para baixa sensibilidade</li>
                <li>Espessura de 4mm para conforto prolongado</li>
                <li>Compatível com todos os tipos de mouse</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox is-open" onClick={() => setLightbox(false)}>
          <button className="lightbox__close" aria-label="Fechar" type="button" onClick={() => setLightbox(false)}>&times;</button>
          <img className="lightbox__img" src={GALLERY[galleryIdx]} alt="Zoom" onClick={e => e.stopPropagation()} />
          <button className="lightbox__prev" type="button" aria-label="Anterior" onClick={e => { e.stopPropagation(); setGalleryIdx(g => ((g - 1) + GALLERY.length) % GALLERY.length); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button className="lightbox__next" type="button" aria-label="Próximo" onClick={e => { e.stopPropagation(); setGalleryIdx(g => (g + 1) % GALLERY.length); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      )}
    </>
  );
}
