import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChevronLeft,
  FileDown,
  Loader2,
  ClipboardList,
  FileText,
  Wrench,
  Camera,
  AlertCircle,
  CheckCircle,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { openDiarioObraPDF } from '@/lib/pdf/generateDiarioObra'
import { openRelatorioTecnicoPDF } from '@/lib/pdf/generateRelatorioTecnico'
import { toast } from 'sonner'

export default function ReportView() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const tipo = searchParams.get('tipo') as 'diario' | 'tecnico' | null
  const { user } = useAuth()
  const { data: profile } = useProfile()

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', id, tipo],
    queryFn: async () => {
      if (!id || !user) return null
      const table = tipo === 'diario' ? 'daily_reports' : 'technical_reports'
      const { data, error } = await (supabase as any)
        .from(table)
        .select('*, projects(name, address, client_name, art_rrt)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()
      if (error) throw error
      return data as any
    },
    enabled: !!id && !!user && !!tipo,
  })

  const handleExportPDF = async () => {
    if (!report) return

    const project = (report as any).projects || {}
    const commonData = {
      projectName: project.name || 'Sem projeto',
      projectAddress: project.address,
      clientName: project.client_name,
      artRrt: project.art_rrt,
      companyName: profile?.company_name,
      companyLogo: profile?.logo_url,
      creaCau: profile?.crea_cau,
    }

    if (tipo === 'diario') {
      openDiarioObraPDF({
        ...commonData,
        responsavelNome: report.responsavel || profile?.full_name || '',
        reportDate: report.report_date,
        condicaoTempo: report.condicao_tempo || 'Ensolarado',
        temperatura: report.temperatura,
        equipe: report.equipe || [],
        atividades: report.atividades || [],
        equipamentos: report.equipamentos || [],
        ocorrencias: report.ocorrencias,
        fotos: report.fotos || [],
      })
      toast.success('PDF aberto em nova aba — use Ctrl+P para salvar')
    } else {
      openRelatorioTecnicoPDF({
        ...commonData,
        responsavelTecnico: report.responsavel_tecnico || profile?.full_name || '',
        numeroRelatorio: report.numero_relatorio || 'RT-001',
        reportDate: report.report_date,
        objetivo: report.objetivo || '',
        metodologia: report.metodologia || '',
        diagnostico: report.diagnostico || [],
        conclusao: report.conclusao || '',
        recomendacoes: report.recomendacoes || [],
        fotosGerais: report.fotos_gerais || [],
      })
      toast.success('PDF aberto em nova aba — use Ctrl+P para salvar')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Relatório não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/app/dashboard')}>
          Voltar ao início
        </Button>
      </div>
    )
  }

  const project = (report as any).projects || {}
  const isDiario = tipo === 'diario'

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/dashboard')}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {isDiario
              ? <ClipboardList className="w-5 h-5 text-blue-600" />
              : <FileText className="w-5 h-5 text-indigo-600" />
            }
            <h1 className="text-xl font-bold text-foreground">
              {isDiario
                ? `Diário de Obra — ${format(new Date(report.report_date + 'T12:00:00'), "dd/MM/yyyy")}`
                : `Relatório Técnico ${report.numero_relatorio || ''}`
              }
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{project.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={
              report.status === 'finalizado'
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-orange-100 text-orange-700 border-orange-200'
            }
          >
            {report.status === 'finalizado' ? (
              <><CheckCircle className="w-3 h-3 mr-1" />Finalizado</>
            ) : 'Rascunho'}
          </Badge>
          <Button
            className={isDiario ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}
            onClick={handleExportPDF}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Conteúdo do Diário de Obra */}
      {isDiario && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Informações gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Data</p>
                <p className="font-medium">
                  {format(new Date(report.report_date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Responsável</p>
                <p className="font-medium">{report.responsavel}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Clima</p>
                <p className="font-medium">{report.condicao_tempo} {report.temperatura && `· ${report.temperatura}`}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Efetivo</p>
                <p className="font-medium">
                  {(report.equipe || []).length} profissionais ·{' '}
                  {(report.equipe || []).reduce((acc: number, e: any) => acc + (e.horas || 0), 0)}h
                </p>
              </div>
            </CardContent>
          </Card>

          {(report.atividades || []).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Atividades ({(report.atividades || []).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(report.atividades || []).map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{a.descricao}</p>
                      <p className="text-muted-foreground text-xs">{a.disciplina}</p>
                    </div>
                    <Badge variant="secondary">{a.percentual_concluido}%</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {report.ocorrencias && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Ocorrências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{report.ocorrencias}</p>
              </CardContent>
            </Card>
          )}

          {(report.fotos || []).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Fotos ({(report.fotos || []).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {(report.fotos || []).map((f: any, i: number) => (
                    <div key={i}>
                      <img
                        src={f.url}
                        alt={f.caption || `Foto ${i + 1}`}
                        className="w-full aspect-square object-cover rounded-lg border"
                      />
                      {f.caption && (
                        <p className="text-xs text-muted-foreground text-center mt-1">{f.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Conteúdo do Relatório Técnico */}
      {!isDiario && (
        <>
          <Card className="border-indigo-200 bg-indigo-50">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-indigo-700 mb-1">✦ Conclusão / Resumo Executivo</p>
              <p className="text-sm text-indigo-800 leading-relaxed">{report.conclusao}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Número</p>
                <p className="font-medium">{report.numero_relatorio}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Data</p>
                <p className="font-medium">
                  {format(new Date(report.report_date + 'T12:00:00'), "dd/MM/yyyy")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Responsável técnico</p>
                <p className="font-medium">{report.responsavel_tecnico}</p>
              </div>
              {report.crea_cau && (
                <div>
                  <p className="text-muted-foreground text-xs">CREA / CAU</p>
                  <p className="font-medium">{report.crea_cau}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {(report.diagnostico || []).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Diagnóstico ({(report.diagnostico || []).length} seções)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(report.diagnostico || []).map((d: any, i: number) => (
                  <div key={i} className="border rounded-lg overflow-hidden">
                    <div className="bg-indigo-600 text-white px-4 py-2 text-sm font-medium">
                      {d.titulo}
                    </div>
                    <div className="p-4 text-sm">{d.conteudo}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(report.recomendacoes || []).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Recomendações ({(report.recomendacoes || []).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(report.recomendacoes || []).map((r: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <Badge
                      className={
                        r.prioridade === 'alta' ? 'bg-red-100 text-red-700 border-red-200 flex-shrink-0' :
                        r.prioridade === 'baixa' ? 'bg-green-100 text-green-700 border-green-200 flex-shrink-0' :
                        'bg-yellow-100 text-yellow-700 border-yellow-200 flex-shrink-0'
                      }
                    >
                      {r.prioridade}
                    </Badge>
                    <p>{r.texto}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(report.fotos_gerais || []).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Fotos ({(report.fotos_gerais || []).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {(report.fotos_gerais || []).map((f: any, i: number) => (
                    <div key={i}>
                      <img src={f.url} alt={f.caption || `Foto ${i + 1}`}
                        className="w-full aspect-square object-cover rounded-lg border" />
                      {f.caption && <p className="text-xs text-muted-foreground text-center mt-1">{f.caption}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
