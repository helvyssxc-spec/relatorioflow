import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ClipboardList, FileText, Clock, CheckCircle, ChevronRight, ChevronLeft,
  FolderOpen, FilePlus, Search, Wrench
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'

interface ReportItem {
  id: string
  type: 'diario' | 'tecnico' | 'manutencao'
  title: string
  project: string
  date: string
  status: 'draft' | 'finalizado'
}

function useAllReports() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['all-reports', user?.id],
    queryFn: async (): Promise<ReportItem[]> => {
      if (!user) return []
      const [dailyRes, techRes, maintRes] = await Promise.all([
        (supabase as any).from('daily_reports')
          .select('id, report_date, status, projects(name)')
          .eq('user_id', user.id)
          .order('report_date', { ascending: false }),
        (supabase as any).from('technical_reports')
          .select('id, report_date, status, numero_relatorio, projects(name)')
          .eq('user_id', user.id)
          .order('report_date', { ascending: false }),
        (supabase as any).from('maintenance_reports')
          .select('id, report_date, status, ativo_nome, report_type, projects(name)')
          .eq('user_id', user.id)
          .order('report_date', { ascending: false }),
      ])
      const daily: ReportItem[] = (dailyRes.data || []).map((r: any) => ({
        id: r.id, type: 'diario' as const,
        title: `Diário de Obra — ${format(new Date(r.report_date + 'T12:00:00'), 'dd/MM/yyyy')}`,
        project: r.projects?.name || 'Sem projeto',
        date: r.report_date,
        status: r.status,
      }))
      const tech: ReportItem[] = (techRes.data || []).map((r: any) => ({
        id: r.id, type: 'tecnico' as const,
        title: r.numero_relatorio?.startsWith('NBR') ? `Laudo de Reforma ${r.numero_relatorio}` : (r.numero_relatorio ? `Relatório ${r.numero_relatorio}` : 'Relatório Técnico'),
        project: r.projects?.name || 'Sem projeto',
        date: r.report_date,
        status: r.status,
      }))
      const maint: ReportItem[] = (maintRes.data || []).map((r: any) => ({
        id: r.id, type: 'manutencao' as const,
        title: `Manutenção ${r.report_type === 'preventiva' ? 'Prev.' : 'Corr.'} — ${r.ativo_nome}`,
        project: r.projects?.name || 'Sem projeto',
        date: r.report_date,
        status: r.status,
      }))
      return [...daily, ...tech, ...maint].sort((a, b) => b.date.localeCompare(a.date))
    },
    enabled: !!user,
  })
}

export default function Reports() {
  const navigate = useNavigate()
  const { data: reports = [], isLoading } = useAllReports()
  const [search, setSearch] = useState('')

  const filtered = reports.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.project.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full -ml-2">
               <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Histórico de Relatórios</h1>
          </div>
          <p className="text-muted-foreground font-medium pl-1">Todos os seus relatórios salvos</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/app/relatorio/novo')}>
          <FilePlus className="w-4 h-4 mr-2" />Novo
        </Button>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
           <Search className="w-5 h-5 text-muted-foreground/50 group-focus-within:text-orange-500 transition-colors" />
        </div>
        <Input
          placeholder="Buscar por título ou obra..."
          className="pl-12 h-14 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-2xl focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-base shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <p className="text-sm font-black text-muted-foreground tracking-widest uppercase">
            {filtered.length} {filtered.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
          </p>
        </div>
        <div className="grid gap-4 w-full">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-muted/50 glaze animate-pulse rounded-2xl w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center glass rounded-3xl border-slate-200/50 dark:border-white/5">
              <FolderOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold text-lg mb-4">
                {search ? 'Nenhum resultado encontrado' : 'Lista vazia! Nenhum relatório gerado.'}
              </p>
              {!search && (
                <Button className="bg-orange-500 hover:bg-orange-600 font-bold rounded-xl h-12 px-8" onClick={() => navigate('/app/relatorio/novo')}>
                  <FilePlus className="w-5 h-5 mr-2" />Criar primeiro relatório
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((report) => (
                <Link
                  key={report.id}
                  to={`/app/relatorio/${report.id}?tipo=${report.type}`}
                  className="flex items-center gap-5 p-5 glass border-slate-200/50 dark:border-white/5 rounded-2xl hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                    report.type === 'diario' ? 'bg-orange-500/10 text-orange-600 group-hover:bg-orange-500 text-white' : 
                    report.type === 'manutencao' ? 'bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white' :
                    'bg-slate-500/10 text-slate-600 group-hover:bg-slate-500 group-hover:text-white'
                  }`}>
                    {report.type === 'diario'
                      ? <ClipboardList className={report.type === 'diario' ? 'text-orange-500 group-hover:text-white transition-colors w-6 h-6' : 'w-6 h-6'} />
                      : report.type === 'manutencao'
                      ? <Wrench className={report.type === 'manutencao' ? 'text-indigo-500 group-hover:text-white transition-colors w-6 h-6' : 'w-6 h-6'} />
                      : <FileText className={report.type === 'tecnico' ? 'text-slate-500 group-hover:text-white transition-colors w-6 h-6' : 'w-6 h-6'} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-foreground text-lg tracking-tight truncate group-hover:text-orange-500 transition-colors">{report.title}</p>
                    <p className="text-muted-foreground text-sm mt-0.5 truncate flex items-center gap-2 font-medium">
                      <FolderOpen className="w-3.5 h-3.5" />{report.project}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-sm font-bold text-muted-foreground hidden sm:block bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50">
                      {format(new Date(report.date + 'T12:00:00'), "dd 'de' MMM", { locale: ptBR })}
                    </span>
                    <Badge
                      variant="secondary"
                      className={
                        report.status === 'finalizado'
                          ? 'bg-emerald-500/10 text-emerald-600 border-none px-3 py-1.5 rounded-lg shadow-sm font-bold'
                          : 'bg-amber-500/10 text-amber-600 border-none px-3 py-1.5 rounded-lg shadow-sm font-bold'
                      }
                    >
                      {report.status === 'finalizado'
                        ? <><CheckCircle className="w-4 h-4 mr-1.5" />Finalizado</>
                        : <><Clock className="w-4 h-4 mr-1.5" />Rascunho</>
                      }
                    </Badge>
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
