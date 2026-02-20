/* =========================================
   Santos Gamer — Produto Page JS
   Gallery, Cart, Theme, Toast, Qty
   ========================================= */

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/* ── Product data (this page) ── */
const PRODUCT = {
  id: "mousepad-fallen",
  name: "Mousepad Gamer Fallen Ace Speed++ Antiderrapante 45x45cm",
  category: "Acessórios",
  price: 197.90,
};

/* ── Gallery images ── */
const GALLERY_IMAGES = [
  "../assets/img/Mousepad fallen.webp",
  "../assets/img/Mousepad.png",
  "../assets/img/Mousepad2.png",
  "../assets/img/sla.webp",
  "../assets/img/sla2.webp",
  "../assets/img/sla3.webp",
];

/* ── State ── */
const state = {
  cart: loadCart(),
  qty: 1,
  galleryIndex: 0,
};

/* ── DOM refs ── */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ── Init on DOMContentLoaded ── */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initLoginBtn();
  initGallery();
  initQuantity();
  initActions();
  renderCartBadge();
});

/* =================================
   Login button & auth check
   ================================= */
function requireLogin() {
  const user = localStorage.getItem("sg_user");
  if (!user) {
    sessionStorage.setItem("sg_redirect", window.location.href);
    showToast("Faça login para continuar", "error");
    setTimeout(() => { window.location.href = "login.html"; }, 1000);
    return false;
  }
  return true;
}

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
        loginBtn.addEventListener("click", () => {
          if (confirm(`Sair da conta de ${parsed.name}?`)) {
            localStorage.removeItem("sg_user");
            showToast("Logout realizado");
            setTimeout(() => location.reload(), 800);
          }
        });
      }
    } catch (e) {
      localStorage.removeItem("sg_user");
    }
  } else {
    if (loginBtn) {
      loginBtn.addEventListener("click", () => {
        window.location.href = "login.html";
      });
    }
  }
}

/* =================================
   Theme (syncs with home page)
   ================================= */
function initTheme() {
  const saved = localStorage.getItem("sg_theme");
  if (saved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  const toggle = $("#themeToggle");
  if (toggle) toggle.addEventListener("click", toggleTheme);
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
   Gallery
   ================================= */
function initGallery() {
  const thumbs = $$("#galleryThumbs .gallery__thumb");
  const mainImg = $("#galleryImage");
  const mainWrap = $(".gallery__main");
  const zoomBtn = $("#galleryZoom");

  if (!mainImg) return;

  // Thumb click → switch image
  thumbs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      setGalleryImage(idx);
    });
  });

  // Zoom button → open lightbox
  if (zoomBtn) {
    zoomBtn.addEventListener("click", () => openLightbox(state.galleryIndex));
  }

  // Click main image → toggle zoom
  mainWrap.addEventListener("click", (e) => {
    if (e.target === zoomBtn || zoomBtn.contains(e.target)) return;
    if (mainWrap.classList.contains("is-zoomed")) {
      mainWrap.classList.remove("is-zoomed");
    } else {
      openLightbox(state.galleryIndex);
    }
  });

  // Follow mouse on zoomed image
  mainWrap.addEventListener("mousemove", (e) => {
    if (!mainWrap.classList.contains("is-zoomed")) return;
    const rect = mainWrap.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    mainImg.style.transformOrigin = `${x}% ${y}%`;
  });

  // Keyboard nav
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") setGalleryImage(state.galleryIndex - 1);
    if (e.key === "ArrowRight") setGalleryImage(state.galleryIndex + 1);
  });

  createLightbox();
}

function setGalleryImage(index) {
  const total = GALLERY_IMAGES.length;
  const idx = ((index % total) + total) % total;
  state.galleryIndex = idx;

  const mainImg = $("#galleryImage");
  mainImg.src = GALLERY_IMAGES[idx];

  const thumbs = $$("#galleryThumbs .gallery__thumb");
  thumbs.forEach((t, i) => t.classList.toggle("is-active", i === idx));

  // Remove zoom state on switch
  $(".gallery__main").classList.remove("is-zoomed");
}

/* ---- Lightbox ---- */
function createLightbox() {
  if (document.getElementById("lightbox")) return;

  const lb = document.createElement("div");
  lb.id = "lightbox";
  lb.className = "lightbox";
  lb.innerHTML = `
    <button class="lightbox__close" aria-label="Fechar" type="button">&times;</button>
    <img class="lightbox__img" src="" alt="Zoom" />
  `;
  document.body.appendChild(lb);

  lb.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
  lb.addEventListener("click", (e) => {
    if (e.target === lb) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "ArrowLeft") {
      setGalleryImage(state.galleryIndex - 1);
      lb.querySelector(".lightbox__img").src = GALLERY_IMAGES[state.galleryIndex];
    }
    if (e.key === "ArrowRight") {
      setGalleryImage(state.galleryIndex + 1);
      lb.querySelector(".lightbox__img").src = GALLERY_IMAGES[state.galleryIndex];
    }
  });
}

function openLightbox(index) {
  const lb = document.getElementById("lightbox");
  if (!lb) return;
  lb.querySelector(".lightbox__img").src = GALLERY_IMAGES[index];
  lb.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const lb = document.getElementById("lightbox");
  if (!lb) return;
  lb.classList.remove("is-open");
  document.body.style.overflow = "";
}

/* =================================
   Quantity selector
   ================================= */
function initQuantity() {
  const decBtn = $("#qtyDec");
  const incBtn = $("#qtyInc");
  const valEl = $("#qtyVal");

  if (!decBtn || !incBtn || !valEl) return;

  decBtn.addEventListener("click", () => {
    if (state.qty > 1) {
      state.qty--;
      valEl.textContent = state.qty;
    }
  });

  incBtn.addEventListener("click", () => {
    if (state.qty < 10) {
      state.qty++;
      valEl.textContent = state.qty;
    }
  });
}

/* =================================
   Cart / Actions
   ================================= */
function initActions() {
  const addBtn = $("#addToCartBtn");
  const buyBtn = $("#buyNowBtn");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      if (!requireLogin()) return;
      for (let i = 0; i < state.qty; i++) {
        addToCart(PRODUCT.id);
      }
      showToast(`${state.qty}× ${PRODUCT.name} adicionado ao carrinho`);
    });
  }

  if (buyBtn) {
    buyBtn.addEventListener("click", () => {
      if (!requireLogin()) return;
      for (let i = 0; i < state.qty; i++) {
        addToCart(PRODUCT.id);
      }
      showToast("Redirecionando para o checkout...", "success");
    });
  }
}

function addToCart(productId) {
  state.cart[productId] = (state.cart[productId] || 0) + 1;
  persistCart();
  renderCartBadge();
}

function renderCartBadge() {
  const countEl = $("#cartCount");
  if (!countEl) return;
  const count = Object.values(state.cart).reduce((a, b) => a + b, 0);
  countEl.textContent = String(count);
}

function persistCart() {
  try {
    localStorage.setItem("sg_cart_v1", JSON.stringify(state.cart));
  } catch { /* quota exceeded */ }
}

function loadCart() {
  try {
    const raw = localStorage.getItem("sg_cart_v1");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/* =================================
   Toast notifications
   ================================= */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message, type = "success", duration = 3000) {
  const container = $("#toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${type === "success" ? "✓" : "✕"}</span>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("is-leaving");
    toast.addEventListener("animationend", () => toast.remove());
  }, duration);
}
