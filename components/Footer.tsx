"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand-block">
            <Link className="brand brand--footer" href="/" aria-label="Ir para o início">
              <span className="brand__mark" aria-hidden="true">SG</span>
              <span className="brand__text">
                <strong className="brand__name">Santos Store</strong>
                <span className="brand__sub">Hardware • Periféricos • Serviços</span>
              </span>
            </Link>
            <p className="footer__tagline">Loja gamer especializada em periféricos, hardware, upgrades e serviços técnicos.</p>
          </div>

          <div className="footer__cols">
            <div className="footer__col">
              <strong className="footer__col-title">Navegação</strong>
              <Link href="/vitrine">Produtos</Link>
              <Link href="/#servicos">Serviços</Link>
            </div>
            <div className="footer__col">
              <strong className="footer__col-title">Atendimento</strong>
              <Link href="/">Horários</Link>
              <Link href="/">Garantia</Link>
              <Link href="/">Suporte</Link>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span>&copy; 2026 Santos Store. Todos os direitos reservados.</span>
        </div>
      </div>
    </footer>
  );
}
