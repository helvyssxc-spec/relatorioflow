import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  FilePlus, ClipboardList, FileText, Clock, CheckCircle, ChevronRight, FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface ReportItem {
  id: string
  type: 'diario' | 'tecnico'
  title: string
  project: string
  date: string
  status: 'draft' | 'finalizado'
}

function useRecentReports() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['recent-reports', user?.id],
    queryFn: async (): Promise<ReportItem[]> => {
      if (!user) return []
      const [dailyRes, techRes] = await Promise.all([
        (supabase as any).from('daily_reports').select('id, report_date, status, projects(name)')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        (supabase as any).from('technical_reports').select('id, report_date, status, numero_relatorio, projects(name)')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ])
      const daily: ReportItem[] = (dailyRes.data || []).map((r: any) => ({
        id: r.id, type: 'diario',
        title: `Diário de Obra — ${format(new Date(r.report_date), 'dd/MM/yyyy')}`,
        project: r.projects?.name || 'Sem projeto', date: r.report_date, status: r.status,
      }))
      const tech: ReportItem[] = (techRes.data || []).map((r: any) => ({
        id: r.id, type: 'tecnico',
        title: r.numero_relatorio ? `RT-${r.numero_relatorio}` : 'Relatório Técnico',
        project: r.projects?.name || 'Sem projeto', date: r.report_date, status: r.status,
      }))
      return [...daily, ...tech].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
    },
    enabled: !!user,
  })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: reports = [], isLoading } = useRecentReports()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Engenheiro'

  return (
    <div className="space-y-10 max-w-5xl animate-fade-in arch-grid min-h-[calc(100vh-120px)] p-4 rounded-3xl">
      <div className="relative z-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Olá, <span className="text-primary">{firstName}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-lg">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        <Card className="glass border-primary/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Obras</p>
            <p className="text-xl font-bold leading-none">05</p>
          </div>
        </Card>
        <Card className="glass border-primary/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Diários</p>
            <p className="text-xl font-bold leading-none">12</p>
          </div>
        </Card>
        <Card className="glass border-primary/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Técnicos</p>
            <p className="text-xl font-bold leading-none">03</p>
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

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
        <button
          onClick={() => navigate('/app/relatorio/novo?tipo=diario')}
          className="group relative overflow-hidden flex items-center gap-5 p-7 bg-blue-600/90 hover:bg-blue-600 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 text-left border border-white/10 shadow-lg"
        >
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-inner">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="font-bold text-xl text-white">Novo Diário de Obra</p>
            <p className="text-blue-100/80 text-sm mt-0.5">Registrar o dia de hoje com clima e fotos</p>
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
            <p className="font-bold text-xl text-white">Novo Relatório Técnico</p>
            <p className="text-indigo-100/80 text-sm mt-0.5">Laudo, vistoria ou parecer especializado</p>
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
                      : 'bg-indigo-500/10 text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                  }`}>
                    {report.type === 'diario' ? <ClipboardList className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
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

