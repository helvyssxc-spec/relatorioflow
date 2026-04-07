import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, CreditCard, Loader2, ArrowLeft, Shield, Lock, Star, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

const PLAN_FEATURES = [
  'Diários de Obra ilimitados',
  'Relatórios Técnicos ilimitados',
  'Exportação PDF com design premium',
  'Preenchimento automático de clima via GPS',
  'Modo offline — draft automático',
  'Logo e identidade da sua empresa',
  'Histórico completo de relatórios',
  'Suporte prioritário por e-mail',
]

export default function Checkout() {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const [loading, setLoading] = useState(false)

  const hasAccess = profile?.has_access === true

  const handleCheckout = async () => {
    if (!user) return
    setLoading(true)
    try {
      // Registra tentativa de checkout no audit_log (assíncrono)
      (supabase as any)
        .from('audit_logs')
        .insert([{ 
          user_id: user.id, 
          action: 'checkout.started', 
          metadata: { plan: 'monthly', price_brl: 97 } 
        }])
        .then(() => null);

      const { data, error } = await supabase.functions.invoke('pagbank-checkout', {
        body: {
          user_id: user.id,
          email: user.email,
          plan: 'monthly',
        },
      })

      if (error) throw error

      if (data?.payment_url) {
        window.location.href = data.payment_url
      } else {
        toast.error('Erro ao iniciar pagamento. Tente novamente.')
      }
    } catch {
      toast.error('Erro ao conectar com o servidor de pagamento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/app/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu Plano</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Acesso completo ao RelatorioFlow</p>
        </div>
      </div>

      {hasAccess ? (
        /* ── Já tem acesso ── */
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <p className="font-black text-emerald-800 text-xl tracking-tight">Plano Ativo ✓</p>
              <p className="text-emerald-600 text-sm font-medium">Você tem acesso completo ao RelatorioFlow.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PLAN_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-emerald-700 font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Sem acesso — tela de conversão ── */
        <>
          {/* Card principal dark */}
          <div className="rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/20 bg-gradient-to-b from-slate-900 to-slate-950 text-white">
            <div className="p-8 md:p-10 space-y-8">
              {/* Header pricing */}
              <div className="text-center space-y-3">
                <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 font-black uppercase tracking-widest px-4 py-1.5">
                  <Zap className="w-3 h-3 mr-1.5" />
                  Acesso Ilimitado
                </Badge>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-2xl text-white/40 font-black mt-1">R$</span>
                  <span className="text-7xl font-black tracking-tighter leading-none">97</span>
                  <span className="text-white/40 font-bold mb-1">/mês</span>
                </div>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                  Cancele quando quiser · Sem fidelidade
                </p>
              </div>

              {/* Features grid */}
              <div className="grid sm:grid-cols-2 gap-3">
                {PLAN_FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-3 h-3 text-blue-400" />
                    </div>
                    <span className="text-sm text-white/70 font-medium">{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA button */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-500 h-14 text-base font-black rounded-2xl shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Redirecionando para o PagBank...' : 'Assinar por R$ 97/mês'}
              </Button>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 text-xs text-white/30 font-bold">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Pagamento seguro
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  PagBank Certificado
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" />
                  5 estrelas
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Ao assinar, você concorda com nossos termos de uso.
            Cancele a qualquer momento pelo painel.
          </p>
        </>
      )}
    </div>
  )
}
