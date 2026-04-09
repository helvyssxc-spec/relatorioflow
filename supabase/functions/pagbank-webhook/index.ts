import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Verifica o status real do pedido diretamente na API do PagBank
// Isso é mais seguro do que confiar no payload do webhook
async function fetchOrderStatus(orderId: string, apiToken: string, apiUrl: string) {
  const res = await fetch(`${apiUrl}/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`PagBank API error: ${res.status}`)
  return res.json()
}

function extractUserId(referenceId: string): string | null {
  // reference_id = "rf-{uuid}-{timestamp}" onde uuid tem 5 partes
  const parts = referenceId.split('-')
  // "rf" + 5 partes do UUID = índices 1..5
  if (parts.length >= 6) {
    const candidate = parts.slice(1, 6).join('-')
    return UUID_REGEX.test(candidate) ? candidate : null
  }
  return null
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const PAGBANK_TOKEN = Deno.env.get('PAGBANK_API_TOKEN')
    const PAGBANK_API_URL = Deno.env.get('PAGBANK_API_URL') || 'https://sandbox.api.pagseguro.com'

    const payload = await req.json()
    const notificationId: string = payload.id || ''

    // Registra recebimento antes de qualquer validação
    await supabase.from('pagbank_events').insert({
      pagbank_order_id: notificationId,
      event_type: 'webhook_received',
      status: 'pending_verification',
      payload,
    })

    // Se temos token, verificamos o status REAL na API do PagBank
    // Isso previne que qualquer pessoa forje um webhook de pagamento confirmado
    let verifiedStatus: string
    let verifiedOrder: any = payload

    if (PAGBANK_TOKEN && notificationId) {
      verifiedOrder = await fetchOrderStatus(notificationId, PAGBANK_TOKEN, PAGBANK_API_URL)
      verifiedStatus = verifiedOrder.charges?.[0]?.status || verifiedOrder.status || ''
    } else {
      // Sem token configurado: usa o payload diretamente (menos seguro)
      verifiedStatus = payload.charges?.[0]?.status || payload.status || ''
    }

    const referenceId: string = verifiedOrder.reference_id || payload.reference_id || ''
    const userId = extractUserId(referenceId)

    // Atualiza evento com status verificado
    await supabase
      .from('pagbank_events')
      .update({ status: verifiedStatus, ...(userId ? { user_id: userId } : {}) })
      .eq('pagbank_order_id', notificationId)

    if (!userId) {
      console.log(`Webhook sem userId válido. reference_id: ${referenceId}`)
      return new Response(JSON.stringify({ received: true, warning: 'no_user_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Pagamento confirmado → liberar acesso
    if (verifiedStatus === 'PAID' || verifiedStatus === 'AUTHORIZED') {
      await supabase
        .from('profiles')
        .update({
          has_access: true,
          pagbank_order_id: notificationId,
          access_granted_at: new Date().toISOString(),
        })
        .eq('id', userId)

      console.log(`Access granted for user: ${userId}`)
    }

    // Cancelamento/estorno → revogar acesso
    if (verifiedStatus === 'CANCELED' || verifiedStatus === 'DECLINED' || verifiedStatus === 'REFUNDED') {
      await supabase
        .from('profiles')
        .update({ has_access: false })
        .eq('id', userId)

      console.log(`Access revoked for user: ${userId}`)
    }

    return new Response(
      JSON.stringify({ received: true, status: verifiedStatus }),
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
