/* =========================================
   Santos Store — App (Vanilla JS)
   UI/UX aprimorada: toast, swipe, debounce,
   mobile menu, back-to-top, a11y
   ========================================= */

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/* ── Produtos ──────────────────────────────────────────────────────────────
   Campos de cada produto:
     id       → identificador único (sem espaços)
     name     → nome do produto (aparece no card)
     category → categoria (usada nos filtros)
     price    → preço em reais  ex: 299.90
     sold     → qtd vendida (usado na ordenação "mais vendidos")
     tag      → etiqueta exibida no card  ex: "Oferta", "Novo", "Top"
     image    → caminho da imagem  ex: "./assets/img/meu-produto.webp"
                (remova a linha se não tiver imagem)
   ──────────────────────────────────────────────────────────────────────── */
const PRODUCTS = [
  {
    id: "mousepad-fallen",
    name: "Mousepad Gamer Fallen Ace Speed++ Antiderrapante 45x45cm",
    category: "Acessórios",
    price: 197.90,
    sold: 3100,
    tag: "Mais vendido",
    image: "./assets/img/Mousepad.png",
  },
  {
    id: "gpu-rtx4060",
    name: "Placa de Vídeo RTX 4060 8GB GDDR6 128-bit",
    category: "Placa de Vídeo",
    price: 2499.90,
    sold: 870,
    tag: "Top",
    image: "",
  },
  {
    id: "cpu-ryzen5-7600",
    name: "Processador AMD Ryzen 5 7600 3.8GHz AM5",
    category: "Processador",
    price: 1149.90,
    sold: 640,
    tag: "Custo-benefício",
    image: "",
  },
  {
    id: "ssd-kingston-1tb",
    name: "SSD Kingston NV3 NVMe 1TB M.2 2280",
    category: "SSD",
    price: 319.90,
    sold: 2200,
    tag: "Oferta",
    image: "",
  },
  {
    id: "ram-corsair-16",
    name: "Memória RAM Corsair Vengeance 16GB DDR5 5200MHz",
    category: "Memória RAM",
    price: 399.90,
    sold: 980,
    tag: "DDR5",
    image: "",
  },
  {
    id: "mouse-logitech-g502",
    name: "Mouse Gamer Logitech G502 X 25600 DPI",
    category: "Mouse",
    price: 349.90,
    sold: 1750,
    tag: "FPS",
    image: "",
  },
  {
    id: "teclado-redragon",
    name: "Teclado Mecânico Redragon Kumara RGB Switch Red",
    category: "Teclado",
    price: 259.90,
    sold: 1430,
    tag: "Mecânico",
    image: "",
  },
  {
    id: "headset-hyperx",
    name: "Headset Gamer HyperX Cloud Stinger 2 7.1 Surround",
    category: "Headset",
    price: 249.90,
    sold: 1100,
    tag: "Som limpo",
    image: "",
  },
  {
    id: "monitor-aoc-144",
    name: "Monitor AOC 24G2SE 23.8\" 144Hz IPS Full HD",
    category: "Monitor",
    price: 1099.90,
    sold: 720,
    tag: "144Hz",
    image: "",
  },
  {
    id: "fonte-corsair-650",
    name: "Fonte Corsair CV650 650W 80 Plus Bronze",
    category: "Fonte",
    price: 449.90,
    sold: 590,
    tag: "Estável",
    image: "",
  },
  {
    id: "gabinete-aerocool",
    name: "Gabinete Aerocool Cylon Mid Tower RGB Lateral Vidro",
    category: "Gabinete",
    price: 299.90,
    sold: 480,
    tag: "Airflow",
    image: "",
  },
  {
    id: "mb-gigabyte-b650",
    name: "Placa-mãe Gigabyte B650M DS3H DDR5 AM5",
    category: "Placa-mãe",
    price: 849.90,
    sold: 360,
    tag: "AM5",
    image: "",
  },
  // ── Para adicionar mais produtos, copie um bloco acima e cole aqui ──
];

