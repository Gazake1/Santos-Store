"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import ProductCard from "@/components/ProductCard";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function normalize(str: string) {
  return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/* ── Carousel ── */
interface BannerData {
  id: number;
  image_url: string;
  alt_text: string;
  link_url: string;
  bg1: string;
  bg2: string;
}

const FALLBACK_BANNERS: BannerData[] = [
  { id: 1, image_url: "/assets/img/sla.webp", alt_text: "Promoção 1", link_url: "", bg1: "rgba(197,30,48,.20)", bg2: "rgba(255,255,255,.06)" },
  { id: 2, image_url: "/assets/img/sla2.webp", alt_text: "Promoção 2", link_url: "", bg1: "rgba(255,255,255,.08)", bg2: "rgba(197,30,48,.14)" },
  { id: 3, image_url: "/assets/img/sla3.webp", alt_text: "Promoção 3", link_url: "", bg1: "rgba(197,30,48,.16)", bg2: "rgba(0,0,0,.10)" },
];

function Carousel() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [banners, setBanners] = useState<BannerData[]>(FALLBACK_BANNERS);
  const touchStart = useRef(0);

  useEffect(() => {
    fetch("/api/banners")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.banners?.length) setBanners(d.banners); })
      .catch(() => {});
  }, []);

  const total = banners.length;
  const goTo = useCallback((i: number) => setIndex(((i % total) + total) % total), [total]);
  const next = useCallback(() => goTo(index + 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1), [index, goTo]);

  useEffect(() => {
    if (isPaused || total === 0) return;
    const timer = setInterval(() => goTo(index + 1), 5500);
    return () => clearInterval(timer);
  }, [index, isPaused, goTo, total]);

  useEffect(() => {
    const handler = () => { if (document.hidden) setIsPaused(true); else setIsPaused(false); };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  if (total === 0) return null;

  return (
    <section className="homeHero" aria-label="Promoções">
      <div
        className="carousel"
        aria-roledescription="carousel"
        aria-label="Banners promocionais"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={e => { touchStart.current = e.changedTouches[0].screenX; }}
        onTouchEnd={e => {
          const diff = touchStart.current - e.changedTouches[0].screenX;
          if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
        }}
        onKeyDown={e => { if (e.key === "ArrowLeft") prev(); if (e.key === "ArrowRight") next(); }}
        tabIndex={0}
      >
        <div className="carousel__track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {banners.map(b => (
            <article key={b.id} className="slide" style={{ "--bg1": b.bg1, "--bg2": b.bg2 } as React.CSSProperties}>
              <div className="mediaPlaceholder">
                {b.link_url ? (
                  <a href={b.link_url}><img src={b.image_url} alt={b.alt_text || ""} /></a>
                ) : (
                  <img src={b.image_url} alt={b.alt_text || ""} />
                )}
              </div>
            </article>
          ))}
        </div>

        <button className="carousel__btn carousel__btn--prev" type="button" aria-label="Banner anterior" onClick={prev}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button className="carousel__btn carousel__btn--next" type="button" aria-label="Próximo banner" onClick={next}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>

        <div className="carousel__dots" role="tablist" aria-label="Navegação do carrossel">
          {banners.map((_, i) => (
            <button key={i} className={`dot${i === index ? " is-active" : ""}`} type="button" role="tab" aria-label={`Banner ${i + 1}`} aria-selected={i === index} onClick={() => setIndex(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [sort, setSort] = useState("relevancia");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [allProducts, setAllProducts] = useState<{ id: string; name: string; category: string; price: number; sold: number; tag: string; image: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);

  /* Load DB products */
  useEffect(() => {
    fetch("/api/products")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.products?.length) {
          const dbItems = data.products.map((p: Record<string, unknown>) => ({
            id: `db-${p.id}`,
            name: p.title as string,
            category: (p.category as string) || "",
            price: p.price as number,
            sold: (p.sold as number) || 0,
            tag: (p.tag as string) || "",
            image: (Array.isArray(p.images) && p.images.length > 0) ? p.images[0] : "",
            slug: (p.slug as string) || "",
          }));
          setAllProducts(dbItems);
        }
        setLoading(false);
      })
      .catch(() => { setLoading(false); });
  }, []);

  /* Read query param on mount */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q") || "";
    if (q) { setQuery(q); setTimeout(() => document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" }), 300); }
  }, []);

  const filtered = (() => {
    let list = [...allProducts];
    if (query) { const q = normalize(query); list = list.filter(p => normalize(p.name).includes(q) || normalize(p.category).includes(q)); }
    if (maxPrice) list = list.filter(p => p.price <= maxPrice);
    switch (sort) {
      case "menor-preco": list.sort((a, b) => a.price - b.price); break;
      case "maior-preco": list.sort((a, b) => b.price - a.price); break;
      case "mais-vendidos": list.sort((a, b) => b.sold - a.sold); break;
      default: list.sort((a, b) => (b.sold * 2 - b.price) - (a.sold * 2 - a.price));
    }
    return list;
  })();

  return (
    <>
      <Header />
      <main id="main-content">
        {/* Hero Carousel */}
        <Carousel />

        {/* Serviços */}
        <section className="section" id="servicos">
          <div className="container">
            <div className="section__head">
              <div>
                <h2 className="section__title">Serviços técnicos gamer</h2>
                <p className="section__desc">Do básico ao avançado — padrão profissional e foco em desempenho.</p>
              </div>
            </div>

            <div className="grid grid--3">
              <article className="card card--service">
                <div className="card__icon" aria-hidden="true">🖥️</div>
                <h3>Montagem de PC Gamer</h3>
                <p>Você traz as peças ou a gente compra tudo e monta conforme o objetivo.</p>
                <ul className="list" role="list">
                  <li>Organização de cabos</li>
                  <li>Testes e validação</li>
                  <li>Ajustes iniciais</li>
                </ul>
                <Link className="btn btn--outline btn--full" href="/servicos/monte-seu-pc">Quero montar</Link>
              </article>

              <article className="card card--service">
                <div className="card__icon" aria-hidden="true">🧹</div>
                <h3>Limpeza (básica → avançada)</h3>
                <p>Desmontagem completa, organização de cabos e troca de pasta térmica.</p>
                <ul className="list" role="list">
                  <li>Remove poeira</li>
                  <li>Melhora temperaturas</li>
                  <li>Mais estabilidade</li>
                </ul>
                <Link className="btn btn--outline btn--full" href="/servicos/limpeza">Quero orçamento</Link>
              </article>

              <article className="card card--service">
                <div className="card__icon" aria-hidden="true">🚀</div>
                <h3>Upgrade + Otimização</h3>
                <p>Melhorias no PC/notebook e ajustes focados em FPS e estabilidade.</p>
                <ul className="list" role="list">
                  <li>Melhor custo-benefício</li>
                  <li>Configuração e ajustes</li>
                  <li>Ganho real de performance</li>
                </ul>
                <Link className="btn btn--outline btn--full" href="/servicos/upgrade">Quero upgrade</Link>
              </article>
            </div>
          </div>
        </section>

        {/* Produtos */}
        <section className="section" id="produtos">
          <div className="container">
            <div className="section__head">
              <div>
                <h2 className="section__title">Vitrine de produtos</h2>
                <p className="section__desc">Periféricos, hardware e upgrades — filtros rápidos e carrinho.</p>
              </div>
            </div>

            <div className="toolbar" role="region" aria-label="Filtros de vitrine">
              <div className="toolbar__left">
                <label className="field field--inline">
                  <span className="field__label">Ordenar</span>
                  <select value={sort} onChange={e => setSort(e.target.value)}>
                    <option value="relevancia">Relevância</option>
                    <option value="menor-preco">Menor preço</option>
                    <option value="maior-preco">Maior preço</option>
                    <option value="mais-vendidos">Mais vendidos</option>
                  </select>
                </label>

                <label className="field field--inline">
                  <span className="field__label">Preço até</span>
                  <input type="number" min="0" step="50" placeholder="Ex.: 2500" value={maxPrice ?? ""} onChange={e => { const v = Number(e.target.value); setMaxPrice(Number.isFinite(v) && v > 0 ? v : null); }} />
                </label>

                <button className="btn btn--ghost" type="button" onClick={() => { setSort("relevancia"); setMaxPrice(null); setQuery(""); }}>Limpar filtros</button>
              </div>

              <div className="toolbar__right">
                <span className="pill" aria-live="polite">{filtered.length} {filtered.length === 1 ? "item" : "itens"}</span>
              </div>
            </div>

            <div className="products" aria-live="polite">
              {loading ? (
                <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px" }}>
                  <p className="muted">Carregando produtos...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px" }}>
                  <h3 style={{ marginBottom: 8 }}>Nenhum produto cadastrado ainda</h3>
                  <p className="muted">O administrador pode adicionar produtos pelo painel administrativo.</p>
                </div>
              ) : (
                filtered.map(p => <ProductCard key={p.id} product={p} />)
              )}
            </div>

            <div className="vitrine-cta">
              <Link className="btn btn--solid btn--lg" href="/vitrine">
                Ver todos os produtos
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
