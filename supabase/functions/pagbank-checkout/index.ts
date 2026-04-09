import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

// Plano único: R$ 97,00/mês
const PLAN_AMOUNT = 9700 // centavos
const PLAN_NAME = 'RelatorioFlow — Plano Mensal'

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { user_id, email } = await req.json()
    if (!user_id || !email) {
      return new Response(
        JSON.stringify({ error: 'user_id e email são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const pagbankToken = Deno.env.get('PAGBANK_API_TOKEN')
    const baseUrl = Deno.env.get('PAGBANK_API_URL') || 'https://sandbox.api.pagseguro.com'
    const appUrl = Deno.env.get('APP_URL') || 'https://relatorioflow.com.br'

    const orderPayload = {
      reference_id: `rf-${user_id}-${Date.now()}`,
      customer: { name: email.split('@')[0], email, tax_id: '00000000000' },
      items: [{ reference_id: 'monthly', name: PLAN_NAME, quantity: 1, unit_amount: PLAN_AMOUNT }],
      payment_methods: [{ type: 'CREDIT_CARD' }, { type: 'PIX' }, { type: 'BOLETO' }],
      redirect_url: `${appUrl}/app/plano?payment=success`,
      return_url: `${appUrl}/app/plano?payment=success`,
      notification_urls: [`${Deno.env.get('SUPABASE_URL')}/functions/v1/pagbank-webhook`],
    }

    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pagbankToken}` },
      body: JSON.stringify(orderPayload),
    })
    const data = await res.json()

    if (!res.ok) {
      console.error('PagBank error:', data)
      return new Response(
        JSON.stringify({ error: 'Erro no PagBank', details: data }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabase.from('pagbank_events').insert({
      user_id,
      pagbank_order_id: data.id,
      event_type: 'checkout_created',
      status: data.status,
      amount: PLAN_AMOUNT,
      payload: data,
    })

    const paymentUrl = data.links?.find((l: { rel: string; href: string }) => l.rel === 'PAY')?.href

    return new Response(
      JSON.stringify({ order_id: data.id, payment_url: paymentUrl, status: data.status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Checkout error:', err)
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
