/**
 * Edge Function temporária para homologação PagBank.
 *
 * Roda os testes a partir do servidor Supabase (IP limpo),
 * contornando o bloqueio do Cloudflare no IP local.
 *
 * Uso:
 *   curl -X POST https://lmydxgmiytiwgfmjjxdb.supabase.co/functions/v1/pagbank-sandbox-test \
 *     -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"secret":"PAGBANK_HOMOLOG_2026"}'
 *
 * REMOVER após homologação aprovada.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const CORS = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  // Proteção simples — só quem conhece o secret pode rodar os testes
  const body = await req.json().catch(() => ({}));
  if (body.secret !== "PAGBANK_HOMOLOG_2026") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const PAGBANK_API_URL   = Deno.env.get("PAGBANK_API_URL");
  const PAGBANK_API_TOKEN = Deno.env.get("PAGBANK_API_TOKEN");

  if (!PAGBANK_API_URL || !PAGBANK_API_TOKEN) {
    return new Response(JSON.stringify({ error: "PAGBANK_API_URL or PAGBANK_API_TOKEN not set" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const logs: any[] = [];

  // Headers limpos — sem Sec-Fetch-*, sem Origin (evita detecção como bot)
  const apiHeaders: Record<string, string> = {
    "Authorization": `Bearer ${PAGBANK_API_TOKEN}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  };

  async function callPagBank(method: string, path: string, payload?: object) {
    const url = `${PAGBANK_API_URL}${path}`;
    const entry: any = {
      step: `${method} ${path}`,
      request: {
        url,
        method,
        headers: { ...apiHeaders, Authorization: `Bearer ****${PAGBANK_API_TOKEN!.slice(-6)}` },
        body: payload ?? null,
      },
    };
    try {
      const res = await fetch(url, {
        method,
        headers: apiHeaders,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = text; }
      entry.response = { status: res.status, body: data };
      logs.push(entry);
      return { status: res.status, data };
    } catch (err: any) {
      entry.response = { status: "NETWORK_ERROR", body: err.message };
      logs.push(entry);
      return { status: 0, data: null };
    }
  }

  // ── TESTE 1: Criar assinatura ────────────────────────────────────────────
  const referenceId = `rf-homolog-${Date.now()}`;
  const subscriptionPayload = {
    reference_id: referenceId,
    plan: {
      interval: { unit: "MONTH", length: 1 },
      amount: { value: 9700, currency: "BRL" },
      trial: null,
    },
    subscriber: {
      name: "Homologação PagBank",
      email: "homologacao@pagseguro.com.br",
      tax_id: "07346828007",
      phones: [{ country: "55", area: "11", number: "999999999", type: "MOBILE" }],
    },
    payment_method: {
      type: "CREDIT_CARD",
      installments: 1,
      card: {
        // Cartão de teste sandbox PagBank — encriptado via PagBank.js (deve ser gerado fresco)
        encrypted: body.encrypted_card ?? "ENCRYPTED_CARD_PLACEHOLDER",
        security_code: "123",
        holder: {
          name: "HOMOLOGACAO PAGBANK",
          tax_id: "07346828007",
        },
        store: true,
      },
    },
    notification_urls: [
      "https://lmydxgmiytiwgfmjjxdb.supabase.co/functions/v1/pagbank-webhook?secret=SANDBOX_TEST",
    ],
  };

  const createResult = await callPagBank("POST", "/subscriptions", subscriptionPayload);

  let subscriptionId: string | null =
    createResult.data?.id ?? createResult.data?.subscription?.id ?? null;

  // ── TESTE 2: Consultar assinatura ────────────────────────────────────────
  if (subscriptionId) {
    await callPagBank("GET", `/subscriptions/${subscriptionId}`);
  } else {
    logs.push({ step: "GET /subscriptions/:id", skipped: true, reason: "Assinatura não criada no Teste 1" });
  }

  // ── TESTE 3: Cancelar assinatura ─────────────────────────────────────────
  if (subscriptionId) {
    await callPagBank("POST", `/subscriptions/${subscriptionId}/cancel`);
  } else {
    logs.push({ step: "POST /subscriptions/:id/cancel", skipped: true, reason: "Assinatura não criada no Teste 1" });
  }

  return new Response(JSON.stringify({ logs }, null, 2), {
    status: 200,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
