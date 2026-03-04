# 🎮 Santos Store

<p align="center">
  <img src="public/assets/LOGO SG VERMELHA PNG.png" alt="Santos Store" width="80" />
</p>

<p align="center">
  <strong>Loja gamer especializada em periféricos, hardware, upgrades e serviços técnicos.</strong><br/>
  <em>Ribeirão Preto e região — Brasil</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-13.5-black?logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/SQLite-WAL-003B57?logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT" />
</p>

---

## ✨ Features

- **Vitrine completa** — Filtros por categoria, preço, busca e ordenação
- **Página de produto** — Galeria de imagens, especificações agrupadas (estilo ML), descrição, parcelas
- **Carrinho** — Drawer lateral, sincronização com servidor, checkout via WhatsApp
- **Painel Admin** — CRUD de produtos e banners, upload de imagens, estatísticas
- **Tipos de produto** — 11 categorias com especificações dinâmicas pré-configuradas
- **Conta do usuário** — Dados pessoais, segurança, preferências, tema claro/escuro
- **Serviços** — Montagem de PC, limpeza, upgrade — com orçamento via WhatsApp
- **Responsivo** — Mobile-first, funciona em qualquer dispositivo
- **Tema escuro** — Alternância suave entre claro e escuro

## 🛠 Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | **Next.js 13.5** (App Router) + **TypeScript** |
| Banco de dados | **SQLite** via better-sqlite3 (WAL mode) |
| Autenticação | **JWT** + bcryptjs |
| Estilização | **CSS puro** — design tokens, variáveis, sem libs externas |
| Deploy | **Docker** (Dockerfile) — Easypanel / VPS |

## 📂 Estrutura

```
app/              → Páginas e API routes (App Router)
  (auth)/         → Login, Cadastro
  (shop)/         → Vitrine, Produto, Minha Conta, Serviços
  admin/          → Painel administrativo
  api/            → API routes (auth, cart, products, profile, admin, uploads)
components/       → Header, Footer, CartDrawer, ProductCard, BackToTop
lib/              → DB, auth, contexts (auth, cart, theme, toast), helpers
styles/           → CSS modular (globals, auth, admin, produto, vitrine, serviços, minha-conta)
public/assets/    → Imagens estáticas e logo
uploads/          → Imagens uploaded (volume persistente)
data/             → Banco SQLite (volume persistente)
```

## 🚀 Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em dev
npm run dev
```

> Requer **Node.js >= 20**

## 🐳 Deploy (Docker)

```bash
# Build da imagem
docker build -t santos-store .

# Rodar container
docker run -p 3000:3000 \
  -v santos-data:/app/data \
  -v santos-uploads:/app/uploads \
  santos-store
```

## ⚙️ Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `JWT_SECRET` | Chave secreta para tokens JWT | `santos-store-jwt-...` |
| `ADMIN_EMAIL` | E-mail do admin seed | `admin@santosstore.com` |
| `ADMIN_PASSWORD` | Senha do admin seed | — |
| `PORT` | Porta do servidor | `3000` |

## 📄 Licença

[MIT](LICENSE) — © 2026 Gazake
