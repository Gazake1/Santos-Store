/* =========================================
   Santos Store — Vitrine Page JS
   Full catalog with categories & filters
   ========================================= */

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/* ── Full product catalog ── */
const PRODUCTS = [
  // ── Mousepads ──
  { id: "mousepad-fallen", name: "Mousepad Gamer Fallen Ace Speed++ 45x45cm", category: "Mousepad", price: 197.90, sold: 3100, tag: "Mais vendido", image: "../assets/img/Mousepad.png", page: "produto-mousepad.html" },
  { id: "mousepad-rise-g", name: "Mousepad Rise Gaming Grande Speed 42x29cm", category: "Mousepad", price: 79.90, sold: 1800, tag: "Oferta" },
  { id: "mousepad-logitech-xl", name: "Mousepad Logitech G840 XL 90x40cm", category: "Mousepad", price: 249.90, sold: 920, tag: "" },

  // ── Mouses ──
  { id: "mouse-g502", name: "Mouse Gamer Logitech G502 HERO 25.600 DPI", category: "Mouse", price: 249.90, sold: 2400, tag: "Top" },
  { id: "mouse-viper-v3", name: "Mouse Razer Viper V3 HyperSpeed Wireless", category: "Mouse", price: 699.90, sold: 780, tag: "Lançamento" },
  { id: "mouse-deathadder", name: "Mouse Razer DeathAdder V3 Pro Wireless", category: "Mouse", price: 799.90, sold: 620, tag: "" },
  { id: "mouse-gpro-x2", name: "Mouse Logitech G PRO X Superlight 2", category: "Mouse", price: 849.90, sold: 510, tag: "Premium" },
  { id: "mouse-redragon-cobra", name: "Mouse Gamer Redragon Cobra M711 10.000 DPI", category: "Mouse", price: 89.90, sold: 4200, tag: "Custo-benefício" },

  // ── Teclados ──
  { id: "teclado-gpro-tkl", name: "Teclado Mecânico Logitech G PRO TKL", category: "Teclado", price: 649.90, sold: 1100, tag: "Top" },
  { id: "teclado-razer-huntsman", name: "Teclado Razer Huntsman V3 Pro TKL", category: "Teclado", price: 1299.90, sold: 340, tag: "Premium" },
  { id: "teclado-redragon-kumara", name: "Teclado Mecânico Redragon Kumara K552 RGB", category: "Teclado", price: 179.90, sold: 3800, tag: "Custo-benefício" },
  { id: "teclado-hyperx-alloy", name: "Teclado HyperX Alloy Origins 60 Mecânico", category: "Teclado", price: 399.90, sold: 890, tag: "" },

  // ── Headsets ──
  { id: "headset-hyperx-cloud3", name: "Headset HyperX Cloud III Wireless 7.1", category: "Headset", price: 699.90, sold: 950, tag: "Top" },
  { id: "headset-razer-kraken", name: "Headset Razer Kraken V3 X USB 7.1 Surround", category: "Headset", price: 349.90, sold: 1400, tag: "" },
  { id: "headset-logitech-g435", name: "Headset Logitech G435 Wireless Bluetooth", category: "Headset", price: 399.90, sold: 1100, tag: "Leve" },
  { id: "headset-redragon-zeus", name: "Headset Gamer Redragon Zeus X H510 7.1 RGB", category: "Headset", price: 199.90, sold: 2600, tag: "Custo-benefício" },

  // ── Placas de Vídeo ──
  { id: "gpu-rtx4060", name: "Placa de Vídeo RTX 4060 8GB GDDR6 128-bit", category: "Placa de Vídeo", price: 2499.90, sold: 870, tag: "Top" },
  { id: "gpu-rtx4070", name: "Placa de Vídeo RTX 4070 Super 12GB GDDR6X", category: "Placa de Vídeo", price: 3999.90, sold: 520, tag: "Performance" },
  { id: "gpu-rx7600", name: "Placa de Vídeo AMD RX 7600 8GB GDDR6", category: "Placa de Vídeo", price: 1899.90, sold: 640, tag: "Custo-benefício" },
  { id: "gpu-rtx4090", name: "Placa de Vídeo RTX 4090 24GB GDDR6X", category: "Placa de Vídeo", price: 13499.90, sold: 180, tag: "Entusiasta" },

  // ── Processadores ──
  { id: "cpu-ryzen5-7600", name: "Processador AMD Ryzen 5 7600 3.8GHz AM5", category: "Processador", price: 1149.90, sold: 1500, tag: "Custo-benefício" },
  { id: "cpu-ryzen7-7800x3d", name: "Processador AMD Ryzen 7 7800X3D 4.2GHz AM5", category: "Processador", price: 2299.90, sold: 890, tag: "Gamer #1" },
  { id: "cpu-i5-14600k", name: "Processador Intel Core i5-14600K 3.5GHz LGA1700", category: "Processador", price: 1599.90, sold: 720, tag: "" },
  { id: "cpu-i7-14700k", name: "Processador Intel Core i7-14700K 3.4GHz LGA1700", category: "Processador", price: 2499.90, sold: 480, tag: "Performance" },

  // ── SSDs ──
  { id: "ssd-kingston-1tb", name: "SSD Kingston NV3 NVMe 1TB M.2 2280", category: "SSD", price: 449.90, sold: 2200, tag: "Oferta" },
  { id: "ssd-samsung-980pro", name: "SSD Samsung 980 PRO NVMe 1TB 7.000MB/s", category: "SSD", price: 699.90, sold: 1100, tag: "Top" },
  { id: "ssd-wd-black-2tb", name: "SSD WD Black SN850X 2TB NVMe Gen4", category: "SSD", price: 1199.90, sold: 420, tag: "" },

  // ── Memória RAM ──
  { id: "ram-kingston-fury-16", name: "Memória RAM Kingston Fury Beast 16GB DDR5 5200MHz", category: "Memória RAM", price: 399.90, sold: 1800, tag: "Mais vendido" },
  { id: "ram-corsair-32", name: "Kit Memória Corsair Vengeance 32GB (2x16) DDR5 6000MHz", category: "Memória RAM", price: 849.90, sold: 920, tag: "Performance" },
  { id: "ram-gskill-32", name: "Kit Memória G.Skill Trident Z5 RGB 32GB DDR5 6400MHz", category: "Memória RAM", price: 1099.90, sold: 340, tag: "RGB Premium" },

  // ── Monitores ──
  { id: "monitor-lg-27gp850", name: "Monitor LG UltraGear 27\" QHD 165Hz IPS 1ms", category: "Monitor", price: 2299.90, sold: 680, tag: "Top" },
  { id: "monitor-samsung-24-144", name: "Monitor Samsung Odyssey G4 24\" FHD 240Hz IPS", category: "Monitor", price: 1499.90, sold: 1100, tag: "" },
  { id: "monitor-aoc-hero-24", name: "Monitor AOC Hero 24G2 24\" FHD 144Hz IPS 1ms", category: "Monitor", price: 899.90, sold: 2100, tag: "Custo-benefício" },

  // ── Notebooks ──
  { id: "notebook-acer-nitro5", name: "Notebook Acer Nitro 5 i5-13450H RTX 4050 16GB 512GB", category: "Notebook", price: 4999.90, sold: 480, tag: "Oferta" },
  { id: "notebook-lenovo-legion5", name: "Notebook Lenovo Legion 5i i7-13700H RTX 4060 16GB 1TB", category: "Notebook", price: 7499.90, sold: 310, tag: "Top" },
  { id: "notebook-asus-tuf-f15", name: "Notebook ASUS TUF Gaming F15 i5-12500H RTX 4050 8GB", category: "Notebook", price: 4299.90, sold: 590, tag: "Custo-benefício" },
  { id: "notebook-dell-g15", name: "Notebook Dell G15 i7-13650HX RTX 4060 16GB 512GB", category: "Notebook", price: 6499.90, sold: 270, tag: "" },

  // ── PCs Gamers (montados) ──
  { id: "pc-starter", name: "PC Gamer Starter — Ryzen 5 5600 + RX 6600 + 16GB", category: "PC Gamer", price: 3299.90, sold: 420, tag: "Entrada" },
  { id: "pc-performance", name: "PC Gamer Performance — i5-14400F + RTX 4060 + 16GB", category: "PC Gamer", price: 5499.90, sold: 340, tag: "Top" },
  { id: "pc-extreme", name: "PC Gamer Extreme — Ryzen 7 7800X3D + RTX 4070S + 32GB", category: "PC Gamer", price: 8999.90, sold: 180, tag: "Entusiasta" },
  { id: "pc-ultra", name: "PC Gamer Ultra — i9-14900K + RTX 4090 + 64GB DDR5", category: "PC Gamer", price: 18999.90, sold: 60, tag: "Máximo" },

  // ── Cadeiras ──
  { id: "cadeira-thunderx3-tgc12", name: "Cadeira Gamer ThunderX3 TGC12 Reclinável", category: "Cadeira", price: 899.90, sold: 1200, tag: "Mais vendida" },
  { id: "cadeira-dt3-elise", name: "Cadeira DT3 Elise Fabric Ergonômica", category: "Cadeira", price: 1499.90, sold: 560, tag: "Ergonômica" },
  { id: "cadeira-pichau-donek", name: "Cadeira Gamer Pichau Donek II Reclinável 180°", category: "Cadeira", price: 649.90, sold: 1800, tag: "Custo-benefício" },

  // ── Acessórios ──
  { id: "webcam-logitech-c920", name: "Webcam Logitech C920s Full HD 1080p com Tampa", category: "Acessórios", price: 349.90, sold: 780, tag: "" },
  { id: "mic-hyperx-solocast", name: "Microfone HyperX SoloCast USB Condensador", category: "Acessórios", price: 299.90, sold: 920, tag: "Para stream" },
  { id: "suporte-headset", name: "Suporte para Headset Gamer RGB USB Rise Mode", category: "Acessórios", price: 79.90, sold: 1400, tag: "" },
  { id: "hub-usb-c-7p", name: "Hub USB-C 7 em 1 HDMI 4K USB 3.0 SD", category: "Acessórios", price: 149.90, sold: 650, tag: "" },
];

