import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const payload = await req.json()
    console.log('PagBank webhook received:', JSON.stringify(payload))

    const orderId = payload.id || payload.reference_id
    const status = payload.charges?.[0]?.status || payload.status

    // Registrar evento
    await supabase.from('pagbank_events').insert({
      pagbank_order_id: orderId,
      event_type: 'webhook_received',
      status,
      amount: payload.charges?.[0]?.amount?.value,
      payload,
    })

    // Pagamento confirmado → liberar acesso
    if (status === 'PAID' || status === 'AUTHORIZED') {
      const referenceId: string = payload.reference_id || ''
      // reference_id = "rf-{user_id}-{timestamp}"
      const userId = referenceId.split('-')[1]

      if (userId) {
        await supabase
          .from('profiles')
          .update({
            has_access: true,
            pagbank_order_id: orderId,
            access_granted_at: new Date().toISOString(),
          })
          .eq('id', userId)

        // Atualizar user_id no evento
        await supabase
          .from('pagbank_events')
          .update({ user_id: userId })
          .eq('pagbank_order_id', orderId)
          .is('user_id', null)

        console.log(`Access granted for user: ${userId}`)
      }
    }

    // Cancelamento/estorno → revogar acesso
    if (status === 'CANCELED' || status === 'DECLINED' || status === 'REFUNDED') {
      const referenceId: string = payload.reference_id || ''
      const userId = referenceId.split('-')[1]

      if (userId) {
        await supabase
          .from('profiles')
          .update({ has_access: false })
          .eq('id', userId)

        console.log(`Access revoked for user: ${userId}`)
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
