import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Plan amounts in centavos — must match src/config/plans.ts
const PLAN_PRICES: Record<string, { monthly: number; yearly: number; name: string }> = {
  pro:      { monthly: 9700,  yearly: 97000,  name: "Pro" },
  business: { monthly: 24700, yearly: 247000, name: "Business" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAGBANK_API_URL = Deno.env.get("PAGBANK_API_URL");
    if (!PAGBANK_API_URL) {
      throw new Error("PAGBANK_API_URL not configured. Set it to https://api.pagseguro.com for production.");
    }

    const PAGBANK_TOKEN = Deno.env.get("PAGBANK_API_TOKEN");
    if (!PAGBANK_TOKEN) {
      throw new Error("PAGBANK_API_TOKEN not configured");
    }

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      plan,
      billing_cycle,
      encrypted_card,
      security_code,
      holder_name,
      holder_tax_id,
      customer_name,
      customer_email,
      customer_tax_id,
      customer_phone,
    } = body;

    if (!plan || !encrypted_card || !security_code || !holder_name || !customer_email || !customer_tax_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const planConfig = PLAN_PRICES[plan];
    if (!planConfig) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve org_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return new Response(JSON.stringify({ error: "No organization found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cycle = billing_cycle === "annual" ? "annual" : "monthly";
    const amountCentavos = cycle === "annual" ? planConfig.yearly : planConfig.monthly;

    // Interval: monthly = 1 month, annual = 12 months
    const intervalUnit = "MONTH";
    const intervalLength = cycle === "annual" ? 12 : 1;

    const phoneParts = (customer_phone || "11999999999").replace(/\D/g, "");
    const referenceId = `rf-${plan}-${profile.org_id}-${Date.now()}`;

    // Build PagBank Subscription payload
    const subscriptionPayload = {
      reference_id: referenceId,
      plan: {
        interval: {
          unit: intervalUnit,
          length: intervalLength,
        },
        amount: {
          value: amountCentavos,
          currency: "BRL",
        },
        trial: null,
      },
      subscriber: {
        name: customer_name || holder_name,
        email: customer_email,
        tax_id: customer_tax_id.replace(/\D/g, ""),
        phones: [
          {
            country: "55",
            area: phoneParts.substring(0, 2),
            number: phoneParts.substring(2),
            type: "MOBILE",
          },
        ],
      },
      payment_method: {
        type: "CREDIT_CARD",
        installments: 1,
        card: {
          encrypted: encrypted_card,
          security_code: security_code,
          holder: {
            name: holder_name,
            tax_id: (holder_tax_id || customer_tax_id).replace(/\D/g, ""),
          },
          store: true,
        },
      },
      notification_urls: [
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/pagbank-webhook?secret=${Deno.env.get("PAGBANK_WEBHOOK_SECRET") || ""}`,
      ],
    };

    console.log("Creating PagBank subscription:", JSON.stringify({ plan, cycle, amountCentavos }));

    const pagbankRes = await fetch(`${PAGBANK_API_URL}/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAGBANK_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscriptionPayload),
    });

    const pagbankData = await pagbankRes.json();

    if (!pagbankRes.ok) {
      console.error("PagBank error:", JSON.stringify(pagbankData));
      return new Response(
        JSON.stringify({
          error: "Erro no processamento do pagamento",
          details: pagbankData.error_messages || pagbankData,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PagBank subscription statuses: ACTIVE, PENDING, SUSPENDED, CANCELED
    const subscriptionStatus = pagbankData.status;
    if (subscriptionStatus !== "ACTIVE" && subscriptionStatus !== "PENDING") {
      return new Response(
        JSON.stringify({
          error: "Assinatura não aprovada",
          status: subscriptionStatus,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract first charge details (initial payment)
    const firstCharge = pagbankData.charges?.[0] ?? pagbankData.payment_method?.card ?? {};
    const cardBrand = firstCharge.brand ?? pagbankData.payment_method?.card?.brand;
    const cardLastDigits = firstCharge.last_digits ?? pagbankData.payment_method?.card?.last_digits;
    const cardToken = firstCharge.id ?? pagbankData.payment_method?.card?.id;

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Deactivate any existing active subscriptions
    await serviceClient
      .from("subscriptions")
      .update({ status: "canceled", canceled_at: new Date().toISOString() })
      .eq("org_id", profile.org_id)
      .eq("status", "active");

    // Calculate period end
    const now = new Date();
    const periodEnd = new Date(now);
    if (cycle === "annual") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Create subscription record
    const { error: subError } = await serviceClient.from("subscriptions").insert({
      org_id: profile.org_id,
      plan,
      amount: amountCentavos / 100,
      billing_cycle: cycle,
      currency: "BRL",
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      pagbank_subscription_id: pagbankData.id,
      pagbank_order_id: pagbankData.id,
      pagbank_card_token: cardToken ?? null,
      pagbank_charge_id: firstCharge.id ?? null,
      card_last_digits: cardLastDigits ?? null,
      card_brand: cardBrand ?? null,
    });

    if (subError) {
      console.error("Subscription insert error:", subError);
    }

    // Activate org plan
    await serviceClient
      .from("organizations")
      .update({ plan, plan_status: "active" })
      .eq("id", profile.org_id);

    // Log payment event
    await serviceClient.from("payment_events").insert({
      org_id: profile.org_id,
      event_type: "subscription.created",
      payload: {
        subscription_id: pagbankData.id,
        amount: amountCentavos,
        plan,
        billing_cycle: cycle,
        interval_months: intervalLength,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: pagbankData.id,
        plan,
        card_brand: cardBrand,
        card_last_digits: cardLastDigits,
        next_charge: periodEnd.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
