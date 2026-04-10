import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import MascotLogo from '@/components/MascotLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

const schema = z.object({
  full_name: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function Register() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name },
        emailRedirectTo: `${window.location.origin}/app/dashboard`,
      },
    })
    setLoading(false)
    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('E-mail já cadastrado. Faça login.')
      } else {
        toast.error('Erro ao criar conta. Tente novamente.')
      }
      return
    }
    toast.success('Conta criada! Verifique seu e-mail para confirmar.')
    navigate('/login')
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
            <CardTitle className="text-2xl">Criar conta grátis</CardTitle>
            <CardDescription>7 dias grátis, sem cartão de crédito</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-orange-50 rounded-xl p-4 mb-6">
              {['Diários de Obra ilimitados', 'Relatórios Técnicos ilimitados', 'PDFs premium com sua marca'].map((b) => (
                <div key={b} className="flex items-center gap-2 mb-1 last:mb-0">
                  <CheckCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <span className="text-sm text-orange-700">{b}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Nome completo</Label>
                <Input id="full_name" placeholder="Eng. João Silva" {...register('full_name')}
                  className={errors.full_name ? 'border-red-500' : ''} />
                {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail profissional</Label>
                <Input id="email" type="email" placeholder="seu@email.com" {...register('email')}
                  className={errors.email ? 'border-red-500' : ''} />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                    {...register('password')} className={errors.password ? 'border-red-500 pr-10' : 'pr-10'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input id="confirmPassword" type="password" placeholder="Repita a senha"
                  {...register('confirmPassword')} className={errors.confirmPassword ? 'border-red-500' : ''} />
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>

               <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 h-11 text-white font-bold" disabled={loading}>
                {loading && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                Criar conta grátis
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Já tem conta?{' '}
              <Link to="/login" className="text-orange-600 hover:underline font-bold">Fazer login</Link>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
              Ao criar sua conta você concorda com nossos termos de uso.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