/* ── DOM refs ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

const els = {
  productsGrid:    $("#productsGrid"),
  categoryChips:   $("#categoryChips"),
  resultsCount:    $("#resultsCount"),
  searchInput:     $("#searchInput"),
  sortSelect:      $("#sortSelect"),
  maxPriceInput:   $("#maxPriceInput"),
  clearFiltersBtn: $("#clearFiltersBtn"),

  promoCarousel: $("#promoCarousel"),
  carouselTrack: $("#carouselTrack"),
  prevSlideBtn:  $("#prevSlideBtn"),
  nextSlideBtn:  $("#nextSlideBtn"),
  carouselDots:  $("#carouselDots"),

  menuToggle:         $("#menuToggle"),
  mobileMenu:         $("#mobileMenu"),
  mobileMenuBackdrop: $("#mobileMenuBackdrop"),
  mobileMenuClose:    $("#mobileMenuClose"),

  backToTop:      $("#backToTop"),
  toastContainer: $("#toastContainer"),
  themeToggle:    $("#themeToggle"),
};

const state = {
  query: "",
  category: "Todos",
  sort: "relevancia",
  maxPrice: null,
};

/* ── Init ── */
init();

function init() {
  initTheme();
  initLoginBtn();
  renderCategoryChips();
  bindEvents();

  // Read URL search param (from other pages redirecting here)
  const urlParams = new URLSearchParams(window.location.search);
  const urlQuery = (urlParams.get("q") || "").trim();
  if (urlQuery && els.searchInput) {
    els.searchInput.value = urlQuery;
    state.query = urlQuery;
  }

  renderProducts();

  // Auto-scroll to products if search query present
  if (urlQuery) {
    setTimeout(() => scrollToSection("produtos"), 300);
  }

  if (window.SgCart) { SgCart.registerProducts(PRODUCTS); SgCart.renderBadge(); }
  initPromoCarousel();
  initQuickLinks();
  initMobileMenu();
  initBackToTop();
}

/* =================================
   Login button & session state
   ================================= */
function initLoginBtn() {
  const loginBtn = $("#loginBtn");
  const mobileLoginLink = $("#mobileLoginLink");
  const user = localStorage.getItem("sg_user");

  if (user) {
    try {
      const parsed = JSON.parse(user);
      const firstName = parsed.name ? parsed.name.split(" ")[0] : "Conta";

      if (loginBtn) {
        loginBtn.classList.add("is-logged");
        loginBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${firstName}`;
        loginBtn.href = "pages/minha-conta.html";
      }
      if (mobileLoginLink) {
        mobileLoginLink.textContent = `Olá, ${firstName}`;
        mobileLoginLink.href = "pages/minha-conta.html";
      }
    } catch (e) {
      localStorage.removeItem("sg_user");
    }
  } else {
    if (loginBtn) {
      loginBtn.addEventListener("click", () => {
        window.location.href = "pages/login.html";
      });
    }
  }
}

/* =================================
   Theme (light/dark)
   ================================= */
function initTheme() {
  // Default is light (no data-theme attr = light tokens in :root)
  const saved = localStorage.getItem("sg_theme");
  if (saved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  if (els.themeToggle) {
    els.themeToggle.addEventListener("click", toggleTheme);
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("sg_theme", "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("sg_theme", "dark");
  }
}

/* =================================
   Helpers
   ================================= */
function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function debounce(fn, ms = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/* =================================
   Toast notifications
   ================================= */
function showToast(message, type = "success", duration = 3000) {
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${type === "success" ? "✓" : "✕"}</span>
    <span>${escapeHtml(message)}</span>
  `;
  els.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("is-leaving");
    toast.addEventListener("animationend", () => toast.remove());
  }, duration);
}

/* =================================
   Events
   ================================= */
function bindEvents() {
  // Search form submit
  const searchForm = els.searchInput.closest("form");
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    state.query = (els.searchInput.value || "").trim();
    renderProducts();
    scrollToSection("produtos");
  });

  // Search debounced typing
  const debouncedSearch = debounce(() => {
    state.query = (els.searchInput.value || "").trim();
    renderProducts();
    if (state.query) scrollToSection("produtos");
  }, 200);
  els.searchInput.addEventListener("input", debouncedSearch);

  // Sort
  els.sortSelect.addEventListener("change", () => {
    state.sort = els.sortSelect.value;
    renderProducts();
  });

  // Max price (debounced)
  const debouncedPrice = debounce(() => {
    const v = Number(els.maxPriceInput.value);
    state.maxPrice = Number.isFinite(v) && v > 0 ? v : null;
    renderProducts();
  }, 300);
  els.maxPriceInput.addEventListener("input", debouncedPrice);

  // Clear filters
  els.clearFiltersBtn.addEventListener("click", () => {
    state.query = "";
    state.category = "Todos";
    state.sort = "relevancia";
    state.maxPrice = null;

    els.searchInput.value = "";
    els.sortSelect.value = "relevancia";
    els.maxPriceInput.value = "";

    highlightActiveChip();
    renderProducts();
  });

  // Cart drawer — handled by SgCart module
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (window.SgCart) SgCart.close();
      closeMobileMenu();
    }
  });
}

