/* =========================================
   Upgrade + Otimização — Santos Store
   Checkbox upgrades, device toggle, WhatsApp
   ========================================= */

(function () {
  "use strict";

  var WA_NUMBER = "5516992070533";

  /* ── DOM refs ── */
  var form = document.getElementById("upgradeForm");
  var nameInput = document.getElementById("nameInput");
  var modelInput = document.getElementById("modelInput");
  var budgetInput = document.getElementById("budgetInput");
  var descInput = document.getElementById("descInput");
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

  /* ── Checkbox toggle visual ── */
  var upgradeChecks = document.querySelectorAll('input[name="upgrades"]');
  upgradeChecks.forEach(function (cb) {
    cb.addEventListener("change", function () {
      var parent = cb.closest(".svc-check");
      if (parent) parent.classList.toggle("is-checked", cb.checked);
      updateSummary();
    });
  });

  /* ── Listen all inputs ── */
  var allInputs = form.querySelectorAll("input, select, textarea");
  allInputs.forEach(function (el) {
    el.addEventListener("change", updateSummary);
    el.addEventListener("input", updateSummary);
  });

  function getSelectedDevice() {
    var checked = document.querySelector('input[name="device"]:checked');
    return checked ? checked.value : "";
  }

  function getUpgrades() {
    var list = [];
    upgradeChecks.forEach(function (cb) {
      if (cb.checked) list.push(cb.value);
    });
    return list;
  }

  function updateSummary() {
    var items = [];
    var device = getSelectedDevice();
    var upgrades = getUpgrades();

    if (device) items.push("<li><strong>Dispositivo:</strong> " + device + "</li>");
    if (upgrades.length) items.push("<li><strong>Upgrades:</strong> " + upgrades.join(", ") + "</li>");
    if (modelInput.value.trim()) items.push("<li><strong>Modelo:</strong> " + modelInput.value.trim() + "</li>");
    if (budgetInput.value) items.push("<li><strong>Orçamento:</strong> R$ " + budgetInput.value + "</li>");
    if (descInput.value.trim()) items.push("<li><strong>Descrição:</strong> " + descInput.value.trim().substring(0, 80) + (descInput.value.trim().length > 80 ? "..." : "") + "</li>");
    if (nameInput.value.trim()) items.push("<li><strong>Nome:</strong> " + nameInput.value.trim() + "</li>");

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

    var upgrades = getUpgrades();
    if (!upgrades.length) {
      SgCart.showToast("Selecione pelo menos um upgrade.", "error");
      return;
    }
    if (!nameInput.value.trim()) {
      SgCart.showToast("Preencha seu nome.", "error");
      return;
    }

    var device = getSelectedDevice();

    var lines = [];
    lines.push("🚀 *UPGRADE + OTIMIZAÇÃO — Santos Store*");
    lines.push("");
    lines.push("📱 *Dispositivo:* " + (device || "Não informado"));
    lines.push("");
    lines.push("⚙️ *Upgrades desejados:*");
    upgrades.forEach(function (u) { lines.push("  • " + u); });

    if (modelInput.value.trim()) {
      lines.push("");
      lines.push("💻 *Modelo/config atual:* " + modelInput.value.trim());
    }
    if (budgetInput.value) {
      lines.push("💰 *Orçamento:* R$ " + budgetInput.value);
    }
    if (descInput.value.trim()) {
      lines.push("");
      lines.push("📝 *Descrição:* " + descInput.value.trim());
    }

    lines.push("");
    lines.push("👤 *Nome:* " + nameInput.value.trim());

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
