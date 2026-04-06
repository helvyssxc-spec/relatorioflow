import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, CreditCard, Loader2, ArrowLeft, Shield, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

const PLAN_FEATURES = [
  'Diários de Obra ilimitados',
  'Relatórios Técnicos ilimitados',
  'Exportação PDF com design premium',
  'Preenchimento automático de clima',
  'Modo offline — draft automático',
  'Logo e identidade da sua empresa',
  'Histórico completo de relatórios',
  'Suporte por e-mail',
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
    <div className="max-w-2xl space-y-6">
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
        /* Já tem acesso */
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-green-800 text-lg">Plano ativo</p>
                <p className="text-green-600 text-sm">
                  Você tem acesso completo ao RelatorioFlow.
                </p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {PLAN_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className="text-xs text-green-700">{f}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Não tem acesso */
        <>
          <Card className="border-2 border-blue-600 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Plano RelatorioFlow</CardTitle>
                <Badge className="bg-blue-600 text-white">ÚNICO PLANO</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-4 border-y border-border">
                <div className="flex items-end justify-center gap-1">
                  <span className="text-xl text-muted-foreground font-medium">R$</span>
                  <span className="text-5xl font-bold text-foreground">97</span>
                  <span className="text-muted-foreground mb-1">/mês</span>
                </div>
                <p className="text-muted-foreground text-sm mt-1">Cancele quando quiser</p>
              </div>

              <ul className="space-y-2.5">
                {PLAN_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Redirecionando...' : 'Assinar por R$ 97/mês'}
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Pagamento seguro
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  PagBank
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Ao assinar, você concorda com nossos termos de uso.
            Cancele a qualquer momento pelo painel.
          </p>
        </>
      )}
    </div>
  )
}
