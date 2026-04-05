# 🆘 Instruções para o Suporte do PagSeguro

Para concluir a homologação, envie o arquivo 'resultado_homologacao.json' desta pasta para o suporte do PagSeguro (sandbox@pagbank.com.br ou via ticket) com a seguinte mensagem:

---
**ASSUNTO: Liberação de IP da Cloudflare para Homologação de Assinaturas (API)**

**MENSAGEM:**
Olá, equipe técnica do PagSeguro/PagBank. 

Estamos concluindo a homologação técnica do RelatórioFlow (ID de referência rf-homolog-*) e nossas requisições via Supabase Edge Functions estão sendo bloqueadas pelo Cloudflare (Erro 403 Forbidden).

Já atualizamos nosso User-Agent para um navegador Chrome real (conforme anexo), mas o bloqueio persiste por faixa de IP.

**DADOS PARA ALLOWLIST:**
- **Proxy/Origem:** Supabase Edge Functions
- **Domínio:** lmydxgmiytiwgfmjjxdb.supabase.co
- **Último IP Bloqueado (Ray ID 9e74786ac98fa4c2):** 15.228.149.253

Por favor, coloquem esse domínio/faixa de IP em allowlist para que possamos finalizar os testes de cancelamento e webhook.
---
