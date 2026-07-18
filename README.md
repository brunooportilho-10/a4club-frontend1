# A4 CLUB — Frontend Next.js

Frontend SaaS para a plataforma de biblioteca premium de arquivos.

## Setup Local

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Instalação

```bash
npm install
cp .env.example .env.local
```

### Variáveis de Ambiente

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Onde `NEXT_PUBLIC_API_URL` é a URL do backend (importador + API).

### Desenvolvimento

```bash
npm run dev
```

Acessa `http://localhost:3000`

### Build para produção

```bash
npm run build
npm start
```

## Deploy no Railway

### 1. GitHub

```bash
git init
git add .
git commit -m "A4 CLUB Frontend"
git remote add origin https://github.com/seu-usuario/a4club-frontend
git push -u origin main
```

### 2. Railway Dashboard

1. Clica **New Project**
2. Conecta GitHub
3. Seleciona `a4club-frontend`
4. Railway detecta Next.js automaticamente

### 3. Variáveis de Ambiente

Railway → **Variables**:

```
NEXT_PUBLIC_API_URL=https://seu-backend.railway.app
```

### 4. Deploy

Railway auto-deploya quando você faz push.

Ou manual: Railway Dashboard → **Deploy**

## Arquitetura

```
/app
  /login       ← Página de login
  /admin       ← Painel administrativo
  /page.tsx    ← Home/dashboard
  /layout.tsx  ← Layout raiz

/components
  Header.tsx   ← Topbar com busca
  Sidebar.tsx  ← Menu lateral
  Cards.tsx    ← Cards de produtos/categorias

/lib
  api.ts       ← Cliente HTTP (axios)
  auth.ts      ← Autenticação (Zustand)

/styles
  globals.css  ← Estilos globais (Tailwind)
```

## Features

✅ Login/Registro  
✅ Dashboard com métricas  
✅ Busca integrada  
✅ Favoritos  
✅ Histórico de downloads  
✅ Painel admin (importações)  
✅ Responsivo (mobile/tablet/desktop)

## Integração com Backend

O frontend conecta com a API do importador:

```
POST   /auth/register     ← Registrar novo usuário
POST   /auth/login        ← Login
GET    /api/catalogo/home ← Home com categorias + novidades
GET    /api/catalogo/buscar?q=... ← Busca
GET    /admin/stats       ← Dashboard admin
POST   /admin/importar    ← Iniciar importação
GET    /admin/job/:jobId  ← Status de importação
```

## Roadmap

- [ ] Integração com Stripe/Asaas
- [ ] Notificações (email, push)
- [ ] Analytics
- [ ] Recomendações
- [ ] Dark mode
- [ ] Internacionalização

## Suporte

Se tiver dúvidas ou problemas, abra uma issue no GitHub.

---

**Status**: Pronto para produção ✅
