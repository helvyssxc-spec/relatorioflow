# 📑 RelatórioFlow — Documentação Técnica e de Infraestrutura

Este documento serve como a fonte oficial da verdade sobre a arquitetura do **RelatórioFlow**, detalhando as ferramentas utilizadas, suas finalidades, custos e limites.

---

## 🏗️ 1. Core Stack (Tecnologias Base)
*   **Frontend:** React + TypeScript + Vite (Garantem velocidade e tipagem segura).
*   **Interface:** Tailwind CSS + ShadcnUI (Componentes premium e design responsivo).
*   **Estado & Queries:** TanStack Query (Gerenciamento eficiente de dados assíncronos).
*   **Inteligência Artificial:** Motor Híbrido (Google Gemini 1.5 Flash + Groq Llama-3 70B).
*   **Failover:** Chaveamento automático em milissegundos para 100% de disponibilidade.
*   **Exportação:** Templates Premium para PDF (ABNT, RDO, Proposta Comercial), Excel e Word.

---

## ☁️ 2. Infraestrutura e Serviços (SaaS)

### 🚀 Vercel (Hospedagem do Frontend)
*   **Finalidade:** Hospeda o site, gerencia o domínio e o certificado SSL.
*   **Status:** **GRATUITO (Plano Hobby)**.
*   **Limites:** 100GB de banda/mês. Máximo de 1 build por vez.

### ⚡ Supabase (Backend as a Service)
*   **Finalidade:** Banco de Dados (PostgreSQL), Autenticação, Storage e Edge Functions.
*   **Status:** **GRATUITO (Plano Free Tier)**.
*   **Auditoria Avançada:** Tabela `audit_logs` com rastreio de `tokens_input`, `tokens_output` e `provider_id`.
*   **Monitoramento:** Log de performance de geração de IA integrado para análise de custo/benefício.
*   **Armazenamento (Storage Buckets):**
    1.  `logos`: Logos das empresas (Público).
    2.  `org-assets`: Assinaturas e ativos privados (Isolamento via `org_id`).
    3.  `report-images`: Fotos de campo (Isolamento total via RLS `get_user_org_id()`).

### 📱 PWA & Offline (Mobilidade)
*   **Tecnologia:** `vite-plugin-pwa` (Service Worker automático).
*   **Performance:** 83 arquivos pré-cacheados (~4.6 MB).
*   **Estratégia:** *Cache-First* para assets e imagens do Supabase (30 dias), *Network-First* para navegação.
*   **Benefício:** Carregamento instantâneo e funcionamento básico offline para fotos e notas.

### 💳 PagBank (Processamento de Pagamentos)
*   **Status de Homologação:** **SUCESSO (01/04/2026)**. Bypass do Cloudflare via Edge Function validado.
*   **Procedimento de Produção:** Enviar os logs do retorno da função `pagbank-sandbox-test` para o suporte do PagSeguro.
*   **Estratégia Técnica:** Headers limpos e chamadas via IPs de Data Center do Supabase contra bloqueios WAF.
*   **Finalidade:** Gerenciar assinaturas recorrentes (Plano Pro e Business).
*   **Recurso:** Checkout Transparente e Webhook de sincronização de planos.

*   **Templates PDF Elite 2.1:** Redesign total da Proposta Comercial (Capa Executive) e RDO (Status Box).
*   **Marca Dinâmica:** Cores primárias aplicadas via CSS Variables em tempo de execução no PDF.
*   **Isolamento:** Ativos de marca segregados no bucket `org-assets` com políticas RLS restritivas.

### 📊 Umami Analytics (Métricas)
*   **Finalidade:** Métricas de privacidade (sem cookies) para visitantes e uso do app.
*   **Sincronização:** Automatizada via Edge Function `sync-umami-stats` (Cron Job).

---

## 🌐 3. Gestão de Domínio e E-mails (Custo Zero)

### 🌍 Hostmaster (Registrador de Domínio)
*   **Domínio:** `relatorioflow.com.br` (Renovação anual).

### 📧 Zoho Mail (E-mail Profissional)
*   **Contas Criadas:** `contato@`, `admin@`, `financeiro@`.

### ✉️ Resend (E-mail Transacional)
*   **Finalidade:** Envio de PDFs e alertas de sistema.

---

## 🔒 4. Segurança e Manutenção
*   **Modo de Homologação:** Página de manutenção (`/maintenance`) com lista de espera.
*   **Proteção de Dados (RLS):** Isolamento total entre organizações no nível de banco de dados e arquivos de storage (via `get_user_org_id()`).
*   **Failover Architecture:** Arquitetura de redundância geográfica e de provedores de LLM.
*   **Admin Hardening:** Bypass de simulação de planos restrito a `is_system_admin` validado por RPC.
*   **Rate Limiting:** Proteção contra abusos via Edge Functions e Modal de Cota de Alta Conversão.
*   **Audit Log Level:** Registros de `report.generated`, `report.provider_failover` e telemetria de tokens.

---

## 🔗 5. Links Úteis do Projeto
*   **Site Oficial:** [https://relatorioflow.com.br](https://relatorioflow.com.br)
*   **Dashboard do App:** [https://relatorioflow.com.br/dashboard](https://relatorioflow.com.br/dashboard)
*   **Link de Login (Analista):** [https://relatorioflow.com.br/login](https://relatorioflow.com.br/login)

---

## 💡 6. Considerações para o Futuro (Upgrade)
*   **Quando pagar o Supabase ($25):** Se o banco de dados passar de 500MB ou se precisar de suporte 24h.
*   **Quando pagar a Vercel ($20):** Para remover limites de banda ou permitir múltiplos desenvolvedores.

---

## ⚡ 7. Motor Híbrido e Resiliência (Novidade 01/04)
*   **Provedor Primário:** Google Gemini 1.5 Flash (Performance pericial).
*   **Provedor Backup:** Groq (Llama-3-70B) (Velocidade instantânea e fallback de cota).
*   **Garantia:** O sistema monitora erros `429` (Quota Exceeded) e realiza o retry automático com o motor reserva.

---
*Última atualização: 01 de Abril de 2026 — 17:45 PM.*
