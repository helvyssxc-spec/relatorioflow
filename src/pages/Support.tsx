import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  LifeBuoy, Send, MessageSquare, Clock, CheckCircle2, 
  ChevronLeft, Loader2, AlertCircle, HelpCircle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const ticketSchema = z.object({
  subject: z.string().min(5, 'O assunto deve ter ao menos 5 caracteres'),
  description: z.string().min(20, 'Descreva melhor o seu problema ou sugestão (mínimo 20 caracteres)'),
  priority: z.enum(['baixa', 'media', 'alta', 'critica']),
})

type TicketFormData = z.infer<typeof ticketSchema>

export default function Support() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { priority: 'media' }
  })

  const onSubmit = async (data: TicketFormData) => {
    setLoading(true)
    try {
      const { error } = await (supabase as any).from('tickets').insert({
        ...data,
        user_id: user?.id,
        email: user?.email || 'anônimo@exemplo.com',
        status: 'aberto'
      })
      if (error) throw error
      setSuccess(true)
      toast.success('Chamado aberto com sucesso!')
      reset()
    } catch (e: any) {
      toast.error('Erro ao abrir chamado: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full"><ChevronLeft className="w-5 h-5" /></Button>
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">Central de Ajuda</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-1.5 uppercase font-black tracking-widest text-indigo-600">
            <LifeBuoy className="w-3 h-3" /> Suporte & Sugestões
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex flex-col items-center justify-center p-6 text-center space-y-3 bg-indigo-50/20 border-indigo-100 shadow-none hover:bg-indigo-50/40 transition-colors">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600">
            <HelpCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-tighter">Tutorial</p>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6 text-center space-y-3 bg-emerald-50/20 border-emerald-100 shadow-none hover:bg-emerald-50/40 transition-colors">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <MessageSquare className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-tighter">WhatsApp</p>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6 text-center space-y-3 bg-amber-50/20 border-amber-100 shadow-none hover:bg-amber-50/40 transition-colors">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-tighter">Planos</p>
        </Card>
      </div>

      {success ? (
         <Card className="border-emerald-200 bg-emerald-50/30 text-center py-10">
            <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                   <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold">Chamado Enviado!</h2>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">Nossa equipe analisará sua solicitação e responderá por e-mail em até 24 horas.</p>
                <Button onClick={() => setSuccess(false)} variant="outline" className="rounded-full">Abrir outro chamado</Button>
            </CardContent>
         </Card>
      ) : (
        <Card className="glass shadow-2xl border-indigo-100/50 overflow-hidden rounded-3xl">
          <CardHeader className="bg-indigo-50/30 border-b border-indigo-100/50 pb-6">
            <CardTitle className="text-lg font-bold flex items-center gap-2 italic">
              <Send className="w-4 h-4 text-indigo-600" /> Como podemos ajudar?
            </CardTitle>
            <CardDescription>Explique o que ocorreu ou envie sua sugestão de melhoria.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-8 space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-[10px] font-black uppercase text-indigo-900 tracking-widest pl-1">Assunto</Label>
                <Input 
                  id="subject"
                  placeholder="Ex: Erro ao gerar PDF de manutenção"
                  {...register('subject')}
                  className={cn("h-12 rounded-2xl bg-white border-indigo-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 px-5", errors.subject && "border-red-400")}
                />
                {errors.subject && <p className="text-[10px] text-red-500 font-bold px-1">{errors.subject.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-[10px] font-black uppercase text-indigo-900 tracking-widest pl-1">Prioridade</Label>
                <select 
                  id="priority"
                  {...register('priority')}
                  className="w-full h-12 rounded-2xl bg-white border-indigo-100 border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 px-4 text-sm"
                >
                  <option value="baixa">Baixa (Dúvida comum)</option>
                  <option value="media">Média (Ajuste ou sugestão)</option>
                  <option value="alta">Alta (Problema no uso)</option>
                  <option value="critica">Crítica (App fora do ar ou perda de dados)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] font-black uppercase text-indigo-900 tracking-widest pl-1">Descrição Detalhada</Label>
                <Textarea 
                  id="description"
                  placeholder="Conte o que aconteceu com o máximo de detalhes possível..."
                  {...register('description')}
                   className={cn("min-h-[150px] rounded-3xl bg-white border-indigo-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 p-5", errors.description && "border-red-400")}
                />
                {errors.description && <p className="text-[10px] text-red-500 font-bold px-1">{errors.description.message}</p>}
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-200 transition-all active:scale-95">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                Enviar Chamado para Suporte
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Dica */}
      <div className="flex items-center gap-3 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
             <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-xs text-indigo-900 font-medium leading-relaxed">
             <span className="font-bold">Dica:</span> Antes de abrir um chamado, verifique se você possui conexão com a internet ativa na dashboard.
          </p>
      </div>
    </div>
  )
}
