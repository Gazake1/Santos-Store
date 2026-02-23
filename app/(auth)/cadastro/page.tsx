"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

const UF_OPTIONS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function validateCPF(cpf: string) {
  const digits = (cpf || "").replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rem = (sum * 10) % 11; if (rem === 10) rem = 0;
  if (rem !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rem = (sum * 10) % 11; if (rem === 10) rem = 0;
  return rem === parseInt(digits[10]);
}

function calculateAge(d: string) {
  if (!d) return null;
  const birth = new Date(d);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function maskCPF(v: string) {
  let d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length > 9) d = d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  else if (d.length > 6) d = d.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
  else if (d.length > 3) d = d.replace(/(\d{3})(\d{1,3})/, "$1.$2");
  return d;
}

function maskPhone(v: string) {
  let d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length > 6) d = d.replace(/(\d{2})(\d{5})(\d{1,4})/, "($1) $2-$3");
  else if (d.length > 2) d = d.replace(/(\d{2})(\d{1,5})/, "($1) $2");
  return d;
}

function maskCEP(v: string) {
  let d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length > 5) d = d.replace(/(\d{5})(\d{1,3})/, "$1-$2");
  return d;
}

export default function CadastroPage() {
  const { user, updateUser, updateToken } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  /* form state */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [cpf, setCpf] = useState("");
  const [cpfFeedback, setCpfFeedback] = useState<{ text: string; ok: boolean | null }>({ text: "", ok: null });
  const [birth, setBirth] = useState("");
  const [birthFeedback, setBirthFeedback] = useState<{ text: string; ok: boolean | null }>({ text: "", ok: null });
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [cep, setCep] = useState("");
  const [cepFeedback, setCepFeedback] = useState<{ text: string; ok: boolean | null }>({ text: "", ok: null });
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  /* phone verification */
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneCode, setPhoneCode] = useState("");
  const [showCodeRow, setShowCodeRow] = useState(false);
  const [phoneFeedback, setPhoneFeedback] = useState<{ text: string; ok: boolean | null }>({ text: "", ok: null });
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* Redirect if already logged in */
  useEffect(() => {
    if (user) { router.replace("/"); }
  }, [user, router]);

  /* phone countdown timer */
  useEffect(() => {
    if (countdown <= 0) { if (countdownRef.current) clearInterval(countdownRef.current); return; }
    countdownRef.current = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [countdown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const showSendCode = phone.replace(/\D/g, "").length === 11 && !phoneVerified;

  /* ── CPF blur ── */
  const handleCpfBlur = () => {
    const raw = cpf.replace(/\D/g, "");
    if (raw.length === 11) {
      if (validateCPF(cpf)) setCpfFeedback({ text: "✓ CPF válido", ok: true });
      else setCpfFeedback({ text: "✕ CPF inválido — verifique os dígitos", ok: false });
    } else if (raw.length > 0) {
      setCpfFeedback({ text: "CPF deve ter 11 dígitos", ok: false });
    } else {
      setCpfFeedback({ text: "", ok: null });
    }
  };

  /* ── Birth blur ── */
  const handleBirthBlur = () => {
    if (!birth) { setBirthFeedback({ text: "", ok: null }); return; }
    const age = calculateAge(birth);
    if (age === null) setBirthFeedback({ text: "Data inválida", ok: false });
    else if (age < 18) setBirthFeedback({ text: `✕ Você tem ${age} anos — é necessário ter 18+`, ok: false });
    else setBirthFeedback({ text: `✓ ${age} anos`, ok: true });
  };

  /* ── CEP blur + ViaCEP ── */
  const handleCepBlur = async () => {
    const raw = cep.replace(/\D/g, "");
    if (raw.length !== 8) {
      if (raw.length > 0) setCepFeedback({ text: "CEP deve ter 8 dígitos", ok: false });
      return;
    }
    setCepFeedback({ text: "Buscando...", ok: null });
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const data = await res.json();
      if (data.erro) { setCepFeedback({ text: "✕ CEP não encontrado", ok: false }); return; }
      if (data.logradouro) setStreet(data.logradouro);
      if (data.bairro) setNeighborhood(data.bairro);
      if (data.localidade) setCity(data.localidade);
      if (data.uf) setState(data.uf);
      setCepFeedback({ text: `✓ ${data.localidade} — ${data.uf}`, ok: true });
    } catch {
      setCepFeedback({ text: "Erro ao buscar CEP", ok: false });
    }
  };

  /* ── Send verification code ── */
  const handleSendCode = async () => {
    if (phone.replace(/\D/g, "").length < 11) { showToast("Preencha o telefone completo", "error"); return; }
    try {
      const res = await fetch("/api/verify/send-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Erro ao enviar código", "error"); return; }
      showToast("Código enviado! Verifique o console do servidor.", "success");
      setShowCodeRow(true);
      setCountdown(60);
    } catch { showToast("Erro de conexão", "error"); }
  };

  /* ── Confirm code ── */
  const handleConfirmCode = async () => {
    if (phoneCode.length < 6) { showToast("Digite o código de 6 dígitos", "error"); return; }
    try {
      const res = await fetch("/api/verify/confirm-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, code: phoneCode }) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Código inválido", "error"); return; }
      setPhoneVerified(true);
      setShowCodeRow(false);
      setPhoneFeedback({ text: "✓ Telefone verificado", ok: true });
      showToast("Telefone verificado com sucesso!");
    } catch { showToast("Erro de conexão", "error"); }
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPass) { setError("Preencha nome, e-mail e senha"); return; }
    if (name.length < 3) { setError("Nome deve ter pelo menos 3 caracteres"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("E-mail inválido"); return; }
    if (password.length < 6) { setError("Senha deve ter pelo menos 6 caracteres"); return; }
    if (password !== confirmPass) { setError("As senhas não coincidem"); return; }
    if (cpf && !validateCPF(cpf)) { setError("CPF inválido. Verifique se digitou corretamente."); return; }
    if (birth) {
      const age = calculateAge(birth);
      if (age === null) { setError("Data de nascimento inválida"); return; }
      if (age < 18) { setError("Você deve ter pelo menos 18 anos para se cadastrar"); return; }
    }
    if (phone && phone.replace(/\D/g, "").length >= 11 && !phoneVerified) { setError("Verifique seu telefone antes de continuar. Clique em 'Enviar código'."); return; }
    if (cep && cep.replace(/\D/g, "").length !== 8) { setError("CEP inválido. Deve ter 8 dígitos."); return; }
    if (cep && (!street || !streetNumber || !neighborhood || !city || !state)) { setError("Preencha todos os campos do endereço"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, password, nickname, cpf, phone, birth, gender,
          cep, street, street_number: streetNumber, complement, neighborhood, city, state,
          phone_code: phoneCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao criar conta"); setLoading(false); return; }

      updateUser(data.user);
      updateToken(data.token);
      showToast("Conta criada com sucesso!", "success");

      setTimeout(() => {
        const redir = localStorage.getItem("sg_redirect") || "/";
        localStorage.removeItem("sg_redirect");
        router.push(redir);
      }, 600);
    } catch {
      setError("Erro de conexão. Verifique se o servidor está rodando.");
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <main className="auth">
      <div className="auth__card auth__card--wide">
        <Link className="auth__brand" href="/">
          <img className="brand__logo" src="/assets/LOGO SG VERMELHA PNG.png" alt="Santos Store Logo" />
          <span className="brand__text"><strong className="brand__name">Santos Store</strong></span>
        </Link>

        <h1 className="auth__title">Criar sua conta</h1>
        <p className="auth__subtitle">Cadastre-se para aproveitar as melhores ofertas.</p>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          {/* ═══ Dados de acesso ═══ */}
          <h2 className="auth__section-title">Dados de acesso</h2>

          <div className="auth__field">
            <label htmlFor="reg-email">E-mail</label>
            <input id="reg-email" type="email" placeholder="seu@email.com" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="auth__form-row">
            <div className="auth__field">
              <label htmlFor="reg-password">Senha</label>
              <div className="auth__password-wrap">
                <input id="reg-password" type={showPass ? "text" : "password"} placeholder="Mínimo 6 caracteres" required autoComplete="new-password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
                <button className="auth__toggle-pass" type="button" aria-label={showPass ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPass(!showPass)}>
                  {showPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
            <div className="auth__field">
              <label htmlFor="reg-confirm">Confirmar senha</label>
              <input id="reg-confirm" type="password" placeholder="Repita sua senha" required autoComplete="new-password" minLength={6} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
            </div>
          </div>

          {/* ═══ Dados pessoais ═══ */}
          <h2 className="auth__section-title">Dados pessoais</h2>

          <div className="auth__form-row">
            <div className="auth__field">
              <label htmlFor="reg-name">Nome completo</label>
              <input id="reg-name" type="text" placeholder="Seu nome completo" required autoComplete="name" minLength={3} value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="auth__field">
              <label htmlFor="reg-nickname">Apelido</label>
              <input id="reg-nickname" type="text" placeholder="Como quer ser chamado?" autoComplete="off" value={nickname} onChange={e => setNickname(e.target.value)} />
            </div>
          </div>

          <div className="auth__form-row">
            <div className="auth__field">
              <label htmlFor="reg-cpf">CPF</label>
              <input id="reg-cpf" type="text" placeholder="000.000.000-00" autoComplete="off" maxLength={14} value={cpf} onChange={e => setCpf(maskCPF(e.target.value))} onBlur={handleCpfBlur} className={cpfFeedback.ok === true ? "auth__input--ok" : cpfFeedback.ok === false ? "auth__input--error" : ""} />
              {cpfFeedback.text && <span className={`auth__feedback ${cpfFeedback.ok ? "auth__feedback--ok" : "auth__feedback--error"}`}>{cpfFeedback.text}</span>}
            </div>
            <div className="auth__field">
              <label htmlFor="reg-birth">Data de nascimento</label>
              <input id="reg-birth" type="date" autoComplete="bday" value={birth} onChange={e => setBirth(e.target.value)} onBlur={handleBirthBlur} />
              {birthFeedback.text && <span className={`auth__feedback ${birthFeedback.ok ? "auth__feedback--ok" : "auth__feedback--error"}`}>{birthFeedback.text}</span>}
            </div>
          </div>

          <div className="auth__form-row">
            <div className="auth__field auth__field--phone">
              <label htmlFor="reg-phone">Telefone / WhatsApp</label>
              <div className="auth__phone-row">
                <input id="reg-phone" type="tel" placeholder="(00) 00000-0000" autoComplete="tel" maxLength={15} value={phone} onChange={e => { setPhone(maskPhone(e.target.value)); setPhoneVerified(false); setPhoneFeedback({ text: "", ok: null }); }} />
                {showSendCode && (
                  <button className="btn btn--outline btn--sm" type="button" disabled={countdown > 0} onClick={handleSendCode}>
                    {countdown > 0 ? `Reenviar (${countdown}s)` : "Enviar código"}
                  </button>
                )}
              </div>
              {showCodeRow && !phoneVerified && (
                <div className="auth__code-row">
                  <input type="text" placeholder="Código de 6 dígitos" maxLength={6} inputMode="numeric" value={phoneCode} onChange={e => setPhoneCode(e.target.value.replace(/\D/g, ""))} />
                  <button className="btn btn--solid btn--sm" type="button" onClick={handleConfirmCode}>Confirmar</button>
                </div>
              )}
              {phoneFeedback.text && <span className={`auth__feedback ${phoneFeedback.ok ? "auth__feedback--ok" : "auth__feedback--error"}`}>{phoneFeedback.text}</span>}
            </div>
            <div className="auth__field">
              <label htmlFor="reg-gender">Gênero</label>
              <select id="reg-gender" autoComplete="sex" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="">Selecione</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="nao-binario">Não-binário</option>
                <option value="prefiro-nao-dizer">Prefiro não dizer</option>
              </select>
            </div>
          </div>

          {/* ═══ Endereço ═══ */}
          <h2 className="auth__section-title">Endereço</h2>

          <div className="auth__form-row">
            <div className="auth__field auth__field--cep">
              <label htmlFor="reg-cep">CEP</label>
              <input id="reg-cep" type="text" placeholder="00000-000" maxLength={9} inputMode="numeric" value={cep} onChange={e => setCep(maskCEP(e.target.value))} onBlur={handleCepBlur} />
              {cepFeedback.text && <span className={`auth__feedback ${cepFeedback.ok ? "auth__feedback--ok" : "auth__feedback--error"}`}>{cepFeedback.text}</span>}
            </div>
            <div className="auth__field auth__field--grow">
              <label htmlFor="reg-street">Rua</label>
              <input id="reg-street" type="text" placeholder="Nome da rua" autoComplete="street-address" value={street} onChange={e => setStreet(e.target.value)} />
            </div>
          </div>

          <div className="auth__form-row auth__form-row--3">
            <div className="auth__field auth__field--num">
              <label htmlFor="reg-num">Número</label>
              <input id="reg-num" type="text" placeholder="Nº" inputMode="numeric" value={streetNumber} onChange={e => setStreetNumber(e.target.value)} />
            </div>
            <div className="auth__field auth__field--comp">
              <label htmlFor="reg-comp">Complemento</label>
              <input id="reg-comp" type="text" placeholder="Apto, bloco..." value={complement} onChange={e => setComplement(e.target.value)} />
            </div>
            <div className="auth__field auth__field--grow">
              <label htmlFor="reg-bairro">Bairro</label>
              <input id="reg-bairro" type="text" placeholder="Bairro" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
            </div>
          </div>

          <div className="auth__form-row">
            <div className="auth__field auth__field--grow">
              <label htmlFor="reg-city">Cidade</label>
              <input id="reg-city" type="text" placeholder="Cidade" autoComplete="address-level2" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="auth__field auth__field--uf">
              <label htmlFor="reg-state">Estado</label>
              <select id="reg-state" value={state} onChange={e => setState(e.target.value)}>
                <option value="">UF</option>
                {UF_OPTIONS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          {/* ═══ Error & Submit ═══ */}
          {error && <div className="auth__error" role="alert">{error}</div>}

          <button className="btn btn--solid btn--lg btn--full" type="submit" disabled={loading}>
            {loading ? "Aguarde..." : "Criar conta"}
          </button>
        </form>

        <div className="auth__divider"><span>ou</span></div>

        <p className="auth__switch">
          Já tem conta? <Link href="/login">Fazer login</Link>
        </p>

        <Link className="auth__back" href="/">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Voltar para a loja
        </Link>
      </div>
    </main>
  );
}
