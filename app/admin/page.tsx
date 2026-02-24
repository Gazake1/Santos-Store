"use client";

import "@/styles/admin.css";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/lib/toast-context";
import { PRODUCT_TYPES, buildEmptySpecs, type SpecGroupData } from "@/lib/product-types";

interface Product {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  product_type: string;
  tag: string;
  price: number;
  original_price: number;
  installment_count: number;
  stock: number;
  sold: number;
  accepts_card: boolean;
  accepts_pix: boolean;
  accepts_boleto: boolean;
  active: boolean;
  featured: boolean;
  images: string[];
  specs: SpecGroupData[] | Record<string, string>;
}

interface Banner {
  id: number;
  image_url: string;
  alt_text: string;
  link_url: string;
  bg1: string;
  bg2: string;
  sort_order: number;
  active: number;
}

interface Stats {
  totalUsers: number;
  totalProducts: number;
  activeProducts: number;
  totalSold: number;
}

const money = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const truncate = (s: string, len = 40) => (!s ? "—" : s.length > len ? s.slice(0, len) + "…" : s);

const EMPTY_PRODUCT = {
  title: "", short_description: "", description: "", category: "", product_type: "", tag: "",
  price: 0, original_price: 0, installment_count: 0, stock: 0, sold: 0,
  accepts_card: true, accepts_pix: true, accepts_boleto: false, active: true, featured: false,
};