/* ── State ── */
const state = {
  category: "Todos",
  sort: "relevancia",
  maxPrice: null,
  query: "",
};

/* ── Helpers ── */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function normalize(str) {
  return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function debounce(fn, ms = 250) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initLoginBtn();
  initCategoryChips();
  initFilters();
  renderProducts();
  if (window.SgCart) { SgCart.registerProducts(PRODUCTS); SgCart.renderBadge(); }
});

/* ── Login Button ── */
function initLoginBtn() {
  const loginBtn = $("#loginBtn");
  const user = localStorage.getItem("sg_user");

  if (user) {
    try {
      const parsed = JSON.parse(user);
      const firstName = parsed.name ? parsed.name.split(" ")[0] : "Conta";
      if (loginBtn) {
        loginBtn.classList.add("is-logged");
        loginBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${firstName}`;
        loginBtn.href = "minha-conta.html";
      }
    } catch (e) { localStorage.removeItem("sg_user"); }
  } else {
    if (loginBtn) {
      loginBtn.addEventListener("click", () => { window.location.href = "login.html"; });
    }
  }
}

/* ── Theme ── */
function initTheme() {
  const saved = localStorage.getItem("sg_theme");
  if (saved === "dark") document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");
  const toggle = $("#themeToggle");
  if (toggle) toggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) { document.documentElement.removeAttribute("data-theme"); localStorage.setItem("sg_theme", "light"); }
    else { document.documentElement.setAttribute("data-theme", "dark"); localStorage.setItem("sg_theme", "dark"); }
  });
}

/* ── Category chips ── */
function initCategoryChips() {
  const chips = $$("#categoryChips .chip");
  chips.forEach(ch => {
    ch.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("is-active"));
      ch.classList.add("is-active");
      state.category = ch.dataset.cat;
      renderProducts();
    });
  });
}

/* ── Filters ── */
function initFilters() {
  const sortSel = $("#sortSelect");
  const maxPrice = $("#maxPriceInput");
  const clearBtn = $("#clearFiltersBtn");
  const searchInput = $("#searchInput");

  sortSel.addEventListener("change", () => { state.sort = sortSel.value; renderProducts(); });

  const debouncedPrice = debounce(() => {
    const v = Number(maxPrice.value);
    state.maxPrice = Number.isFinite(v) && v > 0 ? v : null;
    renderProducts();
  }, 300);
  maxPrice.addEventListener("input", debouncedPrice);

  if (searchInput) {
    const form = searchInput.closest("form");
    if (form) form.addEventListener("submit", (e) => { e.preventDefault(); state.query = searchInput.value.trim(); renderProducts(); });
    const debouncedSearch = debounce(() => { state.query = searchInput.value.trim(); renderProducts(); }, 200);
    searchInput.addEventListener("input", debouncedSearch);
  }

  clearBtn.addEventListener("click", () => {
    state.sort = "relevancia"; state.maxPrice = null; state.query = "";
    sortSel.value = "relevancia"; maxPrice.value = "";
    if (searchInput) searchInput.value = "";
    // Reset category
    state.category = "Todos";
    const chips = $$("#categoryChips .chip");
    chips.forEach(c => c.classList.toggle("is-active", c.dataset.cat === "Todos"));
    renderProducts();
  });
}

/* ── Render products ── */
function renderProducts() {
  let list = [...PRODUCTS];

  // Category filter
  if (state.category !== "Todos") {
    list = list.filter(p => p.category === state.category);
  }

  // Search
  if (state.query) {
    const q = normalize(state.query);
    list = list.filter(p => normalize(p.name).includes(q) || normalize(p.category).includes(q));
  }

  // Max price
  if (state.maxPrice) list = list.filter(p => p.price <= state.maxPrice);

  // Sort
  switch (state.sort) {
    case "menor-preco": list.sort((a, b) => a.price - b.price); break;
    case "maior-preco": list.sort((a, b) => b.price - a.price); break;
    case "mais-vendidos": list.sort((a, b) => b.sold - a.sold); break;
  }

  const grid = $("#productsGrid");
  const count = $("#resultsCount");

  if (list.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 16px;color:var(--muted);">
      <p style="font-size:32px;margin-bottom:12px;">🔍</p>
      <p style="font-weight:600;">Nenhum produto encontrado</p>
      <p class="small muted">Tente outros filtros ou categorias.</p>
    </div>`;
  } else {
    grid.innerHTML = list.map(productCard).join("");
  }

  count.textContent = `${list.length} ${list.length === 1 ? "item" : "itens"}`;

  // Bind add-to-cart buttons
  grid.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (window.SgCart) {
        if (!SgCart.requireLogin()) return;
        const p = PRODUCTS.find(x => x.id === btn.dataset.add);
        if (!p) return;
        SgCart.add(btn.dataset.add, { name: p.name, price: p.price, category: p.category });
        showToast(`${p.name} adicionado ao carrinho`);
      }
    });
  });
}

