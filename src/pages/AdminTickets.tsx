import React, { useState, useEffect } from 'react'
import { LifeBuoy, CheckCircle2, MessageSquare, Clock, Filter, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface Ticket {
  id: string
  subject: string
  description: string
  status: 'aberto' | 'em_andamento' | 'concluido'
  priority: 'baixa' | 'media' | 'alta' | 'critica'
  email: string
  created_at: string
}

export default function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        // Fallback para array vazio se a tabela 'tickets' não estiver criada ainda
        setTickets([])
        console.error('Tickets table missing or error:', error)
      } else {
        setTickets(data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await (supabase as any)
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', id)
      
      if (error) throw error
      toast.success('Status atualizado')
      fetchTickets()
      if (selectedTicket?.id === id) {
        setSelectedTicket({ ...selectedTicket, status: newStatus as any })
      }
    } catch (e: any) {
      toast.error('Erro ao atualizar: ' + e.message)
    }
  }

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return
    toast.success('Resposta enviada para o usuário (Simulado). O status foi alterado para concluído.')
    await handleUpdateStatus(selectedTicket.id, 'concluido')
    setReplyText('')
  }

  // Filtragem
  const filtered = filterStatus === 'todos' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus)

  if (loading) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 fade-in animate-in">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de Chamados</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">Resolva e atualize os tickets abertos pelos usuários via suporte.</p>
      </div>

      {/* Tabs de Filtro */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl w-max">
         <button onClick={() => setFilterStatus('todos')} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filterStatus === 'todos' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Todos</button>
         <button onClick={() => setFilterStatus('aberto')} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filterStatus === 'aberto' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>Abertos</button>
         <button onClick={() => setFilterStatus('em_andamento')} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filterStatus === 'em_andamento' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Em Progresso</button>
         <button onClick={() => setFilterStatus('concluido')} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filterStatus === 'concluido' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}>Concluídos</button>
      </div>

      {tickets.length === 0 ? (
         <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">Nenhum chamado aberto!</h3>
            <p className="text-sm text-slate-400">Quando os clientes preencherem o formulário no suporte, os dados cairão aqui.</p>
         </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
           {/* LISTA */}
           <div className="space-y-3">
             {filtered.map(t => (
                <Card 
                  key={t.id} 
                  onClick={() => setSelectedTicket(t)}
                  className={`cursor-pointer transition-all hover:-translate-y-0.5 ${selectedTicket?.id === t.id ? 'ring-2 ring-orange-500 border-transparent shadow-md' : 'hover:shadow-md'}`}
                >
                   <CardContent className="p-4 flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        {t.status === 'concluido' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <MessageSquare className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start mb-1">
                           <h4 className="font-bold text-slate-800 truncate pr-4">{t.subject}</h4>
                           <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                             {new Date(t.created_at).toLocaleDateString('pt-BR')}
                           </span>
                         </div>
                         <p className="text-xs text-slate-500 truncate mb-3">{t.description}</p>
                         <div className="flex gap-2">
                           <Badge variant="outline" className={t.status === 'aberto' ? 'bg-orange-50 text-orange-600 border-orange-200' : t.status === 'concluido' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}>
                             {t.status.toUpperCase()}
                           </Badge>
                           <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
                             {t.priority.toUpperCase()}
                           </Badge>
                         </div>
                      </div>
                   </CardContent>
                </Card>
             ))}
           </div>
           
           {/* PAINEL DIREITO (Ticket Selecionado) */}
           {selectedTicket ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sticky top-24 h-max">
                 <div className="flex justify-between items-start mb-6">
                    <h2 className="text-xl font-bold text-slate-800 leading-tight pr-4">{selectedTicket.subject}</h2>
                    <Badge variant="outline" className={selectedTicket.priority === 'critica' ? 'bg-red-50 text-red-600 border-red-200' : ''}>{selectedTicket.priority}</Badge>
                 </div>
                 
                 <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Contato</p>
                      <p className="text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg inline-block">{selectedTicket.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Relato Original</p>
                      <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl whitespace-pre-wrap">
                         {selectedTicket.description}
                      </div>
                    </div>
                 </div>

                 {selectedTicket.status !== 'concluido' ? (
                   <div className="space-y-3 pt-6 border-t border-slate-100">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Responder & Encerrar</p>
                      <Textarea 
                         placeholder="Escreva a resposta que será enviada ao usuário..." 
                         className="h-28 text-sm"
                         value={replyText}
                         onChange={(e) => setReplyText(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" onClick={handleSendReply}>
                           Enviar Resposta
                        </Button>
                        <Button variant="outline" onClick={() => handleUpdateStatus(selectedTicket.id, 'em_andamento')}>
                           Em Progresso
                        </Button>
                      </div>
                   </div>
                 ) : (
                   <div className="pt-6 border-t border-slate-100 text-center">
                     <AlertCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                     <p className="font-bold text-slate-800">Chamado Concluído</p>
                     <button onClick={() => handleUpdateStatus(selectedTicket.id, 'aberto')} className="text-xs text-orange-600 mt-2 font-bold uppercase hover:underline">Reabrir Chamado</button>
                   </div>
                 )}
              </div>
           ) : (
              <div className="bg-slate-50 rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center p-6 text-center h-[400px] sticky top-24">
                 <MessageSquare className="w-10 h-10 text-slate-300 mb-4" />
                 <p className="font-bold text-slate-600">Selecione um chamado</p>
                 <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Clique em um ticket na lista para ver os detalhes e responder.</p>
              </div>
           )}
        </div>
      )}
    </div>
  )
}

function Loader2(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
}
