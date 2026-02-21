"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  /* Redirect if already logged in */
  useEffect(() => {
    if (user) {
      const redir = localStorage.getItem("sg_redirect") || "/";
      localStorage.removeItem("sg_redirect");
      router.replace(redir);
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) { setError("Preencha todos os campos"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error || "Erro ao fazer login"); setLoading(false); return; }

      login(data.user, data.token);
      showToast(`Bem-vindo, ${data.user.name}!`, "success");

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
      <div className="auth__card">
        <Link className="auth__brand" href="/">
          <img className="brand__logo" src="/assets/LOGO SG VERMELHA PNG.png" alt="Santos Store Logo" />
          <span className="brand__text">
            <strong className="brand__name">Santos Store</strong>
          </span>
        </Link>

        <h1 className="auth__title">Entrar na sua conta</h1>
        <p className="auth__subtitle">Acesse para comprar, acompanhar pedidos e muito mais.</p>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <div className="auth__field">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" placeholder="seu@email.com" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="auth__field">
            <label htmlFor="password">Senha</label>
            <div className="auth__password-wrap">
              <input id="password" type={showPass ? "text" : "password"} placeholder="Sua senha" required autoComplete="current-password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
              <button className="auth__toggle-pass" type="button" aria-label={showPass ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPass(!showPass)}>
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {error && <div className="auth__error" role="alert">{error}</div>}

          <button className="btn btn--solid btn--lg btn--full" type="submit" disabled={loading}>
            {loading ? "Aguarde..." : "Entrar"}
          </button>
        </form>

        <div className="auth__divider"><span>ou</span></div>

        <p className="auth__switch">
          Não tem conta? <Link href="/cadastro">Criar conta grátis</Link>
        </p>

        <Link className="auth__back" href="/">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Voltar para a loja
        </Link>
      </div>
    </main>
  );
}
