"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const CATEGORIES = ["Todos","Notebook","PC Gamer","Monitor","Placa de Vídeo","Processador","Mouse","Teclado","Headset","Mousepad","SSD","Memória RAM","Cadeira","Acessórios"];

const PRODUCTS = [
  { id: "mousepad-fallen", name: "Mousepad Gamer Fallen Ace Speed++ 45x45cm", category: "Mousepad", price: 197.9, sold: 3100, tag: "Mais vendido", image: "/assets/img/Mousepad.png", slug: "mousepad-fallen" },
  { id: "mousepad-rise-g", name: "Mousepad Rise Gaming Grande Speed 42x29cm", category: "Mousepad", price: 79.9, sold: 1800, tag: "Oferta", image: "", slug: "" },
  { id: "mousepad-logitech-xl", name: "Mousepad Logitech G840 XL 90x40cm", category: "Mousepad", price: 249.9, sold: 920, tag: "", image: "", slug: "" },
  { id: "mouse-g502", name: "Mouse Gamer Logitech G502 HERO 25.600 DPI", category: "Mouse", price: 249.9, sold: 2400, tag: "Top", image: "", slug: "" },
  { id: "mouse-viper-v3", name: "Mouse Razer Viper V3 HyperSpeed Wireless", category: "Mouse", price: 699.9, sold: 780, tag: "Lançamento", image: "", slug: "" },
  { id: "mouse-deathadder", name: "Mouse Razer DeathAdder V3 Pro Wireless", category: "Mouse", price: 799.9, sold: 620, tag: "", image: "", slug: "" },
  { id: "mouse-gpro-x2", name: "Mouse Logitech G PRO X Superlight 2", category: "Mouse", price: 849.9, sold: 510, tag: "Premium", image: "", slug: "" },
  { id: "mouse-redragon-cobra", name: "Mouse Gamer Redragon Cobra M711 10.000 DPI", category: "Mouse", price: 89.9, sold: 4200, tag: "Custo-benefício", image: "", slug: "" },
  { id: "teclado-gpro-tkl", name: "Teclado Mecânico Logitech G PRO TKL", category: "Teclado", price: 649.9, sold: 1100, tag: "Top", image: "", slug: "" },
  { id: "teclado-razer-huntsman", name: "Teclado Razer Huntsman V3 Pro TKL", category: "Teclado", price: 1299.9, sold: 340, tag: "Premium", image: "", slug: "" },
  { id: "teclado-redragon-kumara", name: "Teclado Mecânico Redragon Kumara K552 RGB", category: "Teclado", price: 179.9, sold: 3800, tag: "Custo-benefício", image: "", slug: "" },
  { id: "teclado-hyperx-alloy", name: "Teclado HyperX Alloy Origins 60 Mecânico", category: "Teclado", price: 399.9, sold: 890, tag: "", image: "", slug: "" },
  { id: "headset-hyperx-cloud3", name: "Headset HyperX Cloud III Wireless 7.1", category: "Headset", price: 699.9, sold: 950, tag: "Top", image: "", slug: "" },
  { id: "headset-razer-kraken", name: "Headset Razer Kraken V3 X USB 7.1 Surround", category: "Headset", price: 349.9, sold: 1400, tag: "", image: "", slug: "" },
  { id: "headset-logitech-g435", name: "Headset Logitech G435 Wireless Bluetooth", category: "Headset", price: 399.9, sold: 1100, tag: "Leve", image: "", slug: "" },
  { id: "headset-redragon-zeus", name: "Headset Gamer Redragon Zeus X H510 7.1 RGB", category: "Headset", price: 199.9, sold: 2600, tag: "Custo-benefício", image: "", slug: "" },
  { id: "gpu-rtx4060", name: "Placa de Vídeo RTX 4060 8GB GDDR6 128-bit", category: "Placa de Vídeo", price: 2499.9, sold: 870, tag: "Top", image: "", slug: "" },
  { id: "gpu-rtx4070", name: "Placa de Vídeo RTX 4070 Super 12GB GDDR6X", category: "Placa de Vídeo", price: 3999.9, sold: 520, tag: "Performance", image: "", slug: "" },
  { id: "gpu-rx7600", name: "Placa de Vídeo AMD RX 7600 8GB GDDR6", category: "Placa de Vídeo", price: 1899.9, sold: 640, tag: "Custo-benefício", image: "", slug: "" },
  { id: "gpu-rtx4090", name: "Placa de Vídeo RTX 4090 24GB GDDR6X", category: "Placa de Vídeo", price: 13499.9, sold: 180, tag: "Entusiasta", image: "", slug: "" },
  { id: "cpu-ryzen5-7600", name: "Processador AMD Ryzen 5 7600 3.8GHz AM5", category: "Processador", price: 1149.9, sold: 1500, tag: "Custo-benefício", image: "", slug: "" },
  { id: "cpu-ryzen7-7800x3d", name: "Processador AMD Ryzen 7 7800X3D 4.2GHz AM5", category: "Processador", price: 2299.9, sold: 890, tag: "Gamer #1", image: "", slug: "" },
  { id: "cpu-i5-14600k", name: "Processador Intel Core i5-14600K 3.5GHz LGA1700", category: "Processador", price: 1599.9, sold: 720, tag: "", image: "", slug: "" },
  { id: "cpu-i7-14700k", name: "Processador Intel Core i7-14700K 3.4GHz LGA1700", category: "Processador", price: 2499.9, sold: 480, tag: "Performance", image: "", slug: "" },
  { id: "ssd-kingston-1tb", name: "SSD Kingston NV3 NVMe 1TB M.2 2280", category: "SSD", price: 449.9, sold: 2200, tag: "Oferta", image: "", slug: "" },
  { id: "ssd-samsung-980pro", name: "SSD Samsung 980 PRO NVMe 1TB 7.000MB/s", category: "SSD", price: 699.9, sold: 1100, tag: "Top", image: "", slug: "" },
  { id: "ssd-wd-black-2tb", name: "SSD WD Black SN850X 2TB NVMe Gen4", category: "SSD", price: 1199.9, sold: 420, tag: "", image: "", slug: "" },
  { id: "ram-kingston-fury-16", name: "Memória RAM Kingston Fury Beast 16GB DDR5 5200MHz", category: "Memória RAM", price: 399.9, sold: 1800, tag: "Mais vendido", image: "", slug: "" },
  { id: "ram-corsair-32", name: "Kit Memória Corsair Vengeance 32GB (2x16) DDR5 6000MHz", category: "Memória RAM", price: 849.9, sold: 920, tag: "Performance", image: "", slug: "" },
  { id: "ram-gskill-32", name: "Kit Memória G.Skill Trident Z5 RGB 32GB DDR5 6400MHz", category: "Memória RAM", price: 1099.9, sold: 340, tag: "RGB Premium", image: "", slug: "" },
  { id: "monitor-lg-27gp850", name: 'Monitor LG UltraGear 27" QHD 165Hz IPS 1ms', category: "Monitor", price: 2299.9, sold: 680, tag: "Top", image: "", slug: "" },
  { id: "monitor-samsung-24-144", name: 'Monitor Samsung Odyssey G4 24" FHD 240Hz IPS', category: "Monitor", price: 1499.9, sold: 1100, tag: "", image: "", slug: "" },
  { id: "monitor-aoc-hero-24", name: 'Monitor AOC Hero 24G2 24" FHD 144Hz IPS 1ms', category: "Monitor", price: 899.9, sold: 2100, tag: "Custo-benefício", image: "", slug: "" },
  { id: "notebook-acer-nitro5", name: "Notebook Acer Nitro 5 i5-13450H RTX 4050 16GB 512GB", category: "Notebook", price: 4999.9, sold: 480, tag: "Oferta", image: "", slug: "" },
  { id: "notebook-lenovo-legion5", name: "Notebook Lenovo Legion 5i i7-13700H RTX 4060 16GB 1TB", category: "Notebook", price: 7499.9, sold: 310, tag: "Top", image: "", slug: "" },
  { id: "notebook-asus-tuf-f15", name: "Notebook ASUS TUF Gaming F15 i5-12500H RTX 4050 8GB", category: "Notebook", price: 4299.9, sold: 590, tag: "Custo-benefício", image: "", slug: "" },
  { id: "notebook-dell-g15", name: "Notebook Dell G15 i7-13650HX RTX 4060 16GB 512GB", category: "Notebook", price: 6499.9, sold: 270, tag: "", image: "", slug: "" },
  { id: "pc-starter", name: "PC Gamer Starter — Ryzen 5 5600 + RX 6600 + 16GB", category: "PC Gamer", price: 3299.9, sold: 420, tag: "Entrada", image: "", slug: "" },
  { id: "pc-performance", name: "PC Gamer Performance — i5-14400F + RTX 4060 + 16GB", category: "PC Gamer", price: 5499.9, sold: 340, tag: "Top", image: "", slug: "" },
  { id: "pc-extreme", name: "PC Gamer Extreme — Ryzen 7 7800X3D + RTX 4070S + 32GB", category: "PC Gamer", price: 8999.9, sold: 180, tag: "Entusiasta", image: "", slug: "" },
  { id: "pc-ultra", name: "PC Gamer Ultra — i9-14900K + RTX 4090 + 64GB DDR5", category: "PC Gamer", price: 18999.9, sold: 60, tag: "Máximo", image: "", slug: "" },
  { id: "cadeira-thunderx3-tgc12", name: "Cadeira Gamer ThunderX3 TGC12 Reclinável", category: "Cadeira", price: 899.9, sold: 1200, tag: "Mais vendida", image: "", slug: "" },
  { id: "cadeira-dt3-elise", name: "Cadeira DT3 Elise Fabric Ergonômica", category: "Cadeira", price: 1499.9, sold: 560, tag: "Ergonômica", image: "", slug: "" },
  { id: "cadeira-pichau-donek", name: "Cadeira Gamer Pichau Donek II Reclinável 180°", category: "Cadeira", price: 649.9, sold: 1800, tag: "Custo-benefício", image: "", slug: "" },
  { id: "webcam-logitech-c920", name: "Webcam Logitech C920s Full HD 1080p com Tampa", category: "Acessórios", price: 349.9, sold: 780, tag: "", image: "", slug: "" },
  { id: "mic-hyperx-solocast", name: "Microfone HyperX SoloCast USB Condensador", category: "Acessórios", price: 299.9, sold: 920, tag: "Para stream", image: "", slug: "" },
  { id: "suporte-headset", name: "Suporte para Headset Gamer RGB USB Rise Mode", category: "Acessórios", price: 79.9, sold: 1400, tag: "", image: "", slug: "" },
  { id: "hub-usb-c-7p", name: "Hub USB-C 7 em 1 HDMI 4K USB 3.0 SD", category: "Acessórios", price: 149.9, sold: 650, tag: "", image: "", slug: "" },
];

function normalize(str: string) {
  return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function VitrinePage() {
  const [category, setCategory] = useState("Todos");
  const [sort, setSort] = useState("relevancia");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q") || "";
    if (q) setQuery(q);
  }, []);

  const filtered = (() => {
    let list = [...PRODUCTS];
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
            {filtered.length === 0 ? (
              <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px" }}>
                <h3 style={{ marginBottom: 8 }}>Nenhum produto encontrado</h3>
                <p className="muted">Tente remover filtros ou buscar por outro termo.</p>
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