/* =================================
   Categories / Chips
   ================================= */
function getCategories() {
  const set = new Set(PRODUCTS.map((p) => p.category));
  return ["Todos", ...Array.from(set)];
}

function renderCategoryChips() {
  if (!els.categoryChips) return;
  const cats = getCategories();
  els.categoryChips.innerHTML = cats
    .map((c) => {
      const active = c === state.category ? "is-active" : "";
      return `<button class="chip ${active}" type="button" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`;
    })
    .join("");

  els.categoryChips.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.category = btn.dataset.cat;
      highlightActiveChip();
      renderProducts();
      scrollToSection("produtos");
    });
  });
}

function highlightActiveChip() {
  if (!els.categoryChips) return;
  els.categoryChips.querySelectorAll(".chip").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.cat === state.category);
  });
}

/* =================================
   Quick Links
   ================================= */
function initQuickLinks() {
  document.querySelectorAll("[data-ql-cat]").forEach((el) => {
    el.addEventListener("click", () => {
      const cat = el.getAttribute("data-ql-cat");
      if (cat) {
        state.category = cat;
        highlightActiveChip();
        renderProducts();
      }
      scrollToSection("produtos");
    });
  });
}

/* =================================
   Products (filter / render)
   ================================= */
function filterProducts() {
  let list = [...PRODUCTS];

  if (state.category !== "Todos") {
    list = list.filter((p) => p.category === state.category);
  }

  if (state.query) {
    const q = normalize(state.query);
    list = list.filter(
      (p) => normalize(p.name).includes(q) || normalize(p.category).includes(q)
    );
  }

  if (state.maxPrice != null) {
    list = list.filter((p) => p.price <= state.maxPrice);
  }

  switch (state.sort) {
    case "menor-preco":
      list.sort((a, b) => a.price - b.price);
      break;
    case "maior-preco":
      list.sort((a, b) => b.price - a.price);
      break;
    case "mais-vendidos":
      list.sort((a, b) => b.sold - a.sold);
      break;
    default:
      list.sort((a, b) => b.sold * 2 - b.price - (a.sold * 2 - a.price));
  }

  return list;
}

