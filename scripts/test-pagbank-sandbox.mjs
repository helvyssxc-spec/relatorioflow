/**
 * RelatórioFlow — Teste de Integração PagBank Sandbox
 *
 * Uso:
 *   PAGBANK_API_TOKEN=seu_token node scripts/test-pagbank-sandbox.mjs
 *
 * Gera logs completos de request/response para envio ao PagBank.
 */

const PAGBANK_API_URL = "https://sandbox.api.pagseguro.com";
const PAGBANK_API_TOKEN = process.env.PAGBANK_API_TOKEN;

if (!PAGBANK_API_TOKEN) {
  console.error("ERRO: Defina a variável PAGBANK_API_TOKEN antes de rodar.");
  console.error("Exemplo: PAGBANK_API_TOKEN=seu_token node scripts/test-pagbank-sandbox.mjs");
  process.exit(1);
}

// Dados de teste — cartão sandbox PagBank
const TEST_DATA = {
  plan:              "pro",
  billing_cycle:     "annual",
  // Cartão de teste sandbox PagBank (número genérico para homologação)
  encrypted_card:    "kQ8sWU/ut9CLhz00mPvBaRvn2L9JeIJFf0dqF/+tGlyryD2fCGYUa7Z8+54mDa5KMkCJpM7JWU1WhmUFcbhw1m8i1pWovOjDgsa68h3Jzobfq3qnKaJudVdNc08WyYolxUfff4TbOAhsEtlDOG/jKYXb3SFiJSnJAIf7IhsDRGDSejgtFM9bfKq3HkFUL0QZs1+TWjPWbz+xvmRgZUax72qDfACg0onVRGNJR3dYJGqfzPMvuEMKcJsT5j6oZfmySqs+JSrddv/g2B2t02rOJq/VG7kiz5qcuv9cHVxp0VkZFDU2Tdp3EKgBxIieqkY0jH+43/atD9YMvxd7e9RGfg==", // token gerado via PagBank.js
  security_code:     "123",
  holder_name:       "Homologação PagBank",
  holder_tax_id:     "07346828007",
  customer_name:     "Homologação PagBank",
  customer_email:    "homologacao@pagseguro.com.br",
  customer_tax_id:   "07346828007",
  customer_phone:    "11999999999",
};

const PLAN_PRICES = {
  pro:      { monthly: 9700,  yearly: 97000,  name: "Pro" },
  business: { monthly: 24700, yearly: 247000, name: "Business" },
};

const timestamp = new Date().toISOString();
const logs = [];

function log(section, data) {
  const entry = { section, timestamp: new Date().toISOString(), ...data };
  logs.push(entry);
  console.log("\n" + "=".repeat(70));
  console.log(`[${entry.timestamp}] ${section}`);
  console.log("=".repeat(70));
  if (data.method && data.url) {
    console.log(`${data.method} ${data.url}`);
  }
  if (data.headers) {
    console.log("\nHEADERS:");
    console.log(JSON.stringify(data.headers, null, 2));
  }
  if (data.body) {
    console.log("\nREQUEST BODY:");
    console.log(JSON.stringify(data.body, null, 2));
  }
  if (data.status) {
    console.log(`\nRESPONSE STATUS: ${data.status}`);
  }
  if (data.response) {
    console.log("\nRESPONSE BODY:");
    console.log(JSON.stringify(data.response, null, 2));
  }
  if (data.error) {
    console.log("\nERRO:", data.error);
  }
}

