"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useTheme } from "@/lib/theme-context";

export default function Header() {
  const { user } = useAuth();
  const { count, open } = useCart();
  const { toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      window.location.href = `/vitrine?q=${encodeURIComponent(search.trim())}`;
    }
  };

  return (
    <>
      <a className="skipLink" href="#main-content">Pular para o conteúdo</a>

      <header className="header" id="top">
        <div className="container header__inner">
          <Link className="brand" href="/" aria-label="Santos Store — Ir para o início">
            <img className="brand__logo" src="/assets/LOGO SG VERMELHA PNG.png" alt="Santos Store Logo" />
            <span className="brand__text">
              <strong className="brand__name">Santos Store</strong>
              <span className="brand__sub">Hardware • Periféricos • Serviços</span>
            </span>
          </Link>

          <form className="search" role="search" aria-label="Buscar produtos" onSubmit={handleSearch}>
            <svg className="search__icon" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input name="q" type="search" placeholder="Buscar: RTX, SSD, teclado, mouse..." autoComplete="off" value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn--solid btn--sm" type="submit" aria-label="Buscar">
              <span className="hide-mobile">Buscar</span>
              <svg className="show-mobile" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
          </form>

          <div className="header__actions">
            <Link className="btn btn--ghost hide-tablet" href="/vitrine">Vitrine</Link>
            <Link className="btn btn--ghost hide-tablet" href="/#servicos">Serviços</Link>

            {user?.role === "admin" && (
              <Link className="btn btn--ghost adminLink hide-tablet" href="/admin" title="Painel Admin">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                <span>Admin</span>
              </Link>
            )}

            <button className="themeBtn" type="button" aria-label="Alternar tema claro/escuro" onClick={toggle}>
              <svg className="themeBtn__icon themeBtn__icon--sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              <svg className="themeBtn__icon themeBtn__icon--moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>

            <Link className={`loginBtn${user ? " is-logged" : ""}`} href={user ? "/minha-conta" : "/login"} aria-label={user ? "Minha conta" : "Fazer login"}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span className="loginBtn__text hide-mobile">{user ? `Olá, ${user.name.split(" ")[0]}` : "Entrar"}</span>
            </Link>

            <button className="cartBtn" type="button" aria-label="Abrir carrinho" onClick={open}>
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              <span className="cartBtn__text hide-mobile">Carrinho</span>
              <span className="cartBtn__count" aria-live="polite">{count}</span>
            </button>

            <button className={`menuBtn${menuOpen ? " is-open" : ""}`} type="button" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
              <span className="menuBtn__bar"></span>
              <span className="menuBtn__bar"></span>
              <span className="menuBtn__bar"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`mobileMenu${menuOpen ? " is-open" : ""}`} ref={menuRef} aria-hidden={!menuOpen}>
        <div className="mobileMenu__backdrop" onClick={() => setMenuOpen(false)}></div>
        <nav className="mobileMenu__panel" role="navigation" aria-label="Menu principal">
          <div className="mobileMenu__head">
            <strong>Menu</strong>
            <button className="iconBtn" type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <div className="mobileMenu__body">
            <Link className="mobileMenu__link" href="/vitrine" onClick={() => setMenuOpen(false)}>Vitrine</Link>
            <Link className="mobileMenu__link" href="/#servicos" onClick={() => setMenuOpen(false)}>Serviços</Link>
            <Link className="mobileMenu__link" href={user ? "/minha-conta" : "/login"} onClick={() => setMenuOpen(false)}>
              {user ? "Minha Conta" : "Entrar / Cadastrar"}
            </Link>
            {user?.role === "admin" && (
              <Link className="mobileMenu__link mobileMenu__link--admin" href="/admin" onClick={() => setMenuOpen(false)}>
                ⚙️ Painel Admin
              </Link>
            )}
          </div>
          <div className="mobileMenu__foot">
            <span className="muted small">Ribeirão Preto e região • Brasil</span>
          </div>
        </nav>
      </div>
    </>
  );
}
