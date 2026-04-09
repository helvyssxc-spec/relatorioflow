import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const publicKey = Deno.env.get("PAGBANK_PUBLIC_KEY");
  if (!publicKey) {
    return new Response(JSON.stringify({ error: "Public key not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ public_key: publicKey }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
