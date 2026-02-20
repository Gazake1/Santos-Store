/* =========================================
   Limpeza — Santos Gamer
   Tier selection, extras, WhatsApp redirect
   ========================================= */

(function () {
  "use strict";

  var WA_NUMBER = "5516992070533";

  /* ── DOM refs ── */
  var form = document.getElementById("limpezaForm");
  var nameInput = document.getElementById("nameInput");
  var modelInput = document.getElementById("modelInput");
  var summaryBox = document.getElementById("summaryBox");
  var summaryList = document.getElementById("summaryList");

  /* ── Device selector ── */
  var deviceOptions = document.querySelectorAll("#deviceSelector .svc-device__option");
  deviceOptions.forEach(function (opt) {
    opt.addEventListener("click", function () {
      deviceOptions.forEach(function (o) { o.classList.remove("is-selected"); });
      opt.classList.add("is-selected");
      opt.querySelector("input").checked = true;
      updateSummary();
    });
  });

  /* ── Tier selector ── */
  var tierCards = document.querySelectorAll("#tierSelector .svc-tier");
  tierCards.forEach(function (card) {
    card.addEventListener("click", function () {
      tierCards.forEach(function (c) { c.classList.remove("is-selected"); });
      card.classList.add("is-selected");
      card.querySelector(".svc-tier__radio").checked = true;
      updateSummary();
    });
  });

  /* ── Checkbox toggle visual ── */
  var extraChecks = document.querySelectorAll('input[name="extras"]');
  extraChecks.forEach(function (cb) {
    cb.addEventListener("change", function () {
      var parent = cb.closest(".svc-check");
      if (parent) parent.classList.toggle("is-checked", cb.checked);
      updateSummary();
    });
  });

  /* ── Listen all inputs ── */
  var allInputs = form.querySelectorAll("input, select");
  allInputs.forEach(function (el) {
    el.addEventListener("change", updateSummary);
    el.addEventListener("input", updateSummary);
  });

  function getSelectedDevice() {
    var checked = document.querySelector('input[name="device"]:checked');
    return checked ? checked.value : "";
  }

  function getSelectedTier() {
    var checked = document.querySelector('input[name="tier"]:checked');
    return checked ? checked.value : "";
  }

  function getExtras() {
    var list = [];
    extraChecks.forEach(function (cb) {
      if (cb.checked) list.push(cb.value);
    });
    return list;
  }

  function updateSummary() {
    var items = [];
    var device = getSelectedDevice();
    var tier = getSelectedTier();
    var extras = getExtras();

    if (device) items.push("<li><strong>Dispositivo:</strong> " + device + "</li>");
    if (tier) items.push("<li><strong>Tipo de limpeza:</strong> " + tier + "</li>");
    if (extras.length) items.push("<li><strong>Extras:</strong> " + extras.join(", ") + "</li>");
    if (nameInput.value.trim()) items.push("<li><strong>Nome:</strong> " + nameInput.value.trim() + "</li>");
    if (modelInput.value.trim()) items.push("<li><strong>Modelo:</strong> " + modelInput.value.trim() + "</li>");

    if (items.length > 0) {
      summaryList.innerHTML = items.join("");
      summaryBox.classList.add("is-visible");
    } else {
      summaryBox.classList.remove("is-visible");
    }
  }

  /* ── Submit ── */
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var tier = getSelectedTier();
    if (!tier) {
      SgCart.showToast("Selecione o tipo de limpeza.", "error");
      return;
    }
    if (!nameInput.value.trim()) {
      SgCart.showToast("Preencha seu nome.", "error");
      return;
    }

    var device = getSelectedDevice();
    var extras = getExtras();

    var lines = [];
    lines.push("🧹 *LIMPEZA — Santos Gamer*");
    lines.push("");
    lines.push("📱 *Dispositivo:* " + (device || "Não informado"));
    lines.push("✨ *Tipo de limpeza:* " + tier);

    if (extras.length) {
      lines.push("");
      lines.push("➕ *Extras:*");
      extras.forEach(function (ex) { lines.push("  • " + ex); });
    }

    lines.push("");
    lines.push("👤 *Nome:* " + nameInput.value.trim());
    if (modelInput.value.trim()) lines.push("💻 *Modelo:* " + modelInput.value.trim());

    var msg = encodeURIComponent(lines.join("\n"));
    window.open("https://wa.me/" + WA_NUMBER + "?text=" + msg, "_blank");

    SgCart.showToast("Redirecionando para o WhatsApp...", "success");
  });

  /* ── Theme & Login ── */
  var themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var isDark = document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("sg_theme", "light");
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("sg_theme", "dark");
      }
    });
  }

  var loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    var session;
    try { session = JSON.parse(localStorage.getItem("sg_user") || "null"); } catch (_) { session = null; }
    if (session && session.token) {
      loginBtn.querySelector("span").textContent = session.name || "Minha conta";
      loginBtn.addEventListener("click", function () { window.location.href = "minha-conta.html"; });
    } else {
      loginBtn.addEventListener("click", function () { window.location.href = "login.html"; });
    }
  }

  /* ── Back to top ── */
  var btt = document.getElementById("backToTop");
  if (btt) {
    window.addEventListener("scroll", function () {
      btt.classList.toggle("is-visible", window.scrollY > 400);
    });
    btt.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
