# Plano de Implementação Detalhado — RelatórioFlow 2.0

Este guia detalha os passos técnicos para cada evolução estratégica aprovada.

---

## 🛠️ Módulo A: Experiência de Campo (PWA & Offline)
**Objetivo**: Garantir que o usuário possa tirar fotos e preencher notas em locais sem internet.

### 1. Configuração PWA
- [ ] Instalar o plugin: `npm install vite-plugin-pwa -D`.
- [ ] Configurar o `vite.config.ts` com a estratégia `generateSW` (Cache First).
- [ ] Implementar o manifesto (`manifest.webmanifest`) com ícones e cores da marca.

### 2. Sincronização de Dados
- [ ] **IndexedDB**: Usar a biblioteca `idb` para salvar rascunhos de relatórios e fotos localmente.
- [ ] **Background Sync**: Implementar lógica que detecta a volta da conexão (`navigator.onLine`) e dispara o upload dos arquivos pendentes para o Supabase Storage.

---

## 🔐 Módulo B: Segurança e Conformidade (Audit & Isolation)
**Objetivo**: Blindagem total de dados e registro de ações.

### 1. Isolamento de Storage por Pasta
- [ ] Refatorar o upload de imagens no frontend para o caminho: `report-images/{org_id}/{report_id}/{filename}`.
- [ ] Aplicar nova política de RLS no bucket:
```sql
CREATE POLICY "Org Folder Isolation" ON storage.objects
FOR ALL TO authenticated
USING ( (storage.foldername(name))[1] = get_user_org_id()::text );
```

### 2. Tabela de Auditoria (Logs)
- [ ] Criar a tabela `audit_logs`:
```sql
CREATE TABLE audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organizations(id),
  user_id uuid REFERENCES profiles(id),
  action text NOT NULL, -- Ex: 'report.generated', 'settings.changed'
  metadata jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);
```

---

## ⚙️ Módulo C: Performance e Escalabilidade (Queues)
**Objetivo**: Suportar relatórios massivos de centenas de páginas e fotos.

### 1. Fila de Background (Job Queues)
- [ ] Integrar o **Upstash QStash** para disparar webhooks agendados.
- [ ] O frontend envia a requisição -> Edge Function coloca na fila -> Retorna "Em Processamento" para o usuário.
- [ ] Uma segunda Edge Function processa o laudo, salva no banco e dispara notificação via Realtime/E-mail ao terminar.

### 2. Banco de Dados (Performance de Busca)
- [ ] Criar índices GIN nas colunas de texto para suportar buscas rápidas em milhares de laudos:
```sql
CREATE INDEX idx_reports_content_search ON generated_reports USING GIN (to_tsvector('portuguese', report_content));
```

---

## ✅ Plano de Validação
- **Teste PWA**: Simular perda de conexão e verificar se os dados persistem após o refresh.
- **Teste RLS**: Tentar acessar via URL uma imagem de um `org_id` diferente e validar o erro 403.
- **Teste Queue**: Disparar a geração de um relatório de 50 páginas e garantir que o navegador não receba erro de timeout.
