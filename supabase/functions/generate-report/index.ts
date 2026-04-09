import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// ── System prompt builder ────────────────────────────────────────────────────
function buildSystemPrompt(p: Record<string, any>): string {
  const typeLabels: Record<string, string> = {
    relatorio_tecnico:  "Relatório Técnico",
    vistoria:           "Relatório de Vistoria Técnica",
    laudo_tecnico:      "Laudo Técnico",
    diario_de_obra:     "Diário de Obra (RDO)",
    ata_de_reuniao:     "Ata de Reunião",
    ata_reuniao:        "Ata de Reunião",
    proposta_comercial: "Proposta Comercial",
    orcamento:          "Orçamento Técnico",
    relatorio_rdo:      "Relatório Diário de Obra (RDO)",
    auditoria:          "Relatório de Auditoria",
    parecer_tecnico:    "Parecer Técnico",
    inspecao:           "Relatório de Inspeção",
    manutencao:         "Relatório de Manutenção",
    nbr16280:           "Laudo de Reforma (NBR 16280)",
    outro:              "Relatório Técnico",
  };
  const typeLabel = typeLabels[p.reportType] || "Relatório Técnico";

  const ctx: string[] = [];
  if (p.clientName)       ctx.push(`Cliente/Interessado: ${p.clientName}`);
  if (p.clientCompany)    ctx.push(`Empresa do cliente: ${p.clientCompany}`);
  if (p.reportDate)       ctx.push(`Data: ${p.reportDate}`);
  if (p.reportLocation)   ctx.push(`Local/Endereço: ${p.reportLocation}`);
  if (p.reportNumber)     ctx.push(`Número do documento: ${p.reportNumber}`);
  if (p.responsibleName)  ctx.push(`Responsável técnico: ${p.responsibleName}${p.responsibleRole ? ` (${p.responsibleRole})` : ""}`);
  if (p.weatherCondition) ctx.push(`Condição climática: ${p.weatherCondition}`);
  if (p.accessCondition)  ctx.push(`Condição de acesso: ${p.accessCondition}`);
  if (p.siteCondition)    ctx.push(`Estado do local: ${p.siteCondition}`);
  if (p.userName)         ctx.push(`Elaborado por: ${p.userName}`);
  if (p.imagesCount > 0)  ctx.push(`Fotos anexadas: ${p.imagesCount}`);
  if (p.teamMembers?.length > 0) {
    const team = p.teamMembers
      .filter((m: any) => m.name)
      .map((m: any) => `${m.name}${m.role ? ` (${m.role})` : ""}${m.hours ? ` — ${m.hours}h` : ""}`)
      .join("; ");
    if (team) ctx.push(`Equipe presente: ${team}`);
  }
  if (p.materials?.length > 0) {
    const mats = p.materials
      .filter((m: any) => m.item)
      .map((m: any) => `${m.item}${m.qty ? ` x${m.qty}` : ""}${m.unit ? ` ${m.unit}` : ""}`)
      .join("; ");
    if (mats) ctx.push(`Materiais/equipamentos: ${mats}`);
  }
  if (p.occurrences) ctx.push(`Ocorrências registradas: ${p.occurrences}`);
  if (p.reportType === "orcamento" || p.reportType === "proposta_comercial") {
    if (p.paymentTerms)     ctx.push(`Forma de pagamento: ${p.paymentTerms}`);
    if (p.proposalValidity) ctx.push(`Validade da proposta: ${p.proposalValidity} dias`);
    if (p.executionDays)    ctx.push(`Prazo de execução: ${p.executionDays} dias úteis`);
    if (p.bdiPercent)       ctx.push(`BDI: ${p.bdiPercent}%`);
  }

  const contextBlock = ctx.length > 0
    ? `\n\nINFORMAÇÕES DO DOCUMENTO:\n${ctx.map(c => `- ${c}`).join("\n")}`
    : "";

  const estruturas: Record<string, string> = {
    ata_reuniao: `
ESTRUTURA OBRIGATÓRIA DA ATA:
1. DADOS DA REUNIÃO — data, local, hora de início e encerramento
2. PARTICIPANTES — listar todos com nome, cargo e empresa
3. PAUTA — itens discutidos na reunião
4. DELIBERAÇÕES — decisões tomadas, linguagem formal, pretérito perfeito
5. ENCAMINHAMENTOS — ações definidas com responsável e prazo
6. ENCERRAMENTO — hora de encerramento e quem presidiu
Use linguagem jurídica-administrativa formal. Verbos no pretérito perfeito.`,
    ata_de_reuniao: `
ESTRUTURA OBRIGATÓRIA DA ATA:
1. DADOS DA REUNIÃO — data, local, hora de início e encerramento
2. PARTICIPANTES — listar todos com nome, cargo e empresa
3. PAUTA — itens discutidos na reunião
4. DELIBERAÇÕES — decisões tomadas, linguagem formal, pretérito perfeito
5. ENCAMINHAMENTOS — ações definidas com responsável e prazo
6. ENCERRAMENTO — hora de encerramento e quem presidiu
Use linguagem jurídica-administrativa formal. Verbos no pretérito perfeito.`,
    diario_de_obra: `
Você agora é um extrator de dados de engenharia especializado em RDO. 
Extraia das notas brutas e retorne APENAS um JSON no formato:
{
  "clima": "texto curto",
  "temperatura": "texto curto",
  "equipe": [{"cargo": "string", "qtd": number}],
  "servicos": [{"desc": "string", "percentual": number}],
  "ocorrencias": "texto formal",
  "texto_final": "Relatório descritivo técnico formal em 3ª pessoa"
}
Linguagem técnica objetiva seguindo Resolução CONFEA e NBR 12.722.`,
    relatorio_rdo: `
ESTRUTURA OBRIGATÓRIA DO RDO (Res. CONFEA + NBR 12.722):
1. IDENTIFICAÇÃO DA OBRA — nome, localização, contratante, contratada, RRT/ART
2. CONDIÇÕES DO DIA — clima (manhã/tarde), temperatura aproximada, acesso
3. EFETIVO EM CAMPO — tabela: função, nome, quantidade, horas trabalhadas
4. SERVIÇOS EXECUTADOS — descrição detalhada por frente de serviço com localização
5. EQUIPAMENTOS UTILIZADOS — lista com quantidade e horas de uso
6. MATERIAIS RECEBIDOS/UTILIZADOS — com quantidades
7. OCORRÊNCIAS E OBSERVAÇÕES — não conformidades, paralisações, visitas
8. FOTOGRAFIAS — referências às fotos (se houver)
9. ASSINATURA — responsável técnico com registro profissional
Linguagem técnica objetiva, presente ou pretérito perfeito.`,
    vistoria: `
Você agora é um Perito em Engenharia. Transforme as notas de campo em um Relatório de Vistoria técnica estruturado.
RETORNE SEMPRE UM JSON VÁLIDO no seguinte formato:
{
  "objetivo": "texto formal",
  "metodologia": "texto formal seguindo normas ABNT",
  "diagnostico": [{"titulo": "string", "conteudo": "texto técnico"}],
  "conclusao": "texto pericial final",
  "recomendacoes": [{"texto": "string", "prioridade": "alta/media/baixa"}]
}
Linguagem técnica pericial conforme ABNT NBR 13752.`,
    laudo_tecnico: `
Você agora é um Perito/Consultor. Transforme notas em Laudo Técnico estruturado.
RETORNE SEMPRE UM JSON VÁLIDO no seguinte formato:
{
  "objetivo": "texto formal",
  "metodologia": "texto formal",
  "diagnostico": [{"titulo": "string", "conteudo": "texto técnico"}],
  "conclusao": "parecer técnico final",
  "recomendacoes": [{"texto": "string", "prioridade": "alta/media/baixa"}]
}
Linguagem técnica pericial conforme ABNT NBR 10719.`,
    relatorio_tecnico: `
Você agora é um Engenheiro Consultor. Transforme as notas brutas em um corpo de Relatório Técnico.
RETORNE SEMPRE UM JSON VÁLIDO no seguinte formato:
{
  "objetivo": "texto formal",
  "metodologia": "texto formal",
  "diagnostico": [{"titulo": "string", "conteudo": "texto técnico"}],
  "conclusao": "parecer técnico final",
  "recomendacoes": [{"texto": "string", "prioridade": "alta/media/baixa"}]
}
Linguagem clara, técnica e estruturada.`,
    proposta_comercial: `
ESTRUTURA OBRIGATÓRIA DA PROPOSTA COMERCIAL:
1. APRESENTAÇÃO — breve apresentação da empresa e qualificação
2. OBJETO DA PROPOSTA — descrição clara do serviço ou fornecimento
3. ESCOPO DOS SERVIÇOS — detalhamento de todas as atividades incluídas
4. METODOLOGIA DE EXECUÇÃO — como o serviço será realizado
5. CRONOGRAMA DE EXECUÇÃO — etapas e prazos
6. COMPOSIÇÃO DE PREÇOS — itemização dos serviços com valores unitários
7. CONDIÇÕES COMERCIAIS — forma de pagamento, validade, reajuste
8. GARANTIAS E RESPONSABILIDADES
9. ACEITE — campo para assinatura do contratante
Linguagem comercial profissional. Valorizar diferenciais técnicos.`,
    orcamento: `
ESTRUTURA OBRIGATÓRIA DO ORÇAMENTO TÉCNICO:
1. OBJETO — identificação do serviço/fornecimento orçado
2. MEMÓRIA DE CÁLCULO — critérios e premissas adotados
3. PLANILHA ORÇAMENTÁRIA — itens, quantidades, unidades, preços unitários e totais
4. BDI — composição do BDI aplicado (se informado)
5. TOTAL GERAL — subtotal + BDI + total com BDI
6. VALIDADE DO ORÇAMENTO — prazo de validade
7. CONDIÇÕES DE PAGAMENTO
8. OBSERVAÇÕES TÉCNICAS
Seguir padrão SINAPI para composição se aplicável.`,
    parecer_tecnico: `
ESTRUTURA OBRIGATÓRIA DO PARECER TÉCNICO:
1. OBJETO DO PARECER — identificação da questão técnica analisada
2. DOCUMENTOS ANALISADOS — projetos, laudos, normas consultados
3. ANÁLISE TÉCNICA — desenvolvimento fundamentado da análise
4. CONCLUSÃO — posicionamento técnico conclusivo e objetivo
5. RECOMENDAÇÕES — se aplicável
6. RESSALVAS — limitações do parecer
Linguagem técnica e pericial. Fundamentar em normas e literatura técnica.`,
    auditoria: `
ESTRUTURA OBRIGATÓRIA DO RELATÓRIO DE AUDITORIA:
1. ESCOPO DA AUDITORIA — processos e áreas auditadas
2. CRITÉRIOS DE AUDITORIA — normas, leis ou padrões de referência
3. RESUMO EXECUTIVO — principais achados e visão geral do sistema
4. TABELA DE NÃO CONFORMIDADES — item, evidência, requisito violado, classificação (CRÍTICA/MAIOR/MENOR)
5. OPORTUNIDADES DE MELHORIA
6. CONCLUSÃO GERAL — status de conformidade do sistema auditado
Linguagem formal, tabelas de evidência e foco em conformidade normativa.`,
    inspecao: `
ESTRUTURA OBRIGATÓRIA DO RELATÓRIO DE INSPEÇÃO:
1. DADOS DA INSPEÇÃO — data, hora, responsável e local
2. ELEMENTOS INSPECIONADOS — sistema, componente ou equipamento
3. CHECKLIST DE INSPEÇÃO — tabela com status de cada item verificado
4. ANOMALIAS DETECTADAS — descrição detalhada com possível causa
5. CLASSIFICAÇÃO DE RISCO — avaliação do impacto imediato
6. RECOMENDAÇÕES CORRETIVAS — prazos e ações sugeridas
Objetividade técnica. Use listas para clareza visual.`,
    manutencao_preventiva: `
Você agora é um Inspetor de Manutenção Preventiva. Transforme as notas de serviço em um checklist técnico de manutenção.
RETORNE SEMPRE UM JSON VÁLIDO no seguinte formato:
{
  "ativo_nome": "Nome do equipamento",
  "ativo_tag": "TAG/ID",
  "sistema": "Ar/Eletrica/etc",
  "status_anterior": "operacional/falha/parado",
  "status_posterior": "operacional",
  "checklists": [{"item": "string", "concluido": true}],
  "pecas_substituidas": [{"nome": "string", "qtd": number}],
  "observacoes": "parecer sobre vida útil/estado"
}
Linguagem técnica formal e objetiva.`,
    manutencao_corretiva: `
Você agora é um Técnico de Manutenção Corretiva. Transforme o relato de falha em um relatório de solução técnica.
RETORNE SEMPRE UM JSON VÁLIDO no seguinte formato:
{
  "ativo_nome": "Nome do equipamento",
  "ativo_tag": "TAG/ID",
  "sistema": "Ar/Eletrica/etc",
  "status_anterior": "operacional/falha/parado",
  "status_posterior": "operacional",
  "descricao_servico": "Relato detalhado da causa raiz e solução",
  "pecas_substituidas": [{"nome": "string", "qtd": number}],
  "tempo_parada": "X horas/minutos",
  "observacoes": "recomendações para evitar recorrência"
}
Linguagem técnica formal, focada em diagnóstico e ação.`,
    manutencao: `
ESTRUTURA OBRIGATÓRIA DO RELATÓRIO DE MANUTENÇÃO:
1. IDENTIFICAÇÃO DO ATIVO — tag, nome, fabricante, modelo
2. TIPO DE MANUTENÇÃO — Preventiva, Preditiva ou Corretiva
3. ATIVIDADES REALIZADAS — passo a passo técnico executado
4. PEÇAS/INSUMOS SUBSTITUÍDOS — lista com quantidades e justificativa
5. ENSAIOS E TESTES DE DESEMPENHO — medições antes e depois
6. STATUS FINAL — Liberado para uso / Restrito / Fora de operação
Foco em dados técnicos, medições e rastreabilidade de peças.`,
  };

  const estrutura = estruturas[p.reportType] ?? "";

  if (p.action === "improve") {
    const fieldLabel = p.fieldName ? `campo "${p.fieldName}"` : 'texto';
    return `Você é um engenheiro-redator técnico sênior brasileiro.
Sua tarefa: melhorar APENAS o ${fieldLabel} abaixo, mantendo todas as informações originais.

REGRAS DE FORMATAÇÃO (essenciais):
- Use ## para sub-seções quando o campo tiver mais de um tópico
- Use **negrito** para termos técnicos ou destaques importantes
- Use listas com - quando houver enumeração de itens
- Linguagem técnica formal em 3ª pessoa do singular
- NÃO use primeira pessoa (nunca "realizamos", "fizemos")
- NÃO adicione cabeçalho, rodapé nem contexto além do texto
- NÃO invente dados que não estão no texto original
- Corrija erros de ortografia e gramática
- Retorne APENAS o texto melhorado, nada mais`;
  }

  return `Você é um engenheiro-redator técnico sênior especializado em elaborar ${typeLabel}s profissionais no Brasil.

Sua tarefa: transformar as notas brutas fornecidas em APENAS o corpo do ${typeLabel}, já formatado para o campo solicitado.

REGRAS ABSOLUTAS DE CONTEÚDO:
- Português formal, linguagem técnica objetiva (3ª pessoa do singular — nunca "realizamos", "fizemos")
- NÃO invente dados, medidas ou valores não mencionados nas notas
- NÃO inclua título do documento, nome da empresa, data ou metadados
- Foque exclusivamente no conteúdo técnico do campo solicitado

REGRAS DE FORMATAÇÃO MARKDOWN (obrigatório):
- Use ## para iniciar cada sub-seção ou tópico principal
- Use **negrito** para termos técnicos importantes e conclusões-chave
- Use listas com - para enumeração de itens, anomalias ou ações
- Use listas numeradas (1. 2. 3.) para processos sequenciais
- Separe seções com linha em branco
- Mínimo de 250 palavras; máximo de 600 palavras
${estrutura}
${contextBlock}`;
}

