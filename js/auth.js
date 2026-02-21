/* =========================================
   Santos Store — Auth (Frontend)
   Login, register, CPF validation, phone
   verification, ViaCEP, age check,
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

  /* ── CPF Validation (check digit algorithm) ── */
  function validateCPF(cpf) {
    const digits = (cpf || "").replace(/\D/g, "");
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(digits[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(digits[10])) return false;

    return true;
  }

  /* ── Age calculation ── */
  function calculateAge(birthDateStr) {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  /* ── Save session to localStorage ── */
  function saveSession(data) {
    localStorage.setItem("sg_user", JSON.stringify({
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
    }));
    localStorage.setItem("sg_token", data.token);

    // Save extended profile (includes address, theme, avatar)
    localStorage.setItem("sg_profile", JSON.stringify({
      nickname: data.user.nickname || "",
      cpf: data.user.cpf || "",
      phone: data.user.phone || "",
      phone_verified: data.user.phone_verified || 0,
      birth: data.user.birth || "",
      gender: data.user.gender || "",
      theme_preference: data.user.theme_preference || "light",
      avatar: data.user.avatar || "",
      cep: data.user.cep || "",
      street: data.user.street || "",
      street_number: data.user.street_number || "",
      complement: data.user.complement || "",
      neighborhood: data.user.neighborhood || "",
      city: data.user.city || "",
      state: data.user.state || "",
    }));

    // Apply theme preference from server
    const theme = data.user.theme_preference || "light";
    localStorage.setItem("sg_theme", theme);
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  /* ── Redirect if already logged in ── */
  const currentUser = localStorage.getItem("sg_user");
  if (currentUser) {
    const redirectTo = sessionStorage.getItem("sg_redirect") || "minha-conta.html";
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

        // Save full session (user, token, profile, theme, avatar)
        saveSession(data);

        // Sync cart from server
        if (window.SgCart && data.cart) {
          SgCart.syncOnLogin(data.cart);
        }

        showToast(`Bem-vindo, ${data.user.name}!`);

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
    // ── Track verification state ──
    let phoneVerified = false;
    let phoneVerifiedCode = "";

    // ── CPF mask ──
    const cpfInput = document.getElementById("cpf");
    if (cpfInput) {
      cpfInput.addEventListener("input", () => {
        let v = cpfInput.value.replace(/\D/g, "").slice(0, 11);
        if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
        else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
        else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
        cpfInput.value = v;
      });

      // Real-time CPF validation feedback
      cpfInput.addEventListener("blur", () => {
        const raw = cpfInput.value.replace(/\D/g, "");
        const feedback = document.getElementById("cpfFeedback");
        if (raw.length === 11) {
          if (validateCPF(cpfInput.value)) {
            if (feedback) { feedback.textContent = "✓ CPF válido"; feedback.className = "auth__feedback auth__feedback--ok"; }
            cpfInput.classList.remove("auth__input--error");
            cpfInput.classList.add("auth__input--ok");
          } else {
            if (feedback) { feedback.textContent = "✕ CPF inválido — verifique os dígitos"; feedback.className = "auth__feedback auth__feedback--error"; }
            cpfInput.classList.add("auth__input--error");
            cpfInput.classList.remove("auth__input--ok");
          }
        } else if (raw.length > 0) {
          if (feedback) { feedback.textContent = "CPF deve ter 11 dígitos"; feedback.className = "auth__feedback auth__feedback--error"; }
          cpfInput.classList.add("auth__input--error");
          cpfInput.classList.remove("auth__input--ok");
        } else {
          if (feedback) { feedback.textContent = ""; feedback.className = "auth__feedback"; }
          cpfInput.classList.remove("auth__input--error", "auth__input--ok");
        }
      });
    }

    // ── Phone mask ──
    const phoneInput = document.getElementById("phone");
    if (phoneInput) {
      phoneInput.addEventListener("input", () => {
        let v = phoneInput.value.replace(/\D/g, "").slice(0, 11);
        if (v.length > 6) v = v.replace(/(\d{2})(\d{5})(\d{1,4})/, "($1) $2-$3");
        else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,5})/, "($1) $2");
        phoneInput.value = v;

        // Reset verification if phone changes
        const raw = v.replace(/\D/g, "");
        if (raw.length === 11) {
          showSendCodeBtn(true);
        } else {
          showSendCodeBtn(false);
          phoneVerified = false;
          phoneVerifiedCode = "";
          updatePhoneStatus(false);
        }
      });
    }

    // ── Phone verification UI ──
    const sendCodeBtn = document.getElementById("sendCodeBtn");
    const phoneCodeWrap = document.getElementById("phoneCodeWrap");
    const phoneCodeInput = document.getElementById("phoneCode");
    const confirmCodeBtn = document.getElementById("confirmCodeBtn");
    const phoneFeedback = document.getElementById("phoneFeedback");

    function showSendCodeBtn(show) {
      if (sendCodeBtn) sendCodeBtn.style.display = show ? "inline-flex" : "none";
    }

    function updatePhoneStatus(verified) {
      if (phoneFeedback) {
        if (verified) {
          phoneFeedback.textContent = "✓ Telefone verificado";
          phoneFeedback.className = "auth__feedback auth__feedback--ok";
        } else {
          phoneFeedback.textContent = "";
          phoneFeedback.className = "auth__feedback";
        }
      }
      if (phoneCodeWrap && verified) {
        phoneCodeWrap.style.display = "none";
      }
    }

    if (sendCodeBtn) {
      sendCodeBtn.addEventListener("click", async () => {
        const phone = phoneInput ? phoneInput.value : "";
        if (!phone || phone.replace(/\D/g, "").length < 11) {
          showToast("Preencha o telefone completo", "error");
          return;
        }

        sendCodeBtn.disabled = true;
        sendCodeBtn.textContent = "Enviando...";

        try {
          const res = await fetch(`${API}/verify/send-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone }),
          });

          const data = await res.json();

          if (!res.ok) {
            showToast(data.error || "Erro ao enviar código", "error");
            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = "Enviar código";
            return;
          }

          showToast("Código enviado! Verifique o console do servidor.", "success");
          if (phoneCodeWrap) phoneCodeWrap.style.display = "flex";
          if (phoneCodeInput) phoneCodeInput.focus();

          // Countdown 60s
          let countdown = 60;
          sendCodeBtn.textContent = `Reenviar (${countdown}s)`;
          const timer = setInterval(() => {
            countdown--;
            sendCodeBtn.textContent = `Reenviar (${countdown}s)`;
            if (countdown <= 0) {
              clearInterval(timer);
              sendCodeBtn.disabled = false;
              sendCodeBtn.textContent = "Reenviar código";
            }
          }, 1000);

        } catch (err) {
          console.error("Send code error:", err);
          showToast("Erro de conexão", "error");
          sendCodeBtn.disabled = false;
          sendCodeBtn.textContent = "Enviar código";
        }
      });
    }

    if (confirmCodeBtn) {
      confirmCodeBtn.addEventListener("click", async () => {
        const phone = phoneInput ? phoneInput.value : "";
        const code = phoneCodeInput ? phoneCodeInput.value.trim() : "";

        if (!code || code.length < 6) {
          showToast("Digite o código de 6 dígitos", "error");
          return;
        }

        confirmCodeBtn.disabled = true;
        confirmCodeBtn.textContent = "Verificando...";

        try {
          const res = await fetch(`${API}/verify/confirm-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, code }),
          });

          const data = await res.json();

          if (!res.ok) {
            showToast(data.error || "Código inválido", "error");
            confirmCodeBtn.disabled = false;
            confirmCodeBtn.textContent = "Confirmar";
            return;
          }

          phoneVerified = true;
          phoneVerifiedCode = code;
          updatePhoneStatus(true);
          showToast("Telefone verificado com sucesso!");

        } catch (err) {
          console.error("Confirm code error:", err);
          showToast("Erro de conexão", "error");
          confirmCodeBtn.disabled = false;
          confirmCodeBtn.textContent = "Confirmar";
        }
      });
    }

    // ── Birth date validation (blur) ──
    const birthInput = document.getElementById("birth");
    if (birthInput) {
      birthInput.addEventListener("blur", () => {
        const feedback = document.getElementById("birthFeedback");
        if (!birthInput.value) {
          if (feedback) { feedback.textContent = ""; feedback.className = "auth__feedback"; }
          return;
        }
        const age = calculateAge(birthInput.value);
        if (age === null) {
          if (feedback) { feedback.textContent = "Data inválida"; feedback.className = "auth__feedback auth__feedback--error"; }
        } else if (age < 18) {
          if (feedback) { feedback.textContent = `✕ Você tem ${age} anos — é necessário ter 18+`; feedback.className = "auth__feedback auth__feedback--error"; }
        } else {
          if (feedback) { feedback.textContent = `✓ ${age} anos`; feedback.className = "auth__feedback auth__feedback--ok"; }
        }
      });
    }

    // ── CEP mask + ViaCEP auto-fill ──
    const cepInput = document.getElementById("cep");
    if (cepInput) {
      cepInput.addEventListener("input", () => {
        let v = cepInput.value.replace(/\D/g, "").slice(0, 8);
        if (v.length > 5) v = v.replace(/(\d{5})(\d{1,3})/, "$1-$2");
        cepInput.value = v;
      });

      cepInput.addEventListener("blur", async () => {
        const raw = cepInput.value.replace(/\D/g, "");
        const cepFeedback = document.getElementById("cepFeedback");

        if (raw.length !== 8) {
          if (raw.length > 0 && cepFeedback) {
            cepFeedback.textContent = "CEP deve ter 8 dígitos";
            cepFeedback.className = "auth__feedback auth__feedback--error";
          }
          return;
        }

        if (cepFeedback) { cepFeedback.textContent = "Buscando..."; cepFeedback.className = "auth__feedback"; }

        try {
          const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
          const data = await res.json();

          if (data.erro) {
            if (cepFeedback) { cepFeedback.textContent = "✕ CEP não encontrado"; cepFeedback.className = "auth__feedback auth__feedback--error"; }
            return;
          }

          // Auto-fill address fields
          const streetInput = document.getElementById("street");
          const neighborhoodInput = document.getElementById("neighborhood");
          const cityInput = document.getElementById("city");
          const stateInput = document.getElementById("state");

          if (streetInput && data.logradouro) streetInput.value = data.logradouro;
          if (neighborhoodInput && data.bairro) neighborhoodInput.value = data.bairro;
          if (cityInput && data.localidade) cityInput.value = data.localidade;
          if (stateInput && data.uf) stateInput.value = data.uf;

          if (cepFeedback) {
            cepFeedback.textContent = `✓ ${data.localidade} — ${data.uf}`;
            cepFeedback.className = "auth__feedback auth__feedback--ok";
          }

          // Focus on número after auto-fill
          const numberInput = document.getElementById("street_number");
          if (numberInput) numberInput.focus();

        } catch (err) {
          console.error("ViaCEP error:", err);
          if (cepFeedback) { cepFeedback.textContent = "Erro ao buscar CEP"; cepFeedback.className = "auth__feedback auth__feedback--error"; }
        }
      });
    }

    // ── Form submit ──
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideError(registerError);

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const nickname = (document.getElementById("nickname")?.value || "").trim();
      const cpf = (document.getElementById("cpf")?.value || "").trim();
      const phone = (document.getElementById("phone")?.value || "").trim();
      const birth = (document.getElementById("birth")?.value || "").trim();
      const gender = (document.getElementById("gender")?.value || "").trim();

      // Address fields
      const cep = (document.getElementById("cep")?.value || "").trim();
      const street = (document.getElementById("street")?.value || "").trim();
      const street_number = (document.getElementById("street_number")?.value || "").trim();
      const complement = (document.getElementById("complement")?.value || "").trim();
      const neighborhood = (document.getElementById("neighborhood")?.value || "").trim();
      const city = (document.getElementById("city")?.value || "").trim();
      const state = (document.getElementById("state")?.value || "").trim();

      // ── Client-side validation ──
      if (!name || !email || !password || !confirmPassword) {
        showError(registerError, "Preencha nome, e-mail e senha");
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

      // CPF validation
      if (cpf) {
        if (!validateCPF(cpf)) {
          showError(registerError, "CPF inválido. Verifique se digitou corretamente.");
          return;
        }
      }

      // Birth date — must be 18+
      if (birth) {
        const age = calculateAge(birth);
        if (age === null) {
          showError(registerError, "Data de nascimento inválida");
          return;
        }
        if (age < 18) {
          showError(registerError, "Você deve ter pelo menos 18 anos para se cadastrar");
          return;
        }
      }

      // Phone verification check
      if (phone && phone.replace(/\D/g, "").length >= 11 && !phoneVerified) {
        showError(registerError, "Verifique seu telefone antes de continuar. Clique em 'Enviar código'.");
        return;
      }

      // CEP validation
      if (cep && cep.replace(/\D/g, "").length !== 8) {
        showError(registerError, "CEP inválido. Deve ter 8 dígitos.");
        return;
      }

      // Address completeness check (if CEP is filled, other fields should be too)
      if (cep && (!street || !street_number || !neighborhood || !city || !state)) {
        showError(registerError, "Preencha todos os campos do endereço");
        return;
      }

      setLoading(registerSubmit, true);

      try {
        const res = await fetch(`${API}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name, email, password, nickname, cpf, phone, birth, gender,
            cep, street, street_number, complement, neighborhood, city, state,
            phone_code: phoneVerifiedCode || undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          showError(registerError, data.error || "Erro ao criar conta");
          setLoading(registerSubmit, false);
          return;
        }

        // Auto-login after registration
        saveSession(data);

        // Sync cart if any local items
        if (window.SgCart && data.cart) {
          SgCart.syncOnLogin(data.cart);
        }

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
