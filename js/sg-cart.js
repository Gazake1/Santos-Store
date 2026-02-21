/* =========================================
   Santos Store — Cart Module (Shared)
   Included by every page. Manages cart state,
   the cart drawer UI, server sync with JWT,
   badge rendering and purchase history.
   ========================================= */

window.SgCart = (function () {
  "use strict";

  const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const STORAGE_KEY = "sg_cart";
  const OLD_KEY = "sg_cart_v1";
  const WA_NUMBER = "5516992070533";
  const API = window.location.port
    ? `${window.location.protocol}//${window.location.hostname}:3000/api`
    : "/api";

  /* ── Internal state: { productId: { qty, name, price, category } } ── */
  let items = {};
  let drawerBound = false;

  /* ── Helpers ── */
  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function getSession() {
    try {
      var user = JSON.parse(localStorage.getItem("sg_user") || "null");
      var token = localStorage.getItem("sg_token");
      if (user && token) { user.token = token; return user; }
      return null;
    } catch { return null; }
  }

  function isInPages() {
    return window.location.pathname.includes("/pages/");
  }

  function loginUrl() {
    return isInPages() ? "login.html" : "pages/login.html";
  }

  /* ── Toast (reusable) ── */
  function showToast(message, type, duration) {
    type = type || "success";
    duration = duration || 3000;
    var container = document.getElementById("toastContainer");
    if (!container) return;
    var toast = document.createElement("div");
    toast.className = "toast toast--" + type;
    toast.innerHTML = '<span class="toast__icon">' + (type === "success" ? "✓" : "✕") + "</span><span>" + escapeHtml(message) + "</span>";
    container.appendChild(toast);
    setTimeout(function () {
      toast.classList.add("is-leaving");
      toast.addEventListener("animationend", function () { toast.remove(); });
    }, duration);
  }

  /* ══════════════════════════════════════
     PERSISTENCE (localStorage)
     ══════════════════════════════════════ */
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var arr = JSON.parse(raw);
        items = {};
        arr.forEach(function (item) {
          items[item.id] = { qty: item.qty, name: item.name, price: item.price, category: item.category || "" };
        });
        return;
      }
      // Migrate from old format
      var oldRaw = localStorage.getItem(OLD_KEY);
      if (oldRaw) {
        var old = JSON.parse(oldRaw);
        items = {};
        Object.keys(old).forEach(function (id) {
          items[id] = { qty: old[id], name: id, price: 0, category: "" };
        });
        persist();
        localStorage.removeItem(OLD_KEY);
        return;
      }
      items = {};
    } catch (e) {
      items = {};
    }
  }

  function persist() {
    try {
      var arr = Object.keys(items).map(function (id) {
        return { id: id, qty: items[id].qty, name: items[id].name, price: items[id].price, category: items[id].category };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      // Backward compat
      var old = {};
      Object.keys(items).forEach(function (id) { old[id] = items[id].qty; });
      localStorage.setItem(OLD_KEY, JSON.stringify(old));
    } catch (e) { /* quota exceeded */ }
    syncToServer();
  }

  /* ══════════════════════════════════════
     SERVER SYNC
     ══════════════════════════════════════ */
  var syncTimer = null;

  function syncToServer() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(_doSync, 500); // debounce
  }

  function _doSync() {
    var session = getSession();
    if (!session || !session.token) return;
    var arr = Object.keys(items).map(function (id) {
      return { product_id: id, quantity: items[id].qty, name: items[id].name, price: items[id].price, category: items[id].category };
    });
    fetch(API + "/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.token },
      body: JSON.stringify({ items: arr }),
    }).catch(function () { /* silent */ });
  }

  function fetchFromServer() {
    var session = getSession();
    if (!session || !session.token) return Promise.resolve(null);
    return fetch(API + "/cart", {
      headers: { Authorization: "Bearer " + session.token },
    })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) { return data ? (data.items || []) : null; })
      .catch(function () { return null; });
  }

  /** Called after login — merge server cart into local */
  function syncOnLogin() {
    return fetchFromServer().then(function (serverItems) {
      if (!serverItems) return;
      serverItems.forEach(function (si) {
        var id = si.product_id;
        if (!items[id]) {
          items[id] = { qty: si.quantity, name: si.name || id, price: si.price || 0, category: si.category || "" };
        }
      });
      persist();
      renderBadge();
      renderDrawer();
    });
  }

  /* ══════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════ */
  function requireLogin() {
    var user = localStorage.getItem("sg_user");
    if (!user) {
      sessionStorage.setItem("sg_redirect", window.location.href);
      showToast("Faça login para adicionar ao carrinho", "error");
      setTimeout(function () { window.location.href = loginUrl(); }, 1000);
      return false;
    }
    return true;
  }

  function add(productId, info) {
    if (!requireLogin()) return false;
    info = info || {};
    if (items[productId]) {
      items[productId].qty += 1;
      // Update info if better data available
      if (info.name && items[productId].name === productId) {
        items[productId].name = info.name;
        items[productId].price = info.price || 0;
        items[productId].category = info.category || "";
      }
    } else {
      items[productId] = { qty: 1, name: info.name || productId, price: info.price || 0, category: info.category || "" };
    }
    persist();
    renderBadge();
    renderDrawer();
    return true;
  }

  function addMultiple(productId, qty, info) {
    if (!requireLogin()) return false;
    info = info || {};
    if (items[productId]) {
      items[productId].qty += qty;
    } else {
      items[productId] = { qty: qty, name: info.name || productId, price: info.price || 0, category: info.category || "" };
    }
    persist();
    renderBadge();
    renderDrawer();
    return true;
  }

  function remove(productId) {
    delete items[productId];
    persist();
    renderBadge();
    renderDrawer();
  }

  function setQty(productId, qty) {
    if (qty <= 0) return remove(productId);
    if (items[productId]) items[productId].qty = qty;
    persist();
    renderBadge();
    renderDrawer();
  }

  function clear() {
    items = {};
    persist();
    renderBadge();
    renderDrawer();
  }

  function getItems() {
    return Object.keys(items).map(function (id) {
      return { id: id, qty: items[id].qty, name: items[id].name, price: items[id].price, category: items[id].category };
    });
  }

  function getTotal() {
    return getItems().reduce(function (sum, i) { return sum + i.price * i.qty; }, 0);
  }

  function getCount() {
    return Object.keys(items).reduce(function (total, id) { return total + items[id].qty; }, 0);
  }

  /** Backfill product info for items migrated from v1 */
  function registerProducts(products) {
    var changed = false;
    products.forEach(function (p) {
      if (items[p.id] && (items[p.id].name === p.id || items[p.id].price === 0)) {
        items[p.id].name = p.name;
        items[p.id].price = p.price;
        items[p.id].category = p.category;
        changed = true;
      }
    });
    if (changed) persist();
  }

  /* ══════════════════════════════════════
     BADGE
     ══════════════════════════════════════ */
  function renderBadge() {
    var el = document.getElementById("cartCount");
    if (!el) return;
    el.textContent = String(getCount());
  }

  /* ══════════════════════════════════════
     DRAWER (created dynamically if needed)
     ══════════════════════════════════════ */
  function ensureDrawer() {
    if (document.getElementById("cartDrawer")) return;
    var aside = document.createElement("aside");
    aside.className = "drawer";
    aside.id = "cartDrawer";
    aside.setAttribute("aria-label", "Carrinho");
    aside.setAttribute("aria-hidden", "true");
    aside.innerHTML =
      '<div class="drawer__backdrop" id="cartBackdrop" tabindex="-1"></div>' +
      '<div class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="cartTitle">' +
        '<div class="drawer__head">' +
          '<h3 id="cartTitle">Seu carrinho</h3>' +
          '<button class="iconBtn" id="closeCartBtn" type="button" aria-label="Fechar carrinho">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="drawer__body" id="cartItems"></div>' +
        '<div class="drawer__foot">' +
          '<div class="totals">' +
            '<div class="totals__row"><span>Total</span><strong id="cartTotal">R$ 0,00</strong></div>' +
            '<div class="totals__row small muted"><span>Frete e descontos</span><span>calculados depois</span></div>' +
          '</div>' +
          '<button class="btn btn--solid btn--full" id="checkoutBtn" type="button">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> ' +
            'Finalizar via WhatsApp' +
          '</button>' +
          '<button class="btn btn--ghost btn--full" id="clearCartBtn" type="button">Limpar carrinho</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(aside);
  }

  function bindDrawerEvents() {
    if (drawerBound) return;
    drawerBound = true;

    var backdrop = document.getElementById("cartBackdrop");
    var closeBtn = document.getElementById("closeCartBtn");
    var clearBtn = document.getElementById("clearCartBtn");
    var checkoutBtn = document.getElementById("checkoutBtn");

    if (backdrop) backdrop.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (clearBtn) clearBtn.addEventListener("click", function () {
      clear();
      showToast("Carrinho limpo");
    });
    if (checkoutBtn) checkoutBtn.addEventListener("click", doCheckout);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        var drawer = document.getElementById("cartDrawer");
        if (drawer && drawer.classList.contains("is-open")) close();
      }
    });
  }

  function doCheckout() {
    if (!requireLogin()) return;
    var list = getItems();
    if (list.length === 0) {
      showToast("Seu carrinho está vazio.", "error");
      return;
    }
    savePurchaseHistory(list);
    var cartText = list.map(function (i) {
      return "• " + i.qty + "x " + i.name + " — " + BRL.format(i.price * i.qty);
    }).join("\n");
    var total = BRL.format(getTotal());
    var msg = encodeURIComponent("Olá! Gostaria de finalizar minha compra na Santos Store:\n\n" + cartText + "\n\nTotal: " + total);
    window.open("https://wa.me/" + WA_NUMBER + "?text=" + msg, "_blank");
    clear();
    showToast("Redirecionando para WhatsApp...");
  }

  function open() {
    ensureDrawer();
    bindDrawerEvents();
    renderDrawer();
    var drawer = document.getElementById("cartDrawer");
    if (!drawer) return;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function close() {
    var drawer = document.getElementById("cartDrawer");
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    // Restore scroll only if no other overlay
    var mobileMenu = document.getElementById("mobileMenu");
    if (!mobileMenu || !mobileMenu.classList.contains("is-open")) {
      document.body.style.overflow = "";
    }
  }

  function renderDrawer() {
    var cartItemsEl = document.getElementById("cartItems");
    var cartTotalEl = document.getElementById("cartTotal");
    if (!cartItemsEl) return;

    var list = getItems();
    if (list.length === 0) {
      cartItemsEl.innerHTML =
        '<div style="text-align:center;padding:32px 16px;color:var(--muted);">' +
          '<p style="font-size:36px;margin-bottom:12px;">🛒</p>' +
          '<p style="font-weight:600;">Carrinho vazio</p>' +
          '<p class="small muted">Adicione produtos para ver aqui.</p>' +
        '</div>';
      if (cartTotalEl) cartTotalEl.textContent = BRL.format(0);
      return;
    }

    cartItemsEl.innerHTML = list.map(function (item) {
      return (
        '<div class="citem">' +
          '<div class="citem__top">' +
            '<div>' +
              '<div class="citem__name">' + escapeHtml(item.name) + '</div>' +
              '<div class="citem__sub">' + escapeHtml(item.category) + ' • ' + BRL.format(item.price) + '</div>' +
            '</div>' +
            '<button class="iconBtn" type="button" aria-label="Remover ' + escapeHtml(item.name) + '" data-cart-remove="' + escapeHtml(item.id) + '">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>' +
            '</button>' +
          '</div>' +
          '<div class="qty" aria-label="Quantidade de ' + escapeHtml(item.name) + '">' +
            '<button type="button" data-cart-dec="' + escapeHtml(item.id) + '" aria-label="Diminuir">−</button>' +
            '<span>' + item.qty + '</span>' +
            '<button type="button" data-cart-inc="' + escapeHtml(item.id) + '" aria-label="Aumentar">+</button>' +
          '</div>' +
        '</div>'
      );
    }).join("");

    if (cartTotalEl) cartTotalEl.textContent = BRL.format(getTotal());

    // Bind individual item events
    cartItemsEl.querySelectorAll("[data-cart-remove]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        remove(btn.dataset.cartRemove);
        showToast("Item removido");
      });
    });
    cartItemsEl.querySelectorAll("[data-cart-inc]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.dataset.cartInc;
        if (items[id]) setQty(id, items[id].qty + 1);
      });
    });
    cartItemsEl.querySelectorAll("[data-cart-dec]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.dataset.cartDec;
        if (items[id]) setQty(id, items[id].qty - 1);
      });
    });
  }

  /* ══════════════════════════════════════
     PURCHASE HISTORY
     ══════════════════════════════════════ */
  function savePurchaseHistory(cartItems) {
    try {
      var existing = JSON.parse(localStorage.getItem("sg_purchases") || "[]");
      var now = new Date().toLocaleDateString("pt-BR");
      var total = cartItems.reduce(function (sum, i) { return sum + i.price * i.qty; }, 0);
      cartItems.forEach(function (item) {
        existing.unshift({
          id: item.id, name: item.name, qty: item.qty, price: item.price,
          total: BRL.format(total), date: now,
        });
      });
      localStorage.setItem("sg_purchases", JSON.stringify(existing.slice(0, 50)));
    } catch (e) { /* quota exceeded */ }
  }

  /* ══════════════════════════════════════
     WHATSAPP (for product pages)
     ══════════════════════════════════════ */
  function openWhatsApp(productName, price) {
    var msg = encodeURIComponent(
      "Olá! Tenho interesse no produto: " + productName +
      (price ? " (" + BRL.format(price) + ")" : "") +
      "\nGostaria de mais informações e como proceder com a compra."
    );
    window.open("https://wa.me/" + WA_NUMBER + "?text=" + msg, "_blank");
  }

  function openWhatsAppBuild(payload) {
    var msg = encodeURIComponent(
      "Olá! Gostaria de um orçamento para montar um PC:\n\n" +
      "🎯 Objetivo: " + (payload.goal || "Não informado") + "\n" +
      "💰 Orçamento: R$ " + (payload.budget || "Não informado") + "\n" +
      "🎨 Preferência: " + (payload.pref || "Não informado") + "\n" +
      "👤 Nome: " + (payload.name || "Não informado")
    );
    window.open("https://wa.me/" + WA_NUMBER + "?text=" + msg, "_blank");
  }

  /* ══════════════════════════════════════
     INIT (auto-runs on DOMContentLoaded)
     ══════════════════════════════════════ */
  function init() {
    load();
    ensureDrawer();
    bindDrawerEvents();

    // Bind the cart open button
    var openBtn = document.getElementById("openCartBtn");
    if (openBtn) {
      openBtn.addEventListener("click", function (e) {
        e.preventDefault();
        open();
      });
    }

    renderBadge();

    // If user is logged in, try an initial sync
    var session = getSession();
    if (session && session.token) {
      syncOnLogin();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* ── Public interface ── */
  return {
    add: add,
    addMultiple: addMultiple,
    remove: remove,
    setQty: setQty,
    clear: clear,
    getItems: getItems,
    getTotal: getTotal,
    getCount: getCount,
    open: open,
    close: close,
    renderBadge: renderBadge,
    renderDrawer: renderDrawer,
    registerProducts: registerProducts,
    syncOnLogin: syncOnLogin,
    showToast: showToast,
    persist: persist,
    requireLogin: requireLogin,
    openWhatsApp: openWhatsApp,
    openWhatsAppBuild: openWhatsAppBuild,
    BRL: BRL,
  };
})();