export default function AdminPage() {
  const { user, token, logout } = useAuth();
  const { toggle: toggleTheme } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [specGroups, setSpecGroups] = useState<SpecGroupData[]>([]);
  const [saving, setSaving] = useState(false);

  /* Banner state */
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null);
  const [bannerForm, setBannerForm] = useState({ image_url: "", alt_text: "", link_url: "", bg1: "rgba(197,30,48,.20)", bg2: "rgba(255,255,255,.06)", sort_order: 0, active: true });
  const [savingBanner, setSavingBanner] = useState(false);
  const [bannerPendingFile, setBannerPendingFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  const headers = useCallback((json = true) => {
    const h: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (json) h["Content-Type"] = "application/json";
    return h;
  }, [token]);

  /* ── Auth guard ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      const t = localStorage.getItem("sg_token");
      const raw = localStorage.getItem("sg_user");
      let u: { role?: string } | null = null;
      try { u = raw ? JSON.parse(raw) : null; } catch { /* */ }
      if (!t || !u || u.role !== "admin") {
        router.replace("/login");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [user, router]);

  /* ── Load data ── */
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { headers: headers() });
      if (res.ok) setStats(await res.json());
    } catch { /* */ }
  }, [headers]);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/products", { headers: headers() });
      if (res.ok) { const d = await res.json(); setProducts(d.products || []); }
    } catch { /* */ }
  }, [headers]);

  const loadBanners = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/banners", { headers: headers() });
      if (res.ok) { const d = await res.json(); setBanners(d.banners || []); }
    } catch { /* */ }
  }, [headers]);

  useEffect(() => {
    if (token) { loadStats(); loadProducts(); loadBanners(); }
  }, [token, loadStats, loadProducts, loadBanners]);

  /* ── Modal controls ── */
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_PRODUCT });
    setPendingFiles([]);
    setExistingImages([]);
    setSpecGroups([]);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      title: p.title || "", short_description: p.short_description || "", description: p.description || "",
      category: p.category || "", product_type: p.product_type || "", tag: p.tag || "",
      price: p.price || 0, original_price: p.original_price || 0, installment_count: p.installment_count || 0,
      stock: p.stock ?? 0, sold: p.sold ?? 0,
      accepts_card: !!p.accepts_card, accepts_pix: !!p.accepts_pix, accepts_boleto: !!p.accepts_boleto,
      active: !!p.active, featured: !!p.featured,
    });
    // Load existing specs: support both new array format and legacy object format
    if (Array.isArray(p.specs)) {
      setSpecGroups(p.specs);
    } else if (p.specs && typeof p.specs === "object" && Object.keys(p.specs).length > 0) {
      // Convert legacy { key: value } to new format
      setSpecGroups([{ group: "Características", specs: Object.entries(p.specs).map(([label, value]) => ({ label, value: String(value) })) }]);
    } else {
      if (p.product_type && PRODUCT_TYPES[p.product_type]) {
        setSpecGroups(buildEmptySpecs(p.product_type));
      } else {
        setSpecGroups([]);
      }
    }
    setExistingImages(Array.isArray(p.images) ? [...p.images] : []);
    setPendingFiles([]);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingId(null); };

  /* ── Banner modal controls ── */
  const openCreateBanner = () => {
    setEditingBannerId(null);
    setBannerForm({ image_url: "", alt_text: "", link_url: "", bg1: "rgba(197,30,48,.20)", bg2: "rgba(255,255,255,.06)", sort_order: banners.length, active: true });
    setBannerPendingFile(null);
    setBannerModalOpen(true);
  };

  const openEditBanner = (b: Banner) => {
    setEditingBannerId(b.id);
    setBannerForm({
      image_url: b.image_url || "", alt_text: b.alt_text || "", link_url: b.link_url || "",
      bg1: b.bg1 || "rgba(197,30,48,.20)", bg2: b.bg2 || "rgba(255,255,255,.06)",
      sort_order: b.sort_order ?? 0, active: !!b.active,
    });
    setBannerPendingFile(null);
    setBannerModalOpen(true);
  };

  const closeBannerModal = () => { setBannerModalOpen(false); setEditingBannerId(null); setBannerPendingFile(null); };

  const saveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    let imageUrl = bannerForm.image_url;

    // Upload file if selected
    if (bannerPendingFile) {
      const fd = new FormData();
      fd.append("image", bannerPendingFile);
      try {
        const uploadRes = await fetch("/api/admin/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
        if (!uploadRes.ok) throw new Error((await uploadRes.json()).error || "Erro no upload");
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      } catch (err: unknown) { showToast((err as Error).message, "error"); return; }
    }

    if (!imageUrl.trim()) { showToast("Selecione uma imagem ou informe a URL", "error"); return; }
    setSavingBanner(true);
    try {
      const url = editingBannerId ? `/api/admin/banners/${editingBannerId}` : "/api/admin/banners";
      const method = editingBannerId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify({ ...bannerForm, image_url: imageUrl, active: bannerForm.active }) });
      if (!res.ok) throw new Error((await res.json()).error || "Erro");
      showToast(editingBannerId ? "Banner atualizado!" : "Banner criado!", "success");
      closeBannerModal();
      loadBanners();
    } catch (err: unknown) { showToast((err as Error).message, "error"); }
    setSavingBanner(false);
  };

  const deleteBanner = async (b: Banner) => {
    if (!confirm(`Excluir banner "${b.alt_text || b.image_url}"?`)) return;
    try {
      const res = await fetch(`/api/admin/banners/${b.id}`, { method: "DELETE", headers: headers() });
      if (!res.ok) throw new Error("Erro ao excluir");
      showToast("Banner excluído", "success");
      loadBanners();
    } catch (err: unknown) { showToast((err as Error).message, "error"); }
  };

  /* ── Save product ── */
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { showToast("Título é obrigatório", "error"); return; }
    if (form.price <= 0) { showToast("Preço deve ser maior que zero", "error"); return; }

    // Filter out empty spec values before saving
    const cleanedSpecs = specGroups.map(g => ({
      ...g,
      specs: g.specs.filter(s => s.value.trim() !== ""),
    })).filter(g => g.specs.length > 0);

    const formData = { ...form, specs: cleanedSpecs };

    setSaving(true);
    try {
      let product: Product;
      if (editingId) {
        const res = await fetch(`/api/admin/products/${editingId}`, { method: "PUT", headers: headers(), body: JSON.stringify(formData) });
        if (!res.ok) throw new Error((await res.json()).error || "Erro");
        product = (await res.json()).product ?? (await (await fetch(`/api/admin/products`, { headers: headers() })).json()).products?.find((p: Product) => p.id === editingId);

        // Remove deleted existing images
        const serverImages = product?.images || [];
        const removed = serverImages.filter((img: string) => !existingImages.includes(img));
        for (const img of removed) {
          await fetch(`/api/admin/products/${editingId}/images`, { method: "DELETE", headers: headers(), body: JSON.stringify({ imagePath: img }) }).catch(() => {});
        }
      } else {
        const res = await fetch("/api/admin/products", { method: "POST", headers: headers(), body: JSON.stringify(formData) });
        if (!res.ok) throw new Error((await res.json()).error || "Erro");
        product = (await res.json()).product;
      }

      // Upload pending files
      if (pendingFiles.length > 0 && product) {
        const fd = new FormData();
        pendingFiles.forEach(f => fd.append("images", f));
        await fetch(`/api/admin/products/${product.id}/images`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      }

      showToast(editingId ? "Produto atualizado!" : "Produto criado!", "success");
      closeModal();
      loadProducts();
      loadStats();
    } catch (err: unknown) {
      showToast((err as Error).message, "error");
    }
    setSaving(false);
  };

  /* ── Delete product ── */
  const deleteProduct = async (p: Product) => {
    if (!confirm(`Excluir "${p.title}"?\nEssa ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE", headers: headers() });
      if (!res.ok) throw new Error("Erro ao excluir");
      showToast("Produto excluído", "success");
      loadProducts();
      loadStats();
    } catch (err: unknown) { showToast((err as Error).message, "error"); }
  };

  /* ── Image handling ── */
  const onFilesSelected = (files: FileList | File[]) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith("image/"));
    setPendingFiles(prev => [...prev, ...imgs]);
  };

  const removeExisting = (i: number) => setExistingImages(prev => prev.filter((_, idx) => idx !== i));
  const removePending = (i: number) => setPendingFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleLogout = () => { logout(); router.push("/"); };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="admin">
      {/* Header */}
      <header className="admin__header">
        <div className="container admin__header-inner">
          <div className="admin__header-left">
            <Link className="brand" href="/" aria-label="Santos Store">
              <img className="brand__logo" src="/assets/LOGO SG VERMELHA PNG.png" alt="Santos Store Logo" style={{ height: 36 }} />
              <span className="brand__text"><strong className="brand__name">Santos Store</strong></span>
            </Link>
            <span className="admin__badge">Admin</span>
          </div>
          <div className="admin__header-actions">
            <button className="themeBtn" type="button" aria-label="Alternar tema" onClick={toggleTheme}>
              <svg className="themeBtn__icon themeBtn__icon--sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              <svg className="themeBtn__icon themeBtn__icon--moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
            <Link className="btn btn--ghost" href="/minha-conta">Minha Conta</Link>
            <button className="btn btn--ghost" type="button" onClick={handleLogout}>Sair</button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 4 }}>Painel Administrativo</h1>
        <p style={{ color: "var(--muted)", marginBottom: 24 }}>Gerencie produtos, veja estatísticas e controle sua loja.</p>

        {/* Stats */}
        <div className="admin__stats">
          {[
            { label: "Usuários", value: stats?.totalUsers },
            { label: "Produtos", value: stats?.totalProducts },
            { label: "Ativos", value: stats?.activeProducts },
            { label: "Vendidos", value: stats?.totalSold },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-card__value">{s.value ?? "—"}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Banners section */}
        <section className="admin__section">
          <div className="admin__section-head">
            <h2>Banners / Propagandas</h2>
            <button className="btn btn--solid" type="button" onClick={openCreateBanner}>+ Novo Banner</button>
          </div>

          {banners.length === 0 ? (
            <div className="admin__empty">
              <div className="admin__empty-icon">🖼️</div>
              <p style={{ fontWeight: 600 }}>Nenhum banner cadastrado</p>
              <p className="small muted">Clique em &quot;Novo Banner&quot; para adicionar.</p>
            </div>
          ) : (
            <table className="admin__table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Preview</th>
                  <th>Alt Text</th>
                  <th>Link</th>
                  <th style={{ textAlign: "center" }}>Ordem</th>
                  <th style={{ textAlign: "center" }}>Ativo</th>
                  <th style={{ width: 140, textAlign: "center" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {banners.map(b => (
                  <tr key={b.id}>
                    <td><img className="admin__thumb" src={b.image_url} alt={b.alt_text || ""} loading="lazy" style={{ width: 72, height: 40, objectFit: "cover", borderRadius: 4 }} /></td>
                    <td>{b.alt_text || "—"}</td>
                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.link_url || "—"}</td>
                    <td style={{ textAlign: "center" }}>{b.sort_order}</td>
                    <td style={{ textAlign: "center" }}>{b.active ? "✅" : "❌"}</td>
                    <td style={{ textAlign: "center" }}>
                      <button className="btn btn--sm btn--ghost" onClick={() => openEditBanner(b)}>Editar</button>
                      <button className="btn btn--sm btn--danger" onClick={() => deleteBanner(b)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Products section */}
        <section className="admin__section">
          <div className="admin__section-head">
            <h2>Produtos</h2>
            <button className="btn btn--solid" type="button" onClick={openCreate}>+ Novo Produto</button>
          </div>

          {products.length === 0 ? (
            <div className="admin__empty">
              <div className="admin__empty-icon">📦</div>
              <p style={{ fontWeight: 600 }}>Nenhum produto cadastrado</p>
              <p className="small muted">Clique em &quot;Novo Produto&quot; para começar.</p>
            </div>
          ) : (
            <table className="admin__table">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>Img</th>
                  <th>Título</th>
                  <th>Categoria</th>
                  <th style={{ textAlign: "right" }}>Preço</th>
                  <th style={{ textAlign: "center" }}>Estoque</th>
                  <th style={{ textAlign: "center" }}>Vendidos</th>
                  <th style={{ textAlign: "center" }}>Ativo</th>
                  <th style={{ textAlign: "center" }}>Destaque</th>
                  <th style={{ width: 140, textAlign: "center" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>{p.images?.length > 0 ? <img className="admin__thumb" src={p.images[0]} alt="" loading="lazy" /> : <span className="admin__thumb admin__thumb--empty">📷</span>}</td>
                    <td><strong>{truncate(p.title)}</strong><br /><span className="small muted">{p.slug}</span></td>
                    <td>{p.category || "—"}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{money(p.price)}</td>
                    <td style={{ textAlign: "center" }}>{p.stock}</td>
                    <td style={{ textAlign: "center" }}>{p.sold}</td>
                    <td style={{ textAlign: "center" }}>{p.active ? "✅" : "❌"}</td>
                    <td style={{ textAlign: "center" }}>{p.featured ? "⭐" : "—"}</td>
                    <td style={{ textAlign: "center" }}>
                      <button className="btn btn--sm btn--ghost" onClick={() => openEdit(p)}>Editar</button>
                      <button className="btn btn--sm btn--danger" onClick={() => deleteProduct(p)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

      {/* Product Modal */}
      {modalOpen && (
        <div className="admin__modal-backdrop active" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="admin__modal">
            <h2>{editingId ? "Editar Produto" : "Novo Produto"}</h2>
            <form className="admin__form" onSubmit={saveProduct} noValidate>
              {/* Product Type Selector */}
              <div className="admin__field admin__field--full">
                <label>Tipo do produto *</label>
                <div className="admin__type-grid">
                  {Object.entries(PRODUCT_TYPES).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      className={`admin__type-btn${form.product_type === key ? " is-active" : ""}`}
                      onClick={() => {
                        setForm(f => ({ ...f, product_type: key }));
                        setSpecGroups(buildEmptySpecs(key));
                      }}
                    >
                      <span className="admin__type-icon">{cfg.icon}</span>
                      <span className="admin__type-label">{cfg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin__field admin__field--full">
                <label>Título</label>
                <input type="text" placeholder="Nome do produto" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="admin__field admin__field--full">
                <label>Descrição curta</label>
                <input type="text" placeholder="Uma linha resumindo o produto" value={form.short_description} onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))} />
              </div>
              <div className="admin__field admin__field--full">
                <label>Descrição completa</label>
                <textarea placeholder="Detalhes, características, especificações..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="admin__form-row">
                <div className="admin__field"><label>Categoria</label><input type="text" placeholder="Ex: Periféricos, Hardware..." value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
                <div className="admin__field"><label>Tag (etiqueta)</label><input type="text" placeholder="Ex: Oferta, Novo, Top" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} /></div>
              </div>

              <div className="admin__form-row admin__form-row--3">
                <div className="admin__field"><label>Preço (R$)</label><input type="number" step="0.01" min="0" placeholder="0.00" required value={form.price || ""} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} /></div>
                <div className="admin__field"><label>Preço original (R$)</label><input type="number" step="0.01" min="0" placeholder="0.00 (desconto)" value={form.original_price || ""} onChange={e => setForm(f => ({ ...f, original_price: parseFloat(e.target.value) || 0 }))} /></div>
                <div className="admin__field"><label>Parcelas (x)</label><input type="number" min="0" max="24" placeholder="0" value={form.installment_count || ""} onChange={e => setForm(f => ({ ...f, installment_count: parseInt(e.target.value) || 0 }))} /></div>
              </div>

              <div className="admin__form-row">
                <div className="admin__field"><label>Estoque</label><input type="number" min="0" placeholder="0" value={form.stock || ""} onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))} /></div>
                <div className="admin__field"><label>Vendidos</label><input type="number" min="0" placeholder="0" value={form.sold || ""} onChange={e => setForm(f => ({ ...f, sold: parseInt(e.target.value) || 0 }))} /></div>
              </div>

              <div className="admin__switch-row">
                {[
                  { key: "accepts_card", label: "Aceita Cartão" },
                  { key: "accepts_pix", label: "Aceita Pix" },
                  { key: "accepts_boleto", label: "Aceita Boleto" },
                  { key: "active", label: "Ativo" },
                  { key: "featured", label: "Destaque" },
                ].map(s => (
                  <label className="admin__switch-item" key={s.key}>
                    <input type="checkbox" checked={(form as Record<string, unknown>)[s.key] as boolean} onChange={e => setForm(f => ({ ...f, [s.key]: e.target.checked }))} /> {s.label}
                  </label>
                ))}
              </div>

              {/* ── Dynamic Spec Fields (based on product type) ── */}
              {specGroups.length > 0 && (
                <div className="admin__field admin__field--full admin__specs-section">
                  <div className="admin__specs-header">
                    <label>Características do produto</label>
                    <span className="admin__specs-type-badge">{form.product_type && PRODUCT_TYPES[form.product_type] ? PRODUCT_TYPES[form.product_type].label : ""}</span>
                  </div>
                  {specGroups.map((group, gIdx) => {
                    const typeConfig = form.product_type ? PRODUCT_TYPES[form.product_type] : null;
                    const groupConfig = typeConfig?.groups.find(g => g.title === group.group);
                    return (
                      <div key={gIdx} className="admin__specs-group">
                        <h4 className="admin__specs-group-title">{group.group}</h4>
                        <div className="admin__specs-fields">
                          {group.specs.map((spec, sIdx) => {
                            const fieldConfig = groupConfig?.fields.find(f => f.label === spec.label);
                            return (
                              <div key={sIdx} className="admin__specs-row">
                                <span className="admin__specs-label">{spec.label}</span>
                                {fieldConfig?.type === "select" && fieldConfig.options ? (
                                  <select
                                    value={spec.value}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setSpecGroups(prev => prev.map((g, gi) =>
                                        gi === gIdx ? { ...g, specs: g.specs.map((s, si) => si === sIdx ? { ...s, value: val } : s) } : g
                                      ));
                                    }}
                                  >
                                    <option value="">Selecione...</option>
                                    {fieldConfig.options.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder={fieldConfig?.placeholder || ""}
                                    value={spec.value}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setSpecGroups(prev => prev.map((g, gi) =>
                                        gi === gIdx ? { ...g, specs: g.specs.map((s, si) => si === sIdx ? { ...s, value: val } : s) } : g
                                      ));
                                    }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Images */}
              <div className="admin__field admin__field--full">
                <label>Imagens</label>
                <div className="admin__images">
                  {existingImages.map((src, i) => (
                    <div className="admin__img-thumb" key={`ex-${i}`}>
                      <img src={src} alt={`Imagem ${i + 1}`} />
                      <button type="button" className="admin__img-remove" title="Remover" onClick={() => removeExisting(i)}>&times;</button>
                    </div>
                  ))}
                  {pendingFiles.map((file, i) => (
                    <div className="admin__img-thumb" key={`pend-${i}`}>
                      <img src={URL.createObjectURL(file)} alt={`Nova imagem ${i + 1}`} />
                      <button type="button" className="admin__img-remove" title="Remover" onClick={() => removePending(i)}>&times;</button>
                    </div>
                  ))}
                </div>
                <div className="admin__upload-zone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("dragover"); }}
                  onDragLeave={e => e.currentTarget.classList.remove("dragover")}
                  onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("dragover"); onFilesSelected(e.dataTransfer.files); }}
                >
                  📷 Clique ou arraste imagens aqui (máx. 5MB cada)
                  <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={e => { if (e.target.files) { onFilesSelected(e.target.files); e.target.value = ""; } }} />
                </div>
              </div>

              <div className="admin__modal-actions">
                <button className="btn btn--ghost" type="button" onClick={closeModal}>Cancelar</button>
                <button className="btn btn--solid" type="submit" disabled={saving}>{saving ? "Salvando…" : editingId ? "Atualizar Produto" : "Salvar Produto"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banner Modal */}
      {bannerModalOpen && (
        <div className="admin__modal-backdrop active" onClick={e => { if (e.target === e.currentTarget) closeBannerModal(); }}>
          <div className="admin__modal" style={{ maxWidth: 520 }}>
            <h2>{editingBannerId ? "Editar Banner" : "Novo Banner"}</h2>
            <form className="admin__form" onSubmit={saveBanner} noValidate>
              <div className="admin__field admin__field--full">
                <label>Imagem do Banner *</label>
                <div className="admin__upload-zone" onClick={() => bannerFileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("dragover"); }}
                  onDragLeave={e => e.currentTarget.classList.remove("dragover")}
                  onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("dragover"); const f = e.dataTransfer.files[0]; if (f?.type.startsWith("image/")) { setBannerPendingFile(f); setBannerForm(prev => ({ ...prev, image_url: URL.createObjectURL(f) })); } }}
                >
                  🖼️ Clique ou arraste uma imagem aqui (máx. 5MB)
                  <input ref={bannerFileRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) { setBannerPendingFile(f); setBannerForm(prev => ({ ...prev, image_url: URL.createObjectURL(f) })); } e.target.value = ""; }} />
                </div>
                <p className="small muted" style={{ marginTop: 6 }}>Ou cole uma URL abaixo:</p>
                <input type="text" placeholder="/assets/img/banner.webp ou https://..." value={bannerPendingFile ? bannerPendingFile.name : bannerForm.image_url} onChange={e => { setBannerPendingFile(null); setBannerForm(f => ({ ...f, image_url: e.target.value })); }} style={{ marginTop: 4 }} />
              </div>
              {(bannerForm.image_url || bannerPendingFile) && (
                <div className="admin__field admin__field--full" style={{ marginBottom: 12 }}>
                  <img src={bannerPendingFile ? URL.createObjectURL(bannerPendingFile) : bannerForm.image_url} alt="Preview" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8, border: "1px solid var(--stroke)" }} />
                </div>
              )}
              <div className="admin__field admin__field--full">
                <label>Texto alternativo (alt)</label>
                <input type="text" placeholder="Descrição do banner" value={bannerForm.alt_text} onChange={e => setBannerForm(f => ({ ...f, alt_text: e.target.value }))} />
              </div>
              <div className="admin__field admin__field--full">
                <label>Link (ao clicar)</label>
                <input type="text" placeholder="/vitrine ou https://..." value={bannerForm.link_url} onChange={e => setBannerForm(f => ({ ...f, link_url: e.target.value }))} />
              </div>
              <div className="admin__form-row">
                <div className="admin__field">
                  <label>Ordem</label>
                  <input type="number" min="0" value={bannerForm.sort_order} onChange={e => setBannerForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="admin__field" style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 22 }}>
                  <label className="admin__switch-item">
                    <input type="checkbox" checked={bannerForm.active} onChange={e => setBannerForm(f => ({ ...f, active: e.target.checked }))} /> Ativo
                  </label>
                </div>
              </div>
              <div className="admin__modal-actions">
                <button className="btn btn--ghost" type="button" onClick={closeBannerModal}>Cancelar</button>
                <button className="btn btn--solid" type="submit" disabled={savingBanner}>{savingBanner ? "Salvando…" : editingBannerId ? "Atualizar Banner" : "Salvar Banner"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
