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
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 glass border-slate-200/50 dark:border-white/5 rounded-3xl hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <HelpCircle className="w-6 h-6" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">Tutorial</p>
        </div>
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 glass border-slate-200/50 dark:border-white/5 rounded-3xl hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <MessageSquare className="w-6 h-6" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">WhatsApp</p>
        </div>
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 glass border-slate-200/50 dark:border-white/5 rounded-3xl hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">Planos</p>
        </div>
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
        <Card className="glass shadow-2xl border-slate-200/50 dark:border-white/5 rounded-[32px] overflow-hidden">
          <CardHeader className="bg-white/40 dark:bg-slate-900/40 border-b border-border/50 pb-6 pt-8 px-8">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                 <Send className="w-5 h-5" />
              </div>
              Como podemos ajudar?
            </CardTitle>
            <CardDescription className="text-base mt-2">Explique o que ocorreu ou envie sua sugestão de melhoria para nossa equipe técnica.</CardDescription>
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

              <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black tracking-widest uppercase text-sm shadow-xl shadow-orange-500/20 hover:shadow-2xl hover:shadow-orange-500/40 transition-all hover:-translate-y-0.5 active:translate-y-0">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Enviar Chamado
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Dica */}
      <div className="flex items-center gap-4 p-6 rounded-3xl glass border-slate-200/50 dark:border-white/5">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-sm flex-shrink-0">
             <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
             <span className="font-black text-foreground">Dica Rápida:</span> Antes de abrir um chamado, verifique se seu dispositivo possui conexão com a internet ativa para sincronizar os dados pendentes do RDO.
          </p>
      </div>
    </div>
  )
}
