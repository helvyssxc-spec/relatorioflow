import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Shield, CheckCircle2, Clock, AlertCircle, ChevronLeft, 
  Search, Filter, ExternalLink, MoreVertical, Loader2,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/integrations/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function AdminTickets() {
  const navigate = useNavigate()
  const { data: profile } = useProfile()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'todos' | 'aberto' | 'em_analise' | 'resolvido'>('todos')
  const [searchTerm, setSearchTerm] = useState('')

  // 1. Busca todos os tickets (Somente se Admin)
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-tickets-full', filter],
    queryFn: async () => {
      if (!profile?.is_admin) throw new Error('Acesso negado')
      let query = (supabase as any).from('tickets').select('*').order('created_at', { ascending: false })
      
      if (filter !== 'todos') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!profile?.is_admin
  })

  // 2. Mutação para atualizar status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await (supabase as any).from('tickets').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets-full'] })
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] })
      toast.success('Status do chamado atualizado!')
    }
  })

  // Bloqueio de segurança
  if (!isLoading && !profile?.is_admin) {
    navigate('/app/dashboard')
    return null
  }

  const filteredTickets = tickets.filter((t: any) => 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full"><ChevronLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-amber-600" /> Gestão de Chamados
            </h1>
            <p className="text-muted-foreground text-sm">Administração global de suporte do RelatorioFlow.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
            <Button variant={filter === 'todos' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('todos')} className="rounded-full">Todos</Button>
            <Button variant={filter === 'aberto' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('aberto')} className="rounded-full text-red-600 border-red-100">Abertos</Button>
            <Button variant={filter === 'em_analise' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('em_analise')} className="rounded-full text-amber-600 border-amber-100">Em Análise</Button>
            <Button variant={filter === 'resolvido' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('resolvido')} className="rounded-full text-emerald-600 border-emerald-100">Resolvidos</Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por e-mail ou assunto..." 
          className="pl-11 h-12 rounded-2xl bg-white/50 backdrop-blur-sm border-gray-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden rounded-3xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center space-y-4">
               <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
               <p className="font-bold text-muted-foreground">Carregando central de tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-20 text-center space-y-4">
               <AlertCircle className="w-16 h-16 text-muted-foreground/20 mx-auto" />
               <p className="text-xl font-bold text-muted-foreground">Nenhum chamado encontrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTickets.map((ticket: any) => (
                <div key={ticket.id} className="p-6 hover:bg-primary/[0.02] transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                       <Badge className={cn(
                         "text-[10px] font-black tracking-widest uppercase py-0.5",
                         ticket.priority === 'critica' && "bg-red-600 text-white shadow-lg shadow-red-200",
                         ticket.priority === 'alta' && "bg-orange-500 text-white",
                         ticket.priority === 'media' && "bg-blue-500 text-white",
                         ticket.priority === 'baixa' && "bg-gray-400 text-white"
                       )}>
                         {ticket.priority === 'critica' && <AlertTriangle className="w-3 h-3 mr-1" />}
                         {ticket.priority}
                       </Badge>
                       <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">ID: {ticket.id.slice(0,8)}</span>
                    </div>
                    <h3 className="font-black text-lg text-gray-900 group-hover:text-primary transition-colors">{ticket.subject}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">{ticket.description}</p>
                    <div className="flex flex-wrap items-center gap-4 pt-1">
                       <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                          <ExternalLink className="w-3 h-3" /> {ticket.email}
                       </div>
                       <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" /> {format(new Date(ticket.created_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                       <Badge variant="outline" className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold border-none",
                          ticket.status === 'aberto' ? 'bg-red-50 text-red-600' : 
                          ticket.status === 'em_analise' ? 'bg-amber-50 text-amber-600' : 
                          'bg-emerald-50 text-emerald-600'
                       )}>
                         {ticket.status === 'aberto' && 'Aberto'}
                         {ticket.status === 'em_analise' && 'Em Análise'}
                         {ticket.status === 'resolvido' && 'Resolvido'}
                       </Badge>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-indigo-50"><MoreVertical className="w-5 h-5 text-gray-400" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-indigo-50">
                        <DropdownMenuLabel className="text-[10px] uppercase font-black text-gray-400 p-2">Alterar Status</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: ticket.id, status: 'em_analise' })} className="rounded-xl flex items-center gap-2 cursor-pointer">
                          <Clock className="w-4 h-4 text-amber-500" /> Marcar como Em Análise
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: ticket.id, status: 'resolvido' })} className="rounded-xl flex items-center gap-2 cursor-pointer">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Marcar como Resolvido
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: ticket.id, status: 'aberto' })} className="rounded-xl flex items-center gap-2 text-red-600 cursor-pointer">
                          <AlertCircle className="w-4 h-4" /> Reabrir Chamado
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
