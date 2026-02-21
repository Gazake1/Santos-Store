"use client";

import "@/styles/admin.css";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/lib/toast-context";

interface Product {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
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
  title: "", short_description: "", description: "", category: "", tag: "",
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
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        alert("Acesso negado. Apenas administradores podem acessar esta página.");
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

  useEffect(() => {
    if (token) { loadStats(); loadProducts(); }
  }, [token, loadStats, loadProducts]);

  /* ── Modal controls ── */
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_PRODUCT });
    setPendingFiles([]);
    setExistingImages([]);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      title: p.title || "", short_description: p.short_description || "", description: p.description || "",
      category: p.category || "", tag: p.tag || "",
      price: p.price || 0, original_price: p.original_price || 0, installment_count: p.installment_count || 0,
      stock: p.stock ?? 0, sold: p.sold ?? 0,
      accepts_card: !!p.accepts_card, accepts_pix: !!p.accepts_pix, accepts_boleto: !!p.accepts_boleto,
      active: !!p.active, featured: !!p.featured,
    });
    setExistingImages(Array.isArray(p.images) ? [...p.images] : []);
    setPendingFiles([]);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingId(null); };

  /* ── Save product ── */
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { showToast("Título é obrigatório", "error"); return; }
    if (form.price <= 0) { showToast("Preço deve ser maior que zero", "error"); return; }

    setSaving(true);
    try {
      let product: Product;
      if (editingId) {
        const res = await fetch(`/api/admin/products/${editingId}`, { method: "PUT", headers: headers(), body: JSON.stringify(form) });
        if (!res.ok) throw new Error((await res.json()).error || "Erro");
        product = (await res.json()).product ?? (await (await fetch(`/api/admin/products`, { headers: headers() })).json()).products?.find((p: Product) => p.id === editingId);

        // Remove deleted existing images
        const serverImages = product?.images || [];
        const removed = serverImages.filter((img: string) => !existingImages.includes(img));
        for (const img of removed) {
          await fetch(`/api/admin/products/${editingId}/images`, { method: "DELETE", headers: headers(), body: JSON.stringify({ imagePath: img }) }).catch(() => {});
        }
      } else {
        const res = await fetch("/api/admin/products", { method: "POST", headers: headers(), body: JSON.stringify(form) });
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
    </div>
  );
}