function renderProducts() {
  const list = filterProducts();
  els.resultsCount.textContent = `${list.length} ${list.length === 1 ? "item" : "itens"}`;

  if (list.length === 0) {
    els.productsGrid.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
        <h3 style="margin-bottom: 8px;">Nenhum produto encontrado</h3>
        <p class="muted">Tente remover filtros ou buscar por outro termo.</p>
      </div>
    `;
    return;
  }

  els.productsGrid.innerHTML = list.map((p) => productCard(p)).join("");

  // Add to cart
  els.productsGrid.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-add");
      const product = PRODUCTS.find((x) => x.id === id);
      if (!product) return;
      if (window.SgCart) {
        if (!SgCart.requireLogin()) return;
        SgCart.add(id, { name: product.name, price: product.price, category: product.category });
        showToast(`${product.name} adicionado ao carrinho`);
      }
    });
  });

  // Quick view
  els.productsGrid.querySelectorAll("[data-quick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-quick");
      const p = PRODUCTS.find((x) => x.id === id);
      if (!p) return;
      showToast(`${p.name} — ${BRL.format(p.price)}`, "success", 3000);
    });
  });
}

function productPageUrl(id) {
  const pages = { "mousepad-fallen": "pages/produto-mousepad.html" };
  return pages[id] || null;
}

function productCard(p) {
  const installment = p.price / 12;
  const hasImage = Boolean(p.image);
  const pageUrl = productPageUrl(p.id);
  const imageMarkup = hasImage
    ? `<img class="pcard__photo" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async" />`
    : "";

  const imgLink = pageUrl
    ? `<a href="${pageUrl}" class="pcard__img ${hasImage ? "pcard__img--has-photo" : ""}">${imageMarkup}</a>`
    : `<div class="pcard__img ${hasImage ? "pcard__img--has-photo" : ""}">${imageMarkup}</div>`;

  const titleLink = pageUrl
    ? `<a href="${pageUrl}" class="pcard__title">${escapeHtml(p.name)}</a>`
    : `<div class="pcard__title">${escapeHtml(p.name)}</div>`;

  const verBtn = pageUrl
    ? `<a class="btn btn--outline btn--sm" href="${pageUrl}">Ver</a>`
    : `<button class="btn btn--outline btn--sm" type="button" data-quick="${escapeHtml(p.id)}">Ver</button>`;

  return `
    <article class="pcard">
      ${imgLink}
      <div class="pcard__body">
        <div class="pcard__meta">
          <span>${escapeHtml(p.category)}</span>
          <span class="badge badge--soft">${escapeHtml(p.tag)}</span>
        </div>
        ${titleLink}
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

/* =================================
   Carousel (touch / swipe / auto)
   ================================= */
function initPromoCarousel() {
  if (!els.promoCarousel || !els.carouselTrack) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const slides = Array.from(els.carouselTrack.querySelectorAll("[data-slide]"));
  const total = slides.length;

  let index = 0;
  let timer = null;
  let isPaused = false;

  // Touch/swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  const SWIPE_THRESHOLD = 50;

  // Render dots
  els.carouselDots.innerHTML = slides
    .map(
      (_, i) =>
        `<button class="dot ${i === 0 ? "is-active" : ""}" type="button" role="tab" aria-label="Banner ${i + 1}" aria-selected="${i === 0}" data-dot="${i}"></button>`
    )
    .join("");

  const dots = Array.from(els.carouselDots.querySelectorAll(".dot"));

  function goTo(i) {
    index = ((i % total) + total) % total;
    els.carouselTrack.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, di) => {
      d.classList.toggle("is-active", di === index);
      d.setAttribute("aria-selected", String(di === index));
    });
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  els.nextSlideBtn?.addEventListener("click", () => { next(); resetAutoplay(); });
  els.prevSlideBtn?.addEventListener("click", () => { prev(); resetAutoplay(); });

  dots.forEach((d) => {
    d.addEventListener("click", () => {
      const i = Number(d.dataset.dot);
      if (Number.isFinite(i)) { goTo(i); resetAutoplay(); }
    });
  });

  // Touch events
  els.promoCarousel.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  els.promoCarousel.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) next();
      else prev();
      resetAutoplay();
    }
  }, { passive: true });

  // Pause on hover
  els.promoCarousel.addEventListener("mouseenter", () => { isPaused = true; });
  els.promoCarousel.addEventListener("mouseleave", () => { isPaused = false; });

  // Autoplay
  function startAutoplay() {
    if (prefersReduced) return;
    stopAutoplay();
    timer = setInterval(() => {
      if (!isPaused) next();
    }, 5500);
  }

  function stopAutoplay() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  startAutoplay();

  // Pause when tab not visible
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  // Keyboard
  els.promoCarousel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { prev(); resetAutoplay(); }
    if (e.key === "ArrowRight") { next(); resetAutoplay(); }
  });
}

/* =================================
   Mobile Menu
   ================================= */
function initMobileMenu() {
  if (!els.menuToggle || !els.mobileMenu) return;

  els.menuToggle.addEventListener("click", toggleMobileMenu);
  els.mobileMenuBackdrop?.addEventListener("click", closeMobileMenu);
  els.mobileMenuClose?.addEventListener("click", closeMobileMenu);

  // Close menu when clicking nav links
  els.mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });
}

function toggleMobileMenu() {
  const isOpen = els.mobileMenu.classList.contains("is-open");
  if (isOpen) closeMobileMenu();
  else openMobileMenu();
}

function openMobileMenu() {
  els.mobileMenu.classList.add("is-open");
  els.mobileMenu.setAttribute("aria-hidden", "false");
  els.menuToggle.classList.add("is-open");
  els.menuToggle.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closeMobileMenu() {
  els.mobileMenu.classList.remove("is-open");
  els.mobileMenu.setAttribute("aria-hidden", "true");
  els.menuToggle.classList.remove("is-open");
  els.menuToggle.setAttribute("aria-expanded", "false");
  // Only restore if cart drawer isn't open
  const cartDrawer = document.getElementById("cartDrawer");
  if (!cartDrawer || !cartDrawer.classList.contains("is-open")) {
    document.body.style.overflow = "";
  }
}

/* =================================
   Back to Top
   ================================= */
function initBackToTop() {
  if (!els.backToTop) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      els.backToTop.classList.toggle("is-visible", !entry.isIntersecting);
    },
    { threshold: 0 }
  );

  // Observe the header — when it's out of view, show the button
  const header = document.getElementById("top");
  if (header) observer.observe(header);

  els.backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
