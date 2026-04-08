import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { jobId } = await req.json();

    if (!jobId) {
      return new Response(JSON.stringify({ error: "jobId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Get job data
    const { data: job, error: jobError } = await supabaseAdmin
      .from("report_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Mark as processing
    await supabaseAdmin.from("report_jobs").update({ status: "processing" }).eq("id", jobId);

    // 3. Process logic (Simulated for MVP Stabilization)
    // Here we would call the AI generation and PDF generation if needed
    // For now, we just wait a bit and mark as completed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Complete job
    const { error: completeError } = await supabaseAdmin
      .from("report_jobs")
      .update({ 
        status: "completed",
        updated_at: new Date().toISOString()
      })
      .eq("id", jobId);

    if (completeError) throw completeError;

    return new Response(JSON.stringify({ success: true, message: "Job processed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
