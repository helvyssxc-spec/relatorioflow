# RelatorioFlow MVP — Guia de Setup

## Estrutura do projeto

```
relatorioflow_MVP/
├── src/
│   ├── pages/          # 10 páginas completas
│   ├── components/
│   │   ├── ui/         # 49 componentes shadcn/ui
│   │   └── layout/     # AppLayout + AppSidebar
│   ├── hooks/          # useAuth, useProfile, useWeather
│   ├── lib/
│   │   ├── offline-db.ts         # Draft offline (IndexedDB)
│   │   └── pdf/
│   │       ├── generateDiarioObra.ts
│   │       └── generateRelatorioTecnico.ts
│   └── integrations/supabase/   # Cliente Supabase
├── supabase/
│   ├── migrations/     # Schema completo do banco
│   └── functions/      # Edge Functions PagBank
└── .env.example
```

## 1. Instalar dependências

```bash
cd relatorioflow_MVP
npm install
# ou: bun install
```

## 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

Preencha:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Opcional — para clima automático no Diário de Obra
# Crie uma chave gratuita em openweathermap.org
VITE_OPENWEATHER_API_KEY=sua_chave_aqui
```

## 3. Configurar Supabase

### 3.1 Criar projeto no Supabase
Acesse [supabase.com](https://supabase.com) e crie um novo projeto.

### 3.2 Rodar a migration
No Supabase Dashboard → SQL Editor, cole e execute o conteúdo de:
```
supabase/migrations/20260405000000_mvp_initial.sql
```

### 3.3 Copiar as credenciais
Em Settings → API:
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public` → `VITE_SUPABASE_ANON_KEY`

## 4. Rodar o projeto

```bash
npm run dev
```

Acesse: http://localhost:5173

## 5. Configurar PagBank (para cobrar)

### 5.1 Criar conta no PagBank
Acesse [dev.pagbank.com.br](https://dev.pagbank.com.br) e crie uma conta de desenvolvedor.

### 5.2 Deploy das Edge Functions
```bash
supabase functions deploy pagbank-checkout
supabase functions deploy pagbank-webhook
```

### 5.3 Configurar secrets nas Edge Functions
```bash
supabase secrets set PAGBANK_TOKEN=seu_token_aqui
supabase secrets set PAGBANK_ENV=sandbox  # ou: production
supabase secrets set APP_URL=https://seu-dominio.com
```

### 5.4 Configurar webhook no PagBank
URL do webhook:
```
https://xxxx.supabase.co/functions/v1/pagbank-webhook
```

## 6. Deploy (Vercel)

```bash
npm run build
vercel deploy
```

Adicione as variáveis de ambiente no painel da Vercel.

---

## Fluxo do produto

```
Landing (/)
  → Cadastro (/cadastro)
  → Dashboard (/app/dashboard)
    → Novo Relatório (/app/relatorio/novo)
      → Diário de Obra (/app/relatorio/novo/diario?project=ID)
      → Relatório Técnico (/app/relatorio/novo/tecnico?project=ID)
    → Ver/Exportar (/app/relatorio/:id?tipo=diario|tecnico)
    → Configurações (/app/configuracoes)
    → Plano/Pagamento (/app/plano)
```

## Funcionalidades implementadas

- [x] Landing page completa com preço único (R$ 97/mês)
- [x] Autenticação (login, cadastro) via Supabase Auth
- [x] Dashboard com relatórios recentes
- [x] Seletor de obra/projeto com criação inline
- [x] **Diário de Obra** — clima automático, equipe, atividades, equipamentos, fotos, draft offline
- [x] **Relatório Técnico** — objetivo, metodologia, diagnóstico por seções, conclusão, recomendações
- [x] **Gerador de PDF premium** — HTML renderizado com design institucional
  - Diário de Obra: acumulado inteligente da obra
  - Relatório Técnico: resumo executivo em destaque
- [x] Visualizador de relatórios salvos com exportação
- [x] Configurações: perfil, logo da empresa, CREA/CAU, senha
- [x] Checkout PagBank (plano único R$ 97/mês)
- [x] Webhook PagBank (liberar/revogar acesso automaticamente)
- [x] Draft offline via IndexedDB (funciona sem internet)
- [x] Schema Supabase com RLS completo

## Próximos passos sugeridos

1. Conectar à sua instância Supabase real
2. Testar no Supabase Sandbox (PagBank)
3. Configurar domínio e deploy na Vercel
4. Cadastrar logo e CREA nas configurações
5. Criar primeira obra e gerar um PDF de teste