// ── Gemini stream ────────────────────────────────────────────────────────────
async function callGemini(prompt: string, apiKey: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.65, topK: 40, topP: 0.95, maxOutputTokens: 4096 },
    }),
  });
  return res;
}

// ── Groq stream (OpenAI-compatible) ─────────────────────────────────────────
async function callGroq(prompt: string, apiKey: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      stream: true,
      temperature: 0.65,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  return res;
}

// ── Stream parsers ───────────────────────────────────────────────────────────
async function streamGemini(
  response: Response,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder
): Promise<{ inputTokens: number; outputTokens: number }> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let inputTokens = 0, outputTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.usageMetadata) {
          inputTokens  = data.usageMetadata.promptTokenCount    || 0;
          outputTokens = data.usageMetadata.candidatesTokenCount || 0;
        }
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) await writer.write(encoder.encode(text));
      } catch { /* skip */ }
    }
  }
  return { inputTokens, outputTokens };
}

async function streamGroq(
  response: Response,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder
): Promise<{ inputTokens: number; outputTokens: number }> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let inputTokens = 0, outputTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") continue;
      try {
        const data = JSON.parse(raw);
        if (data.usage) {
          inputTokens  = data.usage.prompt_tokens     || 0;
          outputTokens = data.usage.completion_tokens || 0;
        }
        const text = data.choices?.[0]?.delta?.content;
        if (text) await writer.write(encoder.encode(text));
      } catch { /* skip */ }
    }
  }
  return { inputTokens, outputTokens };
}

// ── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();
    const { notes } = payload;

    if (!notes?.trim()) {
      return new Response(JSON.stringify({ error: "Campo 'notes' é obrigatório." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Plan-based rate limiting ─────────────────────────────────────────────
    const PLAN_LIMITS: Record<string, number> = { starter: 5, pro: 50, business: -1 };
    const PLAN_MAP: Record<string, string> = { free: "starter", basico: "pro", pro: "pro", starter: "starter", business: "business" };

    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: profile } = await supabaseAdmin
        .from("profiles").select("org_id").eq("id", user.id).single();

      if (profile?.org_id) {
        const { data: org } = await supabaseAdmin
          .from("organizations").select("plan").eq("id", profile.org_id).single();

        const planKey = PLAN_MAP[org?.plan ?? "starter"] ?? "starter";
        const limit = PLAN_LIMITS[planKey] ?? 5;

        if (limit !== -1) {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const { count } = await supabaseAdmin
            .from("generated_reports")
            .select("*", { count: "exact", head: true })
            .eq("org_id", profile.org_id)
            .gte("created_at", startOfMonth.toISOString());

          if ((count ?? 0) >= limit) {
            return new Response(
              JSON.stringify({ error: `Limite de ${limit} relatórios/mês atingido. Faça upgrade do seu plano para continuar.` }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }
    } catch (limitErr) {
      console.warn("Rate limit check failed (allowing request):", limitErr);
    }
    // ────────────────────────────────────────────────────────────────────────

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const GROQ_API_KEY   = Deno.env.get("GROQ_API_KEY");

    if (!GEMINI_API_KEY && !GROQ_API_KEY) {
      throw new Error("Nenhuma chave de IA configurada (GEMINI_API_KEY ou GROQ_API_KEY).");
    }

    const systemPrompt = buildSystemPrompt(payload);
    const userMessage  = payload.action === "improve"
      ? `Melhore o seguinte relatório:\n\n${notes}`
      : `Notas brutas do campo:\n\n${notes}`;
    const fullPrompt = `${systemPrompt}\n\n${userMessage}`;

    // ── Tenta Gemini, cai para Groq se 429 ou indisponível ──
    let response: Response | null = null;
    let provider: "gemini" | "groq" = "gemini";

    if (GEMINI_API_KEY) {
      const geminiRes = await callGemini(fullPrompt, GEMINI_API_KEY);
      if (geminiRes.ok) {
        response = geminiRes;
        provider = "gemini";
      } else if (GROQ_API_KEY) {
        const err = await geminiRes.text();
        console.warn(`Gemini ${geminiRes.status} — falling back to Groq:`, err);
        const groqRes = await callGroq(fullPrompt, GROQ_API_KEY);
        if (groqRes.ok) { response = groqRes; provider = "groq"; }
        else {
          const groqErr = await groqRes.text();
          console.error("Groq error:", groqRes.status, groqErr);
        }
      } else {
        const err = await geminiRes.text();
        console.error("Gemini error:", geminiRes.status, err);
      }
    } else if (GROQ_API_KEY) {
      // Gemini não configurado — usa Groq diretamente
      const groqRes = await callGroq(fullPrompt, GROQ_API_KEY);
      if (groqRes.ok) { response = groqRes; provider = "groq"; }
    }

    if (!response) {
      // Log quota/error to audit_logs
      try {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabaseAdmin.from("audit_logs").insert({
          org_id:   payload.orgId ?? null,
          user_id:  user.id,
          action:   "report.quota_exceeded",
          tokens_input: 0, tokens_output: 0,
          metadata: { report_type: payload.reportType ?? null, status: "quota_exceeded" },
        });
      } catch { /* ignore */ }

      return new Response(JSON.stringify({ error: "Serviço de IA temporariamente indisponível. Tente novamente em instantes." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Stream para o frontend ──
    const { readable, writable } = new TransformStream();
    const writer  = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      let inputTokens = 0, outputTokens = 0;
      try {
        const tokens = provider === "gemini"
          ? await streamGemini(response!, writer, encoder)
          : await streamGroq(response!, writer, encoder);
        inputTokens  = tokens.inputTokens;
        outputTokens = tokens.outputTokens;

        if (inputTokens > 0 || outputTokens > 0) {
          await writer.write(encoder.encode(`\n__RF_USAGE__:${JSON.stringify({ i: inputTokens, o: outputTokens })}`));
        }

        // Audit log
        try {
          const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
          );
          await supabaseAdmin.from("audit_logs").insert({
            org_id:        payload.orgId ?? null,
            user_id:       user.id,
            action:        payload.action === "improve" ? "report.improved" : "report.generated",
            tokens_input:  inputTokens,
            tokens_output: outputTokens,
            metadata:      { report_type: payload.reportType ?? null, provider, status: "success" },
          });
        } catch (auditErr) {
          console.warn("audit_log insert failed:", auditErr);
        }
      } catch (err) {
        console.error("Stream error:", err);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });

  } catch (e) {
    console.error("generate-report error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno no servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
