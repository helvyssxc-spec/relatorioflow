import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

serve(async (req) => {
  try {
    // Estas variáveis devem ser configuradas como "secrets" no painel do Supabase Edge Functions
    const umamiApiKey = Deno.env.get("UMAMI_API_KEY");
    const umamiWebsiteId = Deno.env.get("UMAMI_WEBSITE_ID");
    
    // Injetados automaticamente pelo Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!umamiApiKey || !umamiWebsiteId || !supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Missing environment variables." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Usaremos o Service Role para fazer o bypass do RLS ao inserir os dados
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calcular data atual em UTC para padronização.
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const startAt = startOfDay.getTime();
    const endAt = endOfDay.getTime();

    // Consultando os relatórios agregados ("stats") do Umami no dia
    const umamiUrl = `https://api.umami.is/v1/websites/${umamiWebsiteId}/stats?startAt=${startAt}&endAt=${endAt}`;
    const response = await fetch(umamiUrl, {
      method: "GET",
      headers: {
        "x-umami-api-key": umamiApiKey,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Umami API Error: ${response.status} ${response.statusText}`);
    }

    const stats = await response.json();
    
    // Formato retornado pelo Umami: { pageviews: { value: 10, prev: 0 }, ... }
    const isoDate = startOfDay.toISOString().split("T")[0]; // YYYY-MM-DD

    // Realiza um UPSERT. Se o script rodar mais de uma vez no mesmo dia,
    // ele atualiza a linha com os dados mais recentes do Umami naquele dia.
    const { error: dbError } = await supabase
      .from('umami_daily_stats')
      .upsert({
        date: isoDate,
        website_id: umamiWebsiteId,
        pageviews: stats.pageviews?.value || 0,
        visitors: stats.visitors?.value || 0,
        visits: stats.visits?.value || 0,
        bounces: stats.bounces?.value || 0,
        totaltime: stats.totaltime?.value || 0
      }, { onConflict: 'date,website_id' });

    if (dbError) {
      throw new Error(`Supabase DB Error: ${dbError.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      date: isoDate, 
      message: "Synced day perfectly.",
      stats 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
