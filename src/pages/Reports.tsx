import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ClipboardList, FileText, Clock, CheckCircle, ChevronRight,
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
          <h1 className="text-2xl font-bold text-foreground">Histórico de Relatórios</h1>
          <p className="text-muted-foreground mt-1">Todos os seus relatórios salvos</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/app/relatorio/novo')}>
          <FilePlus className="w-4 h-4 mr-2" />Novo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título ou obra..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            {filtered.length} relatório{filtered.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">
                {search ? 'Nenhum resultado encontrado' : 'Nenhum relatório ainda'}
              </p>
              {!search && (
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/app/relatorio/novo')}>
                  <FilePlus className="w-4 h-4 mr-2" />Criar primeiro relatório
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((report) => (
                <Link
                  key={report.id}
                  to={`/app/relatorio/${report.id}?tipo=${report.type}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    report.type === 'diario' ? 'bg-blue-100 text-blue-600' : 
                    report.type === 'manutencao' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-indigo-100 text-indigo-600'
                  }`}>
                    {report.type === 'diario'
                      ? <ClipboardList className="w-5 h-5" />
                      : report.type === 'manutencao'
                      ? <Wrench className="w-5 h-5" />
                      : <FileText className="w-5 h-5" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{report.title}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{report.project}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {format(new Date(report.date + 'T12:00:00'), "dd 'de' MMM", { locale: ptBR })}
                    </span>
                    <Badge
                      variant="secondary"
                      className={
                        report.status === 'finalizado'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-orange-100 text-orange-700 border-orange-200'
                      }
                    >
                      {report.status === 'finalizado'
                        ? <><CheckCircle className="w-3 h-3 mr-1" />Finalizado</>
                        : <><Clock className="w-3 h-3 mr-1" />Rascunho</>
                      }
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
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
