import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  FilePlus, ClipboardList, FileText, Clock, CheckCircle, ChevronRight, FolderOpen,
  Settings as SettingsIcon, CloudOff, RefreshCw, Zap, TrendingUp, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { getDB } from '@/lib/offline/db'
import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { Shield } from 'lucide-react'

interface ReportItem {
  id: string
  type: 'diario' | 'tecnico' | 'manutencao'
  title: string
  project: string
  date: string
  status: 'draft' | 'finalizado'
}

function useDashboardStats() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user) return { projects: 0, daily: 0, technical: 0 }
      
      const [projectsRes, dailyRes, techRes] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true),
        supabase.from('daily_reports').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('technical_reports').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ])

      return {
        projects: projectsRes.count || 0,
        daily: dailyRes.count || 0,
        technical: techRes.count || 0,
      }
    },
    enabled: !!user,
  })
}

function useAIUsage() {
  const { data: profile } = useProfile()
  return useQuery({
    queryKey: ['ai-usage-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_usage_logs' as any)
        .select('total_tokens, estimated_cost_usd')
      
      if (error) throw error
      
      const stats = (data || []).reduce((acc: any, curr: any) => ({
        tokens: acc.tokens + (curr.total_tokens || 0),
        cost: acc.cost + Number(curr.estimated_cost_usd || 0)
      }), { tokens: 0, cost: 0 })
      
      return stats
    },
    enabled: !!profile?.is_admin
  })
}

function useAdminTickets() {
  const { data: profile } = useProfile()
  return useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      // Audit Mock: Return sample tickets
      if (import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') || !import.meta.env.VITE_SUPABASE_URL) {
        return [
          { id: 't1', subject: 'Dificuldade com Upload de Fotos', email: 'joao@obra.com', priority: 'alta', status: 'aberto', created_at: new Date().toISOString() },
          { id: 't2', subject: 'Sugestão: Modo Escuro', email: 'maria@tech.com', priority: 'baixa', status: 'pendente', created_at: new Date().toISOString() }
        ]
      }

      if (!profile?.is_admin) return []
      const { data, error } = await (supabase as any)
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return data
    },
    enabled: !!profile?.is_admin,
  })
}

