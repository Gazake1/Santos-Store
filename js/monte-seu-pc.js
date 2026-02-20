/* =========================================
   Monte seu PC — Santos Gamer
   Form handling, summary preview, WhatsApp
   ========================================= */

(function () {
  "use strict";

  var WA_NUMBER = "5516992070533";

  /* ── DOM refs ── */
  var form = document.getElementById("buildForm");
  var goalSelect = document.getElementById("goalSelect");
  var budgetInput = document.getElementById("budgetInput");
  var cpuPlatform = document.getElementById("cpuPlatform");
  var cpuTier = document.getElementById("cpuTier");
  var ramSelect = document.getElementById("ramSelect");
  var storageSelect = document.getElementById("storageSelect");
  var gpuSelect = document.getElementById("gpuSelect");
  var prefSelect = document.getElementById("prefSelect");
  var nameInput = document.getElementById("nameInput");
  var obsInput = document.getElementById("obsInput");
  var summaryBox = document.getElementById("summaryBox");
  var summaryList = document.getElementById("summaryList");
  var extraChecks = document.querySelectorAll('input[name="extras"]');

  /* ── Checkbox toggle visual ── */
  extraChecks.forEach(function (cb) {
    cb.addEventListener("change", function () {
      var parent = cb.closest(".svc-check");
      if (parent) parent.classList.toggle("is-checked", cb.checked);
      updateSummary();
    });
  });

  /* ── Update summary on any change ── */
  var allInputs = form.querySelectorAll("select, input");
  allInputs.forEach(function (el) {
    el.addEventListener("change", updateSummary);
    el.addEventListener("input", updateSummary);
  });

  function getExtras() {
    var list = [];
    extraChecks.forEach(function (cb) {
      if (cb.checked) list.push(cb.value);
    });
    return list;
  }

  function updateSummary() {
    var items = [];
    if (goalSelect.value) items.push("<li><strong>Objetivo:</strong> " + goalSelect.value + "</li>");
    if (budgetInput.value) items.push("<li><strong>Orçamento:</strong> R$ " + budgetInput.value + "</li>");
    if (cpuPlatform.value) items.push("<li><strong>Processador:</strong> " + cpuPlatform.value + "</li>");
    if (cpuTier.value) items.push("<li><strong>Nível CPU:</strong> " + cpuTier.value + "</li>");
    if (ramSelect.value) items.push("<li><strong>RAM:</strong> " + ramSelect.value + "</li>");
    if (storageSelect.value) items.push("<li><strong>Armazenamento:</strong> " + storageSelect.value + "</li>");
    if (gpuSelect.value) items.push("<li><strong>GPU:</strong> " + gpuSelect.value + "</li>");
    if (prefSelect.value) items.push("<li><strong>Preferência:</strong> " + prefSelect.value + "</li>");

    var extras = getExtras();
    if (extras.length) items.push("<li><strong>Extras:</strong> " + extras.join(", ") + "</li>");

    if (nameInput.value.trim()) items.push("<li><strong>Nome:</strong> " + nameInput.value.trim() + "</li>");
    if (obsInput.value.trim()) items.push("<li><strong>Obs:</strong> " + obsInput.value.trim() + "</li>");

    if (items.length > 0) {
      summaryList.innerHTML = items.join("");
      summaryBox.classList.add("is-visible");
    } else {
      summaryBox.classList.remove("is-visible");
    }

    // Update step indicators
    updateSteps();
  }

  /* ── Step indicator ── */
  function updateSteps() {
    var steps = document.querySelectorAll(".svc-step");
    // Step 1: goal + budget
    var s1 = goalSelect.value && budgetInput.value;
    // Step 2: at least one config
    var s2 = cpuPlatform.value || cpuTier.value || ramSelect.value || storageSelect.value || gpuSelect.value || prefSelect.value;
    // Step 3: name
    var s3 = nameInput.value.trim().length > 0;

    steps.forEach(function (step) {
      step.classList.remove("is-active", "is-done");
    });

    if (s3 && s2 && s1) {
      steps[0].classList.add("is-done");
      steps[1].classList.add("is-done");
      steps[2].classList.add("is-active");
    } else if (s2 || (s1 && !s3)) {
      steps[0].classList.add("is-done");
      steps[1].classList.add("is-active");
    } else {
      steps[0].classList.add("is-active");
    }
  }

  /* ── Submit ── */
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Validate required fields
    if (!goalSelect.value || !budgetInput.value || !nameInput.value.trim()) {
      SgCart.showToast("Preencha ao menos Objetivo, Orçamento e Nome.", "error");
      return;
    }

    var lines = [];
    lines.push("🖥️ *MONTE SEU PC — Santos Gamer*");
    lines.push("");
    lines.push("🎯 *Objetivo:* " + goalSelect.value);
    lines.push("💰 *Orçamento:* R$ " + budgetInput.value);
    lines.push("");

    if (cpuPlatform.value) lines.push("🔧 *Processador:* " + cpuPlatform.value);
    if (cpuTier.value) lines.push("📊 *Nível CPU:* " + cpuTier.value);
    if (ramSelect.value) lines.push("💾 *RAM:* " + ramSelect.value);
    if (storageSelect.value) lines.push("💿 *Armazenamento:* " + storageSelect.value);
    if (gpuSelect.value) lines.push("🎮 *GPU:* " + gpuSelect.value);
    if (prefSelect.value) lines.push("🎨 *Preferência:* " + prefSelect.value);

    var extras = getExtras();
    if (extras.length) {
      lines.push("");
      lines.push("✨ *Extras:* " + extras.join(", "));
    }

    lines.push("");
    lines.push("👤 *Nome:* " + nameInput.value.trim());
    if (obsInput.value.trim()) lines.push("📝 *Obs:* " + obsInput.value.trim());

    var msg = encodeURIComponent(lines.join("\n"));
    window.open("https://wa.me/" + WA_NUMBER + "?text=" + msg, "_blank");

    SgCart.showToast("Redirecionando para o WhatsApp...", "success");
  });

  /* ── Theme & Login (common) ── */
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
