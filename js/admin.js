/* =========================================
   Santos Store — Admin Panel (js/admin.js)
   ========================================= */

(function () {
  "use strict";

  const API = window.location.origin + "/api";

  /* ── Auth check ── */
  const token = localStorage.getItem("sg_token");
  const raw   = localStorage.getItem("sg_user");
  let user    = null;

  try { user = raw ? JSON.parse(raw) : null; } catch { /* ignore */ }

  if (!token || !user || user.role !== "admin") {
    alert("Acesso negado. Apenas administradores podem acessar esta página.");
    window.location.href = "login.html";
    return;
  }

  /* ── DOM refs ── */
  const $            = (sel) => document.querySelector(sel);
  const $$           = (sel) => document.querySelectorAll(sel);
  const themeToggle  = $("#themeToggle");
  const logoutBtn    = $("#logoutBtn");
  const statsGrid    = $("#statsGrid");
  const statUsers    = $("#statUsers");
  const statProducts = $("#statProducts");
  const statActive   = $("#statActive");
  const statSold     = $("#statSold");
  const productsWrap = $("#productsTableWrap");
  const productsEmpty= $("#productsEmpty");
  const newProductBtn= $("#newProductBtn");
  const productModal = $("#productModal");
  const modalTitle   = $("#modalTitle");
  const productForm  = $("#productForm");
  const productIdEl  = $("#productId");
  const cancelBtn    = $("#cancelProductBtn");
  const saveBtn      = $("#saveProductBtn");
  const uploadZone   = $("#uploadZone");
  const imageInput   = $("#imageInput");
  const imagePreview = $("#imagePreview");
  const toastBox     = $("#toastContainer");

  /* ── Helpers ── */
  function headers(json = true) {
    const h = { Authorization: "Bearer " + token };
    if (json) h["Content-Type"] = "application/json";
    return h;
  }

  async function api(path, opts = {}) {
    const res = await fetch(API + path, { headers: headers(opts.json !== false), ...opts });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
    return data;
  }

  function toast(msg, type = "success") {
    if (!toastBox) return;
    const el = document.createElement("div");
    el.className = "toast toast--" + type;
    el.textContent = msg;
    toastBox.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, 3500);
  }

  function money(v) {
    return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function truncate(s, len = 50) {
    if (!s) return "—";
    return s.length > len ? s.slice(0, len) + "…" : s;
  }

  /* ── Theme ── */
  function applyTheme() {
    const t = localStorage.getItem("sg_theme") || "light";
    document.documentElement.setAttribute("data-theme", t);
  }
  applyTheme();

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("sg_theme", next);
      // sync to server
      fetch(API + "/profile/theme", {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ theme: next }),
      }).catch(() => {});
    });
  }

  /* ── Logout ── */
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("sg_token");
      localStorage.removeItem("sg_user");
      window.location.href = "login.html";
    });
  }

  /* ══════════════════════════════════════
     STATS
     ══════════════════════════════════════ */

  async function loadStats() {
    try {
      const data = await api("/admin/stats");
      if (statUsers)    statUsers.textContent    = data.totalUsers ?? "—";
      if (statProducts) statProducts.textContent = data.totalProducts ?? "—";
      if (statActive)   statActive.textContent   = data.activeProducts ?? "—";
      if (statSold)     statSold.textContent     = data.totalSold ?? "—";
    } catch (err) {
      console.error("[STATS]", err);
    }
  }

  /* ══════════════════════════════════════
     PRODUCTS TABLE
     ══════════════════════════════════════ */

  let allProducts = [];

  async function loadProducts() {
    try {
      const data = await api("/admin/products");
      allProducts = data.products || [];
      renderTable();
    } catch (err) {
      toast("Erro ao carregar produtos: " + err.message, "error");
    }
  }

  function renderTable() {
    if (!productsWrap) return;

    if (allProducts.length === 0) {
      productsWrap.innerHTML = "";
      productsWrap.appendChild(productsEmpty);
      productsEmpty.style.display = "";
      return;
    }

    productsEmpty.style.display = "none";

    const table = document.createElement("table");
    table.className = "admin__table";

    table.innerHTML = `
      <thead>
        <tr>
          <th style="width:56px">Img</th>
          <th>Título</th>
          <th>Categoria</th>
          <th style="text-align:right">Preço</th>
          <th style="text-align:center">Estoque</th>
          <th style="text-align:center">Vendidos</th>
          <th style="text-align:center">Ativo</th>
          <th style="text-align:center">Destaque</th>
          <th style="width:140px;text-align:center">Ações</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    allProducts.forEach(p => {
      const imgs = Array.isArray(p.images) ? p.images : [];
      const thumb = imgs.length > 0
        ? `<img class="admin__thumb" src="${imgs[0]}" alt="" loading="lazy" />`
        : `<span class="admin__thumb admin__thumb--empty">📷</span>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${thumb}</td>
        <td><strong>${truncate(p.title, 40)}</strong><br><span class="small muted">${p.slug}</span></td>
        <td>${p.category || "—"}</td>
        <td style="text-align:right;white-space:nowrap">${money(p.price)}</td>
        <td style="text-align:center">${p.stock}</td>
        <td style="text-align:center">${p.sold}</td>
        <td style="text-align:center">${p.active ? "✅" : "❌"}</td>
        <td style="text-align:center">${p.featured ? "⭐" : "—"}</td>
        <td style="text-align:center">
          <button class="btn btn--sm btn--ghost editBtn" data-id="${p.id}">Editar</button>
          <button class="btn btn--sm btn--danger deleteBtn" data-id="${p.id}">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    productsWrap.innerHTML = "";
    productsWrap.appendChild(table);

    // bind edit / delete buttons
    table.querySelectorAll(".editBtn").forEach(btn => {
      btn.addEventListener("click", () => openEdit(Number(btn.dataset.id)));
    });
    table.querySelectorAll(".deleteBtn").forEach(btn => {
      btn.addEventListener("click", () => deleteProduct(Number(btn.dataset.id)));
    });
  }

  /* ══════════════════════════════════════
     MODAL: Create / Edit
     ══════════════════════════════════════ */

  let pendingFiles = []; // files not yet uploaded
  let existingImages = []; // already on server
  let editingProductId = null;

  function openModal() {
    productModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    productModal.classList.remove("active");
    document.body.style.overflow = "";
    productForm.reset();
    productIdEl.value = "";
    pendingFiles = [];
    existingImages = [];
    editingProductId = null;
    renderImagePreview();
  }

  function openCreate() {
    editingProductId = null;
    modalTitle.textContent = "Novo Produto";
    saveBtn.textContent = "Salvar Produto";
    productForm.reset();
    productIdEl.value = "";
    // defaults
    $("#pAcceptsCard").checked = true;
    $("#pAcceptsPix").checked = true;
    $("#pAcceptsBoleto").checked = false;
    $("#pActive").checked = true;
    $("#pFeatured").checked = false;
    pendingFiles = [];
    existingImages = [];
    renderImagePreview();
    openModal();
  }

  function openEdit(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    editingProductId = p.id;
    modalTitle.textContent = "Editar Produto";
    saveBtn.textContent = "Atualizar Produto";
    productIdEl.value = p.id;

    $("#pTitle").value          = p.title || "";
    $("#pShortDesc").value      = p.short_description || "";
    $("#pDescription").value    = p.description || "";
    $("#pCategory").value       = p.category || "";
    $("#pTag").value            = p.tag || "";
    $("#pPrice").value          = p.price || "";
    $("#pOriginalPrice").value  = p.original_price || "";
    $("#pInstallments").value   = p.installment_count || "";
    $("#pStock").value          = p.stock ?? "";
    $("#pSold").value           = p.sold ?? "";
    $("#pAcceptsCard").checked  = !!p.accepts_card;
    $("#pAcceptsPix").checked   = !!p.accepts_pix;
    $("#pAcceptsBoleto").checked= !!p.accepts_boleto;
    $("#pActive").checked       = !!p.active;
    $("#pFeatured").checked     = !!p.featured;

    existingImages = Array.isArray(p.images) ? [...p.images] : [];
    pendingFiles = [];
    renderImagePreview();
    openModal();
  }

  /* ── Image preview ── */
  function renderImagePreview() {
    if (!imagePreview) return;
    imagePreview.innerHTML = "";

    // existing (on server)
    existingImages.forEach((src, i) => {
      const div = document.createElement("div");
      div.className = "admin__img-thumb";
      div.innerHTML = `
        <img src="${src}" alt="Imagem ${i + 1}" />
        <button type="button" class="admin__img-remove" data-type="existing" data-index="${i}" title="Remover">&times;</button>
      `;
      imagePreview.appendChild(div);
    });

    // pending (local)
    pendingFiles.forEach((file, i) => {
      const div = document.createElement("div");
      div.className = "admin__img-thumb";
      const url = URL.createObjectURL(file);
      div.innerHTML = `
        <img src="${url}" alt="Nova imagem ${i + 1}" />
        <button type="button" class="admin__img-remove" data-type="pending" data-index="${i}" title="Remover">&times;</button>
      `;
      imagePreview.appendChild(div);
    });

    // bind remove buttons
    imagePreview.querySelectorAll(".admin__img-remove").forEach(btn => {
      btn.addEventListener("click", () => {
        const type  = btn.dataset.type;
        const index = Number(btn.dataset.index);
        if (type === "existing") {
          existingImages.splice(index, 1);
        } else {
          pendingFiles.splice(index, 1);
        }
        renderImagePreview();
      });
    });
  }

  /* ── Upload zone events ── */
  if (uploadZone && imageInput) {
    uploadZone.addEventListener("click", () => imageInput.click());

    uploadZone.addEventListener("dragover", e => {
      e.preventDefault();
      uploadZone.classList.add("dragover");
    });
    uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));
    uploadZone.addEventListener("drop", e => {
      e.preventDefault();
      uploadZone.classList.remove("dragover");
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
      pendingFiles.push(...files);
      renderImagePreview();
    });

    imageInput.addEventListener("change", () => {
      const files = Array.from(imageInput.files);
      pendingFiles.push(...files);
      imageInput.value = "";
      renderImagePreview();
    });
  }

  /* ── Save product ── */
  if (productForm) {
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      saveBtn.disabled = true;
      saveBtn.textContent = "Salvando…";

      const body = {
        title:             $("#pTitle").value.trim(),
        short_description: $("#pShortDesc").value.trim(),
        description:       $("#pDescription").value.trim(),
        category:          $("#pCategory").value.trim(),
        tag:               $("#pTag").value.trim(),
        price:             parseFloat($("#pPrice").value) || 0,
        original_price:    parseFloat($("#pOriginalPrice").value) || 0,
        installment_count: parseInt($("#pInstallments").value) || 0,
        stock:             parseInt($("#pStock").value) || 0,
        sold:              parseInt($("#pSold").value) || 0,
        accepts_card:      $("#pAcceptsCard").checked,
        accepts_pix:       $("#pAcceptsPix").checked,
        accepts_boleto:    $("#pAcceptsBoleto").checked,
        active:            $("#pActive").checked,
        featured:          $("#pFeatured").checked,
      };

      if (!body.title) { toast("Título é obrigatório", "error"); resetSaveBtn(); return; }
      if (body.price <= 0) { toast("Preço deve ser maior que zero", "error"); resetSaveBtn(); return; }

      try {
        let product;

        if (editingProductId) {
          /* ── UPDATE ── */
          const res = await api(`/admin/products/${editingProductId}`, {
            method: "PUT",
            body: JSON.stringify(body),
          });
          product = res.product;

          /* Handle removed existing images */
          const serverImages = product.images || [];
          const removedImages = serverImages.filter(img => !existingImages.includes(img));
          for (const img of removedImages) {
            await fetch(API + `/admin/products/${product.id}/images`, {
              method: "DELETE",
              headers: headers(),
              body: JSON.stringify({ imagePath: img }),
            }).catch(() => {});
          }
        } else {
          /* ── CREATE ── */
          const res = await api("/admin/products", {
            method: "POST",
            body: JSON.stringify(body),
          });
          product = res.product;
        }

        /* Upload pending files */
        if (pendingFiles.length > 0 && product) {
          const fd = new FormData();
          pendingFiles.forEach(f => fd.append("images", f));
          await fetch(API + `/admin/products/${product.id}/images`, {
            method: "POST",
            headers: { Authorization: "Bearer " + token },
            body: fd,
          });
        }

        toast(editingProductId ? "Produto atualizado!" : "Produto criado!", "success");
        closeModal();
        loadProducts();
        loadStats();
      } catch (err) {
        toast(err.message, "error");
      } finally {
        resetSaveBtn();
      }
    });
  }

  function resetSaveBtn() {
    saveBtn.disabled = false;
    saveBtn.textContent = editingProductId ? "Atualizar Produto" : "Salvar Produto";
  }

  /* ── Delete product ── */
  async function deleteProduct(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    if (!confirm(`Excluir "${p.title}"?\nEssa ação não pode ser desfeita.`)) return;

    try {
      await api(`/admin/products/${id}`, { method: "DELETE" });
      toast("Produto excluído", "success");
      loadProducts();
      loadStats();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  /* ── Modal events ── */
  if (newProductBtn) newProductBtn.addEventListener("click", openCreate);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  if (productModal) {
    productModal.addEventListener("click", (e) => {
      if (e.target === productModal) closeModal();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && productModal.classList.contains("active")) closeModal();
  });

  /* ══════════════════════════════════════
     INIT
     ══════════════════════════════════════ */

  loadStats();
  loadProducts();

})();
