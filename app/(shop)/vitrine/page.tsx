"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

const CATEGORIES = ["Todos","Notebook","PC Gamer","Monitor","Placa de Vídeo","Processador","Mouse","Teclado","Headset","Mousepad","SSD","Memória RAM","Cadeira","Acessórios"];

interface VProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  sold: number;
  tag: string;
  image: string;
  slug: string;
}

function normalize(str: string) {
  return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function VitrinePage() {
  const [allProducts, setAllProducts] = useState<VProduct[]>([]);
  const [category, setCategory] = useState("Todos");
  const [sort, setSort] = useState("relevancia");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  /* Load DB products */
  useEffect(() => {
    fetch("/api/products")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.products?.length) {
          const dbProducts: VProduct[] = data.products.map((p: Record<string, unknown>) => ({
            id: `db-${p.id}`,
            name: p.title as string,
            category: (p.category as string) || "",
            price: p.price as number,
            sold: (p.sold as number) || 0,
            tag: (p.tag as string) || "",
            image: (Array.isArray(p.images) && p.images.length > 0) ? p.images[0] : "",
            slug: p.slug as string || "",
          }));
          setAllProducts(dbProducts);
        }
        setLoading(false);
      })
      .catch(() => { setLoading(false); });
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q") || "";
    if (q) setQuery(q);
  }, []);

  const filtered = (() => {
    let list = [...allProducts];
    if (category !== "Todos") list = list.filter(p => p.category === category);
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

  const clearFilters = () => { setCategory("Todos"); setSort("relevancia"); setMaxPrice(null); setQuery(""); };

  return (
    <>
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Navegação">
        <div className="container">
          <ol className="breadcrumb__list">
            <li><Link href="/">Início</Link></li>
            <li aria-current="page">Vitrine</li>
          </ol>
        </div>
      </nav>

      {/* Hero */}
      <section className="vitrine-hero">
        <div className="container">
          <h1 className="vitrine-hero__title">Vitrine Santos Store</h1>
          <p className="vitrine-hero__desc">Tudo para seu setup gamer em um só lugar. Navegue por categorias ou explore todos os produtos.</p>
        </div>
      </section>

      {/* Category chips */}
      <section className="vitrine-cats" id="catalogo">
        <div className="container">
          <div className="cats__inner">
            {CATEGORIES.map(cat => (
              <button key={cat} className={`chip${cat === category ? " is-active" : ""}`} type="button" onClick={() => setCategory(cat)}>
                {cat === "Todos" ? "Todos" : cat + (cat === "Notebook" ? "s" : cat === "Monitor" ? "es" : "")}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products grid */}
      <section className="section" id="vitrine-grid">
        <div className="container">
          <div className="toolbar" role="region" aria-label="Filtros">
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
                <input type="number" min="0" step="100" placeholder="Ex.: 5000" value={maxPrice ?? ""} onChange={e => { const v = Number(e.target.value); setMaxPrice(Number.isFinite(v) && v > 0 ? v : null); }} />
              </label>

              <button className="btn btn--ghost" type="button" onClick={clearFilters}>Limpar filtros</button>
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
                <h3 style={{ marginBottom: 8 }}>Nenhum produto encontrado</h3>
                <p className="muted">Nenhum produto cadastrado ainda. O administrador pode adicionar produtos pelo painel.</p>
              </div>
            ) : (
              filtered.map(p => <ProductCard key={p.id} product={p} />)
            )}
          </div>
        </div>
      </section>
    </>
  );
}