function productCard(p) {
  const installment = p.price / 12;
  const hasImage = Boolean(p.image);
  const pageUrl = p.page || null;
  const imageMarkup = hasImage
    ? `<img class="pcard__photo" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" />`
    : "";

  const imgEl = pageUrl
    ? `<a href="${pageUrl}" class="pcard__img ${hasImage ? "pcard__img--has-photo" : ""}">${imageMarkup}</a>`
    : `<div class="pcard__img ${hasImage ? "pcard__img--has-photo" : ""}">${imageMarkup}</div>`;

  const titleEl = pageUrl
    ? `<a href="${pageUrl}" class="pcard__title">${escapeHtml(p.name)}</a>`
    : `<div class="pcard__title">${escapeHtml(p.name)}</div>`;

  const verBtn = pageUrl
    ? `<a class="btn btn--outline btn--sm" href="${pageUrl}">Ver</a>`
    : `<button class="btn btn--outline btn--sm" type="button" disabled>Em breve</button>`;

  const tagHtml = p.tag ? `<span class="badge badge--soft">${escapeHtml(p.tag)}</span>` : "";

  return `
    <article class="pcard">
      ${imgEl}
      <div class="pcard__body">
        <div class="pcard__meta">
          <span>${escapeHtml(p.category)}</span>
          ${tagHtml}
        </div>
        ${titleEl}
        <div class="pcard__price">
          <strong>${BRL.format(p.price)}</strong>
          <span>12x de ${BRL.format(installment)}</span>
        </div>
        <div class="pcard__actions">
          ${verBtn}
          <button class="btn btn--solid btn--sm" type="button" data-add="${escapeHtml(p.id)}">Adicionar</button>
        </div>
      </div>
    </article>
  `;
}

/* ── Toast ── */
function showToast(message, type = "success", duration = 3000) {
  const container = $("#toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span class="toast__icon">${type === "success" ? "✓" : "✕"}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add("is-leaving"); toast.addEventListener("animationend", () => toast.remove()); }, duration);
}
