import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "API key obrigatória. Use: Authorization: Bearer rf_sua_chave" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawKey = authHeader.slice(7);
    const keyHash = await hashApiKey(rawKey);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: apiKey } = await supabase
      .from("api_keys")
      .select("id, org_id, is_active, revoked_at")
      .eq("key_hash", keyHash)
      .single();

    if (!apiKey || !apiKey.is_active || apiKey.revoked_at) {
      return new Response(
        JSON.stringify({ error: "API key inválida ou revogada." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("id, plan, name")
      .eq("id", apiKey.org_id)
      .single();

    if (org?.plan !== "business") {
      return new Response(
        JSON.stringify({ error: "A API pública é exclusiva do plano Business." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("api_keys").update({ last_used: new Date().toISOString() }).eq("id", apiKey.id);

    const url = new URL(req.url);

    // GET — list reports
    if (req.method === "GET") {
      const limit = parseInt(url.searchParams.get("limit") || "20");
      const offset = parseInt(url.searchParams.get("offset") || "0");

      const { data: reports } = await supabase
        .from("generated_reports")
        .select("id, client_name, report_type, report_date, report_location, created_at")
        .eq("org_id", apiKey.org_id)
        .order("created_at", { ascending: false })
        .range(offset, offset + Math.min(limit, 100) - 1);

      return new Response(
        JSON.stringify({ data: reports || [], total: reports?.length || 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST — generate report
    if (req.method === "POST") {
      const body = await req.json();

      if (!body.notes?.trim()) {
        return new Response(
          JSON.stringify({ error: "Campo obrigatório: 'notes' (descrição das atividades)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const reportPayload = {
        notes: body.notes,
        reportType: body.report_type || "relatorio_tecnico",
        reportNumber: body.report_number || null,
        reportDate: body.report_date || new Date().toISOString().split("T")[0],
        reportLocation: body.report_location || null,
        clientName: body.client_name || null,
        clientCompany: body.client_company || null,
        responsibleName: body.responsible_name || null,
        responsibleRole: body.responsible_role || null,
        weatherCondition: body.weather_condition || null,
        accessCondition: body.access_condition || null,
        siteCondition: body.site_condition || null,
        teamMembers: body.team_members || [],
        occurrences: body.occurrences || null,
        materials: (body.materials || []).map((m: any) => ({
          item: m.item || "",
          qty: String(m.qty || "1"),
          unit: m.unit || "un",
          price: String(m.price || ""),
        })),
        paymentTerms: body.payment_terms || null,
        proposalValidity: body.proposal_validity || null,
        executionDays: body.execution_days || null,
        bdiPercent: body.bdi_percent || null,
        orgName: org!.name,
      };

      const genRes = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify(reportPayload),
        }
      );

      if (!genRes.ok) {
        throw new Error("Erro ao gerar relatório via IA.");
      }

      const reportText = await genRes.text();

      // Find any user in the org to assign as user_id (required by schema)
      const { data: orgUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("org_id", apiKey.org_id)
        .limit(1)
        .single();

      const { data: saved, error: saveErr } = await supabase
        .from("generated_reports")
        .insert({
          org_id: apiKey.org_id,
          user_id: orgUser?.id || apiKey.org_id,
          input_text: body.notes,
          report_content: reportText,
          report_type: reportPayload.reportType,
          report_number: reportPayload.reportNumber,
          report_date: reportPayload.reportDate,
          report_location: reportPayload.reportLocation,
          client_name: reportPayload.clientName,
          client_company: reportPayload.clientCompany,
          responsible_name: reportPayload.responsibleName,
          responsible_role: reportPayload.responsibleRole,
          team_members: reportPayload.teamMembers,
          materials: reportPayload.materials,
          occurrences: reportPayload.occurrences,
          weather_condition: reportPayload.weatherCondition,
          access_condition: reportPayload.accessCondition,
          site_condition: reportPayload.siteCondition,
        })
        .select("id, created_at")
        .single();

      if (saveErr) throw saveErr;

      return new Response(
        JSON.stringify({
          success: true,
          report: {
            id: saved.id,
            content: reportText,
            created_at: saved.created_at,
            report_type: reportPayload.reportType,
            client_name: reportPayload.clientName,
          },
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Método não suportado. Use GET ou POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[api-generate-report]", err);
    return new Response(
      JSON.stringify({ error: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
