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
  'Diários e Relatórios Ilimitados',
  'Exportação de PDF Premium (White Label)',
  'Integração de Clima via GPS Automático',
  'Armazenamento em Nuvem (Fotos e Anexos)',
  'Modo Offline Híbrido de Segurança',
  'Suporte Prioritário e Backup Diário',
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
        <div className="rounded-[32px] border border-orange-500/20 bg-orange-50/50 dark:bg-orange-500/10 p-8 glass shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/30">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-black text-foreground text-2xl tracking-tight">Plano Elite Ativo</p>
              <p className="text-muted-foreground text-sm font-medium mt-1">Sua conta possui acesso ilimitado liberado.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLAN_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3 bg-white/40 dark:bg-slate-900/40 p-3 rounded-2xl border border-white/20 dark:border-white/5">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-bold text-foreground leading-tight">{f}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Sem acesso — tela de conversão ── */
        <>
          {/* Card principal dark */}
          <div className="rounded-[32px] overflow-hidden shadow-2xl glass border-slate-200/50 dark:border-white/5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-black relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="p-8 md:p-10 space-y-8 relative z-10">
              {/* Header pricing */}
              <div className="text-center space-y-4">
                <Badge className="bg-orange-500 text-white border-none font-black uppercase tracking-widest px-4 py-1.5 shadow-lg shadow-orange-500/30">
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Acesso Ilimitado Elite
                </Badge>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-2xl text-muted-foreground font-black mt-1">R$</span>
                  <span className="text-7xl font-black tracking-tighter leading-none text-foreground">97</span>
                  <span className="text-muted-foreground font-bold mb-1">/mês</span>
                </div>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest bg-muted/50 inline-block px-4 py-1 rounded-full">
                  Cancele quando quiser · Sem fidelidade
                </p>
              </div>

              {/* Features grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {PLAN_FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm text-foreground font-bold">{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA button */}
              <Button
                className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 h-16 text-lg font-black rounded-2xl shadow-xl shadow-orange-500/30 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/40 text-white"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="w-5 h-5 mr-2" />
                )}
                {loading ? 'Redirecionando para segurança...' : 'Assinar Acesso Elite agora'}
              </Button>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 text-[10px] text-muted-foreground uppercase font-black tracking-widest pt-4 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  Checkout Seguro
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-orange-500" />
                  PagBank 100%
                </div>
                <div className="flex items-center gap-1.5 hidden sm:flex">
                  <Star className="w-4 h-4 text-amber-500" />
                  Garantia Ativa
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
