/* =========================================
   Santos Gamer — Auth (Frontend)
   Handles login, register, password toggle,
   theme sync, and session management.
   ========================================= */

(function () {
  "use strict";

  const API = window.location.port
    ? `${window.location.protocol}//${window.location.hostname}:3000/api`
    : "/api";

  /* ── Theme sync ── */
  const saved = localStorage.getItem("sg_theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);

  /* ── Toast ── */
  const toastContainer = document.getElementById("toastContainer");

  function showToast(msg, type = "success") {
    if (!toastContainer) return;
    const t = document.createElement("div");
    t.className = `toast toast--${type}`;
    t.textContent = msg;
    toastContainer.appendChild(t);
    requestAnimationFrame(() => t.classList.add("toast--show"));
    setTimeout(() => {
      t.classList.remove("toast--show");
      t.addEventListener("transitionend", () => t.remove());
    }, 3000);
  }

  /* ── Password toggle ── */
  const toggleBtn = document.getElementById("togglePass");
  const passInput = document.getElementById("password");

  if (toggleBtn && passInput) {
    const eyeOpen = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const eyeClosed = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

    toggleBtn.addEventListener("click", () => {
      const isPassword = passInput.type === "password";
      passInput.type = isPassword ? "text" : "password";
      toggleBtn.innerHTML = isPassword ? eyeClosed : eyeOpen;
      toggleBtn.setAttribute("aria-label", isPassword ? "Ocultar senha" : "Mostrar senha");
    });
  }

  /* ── Helpers ── */
  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
  }

  function hideError(el) {
    if (!el) return;
    el.textContent = "";
    el.hidden = true;
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? "Aguarde..." : btn.dataset.originalText || btn.textContent;
    if (!loading) return;
    btn.dataset.originalText = btn.dataset.originalText || btn.textContent.replace("Aguarde...", "").trim();
  }

  /* Save session to localStorage */
  function saveSession(data) {
    localStorage.setItem(
      "sg_user",
      JSON.stringify({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        token: data.token,
      })
    );
  }

  /* ── Redirect if already logged in ── */
  const currentUser = localStorage.getItem("sg_user");
  if (currentUser) {
    // If user is logged in, redirect to home or previous page
    const redirectTo = sessionStorage.getItem("sg_redirect") || "../index.html";
    sessionStorage.removeItem("sg_redirect");
    window.location.href = redirectTo;
    return;
  }

  /* ===================================
     LOGIN FORM
     =================================== */
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const loginSubmit = document.getElementById("loginSubmit");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideError(loginError);

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      if (!email || !password) {
        showError(loginError, "Preencha todos os campos");
        return;
      }

      setLoading(loginSubmit, true);

      try {
        const res = await fetch(`${API}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          showError(loginError, data.error || "Erro ao fazer login");
          setLoading(loginSubmit, false);
          return;
        }

        // Save session
        saveSession(data);
        showToast(`Bem-vindo, ${data.user.name}!`);

        // Redirect after short delay for toast visibility
        setTimeout(() => {
          const redirectTo = sessionStorage.getItem("sg_redirect") || "../index.html";
          sessionStorage.removeItem("sg_redirect");
          window.location.href = redirectTo;
        }, 800);
      } catch (err) {
        console.error("Login error:", err);
        showError(loginError, "Erro de conexão. Verifique se o servidor está rodando.");
        setLoading(loginSubmit, false);
      }
    });
  }

  /* ===================================
     REGISTER FORM
     =================================== */
  const registerForm = document.getElementById("registerForm");
  const registerError = document.getElementById("registerError");
  const registerSubmit = document.getElementById("registerSubmit");

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideError(registerError);

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      // Client-side validation
      if (!name || !email || !password || !confirmPassword) {
        showError(registerError, "Preencha todos os campos");
        return;
      }
      if (name.length < 3) {
        showError(registerError, "Nome deve ter pelo menos 3 caracteres");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError(registerError, "E-mail inválido");
        return;
      }
      if (password.length < 6) {
        showError(registerError, "Senha deve ter pelo menos 6 caracteres");
        return;
      }
      if (password !== confirmPassword) {
        showError(registerError, "As senhas não coincidem");
        return;
      }

      setLoading(registerSubmit, true);

      try {
        const res = await fetch(`${API}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          showError(registerError, data.error || "Erro ao criar conta");
          setLoading(registerSubmit, false);
          return;
        }

        // Auto-login after registration
        saveSession(data);
        showToast("Conta criada com sucesso!");

        setTimeout(() => {
          const redirectTo = sessionStorage.getItem("sg_redirect") || "../index.html";
          sessionStorage.removeItem("sg_redirect");
          window.location.href = redirectTo;
        }, 800);
      } catch (err) {
        console.error("Register error:", err);
        showError(registerError, "Erro de conexão. Verifique se o servidor está rodando.");
        setLoading(registerSubmit, false);
      }
    });
  }
})();