async function callPagBank(method, path, body) {
  const url = `${PAGBANK_API_URL}${path}`;
  // Headers limpos: Sec-Fetch-* e Origin foram removidos.
  // Esses headers são exclusivos de browser real; usá-los em scripts
  // sem cookies/fingerprint dispara o WAF do Cloudflare.
  const headers = {
    "Authorization": `Bearer ${PAGBANK_API_TOKEN}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "RelatorioFlow/1.0 (Node.js homologacao)",
  };

  // Log request (esconde o token)
  const safeHeaders = {
    ...headers,
    "Authorization": `Bearer ****${PAGBANK_API_TOKEN.slice(-6)}`,
  };

  log(`REQUEST → ${method} ${path}`, {
    method,
    url,
    headers: safeHeaders,
    body: body || null,
  });

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseText = await res.text();
  let responseJson;
  try {
    responseJson = JSON.parse(responseText);
  } catch {
    responseJson = responseText;
  }

  log(`RESPONSE ← ${method} ${path}`, {
    status: `${res.status} ${res.statusText}`,
    response: responseJson,
  });

  return { status: res.status, data: responseJson };
}

// ─── TESTE 1: Criar assinatura ────────────────────────────────────────────────
async function testeCreateSubscription() {
  console.log("\n\n" + "#".repeat(70));
  console.log("# TESTE 1: POST /subscriptions — Criar assinatura recorrente");
  console.log("#".repeat(70));

  const planConfig = PLAN_PRICES[TEST_DATA.plan];
  const cycle = TEST_DATA.billing_cycle === "annual" ? "annual" : "monthly";
  const amountCentavos = cycle === "annual" ? planConfig.yearly : planConfig.monthly;
  const intervalLength = cycle === "annual" ? 12 : 1;
  const referenceId = `rf-${TEST_DATA.plan}-test-${Date.now()}`;

  const phoneParts = TEST_DATA.customer_phone.replace(/\D/g, "");

  const payload = {
    reference_id: referenceId,
    plan: {
      interval: { unit: "MONTH", length: intervalLength },
      amount: { value: amountCentavos, currency: "BRL" },
      trial: null,
    },
    subscriber: {
      name: TEST_DATA.customer_name,
      email: TEST_DATA.customer_email,
      tax_id: TEST_DATA.customer_tax_id.replace(/\D/g, ""),
      phones: [{
        country: "55",
        area: phoneParts.substring(0, 2),
        number: phoneParts.substring(2),
        type: "MOBILE",
      }],
    },
    payment_method: {
      type: "CREDIT_CARD",
      installments: 1,
      card: {
        encrypted: TEST_DATA.encrypted_card,
        security_code: TEST_DATA.security_code,
        holder: {
          name: TEST_DATA.holder_name,
          tax_id: TEST_DATA.holder_tax_id.replace(/\D/g, ""),
        },
        store: true,
      },
    },
    notification_urls: [
      "https://lmydxgmiytiwgfmjjxdb.supabase.co/functions/v1/pagbank-webhook?secret=SANDBOX_TEST",
    ],
  };

  const result = await callPagBank("POST", "/subscriptions", payload);

  if (result.status === 201 || result.status === 200) {
    console.log("\n✅ Assinatura criada com sucesso");
    return result.data;
  } else {
    console.log("\n❌ Falha ao criar assinatura");
    return null;
  }
}

// ─── TESTE 2: Consultar assinatura ───────────────────────────────────────────
async function testeGetSubscription(subscriptionId) {
  console.log("\n\n" + "#".repeat(70));
  console.log(`# TESTE 2: GET /subscriptions/${subscriptionId} — Consultar assinatura`);
  console.log("#".repeat(70));

  const result = await callPagBank("GET", `/subscriptions/${subscriptionId}`);

  if (result.status === 200) {
    console.log("\n✅ Consulta realizada com sucesso");
  } else {
    console.log("\n❌ Falha na consulta");
  }

  return result.data;
}

// ─── TESTE 3: Cancelar assinatura ────────────────────────────────────────────
async function testeCancelSubscription(subscriptionId) {
  console.log("\n\n" + "#".repeat(70));
  console.log(`# TESTE 3: POST /subscriptions/${subscriptionId}/cancel — Cancelar assinatura`);
  console.log("#".repeat(70));

  const result = await callPagBank("POST", `/subscriptions/${subscriptionId}/cancel`);

  if (result.status === 200 || result.status === 204) {
    console.log("\n✅ Assinatura cancelada com sucesso");
  } else {
    console.log("\n❌ Falha no cancelamento");
  }

  return result.data;
}

// ─── EXECUÇÃO DOS TESTES ──────────────────────────────────────────────────────
async function run() {
  console.log("=".repeat(70));
  console.log("RELATÓRIOFLOW — TESTES DE INTEGRAÇÃO PAGBANK SANDBOX");
  console.log(`Data/Hora: ${timestamp}`);
  console.log(`Ambiente: ${PAGBANK_API_URL}`);
  console.log("=".repeat(70));

  // Teste 1: Criar
  const subscription = await testeCreateSubscription();

  if (subscription?.id) {
    // Teste 2: Consultar
    await testeGetSubscription(subscription.id);

    // Teste 3: Cancelar
    await testeCancelSubscription(subscription.id);
  } else {
    console.log("\n⚠️  Testes 2 e 3 pulados — assinatura não foi criada.");
    console.log("    Verifique o encrypted_card no arquivo e tente novamente.");
  }

  // Salva log completo em arquivo
  const logFile = `pagbank-sandbox-logs-${Date.now()}.json`;
  const fs = await import("fs");
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  console.log(`\n\n📄 Log completo salvo em: ${logFile}`);
  console.log("Envie esse arquivo ao PagBank para análise.\n");
}

run().catch(console.error);
