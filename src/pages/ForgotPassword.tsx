import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft } from 'lucide-react'
import MascotLogo from '@/components/MascotLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    setLoading(false)
    if (error) {
      toast.error('Erro ao enviar e-mail. Verifique o endereço e tente novamente.')
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <MascotLogo className="w-10 h-10 group-hover:-translate-y-1 transition-transform" />
            <span className="font-black text-gray-900 text-xl tracking-tighter">RelatorioFlow<span className="text-orange-500">.</span></span>
          </Link>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Esqueceu a senha?</CardTitle>
            <CardDescription>
              {sent
                ? 'Verifique seu e-mail para redefinir a senha'
                : 'Digite seu e-mail para receber o link de redefinição'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-gray-600">
                  Enviamos um link para redefinição de senha. Verifique sua caixa de entrada e spam.
                </p>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Voltar ao login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...register('email')}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>

                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 h-11 text-white font-bold" disabled={loading}>
                  {loading && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                  Enviar link de redefinição
                </Button>

                <div className="text-center">
                  <Link to="/login" className="text-sm text-orange-600 hover:underline inline-flex items-center gap-1 font-bold">
                    <ArrowLeft className="w-3 h-3" />
                    Voltar ao login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