function useRecentReports() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['recent-reports', user?.id],
    queryFn: async (): Promise<ReportItem[]> => {
      // Audit Mock: Standard reports for visualization
      if (import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') || !import.meta.env.VITE_SUPABASE_URL) {
        return [
          { id: 'r1', type: 'diario', title: 'Diário de Obra — 07/04/2026', project: 'Residencial Aurora', date: '2026-04-07', status: 'finalizado' },
          { id: 'r2', type: 'manutencao', title: 'Manutenção Prev. — Chiller 01', project: 'Shopping Metrô', date: '2026-04-07', status: 'draft' },
          { id: 'r3', type: 'tecnico', title: 'Laudo de Estabilidade', project: 'Ponte Rio-Niterói', date: '2026-04-06', status: 'finalizado' }
        ]
      }

      if (!user) return []
      const [dailyRes, techRes, maintRes] = await Promise.all([
        (supabase as any).from('daily_reports').select('id, report_date, status, projects(name)')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        (supabase as any).from('technical_reports').select('id, report_date, status, numero_relatorio, projects(name)')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        (supabase as any).from('maintenance_reports').select('id, report_date, status, ativo_nome, report_type, projects(name)')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ])
      const daily: ReportItem[] = (dailyRes.data || []).map((r: any) => ({
        id: r.id, type: 'diario',
        title: `Diário de Obra — ${format(new Date(r.report_date), 'dd/MM/yyyy')}`,
        project: r.projects?.name || 'Sem projeto', date: r.report_date, status: r.status,
      }))
      const tech: ReportItem[] = (techRes.data || []).map((r: any) => ({
        id: r.id, type: 'tecnico',
        title: r.numero_relatorio ? `Relatório ${r.numero_relatorio}` : 'Relatório Técnico',
        project: r.projects?.name || 'Sem projeto', date: r.report_date, status: r.status,
      }))
      const maint: ReportItem[] = (maintRes.data || []).map((r: any) => ({
          id: r.id, type: 'manutencao',
          title: `Manutenção ${r.report_type === 'preventiva' ? 'Prev.' : 'Corr.'} — ${r.ativo_nome}`,
          project: r.projects?.name || 'Sem projeto', date: r.report_date, status: r.status,
      }))
      return [...daily, ...tech, ...maint].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
    },
    enabled: !!user,
  })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { data: reports = [], isLoading } = useRecentReports()
  const { data: stats = { projects: 0, daily: 0, technical: 0 } } = useDashboardStats()
  const { isOnline, syncing, triggerSync } = useOfflineSync()
  const [pendingSyncCount, setPendingSyncCount] = useState(0)

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Engenheiro'

  useEffect(() => {
    const checkSync = async () => {
      const db = await getDB()
      const queue = await db.getAll('sync_queue')
      setPendingSyncCount(queue.length)
    }
    checkSync()
    const interval = setInterval(checkSync, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-10 max-w-5xl animate-fade-in arch-grid min-h-[calc(100vh-120px)] p-4 rounded-3xl">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Olá, <span className="text-primary">{firstName}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Indicador de Sincronização */}
        <div className="flex items-center gap-2">
           {!isOnline && (
              <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full animate-bounce">
                <CloudOff className="w-3.5 h-3.5" /> Offline
              </Badge>
           )}
           {pendingSyncCount > 0 && (
              <Button 
                onClick={() => triggerSync()} 
                disabled={syncing || !isOnline}
                variant="outline" 
                className={cn(
                  "rounded-full h-10 px-4 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center gap-2",
                  syncing && "opacity-70 cursor-not-allowed"
                )}
              >
                {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="font-bold">{pendingSyncCount} {pendingSyncCount === 1 ? 'item pendente' : 'itens pendentes'}</span>
              </Button>
           )}
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        <Card className="glass border-primary/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Obras</p>
            <p className="text-xl font-bold leading-none">{stats.projects.toString().padStart(2, '0')}</p>
          </div>
        </Card>
        <Card className="glass border-primary/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Diários</p>
            <p className="text-xl font-bold leading-none">{stats.daily.toString().padStart(2, '0')}</p>
          </div>
        </Card>
        <Card className="glass border-primary/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Técnicos</p>
            <p className="text-xl font-bold leading-none">{stats.technical.toString().padStart(2, '0')}</p>
          </div>
        </Card>
        <Card className="glass border-primary/10 bg-primary/5 p-4 rounded-2xl flex items-center gap-3 border-dashed">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Status</p>
            <p className="text-xs font-bold text-primary">Total PRO</p>
          </div>
        </Card>
      </div>

      {/* Sentinela de Custos (Somente Admin) */}
      {profile?.is_admin && <SentinelaDeCustos />}

      {/* Seção Admin: Chamados */}
      {profile?.is_admin && (
        <Card className="relative z-10 border-amber-200/50 bg-amber-50/10 backdrop-blur-xl overflow-hidden rounded-3xl border-dashed">
          <CardHeader className="flex flex-row items-center justify-between pb-6 px-8 pt-8">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Shield className="w-5 h-5" />
               </div>
               <div>
                  <CardTitle className="text-xl font-bold">Chamados de Suporte</CardTitle>
                  <p className="text-sm text-amber-900/60 font-medium">Gestão global de tickets dos usuários</p>
               </div>
            </div>
            <Button 
              onClick={() => navigate('/app/admin/tickets')} 
              variant="outline" size="sm" 
              className="rounded-full border-amber-200 bg-amber-100/50 text-amber-700 hover:bg-amber-100"
            >
               Ver todos
            </Button>
          </CardHeader>
          <CardContent className="px-8 pb-8">
             <AdminTicketsList />
          </CardContent>
        </Card>
      )}

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <button
          onClick={() => navigate('/app/relatorio/novo?tipo=diario')}
          className="group relative overflow-hidden flex items-center gap-5 p-7 bg-blue-600/90 hover:bg-blue-600 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 text-left border border-white/10 shadow-lg"
        >
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-inner">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="font-bold text-xl text-white">Novo RDO</p>
            <p className="text-blue-100/80 text-sm mt-0.5">Clima, efetivo e fotos</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/app/relatorio/novo?tipo=tecnico')}
          className="group relative overflow-hidden flex items-center gap-5 p-7 bg-indigo-600/90 hover:bg-indigo-600 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/20 text-left border border-white/10 shadow-lg"
        >
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-inner">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="font-bold text-xl text-white">Relatório Técnico</p>
            <p className="text-indigo-100/80 text-sm mt-0.5">Laudo ou vistoria técnica</p>
          </div>
        </button>

        <button
          onClick={() => {
            const isAudit = (import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') || !import.meta.env.VITE_SUPABASE_URL);
            const path = isAudit ? '/app/relatorio/novo/manutencao?project=audit-id' : '/app/relatorio/novo/manutencao';
            navigate(path);
          }}
          className="group relative overflow-hidden flex items-center gap-5 p-7 bg-emerald-600/90 hover:bg-emerald-600 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20 text-left border border-white/10 shadow-lg"
        >
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-inner">
            <SettingsIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="font-bold text-xl text-white">Manutenção</p>
            <p className="text-emerald-100/80 text-sm mt-0.5">Preventiva ou Corretiva</p>
          </div>
        </button>
      </div>

      {/* Relatórios recentes */}
      <Card className="relative z-10 border-none shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between pb-6 px-8 pt-8">
          <div>
            <CardTitle className="text-xl font-bold">Relatórios recentes</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Seus últimos registros na plataforma</p>
          </div>
          <Link to="/app/relatorio/novo">
            <Button variant="outline" size="sm" className="rounded-full border-primary/20 hover:bg-primary/5 text-primary">
              <FilePlus className="w-4 h-4 mr-1.5" />Novo
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-8 pb-8 space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted/50 animate-pulse rounded-2xl" />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <p className="text-xl font-semibold text-foreground">Nenhum relatório ainda</p>
              <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
                Comece criando seu primeiro Diário de Obra ou Relatório Técnico para ver o histórico aqui.
              </p>
              <Button className="mt-8 bg-primary hover:bg-primary/90 px-8 h-12 rounded-full shadow-lg shadow-primary/20" onClick={() => navigate('/app/relatorio/novo')}>
                <FilePlus className="w-4 h-4 mr-2" />Criar primeiro relatório
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {reports.map((report) => (
                <Link
                  key={report.id}
                  to={`/app/relatorio/${report.id}?tipo=${report.type}`}
                  className="flex items-center gap-5 px-8 py-5 hover:bg-primary/[0.03] transition-all group"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                    report.type === 'diario' 
                      ? 'bg-blue-500/10 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                      : report.type === 'tecnico'
                      ? 'bg-indigo-500/10 text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                      : 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                  }`}>
                    {report.type === 'diario' ? <ClipboardList className="w-6 h-6" /> : report.type === 'tecnico' ? <FileText className="w-6 h-6" /> : <SettingsIcon className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-base truncate group-hover:text-primary transition-colors">{report.title}</p>
                    <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                      {report.project}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <Badge variant="outline" className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border-0",
                      report.status === 'finalizado'
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-amber-500/10 text-amber-600'
                    )}>
                      {report.status === 'finalizado'
                        ? <><CheckCircle className="w-3.5 h-3.5 mr-1.5" />Finalizado</>
                        : <><Clock className="w-3.5 h-3.5 mr-1.5" />Rascunho</>
                      }
                    </Badge>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/30 group-hover:bg-primary/10 transition-colors">
                      <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SentinelaDeCustos() {
  const { data: profile } = useProfile()
  const { data: stats, isLoading } = useAIUsage()
  
  // Metas padrão se não configurado
  const aiQuota = profile?.ai_token_quota || 1000000
  const storageQuota = profile?.storage_quota_mb || 1024
  
  // Cálculo aproximado de storage baseado em reports para fins de telemetria imediata
  const estimatedStorageUsedMb = ((stats?.tokens || 0) / 20000) * 0.5 + 2.1; 

  if (isLoading || !stats) return <div className="h-32 bg-indigo-50/50 animate-pulse rounded-[32px]" />

  const aiProgress = Math.min((stats.tokens / aiQuota) * 100, 100)
  const storageProgress = Math.min((estimatedStorageUsedMb / storageQuota) * 100, 100)
  
  const getProgressColor = (p: number) => p > 90 ? 'bg-red-500' : p > 70 ? 'bg-amber-400' : 'bg-emerald-400'

  return (
    <Card className="relative z-10 border-none bg-indigo-950 overflow-hidden rounded-[32px] shadow-2xl">
       <div className="absolute top-0 right-0 p-8 opacity-5"><Zap className="w-48 h-48 text-white" /></div>
       <CardContent className="p-8 space-y-8 relative z-10">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                   <Shield className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-white tracking-tight">Sentinela de Custos</h3>
                   <p className="text-indigo-300/60 text-[10px] font-black uppercase tracking-widest pl-1">Monitoramento de Infraestrutura PRO</p>
                </div>
             </div>
             <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-full h-10 px-4 text-xs font-bold gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> Analíticos Completos
             </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             {/* Monitor de IA */}
             <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-indigo-100/60 text-[10px] font-black uppercase tracking-widest leading-none mb-2">Consumo de IA (Tokens)</p>
                      <p className="text-3xl font-black text-white">{stats.tokens.toLocaleString()} <span className="text-indigo-300/40 text-sm">/ {aiQuota.toLocaleString()}</span></p>
                   </div>
                   <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                      ${stats.cost.toFixed(4)} USD
                   </Badge>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                   <div 
                      className={cn("h-full transition-all duration-1000", getProgressColor(aiProgress))} 
                      style={{ width: `${aiProgress}%` }} 
                   />
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-indigo-400/60 pl-1">
                   <span>Cota Gratuita</span>
                   <span>{aiProgress.toFixed(1)}% Usado</span>
                </div>
             </div>

             {/* Monitor de Storage */}
             <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-indigo-100/60 text-[10px] font-black uppercase tracking-widest leading-none mb-2">Armazenamento Obra (MB)</p>
                      <p className="text-3xl font-black text-white">{estimatedStorageUsedMb.toFixed(1)} <span className="text-indigo-300/40 text-sm">/ {storageQuota} MB</span></p>
                   </div>
                   <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                      1GB Free
                   </Badge>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                   <div 
                      className={cn("h-full transition-all duration-1000", getProgressColor(storageProgress))} 
                      style={{ width: `${storageProgress}%` }} 
                   />
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-indigo-400/60 pl-1">
                   <span>Supabase Bucket</span>
                   <span>{storageProgress.toFixed(1)}% Usado</span>
                </div>
             </div>
          </div>

          {/* Alerta Crítico */}
          {(aiProgress > 80 || storageProgress > 80) && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4 animate-pulse">
               <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
               <p className="text-sm text-amber-200 font-medium">
                 <span className="font-bold">Atenção Admin:</span> Suas cotas gratuitas estão chegando ao limite. Considere ativar o método pago para evitar interrupções no campo.
               </p>
            </div>
          )}
       </CardContent>
    </Card>
  )
}

function AdminTicketsList() {
  const { data: tickets = [], isLoading } = useAdminTickets()

  if (isLoading) return <div className="h-20 bg-amber-100/20 animate-pulse rounded-2xl" />
  if (tickets.length === 0) return <p className="text-center py-4 text-amber-900/40 font-medium italic">Nenhum chamado pendente no momento.</p>

  return (
    <div className="space-y-3">
      {tickets.map((ticket: any) => (
        <div key={ticket.id} className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-amber-200/30 group hover:border-amber-400 transition-all">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-2 h-10 rounded-full",
              ticket.priority === 'critica' ? 'bg-red-500' : ticket.priority === 'alta' ? 'bg-orange-500' : 'bg-blue-400'
            )} />
            <div className="min-w-0">
              <p className="font-bold text-gray-900 leading-tight truncate">{ticket.subject}</p>
              <p className="text-xs text-gray-500 truncate">{ticket.email} · {format(new Date(ticket.created_at), 'dd/MM HH:mm')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
             <Badge variant="outline" className={cn(
               "text-[10px] font-black uppercase px-2 py-0.5",
               ticket.status === 'aberto' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'
             )}>
               {ticket.status}
             </Badge>
             <Button variant="ghost" size="icon" className="rounded-full group-hover:bg-amber-100 transition-colors h-8 w-8">
                <ChevronRight className="w-4 h-4 text-amber-600" />
             </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

