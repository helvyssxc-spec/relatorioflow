import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
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

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find active subscription
    const { data: sub } = await serviceClient
      .from("subscriptions")
      .select("*")
      .eq("org_id", profile.org_id)
      .eq("status", "active")
      .maybeSingle();

    if (!sub) {
      return new Response(JSON.stringify({ error: "No active subscription" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cancel subscription at PagBank if we have the subscription ID
    if (sub.pagbank_subscription_id) {
      const cancelRes = await fetch(
        `${PAGBANK_API_URL}/subscriptions/${sub.pagbank_subscription_id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAGBANK_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!cancelRes.ok) {
        const errData = await cancelRes.json().catch(() => ({}));
        console.error("PagBank cancel error:", JSON.stringify(errData));
        // Log the error but still proceed to cancel in the database
        // so the user isn't stuck in an uncancelable state
      } else {
        console.log(`[cancel] Assinatura ${sub.pagbank_subscription_id} cancelada na PagBank`);
      }
    }

    const now = new Date().toISOString();

    // Mark subscription as canceled — access until current_period_end
    await serviceClient
      .from("subscriptions")
      .update({ status: "canceled", canceled_at: now })
      .eq("id", sub.id);

    // Keep org plan active until period ends; plan_status signals cancellation
    await serviceClient
      .from("organizations")
      .update({ plan_status: "canceled" })
      .eq("id", profile.org_id);

    // Log event
    await serviceClient.from("payment_events").insert({
      org_id: profile.org_id,
      event_type: "subscription.canceled",
      payload: {
        subscription_id: sub.id,
        pagbank_subscription_id: sub.pagbank_subscription_id,
        plan: sub.plan,
        canceled_at: now,
        access_until: sub.current_period_end,
      },
    });

    console.log(`[cancel] Org ${profile.org_id} cancelada, acesso até ${sub.current_period_end}`);

    return new Response(
      JSON.stringify({
        success: true,
        access_until: sub.current_period_end,
        plan: sub.plan,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cancel error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
