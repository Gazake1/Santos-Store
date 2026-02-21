# Santos Store

Loja gamer especializada em periféricos, hardware, upgrades e serviços técnicos.

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Banco de dados:** SQLite via better-sqlite3
- **Auth:** JWT + bcryptjs
- **Estilização:** CSS puro (design original preservado)
- **Deploy:** Nixpacks (Railway / Render)

## Estrutura

```
app/              → Páginas e API routes (App Router)
  (auth)/         → Login, Cadastro (sem Header/Footer)
  (shop)/         → Vitrine, Produto, Minha Conta, Serviços (com Header/Footer)
  admin/          → Painel administrativo
  api/            → API routes (auth, cart, products, profile, admin)
components/       → Componentes reutilizáveis (Header, Footer, CartDrawer, etc.)
lib/              → Utilitários (db, auth, contexts, helpers)
styles/           → CSS (globals, auth, admin, produto, vitrine, servicos, minha-conta)
public/assets/    → Imagens e logo
```

## Desenvolvimento

```bash
npm install
npm run dev
```

> Requer Node.js >= 20.9.0

## Variáveis de ambiente

Crie um `.env.local`:

```env
JWT_SECRET=sua-chave-secreta
ADMIN_EMAIL=admin@santosstore.com
ADMIN_PASS=senha-do-admin
```

## Build & Deploy

```bash
npm run build
npm run start
```

O arquivo `nixpacks.toml` já está configurado para deploy automático.
