/* =========================================
   Santos Gamer — Minha Conta (Frontend)
   Profile panel, data persistence, prefs
   ========================================= */

(function () {
  "use strict";

  const API = window.location.port
    ? `${window.location.protocol}//${window.location.hostname}:3000/api`
    : "/api";

  /* ── Auth check — redirect if not logged in ── */
  const session = JSON.parse(localStorage.getItem("sg_user") || "null");
  const token = localStorage.getItem("sg_token");
  if (!session || !token) {
    sessionStorage.setItem("sg_redirect", window.location.href);
    window.location.href = "login.html";
    return;
  }

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  /* ── DOM refs ── */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  /* ── Theme sync ── */
  const savedTheme = localStorage.getItem("sg_theme");
  if (savedTheme === "dark") document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");

  const themeToggleHeader = $("#themeToggle");
  if (themeToggleHeader) themeToggleHeader.addEventListener("click", toggleTheme);

  function toggleTheme() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("sg_theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("sg_theme", "dark");
    }
    // Sync the switch in preferences
    const prefToggle = $("#prefThemeToggle");
    if (prefToggle) prefToggle.checked = !isDark;
  }

  /* ── Toast ── */
  const toastContainer = $("#toastContainer");

  function showToast(msg, type = "success", duration = 3000) {
    if (!toastContainer) return;
    const t = document.createElement("div");
    t.className = `toast toast--${type}`;
    const icon = type === "success" ? "✓" : "✕";
    t.innerHTML = `<span class="toast__icon">${icon}</span><span>${escapeHtml(msg)}</span>`;
    toastContainer.appendChild(t);
    setTimeout(() => {
      t.classList.add("is-leaving");
      t.addEventListener("animationend", () => t.remove());
    }, duration);
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ── Helpers ── */
  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
  }

  function showSuccess(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    setTimeout(() => { el.hidden = true; }, 4000);
  }

  function hideMsg(el) {
    if (!el) return;
    el.textContent = "";
    el.hidden = true;
  }

  function setLoading(btn, loading, originalText) {
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? "Aguarde..." : (originalText || "Salvar");
  }

  /* ── Input masks ── */
  function maskCpf(v) {
    return v.replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  }

  function maskPhone(v) {
    return v.replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
  }

  function maskCep(v) {
    return v.replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 9);
  }

  // Apply masks
  const cpfInput = $("#profileCpf");
  const phoneInput = $("#profilePhone");
  const cepInput = $("#profileCep");

  if (cpfInput) cpfInput.addEventListener("input", () => { cpfInput.value = maskCpf(cpfInput.value); });
  if (phoneInput) phoneInput.addEventListener("input", () => { phoneInput.value = maskPhone(phoneInput.value); });
  if (cepInput) {
    cepInput.addEventListener("input", () => { cepInput.value = maskCep(cepInput.value); });
    cepInput.addEventListener("blur", fetchCep);
  }

  /* ── CEP auto-fill (ViaCEP) ── */
  async function fetchCep() {
    const cep = (cepInput.value || "").replace(/\D/g, "");
    if (cep.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) return;

      if (data.logradouro) $("#profileStreet").value = data.logradouro;
      if (data.bairro) $("#profileNeighborhood").value = data.bairro;
      if (data.localidade) $("#profileCity").value = data.localidade;
      if (data.uf) $("#profileState").value = data.uf;
    } catch { /* silent */ }
  }

  /* ── Tab navigation ── */
  const navItems = $$(".account__nav-item[data-tab]");
  const panels = $$(".account__panel");

  navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      navItems.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      panels.forEach((p) => p.classList.remove("is-active"));
      const target = $(`#panel-${tab}`);
      if (target) target.classList.add("is-active");

      // Save last tab
      localStorage.setItem("sg_account_tab", tab);
    });
  });

  // Restore last tab
  const lastTab = localStorage.getItem("sg_account_tab");
  if (lastTab) {
    const btn = $(`.account__nav-item[data-tab="${lastTab}"]`);
    if (btn) btn.click();
  }

  /* ── Load profile data ── */
  const profileData = JSON.parse(localStorage.getItem("sg_profile") || "null") || {};

  function loadProfileData() {
    // Basic info from session
    $("#accountName").textContent = session.name || "—";
    $("#accountEmail").textContent = session.email || "—";

    // Header login text
    const loginText = $("#loginBtnText");
    if (loginText) {
      loginText.textContent = session.name ? session.name.split(" ")[0] : "Conta";
    }

    // Avatar
    loadAvatar();

    // Profile form fields
    $("#profileName").value = profileData.name || session.name || "";
    $("#profileNickname").value = profileData.nickname || "";
    $("#profileCpf").value = profileData.cpf || "";
    $("#profilePhone").value = profileData.phone || "";
    $("#profileBirth").value = profileData.birth || "";
    $("#profileGender").value = profileData.gender || "";

    // Address
    $("#profileCep").value = profileData.cep || "";
    $("#profileStreet").value = profileData.street || "";
    $("#profileNumber").value = profileData.number || "";
    $("#profileComplement").value = profileData.complement || "";
    $("#profileNeighborhood").value = profileData.neighborhood || "";
    $("#profileCity").value = profileData.city || "";
    $("#profileState").value = profileData.state || "";

    // Security - current email
    const currentEmailInput = $("#currentEmail");
    if (currentEmailInput) currentEmailInput.value = session.email || "";

    // Member since
    fetchMemberSince();
  }

  async function fetchMemberSince() {
    try {
      const res = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          if (data.user.created_at) {
            const date = new Date(data.user.created_at);
            const formatted = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
            $("#accountSince").textContent = `Membro desde ${formatted}`;
          }
          // Sync server profile data to form fields
          if (data.user.nickname && !profileData.nickname) { profileData.nickname = data.user.nickname; $("#profileNickname").value = data.user.nickname; }
          if (data.user.cpf && !profileData.cpf) { profileData.cpf = data.user.cpf; $("#profileCpf").value = data.user.cpf; }
          if (data.user.phone && !profileData.phone) { profileData.phone = data.user.phone; $("#profilePhone").value = data.user.phone; }
          if (data.user.birth && !profileData.birth) { profileData.birth = data.user.birth; $("#profileBirth").value = data.user.birth; }
          if (data.user.gender && !profileData.gender) { profileData.gender = data.user.gender; $("#profileGender").value = data.user.gender; }
        }
      }
    } catch { /* silent */ }
  }

  /* ── Avatar ── */
  function loadAvatar() {
    const avatar = localStorage.getItem("sg_avatar");
    const img = $("#avatarImg");
    const placeholder = $("#avatarPlaceholder");

    if (avatar) {
      img.src = avatar;
      img.classList.add("is-visible");
      placeholder.classList.add("is-hidden");
    } else {
      img.classList.remove("is-visible");
      placeholder.classList.remove("is-hidden");
    }
  }

  $("#avatarEditBtn").addEventListener("click", () => {
    $("#avatarInput").click();
  });

  $("#avatarInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Imagem muito grande. Máximo 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      // Resize image to save localStorage space
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 200;
        let w = img.width, h = img.height;
        if (w > h) { h = (h / w) * MAX; w = MAX; }
        else { w = (w / h) * MAX; h = MAX; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

        localStorage.setItem("sg_avatar", dataUrl);
        loadAvatar();
        showToast("Foto de perfil atualizada!");
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  /* ── Profile form submit ── */
  const profileForm = $("#profileForm");
  const profileError = $("#profileError");
  const profileSuccess = $("#profileSuccess");

  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg(profileError);
    hideMsg(profileSuccess);

    const name = $("#profileName").value.trim();
    if (!name || name.length < 3) {
      showError(profileError, "Nome deve ter pelo menos 3 caracteres.");
      return;
    }

    const data = {
      name,
      nickname: $("#profileNickname").value.trim(),
      cpf: $("#profileCpf").value.trim(),
      phone: $("#profilePhone").value.trim(),
      birth: $("#profileBirth").value,
      gender: $("#profileGender").value,
      cep: $("#profileCep").value.trim(),
      street: $("#profileStreet").value.trim(),
      number: $("#profileNumber").value.trim(),
      complement: $("#profileComplement").value.trim(),
      neighborhood: $("#profileNeighborhood").value.trim(),
      city: $("#profileCity").value.trim(),
      state: $("#profileState").value,
    };

    setLoading($("#profileSubmit"), true, "Salvar alterações");

    try {
      // Update profile on server (all fields)
      const res = await fetch(`${API}/profile`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({
          name: data.name,
          nickname: data.nickname,
          cpf: data.cpf,
          phone: data.phone,
          birth: data.birth,
          gender: data.gender,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        // Update session
        session.name = result.user.name;
        localStorage.setItem("sg_user", JSON.stringify(session));
        $("#accountName").textContent = session.name;
        const loginText = $("#loginBtnText");
        if (loginText) loginText.textContent = session.name.split(" ")[0];
      }
    } catch {
      // Server might not be running, still save locally
    }

    // Save profile data locally
    localStorage.setItem("sg_profile", JSON.stringify(data));
    profileData.name = data.name;

    setLoading($("#profileSubmit"), false, "Salvar alterações");
    showSuccess(profileSuccess, "Dados salvos com sucesso!");
    showToast("Dados pessoais atualizados!");
  });

  // Cancel button
  $("#profileCancel").addEventListener("click", () => {
    loadProfileData();
    showToast("Alterações descartadas", "success");
  });

  /* ── Change email ── */
  const emailForm = $("#emailForm");
  const emailError = $("#emailError");
  const emailSuccess = $("#emailSuccess");

  emailForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg(emailError);
    hideMsg(emailSuccess);

    const newEmail = $("#newEmail").value.trim();
    const password = $("#emailPassword").value;

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      showError(emailError, "E-mail inválido.");
      return;
    }
    if (!password) {
      showError(emailError, "Digite sua senha atual para confirmar.");
      return;
    }

    setLoading($("#emailSubmit"), true, "Alterar e-mail");

    try {
      const res = await fetch(`${API}/profile/email`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ newEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(emailError, data.error || "Erro ao alterar e-mail.");
        setLoading($("#emailSubmit"), false, "Alterar e-mail");
        return;
      }

      // Update session
      session.email = newEmail.toLowerCase();
      if (data.token) localStorage.setItem("sg_token", data.token);
      localStorage.setItem("sg_user", JSON.stringify(session));
      $("#currentEmail").value = session.email;
      $("#accountEmail").textContent = session.email;

      showSuccess(emailSuccess, "E-mail alterado com sucesso!");
      showToast("E-mail atualizado!");
      $("#newEmail").value = "";
      $("#emailPassword").value = "";
    } catch (err) {
      showError(emailError, "Erro de conexão. Verifique se o servidor está rodando.");
    }

    setLoading($("#emailSubmit"), false, "Alterar e-mail");
  });

  /* ── Change password ── */
  const passwordForm = $("#passwordForm");
  const passwordError = $("#passwordError");
  const passwordSuccess = $("#passwordSuccess");

  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg(passwordError);
    hideMsg(passwordSuccess);

    const current = $("#currentPassword").value;
    const newPass = $("#newPassword").value;
    const confirm = $("#confirmNewPassword").value;

    if (!current) {
      showError(passwordError, "Digite sua senha atual.");
      return;
    }
    if (newPass.length < 6) {
      showError(passwordError, "Nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPass !== confirm) {
      showError(passwordError, "As senhas não coincidem.");
      return;
    }

    setLoading($("#passwordSubmit"), true, "Alterar senha");

    try {
      const res = await fetch(`${API}/profile/password`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(passwordError, data.error || "Erro ao alterar senha.");
        setLoading($("#passwordSubmit"), false, "Alterar senha");
        return;
      }

      if (data.token) {
        localStorage.setItem("sg_token", data.token);
      }

      showSuccess(passwordSuccess, "Senha alterada com sucesso!");
      showToast("Senha atualizada!");
      passwordForm.reset();
    } catch (err) {
      showError(passwordError, "Erro de conexão. Verifique se o servidor está rodando.");
    }

    setLoading($("#passwordSubmit"), false, "Alterar senha");
  });

  /* ── Logout ── */
  $("#logoutBtn").addEventListener("click", async () => {
    if (!confirm("Deseja realmente sair da sua conta?")) return;

    try {
      await fetch(`${API}/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* silent */ }

    localStorage.removeItem("sg_user");
    localStorage.removeItem("sg_token");
    localStorage.removeItem("sg_cart");
    showToast("Logout realizado!");
    setTimeout(() => { window.location.href = "../index.html"; }, 600);
  });

  /* ── Preferences: theme toggle ── */
  const prefTheme = $("#prefThemeToggle");
  if (prefTheme) {
    prefTheme.checked = localStorage.getItem("sg_theme") === "dark";
    prefTheme.addEventListener("change", () => {
      if (prefTheme.checked) {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("sg_theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("sg_theme", "light");
      }
    });
  }

  /* ── Preferences: notification switches ── */
  const prefOffers = $("#prefOffers");
  const prefOrderUpdates = $("#prefOrderUpdates");

  // Load saved preferences
  const prefs = JSON.parse(localStorage.getItem("sg_prefs") || "{}");
  if (prefOffers) prefOffers.checked = prefs.offers !== false;
  if (prefOrderUpdates) prefOrderUpdates.checked = prefs.orderUpdates !== false;

  function savePrefs() {
    localStorage.setItem("sg_prefs", JSON.stringify({
      offers: prefOffers ? prefOffers.checked : true,
      orderUpdates: prefOrderUpdates ? prefOrderUpdates.checked : true,
    }));
  }

  if (prefOffers) prefOffers.addEventListener("change", () => { savePrefs(); showToast("Preferência salva"); });
  if (prefOrderUpdates) prefOrderUpdates.addEventListener("change", () => { savePrefs(); showToast("Preferência salva"); });

  /* ── Clear data ── */
  $("#clearCartData").addEventListener("click", () => {
    if (!confirm("Limpar carrinho salvo?")) return;
    localStorage.removeItem("sg_cart_v1");
    localStorage.removeItem("sg_cart");
    if (window.SgCart) SgCart.clear();
    showToast("Carrinho limpo!");
    if (window.SgCart) SgCart.renderBadge();
  });

  $("#clearAllData").addEventListener("click", () => {
    if (!confirm("Limpar TODOS os dados locais? (carrinho, preferências, tema)\nVocê continuará logado.")) return;
    localStorage.removeItem("sg_cart_v1");
    localStorage.removeItem("sg_cart");
    localStorage.removeItem("sg_profile");
    localStorage.removeItem("sg_avatar");
    localStorage.removeItem("sg_prefs");
    localStorage.removeItem("sg_theme");
    localStorage.removeItem("sg_purchases");
    localStorage.removeItem("sg_account_tab");
    localStorage.removeItem("sg_token");
    document.documentElement.removeAttribute("data-theme");
    showToast("Dados locais limpos!");
    setTimeout(() => location.reload(), 800);
  });

  /* ── Delete account ── */
  $("#deleteAccountBtn").addEventListener("click", async () => {
    const confirmed = confirm(
      "ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nTodos os seus dados serão apagados permanentemente.\n\nDeseja realmente excluir sua conta?"
    );
    if (!confirmed) return;

    const doubleConfirm = confirm("Tem certeza absoluta? Não será possível recuperar sua conta.");
    if (!doubleConfirm) return;

    try {
      const res = await fetch(`${API}/profile`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        // Clear all local data
        localStorage.removeItem("sg_user");
        localStorage.removeItem("sg_token");
        localStorage.removeItem("sg_profile");
        localStorage.removeItem("sg_avatar");
        localStorage.removeItem("sg_cart_v1");
        localStorage.removeItem("sg_cart");
        localStorage.removeItem("sg_prefs");
        localStorage.removeItem("sg_theme");
        localStorage.removeItem("sg_purchases");

        showToast("Conta excluída com sucesso.");
        setTimeout(() => { window.location.href = "../index.html"; }, 1000);
      } else {
        showToast("Erro ao excluir conta.", "error");
      }
    } catch {
      showToast("Erro de conexão.", "error");
    }
  });

  /* ── Orders / Purchase history ── */
  function loadOrders() {
    const purchases = JSON.parse(localStorage.getItem("sg_purchases") || "[]");

    if (purchases.length > 0) {
      // Show orders
      const ordersEmpty = $("#ordersEmpty");
      const ordersList = $("#ordersList");
      const historyCard = $("#purchaseHistoryCard");

      if (ordersEmpty) ordersEmpty.hidden = true;
      if (ordersList) {
        ordersList.hidden = false;
        ordersList.innerHTML = purchases.map((p, i) => `
          <div class="order-item">
            <div class="order-item__info">
              <div class="order-item__name">${escapeHtml(p.name || `Pedido #${i + 1}`)}</div>
              <div class="order-item__detail">${escapeHtml(p.date || "—")} • ${escapeHtml(p.total || "—")}</div>
            </div>
            <span class="order-item__status order-item__status--completed">Concluído</span>
          </div>
        `).join("");
      }

      if (historyCard) {
        historyCard.hidden = false;
        const historyEl = $("#purchaseHistory");
        if (historyEl) {
          historyEl.innerHTML = purchases.map((p) => `
            <div class="history-item">
              <span class="history-item__name">${escapeHtml(p.name || "Produto")}</span>
              <span class="history-item__date">${escapeHtml(p.date || "—")}</span>
              <button class="history-item__rebuy" data-rebuy='${escapeHtml(JSON.stringify(p))}'>Comprar novamente</button>
            </div>
          `).join("");

          historyEl.querySelectorAll("[data-rebuy]").forEach((btn) => {
            btn.addEventListener("click", () => {
              showToast("Produto adicionado ao carrinho!");
            });
          });
        }
      }
    }
  }

  /* ── Header login button ── */
  const loginBtn = $("#loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      // Already on account page, do nothing
    });
  }

  /* ── Init ── */
  loadProfileData();
  loadOrders();
  if (window.SgCart) SgCart.renderBadge();
})();
