import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Finds the internal subscription record using any PagBank ID in the payload. */
async function findSubscription(serviceClient: any, body: any) {
  const pagbankSubscriptionId = body.id ?? body.subscription?.id;
  const chargeId = body.charges?.[0]?.id ?? body.charge?.id;
  const orderId = body.id;

  if (pagbankSubscriptionId) {
    const { data } = await serviceClient
      .from("subscriptions")
      .select("*")
      .eq("pagbank_subscription_id", pagbankSubscriptionId)
      .maybeSingle();
    if (data) return data;
  }

  if (chargeId) {
    const { data } = await serviceClient
      .from("subscriptions")
      .select("*")
      .eq("pagbank_charge_id", chargeId)
      .maybeSingle();
    if (data) return data;
  }

  if (orderId) {
    const { data } = await serviceClient
      .from("subscriptions")
      .select("*")
      .eq("pagbank_order_id", orderId)
      .maybeSingle();
    if (data) return data;
  }

  return null;
}

/** Returns the plan name from the PagBank payload reference_id. */
function extractPlanFromBody(body: any): string {
  const ref = body.reference_id ?? body.subscription?.reference_id ?? "";
  if (ref.includes("business")) return "business";
  if (ref.includes("pro")) return "pro";
  return "pro";
}

/** Advances the period end by the subscription interval. */
function advancePeriod(currentEnd: string | null, billingCycle: string): string {
  const base = currentEnd ? new Date(currentEnd) : new Date();
  const next = new Date(base);
  if (billingCycle === "annual") {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next.toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook secret
    const url = new URL(req.url);
    const receivedSecret = url.searchParams.get("secret");
    const expectedSecret = Deno.env.get("PAGBANK_WEBHOOK_SECRET");

    if (!expectedSecret) {
      console.error("[webhook] PAGBANK_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (receivedSecret !== expectedSecret) {
      console.warn("[webhook] Unauthorized: invalid secret token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const eventType: string = body.type ?? "";
    console.log("PagBank webhook:", eventType, JSON.stringify(body).slice(0, 300));

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const sub = await findSubscription(serviceClient, body);

    // Always log the event
    if (sub) {
      await serviceClient.from("payment_events").insert({
        org_id: sub.org_id,
        event_type: eventType || `webhook.${body.charges?.[0]?.status?.toLowerCase() ?? "unknown"}`,
        payload: body,
      });
    }

    // ── SUBSCRIPTION ACTIVATED (first payment approved) ──────────────────
    if (eventType === "subscription.authorized" || eventType === "subscription.activated") {
      const plan = extractPlanFromBody(body);
      if (sub) {
        await serviceClient
          .from("organizations")
          .update({ plan, plan_status: "active" })
          .eq("id", sub.org_id);
        await serviceClient
          .from("subscriptions")
          .update({ status: "active", pagbank_subscription_id: body.id ?? sub.pagbank_subscription_id })
          .eq("id", sub.id);
        console.log(`[webhook] Assinatura ativada: plano ${plan} para org ${sub.org_id}`);
      }
    }

    // ── RECURRING CHARGE SUCCEEDED ────────────────────────────────────────
    else if (
      eventType === "charge.succeeded" ||
      eventType === "subscription.charge.success" ||
      eventType === "subscription.charge.paid"
    ) {
      if (sub) {
        const newPeriodEnd = advancePeriod(sub.current_period_end, sub.billing_cycle);
        await serviceClient
          .from("subscriptions")
          .update({
            status: "active",
            current_period_start: sub.current_period_end ?? new Date().toISOString(),
            current_period_end: newPeriodEnd,
          })
          .eq("id", sub.id);
        await serviceClient
          .from("organizations")
          .update({ plan: sub.plan, plan_status: "active" })
          .eq("id", sub.org_id);
        console.log(`[webhook] Cobrança recorrente OK: plano ${sub.plan}, próxima em ${newPeriodEnd}`);
      }
    }

    // ── RECURRING CHARGE FAILED ───────────────────────────────────────────
    else if (
      eventType === "charge.failed" ||
      eventType === "subscription.charge.failed"
    ) {
      if (sub) {
        // Mark plan as past_due — still active but needs attention
        await serviceClient
          .from("organizations")
          .update({ plan_status: "past_due" })
          .eq("id", sub.org_id);
        console.warn(`[webhook] Falha na cobrança recorrente para org ${sub.org_id}`);
      }
    }

    // ── SUBSCRIPTION CANCELED / DEACTIVATED ──────────────────────────────
    else if (
      eventType === "subscription.deactivated" ||
      eventType === "subscription.canceled" ||
      eventType === "subscription.suspended"
    ) {
      if (sub) {
        await serviceClient
          .from("subscriptions")
          .update({ status: "canceled", canceled_at: new Date().toISOString() })
          .eq("id", sub.id);
        await serviceClient
          .from("organizations")
          .update({ plan: "starter", plan_status: "active" })
          .eq("id", sub.org_id);
        console.log(`[webhook] Assinatura cancelada para org ${sub.org_id}`);
      }
    }

    // ── LEGACY: plain order status (PAID / CANCELED / DECLINED) ─────────
    else {
      const legacyStatus = body.charges?.[0]?.status ?? body.status;
      if (sub && legacyStatus === "PAID") {
        const plan = extractPlanFromBody(body);
        await serviceClient
          .from("organizations")
          .update({ plan, plan_status: "active" })
          .eq("id", sub.org_id);
        await serviceClient
          .from("subscriptions")
          .update({ status: "active" })
          .eq("id", sub.id);
      } else if (sub && (legacyStatus === "CANCELED" || legacyStatus === "DECLINED")) {
        await serviceClient
          .from("subscriptions")
          .update({ status: "canceled", canceled_at: new Date().toISOString() })
          .eq("id", sub.id);
        await serviceClient
          .from("organizations")
          .update({ plan: "starter", plan_status: "active" })
          .eq("id", sub.org_id);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
