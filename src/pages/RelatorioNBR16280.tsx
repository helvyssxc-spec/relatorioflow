import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  FileText, Plus, Trash2, Save, FileDown, Loader2, Mic, Square, Sparkles,
  ChevronLeft, Target, Microscope, CheckCircle, Camera, 
  AlertTriangle, CheckCircle2, ClipboardList, Info, 
  Search, ListChecks, Award, HardHat, Building
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { saveDraft, loadDraft, deleteDraft } from '@/lib/offline-db'
import { openRelatorioTecnicoPDF } from '@/lib/pdf/generateRelatorioTecnico'
import { toast } from 'sonner'
import { AITextAssistant } from '@/components/ui/AITextAssistant'
import { compressImage } from '@/lib/image-utils'
import { SyncStatus } from '@/components/ui/SyncStatus'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'

const schema = z.object({
  numero_relatorio: z.string().min(1, 'Número do relatório obrigatório'),
  report_date: z.string().min(1, 'Data obrigatória'),
  responsavel_tecnico: z.string().min(2, 'Responsável técnico obrigatório'),
  crea_cau: z.string().optional(),
  art_rrt: z.string().optional(),
  unidade: z.string().min(1, 'Unidade obrigatória'),
  bloco: z.string().optional(),
  pavimento: z.string().optional(),
  objetivo: z.string().min(10, 'Objetivo deve ter pelo menos 10 caracteres'),
  analise_impacto: z.string().min(10, 'A análise de impacto é obrigatória'),
  plano_reforma: z.string().min(10, 'O plano de reforma é obrigatório'),
  diagnostico: z.array(z.object({
    titulo: z.string().min(1, 'Título obrigatório'),
    conteudo: z.string().min(1, 'Conteúdo obrigatório'),
  })),
  conclusao: z.string().min(10, 'Conclusão deve ter pelo menos 10 caracteres'),
  recomendacoes: z.array(z.object({
    texto: z.string().min(1, 'Recomendação obrigatória'),
    prioridade: z.enum(['alta', 'media', 'baixa']),
  })),
})
type FormData = z.infer<typeof schema>

interface FotoItem { id: string; url: string; caption: string; uploading?: boolean }
interface FotoSecao { secaoId: string; fotos: FotoItem[] }

const DRAFT_KEY = 'relatorio-nbr16280-draft'

export default function RelatorioNBR16280() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const projectId = searchParams.get('project')

  const [saving, setSaving] = useState(false)
  const [fotosSections, setFotosSections] = useState<FotoSecao[]>([])
  const [fotosGerais, setFotosGerais] = useState<FotoItem[]>([])
  const [projectName, setProjectName] = useState('')
  const [projectData, setProjectData] = useState<any>(null)
  const [syncStatus, setSyncStatus] = useState<import('@/components/ui/SyncStatus').SyncState>('synced')
  const [lastSynced, setLastSynced] = useState<string>('')
  const [currentStep, setCurrentStep] = useState(0)

  // AI Assistant States
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = true; rec.interimResults = true; rec.lang = 'pt-BR'
      rec.onresult = (e: any) => {
        let text = ''
        for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript
        setTranscript(text)
      }
      setRecognition(rec)
    }
  }, [])

  const toggleRecording = () => {
    if (isRecording) recognition?.stop()
    else { setTranscript(''); recognition?.start() }
    setIsRecording(!isRecording)
  }

  const handleGlobalAI = async () => {
    if (!transcript.trim()) { toast.error('Grave um áudio primeiro!'); return }
    setIsGenerating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ 
          notes: transcript, 
          reportType: 'nbr16280',
          action: 'generate'
        })
      })
      
      const text = await res.text()
      const cleanText = text.split('\n__RF_USAGE__')[0]
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
         const parsed = JSON.parse(jsonMatch[0])
         if (parsed.objetivo) setValue('objetivo', parsed.objetivo)
         if (parsed.analise_impacto) setValue('analise_impacto', parsed.analise_impacto)
         if (parsed.plano_reforma) setValue('plano_reforma', parsed.plano_reforma)
         if (parsed.conclusao) setValue('conclusao', parsed.conclusao)
         if (parsed.diagnostico) reset({ ...watch(), diagnostico: parsed.diagnostico })
         if (parsed.recomendacoes) reset({ ...watch(), recomendacoes: parsed.recomendacoes })
         
         toast.success('Laudo de Reforma preenchido pela IA conforme NBR 16280!')
      }
    } catch (e: any) {
      toast.error('Erro na IA: ' + e.message)
    } finally { setIsGenerating(false) }
  }

  const steps = [
    { title: 'Reforma', description: 'Dados da Unidade' },
    { title: 'Análise NBR', description: 'Impacto e Plano' },
    { title: 'Evidências', description: 'Vistoria e Fotos' },
    { title: 'Aprovação', description: 'Parecer Final' },
  ]

  const { register, control, handleSubmit, watch, setValue, reset, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      numero_relatorio: `NBR-${format(new Date(), 'yyyy')}-${Math.floor(Math.random() * 9000) + 1000}`,
      report_date: format(new Date(), 'yyyy-MM-dd'),
      responsavel_tecnico: profile?.full_name || '',
      crea_cau: profile?.crea_cau || '',
      unidade: '',
      bloco: '',
      pavimento: '',
      objetivo: 'Inspeção técnica para conformidade com a norma ABNT NBR 16280:2015 em reforma de unidade autônoma.',
      analise_impacto: '',
      plano_reforma: '',
      diagnostico: [{ titulo: 'Estado Atual', conteudo: '' }],
      conclusao: '',
      recomendacoes: [{ texto: '', prioridade: 'media' }],
    },
  })

  const { fields: diagnosticoFields, append: appendDiagnostico, remove: removeDiagnostico } = useFieldArray({ control, name: 'diagnostico' })
  const { fields: recomendacoesFields, append: appendRecomendacoes, remove: removeRecomendacoes } = useFieldArray({ control, name: 'recomendacoes' })

  useEffect(() => {
    if (!projectId || !user) return
    (supabase as any).from('projects').select('*').eq('id', projectId).single()
      .then(({ data }: any) => { if (data) { setProjectName(data.name); setProjectData(data) } })
  }, [projectId, user])

  const formValues = watch()
  const debouncedFormValues = useDebounce(formValues, 3000)

  useEffect(() => {
    const syncToCloud = async () => {
      if (!projectId || !user || !debouncedFormValues.numero_relatorio) return
      setSyncStatus('syncing')
      try {
        const { error } = await (supabase as any).from('technical_reports').upsert({
          user_id: user.id, project_id: projectId,
          report_date: debouncedFormValues.report_date,
          numero_relatorio: debouncedFormValues.numero_relatorio,
          responsavel_tecnico: debouncedFormValues.responsavel_tecnico,
          crea_cau: debouncedFormValues.crea_cau,
          objetivo: debouncedFormValues.objetivo,
          diagnostico: [
            { titulo: 'Identificação da Unidade', conteudo: `Unidade: ${debouncedFormValues.unidade} | Bloco: ${debouncedFormValues.bloco} | Pavimento: ${debouncedFormValues.pavimento}` },
            { titulo: 'Análise de Impacto NBR 16280', conteudo: debouncedFormValues.analise_impacto },
            { titulo: 'Plano de Reforma', conteudo: debouncedFormValues.plano_reforma },
            ...debouncedFormValues.diagnostico
          ],
          conclusao: debouncedFormValues.conclusao,
          recomendacoes: debouncedFormValues.recomendacoes,
          status: 'draft',
        }, { onConflict: 'project_id,numero_relatorio' })
        if (error) throw error
        setSyncStatus('synced'); setLastSynced(format(new Date(), 'HH:mm'))
      } catch (err) { setSyncStatus('offline') }
    }
    if (debouncedFormValues.analise_impacto) syncToCloud()
  }, [debouncedFormValues, projectId, user])

  const uploadFoto = async (file: File, target: string) => {
    if (!user) return
    const tempId = crypto.randomUUID()
    const newFoto: FotoItem = { id: tempId, url: URL.createObjectURL(file), caption: '', uploading: true }
    setFotosSections(prev => {
      const s = prev.find(x => x.secaoId === target)
      return s ? prev.map(x => x.secaoId === target ? { ...x, fotos: [...x.fotos, newFoto] } : x) : [...prev, { secaoId: target, fotos: [newFoto] }]
    })
    try {
      const compressed = await compressImage(file, 1920, 0.8)
      const path = `${user.id}/nbr16280/${tempId}.${file.type.split('/').pop()}`
      await supabase.storage.from('reports').upload(path, compressed)
      const { data: urlData } = supabase.storage.from('reports').getPublicUrl(path)
      setFotosSections(prev => prev.map(s => s.secaoId === target ? { ...s, fotos: s.fotos.map(f => f.id === tempId ? { ...f, url: urlData.publicUrl, uploading: false } : f) } : s))
    } catch (err) { toast.error('Erro no upload') }
  }

  const onSave = async (data: FormData, status: 'draft' | 'finalizado' = 'draft') => {
    setSaving(true)
    const finalDiagnostico = [
      { titulo: 'Análise de Impacto Normativo', conteudo: data.analise_impacto, fotos: fotosSections.find(s => s.secaoId === 'impacto')?.fotos || [] },
      { titulo: 'Plano de Reforma Detalhado', conteudo: data.plano_reforma, fotos: fotosSections.find(s => s.secaoId === 'plano')?.fotos || [] },
      ...data.diagnostico.map((d, i) => ({ ...d, fotos: fotosSections.find(s => s.secaoId === `sec-${i}`)?.fotos || [] }))
    ]
    
    // Simulação de salvamento e geração de PDF
    openRelatorioTecnicoPDF({
      projectName: `NBR 16280 — ${data.unidade} (${projectName})`,
      projectAddress: projectData?.address,
      clientName: projectData?.client_name,
      artRrt: data.art_rrt || projectData?.art_rrt,
      companyName: profile?.company_name,
      companyLogo: profile?.logo_url,
      numeroRelatorio: data.numero_relatorio,
      reportDate: data.report_date,
      responsavelTecnico: data.responsavel_tecnico,
      creaCau: data.crea_cau,
      objetivo: data.objetivo, metodologia: 'Vistoria conforme diretrizes da NBR 16280.',
      diagnostico: finalDiagnostico as any,
      conclusao: data.conclusao,
      recomendacoes: data.recomendacoes as any,
      fotosGerais: fotosSections.find(s => s.secaoId === 'geral')?.fotos || [],
    })
    setSaving(false); toast.success('Laudo NBR 16280 gerado com sucesso!'); navigate('/app/dashboard')
  }

  return (
    <div className="max-w-3xl space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full"><ChevronLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-indigo-900">Laudo de Reforma</h1>
            <Badge variant="outline" className="text-[9px] bg-indigo-50 text-indigo-600 border-indigo-200">ABNT NBR 16280:2015</Badge>
          </div>
        </div>
        <SyncStatus status={syncStatus} lastSynced={lastSynced} />
      </div>

      <Card className="border-indigo-200 bg-indigo-50/40">
        <CardContent className="p-4 flex items-center gap-4">
          <Button onClick={toggleRecording} variant={isRecording ? "destructive" : "outline"} className={cn("h-12 w-12 rounded-full", isRecording && "animate-pulse")}>
            {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5 text-indigo-600" />}
          </Button>
          <div className="flex-1"><p className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">Assistente NBR 16280</p><p className="text-xs text-muted-foreground line-clamp-1">{transcript || 'Fale sobre a reforma e os impactos estruturais...'}</p></div>
          {transcript && <Button onClick={handleGlobalAI} disabled={isGenerating} size="sm" className="bg-indigo-600"><Sparkles className="w-4 h-4 mr-2" />Preencher</Button>}
        </CardContent>
      </Card>

      <div className="flex gap-2 h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
        {steps.map((_, i) => <div key={i} className={cn("h-full flex-1 transition-all duration-500", i <= currentStep ? "bg-indigo-600" : "bg-transparent")} />)}
      </div>

      <form className="space-y-6">
        {currentStep === 0 && (
          <Card className="glass border-indigo-100">
            <CardHeader><CardTitle className="text-base font-bold flex items-center gap-2"><Building className="w-4 h-4" />Unidade Autônoma</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">Apartamento/Nº *</Label><Input placeholder="Ex: 101" {...register('unidade')} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">Bloco/Torre</Label><Input placeholder="Ex: Bloco A" {...register('bloco')} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">Pavimento</Label><Input placeholder="Ex: 10º Andar" {...register('pavimento')} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">Nº do Laudo</Label><Input {...register('numero_relatorio')} /></div>
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <Card className="glass border-indigo-100">
              <CardHeader className="flex flex-row items-center justify-between pb-3"><CardTitle className="text-base font-bold flex items-center gap-2"><HardHat className="w-4 h-4" />Análise de Impacto</CardTitle><AITextAssistant onApply={t => setValue('analise_impacto', t)} context="Analise os impactos estruturais da reforma." /></CardHeader>
              <CardContent><Textarea placeholder="Descreva os impactos em sistemas estruturais, elétricos e hidráulicos..." {...register('analise_impacto')} className="min-h-32" /></CardContent>
            </Card>
            <Card className="glass border-indigo-100">
              <CardHeader className="flex flex-row items-center justify-between pb-3"><CardTitle className="text-base font-bold flex items-center gap-2"><ClipboardList className="w-4 h-4" />Plano de Reforma</CardTitle><AITextAssistant onApply={t => setValue('plano_reforma', t)} context="Refine o cronograma e plano de reforma." /></CardHeader>
              <CardContent><Textarea placeholder="Cronograma, entrada de materiais e gestão de resíduos..." {...register('plano_reforma')} className="min-h-32" /></CardContent>
            </Card>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
             <Card className="glass border-indigo-100">
              <CardHeader><CardTitle className="text-base font-bold flex items-center gap-2"><Camera className="w-4 h-4" />Vistoria Cautelar</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                   {(fotosSections.find(s => s.secaoId === 'geral')?.fotos || []).map(f => (
                     <div key={f.id} className="relative aspect-square rounded-lg border overflow-hidden"><img src={f.url} className="w-full h-full object-cover" /></div>
                   ))}
                   <label className="aspect-square rounded-lg border-2 border-dashed border-indigo-100 flex items-center justify-center cursor-pointer"><Plus className="w-4 h-4 text-indigo-300" /><input type="file" multiple className="hidden" onChange={(e) => Array.from(e.target.files || []).forEach(f => uploadFoto(f, 'geral'))} /></label>
                </div>
              </CardContent>
             </Card>
             {diagnosticoFields.map((field, i) => (
                <Card key={field.id} className="glass border-indigo-100">
                  <CardHeader className="py-3 flex flex-row items-center gap-2"><Input {...register(`diagnostico.${i}.titulo`)} placeholder="Ambiente (ex: Cozinha)" className="h-8 shadow-none" /><Button variant="ghost" size="icon" onClick={() => removeDiagnostico(i)} className="h-8 w-8 text-red-400"><Trash2 className="w-4 h-4" /></Button></CardHeader>
                  <CardContent className="space-y-3"><Textarea {...register(`diagnostico.${i}.conteudo`)} placeholder="Achados técnicos..." className="text-sm min-h-20" /></CardContent>
                </Card>
             ))}
             <Button type="button" variant="outline" onClick={() => appendDiagnostico({ titulo: '', conteudo: '' })} className="w-full border-dashed border-2 rounded-xl text-indigo-600">Adicionar Ambiente</Button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <Card className="glass border-indigo-100">
               <CardHeader><CardTitle className="text-base font-bold">Parecer Técnico Final</CardTitle></CardHeader>
               <CardContent><Textarea {...register('conclusao')} placeholder="O laudo aprova a reforma conforme a norma?" className="min-h-32" /></CardContent>
            </Card>
            <Card className="glass border-indigo-100">
               <CardHeader><CardTitle className="text-base font-bold">Diretrizes e Restrições</CardTitle></CardHeader>
               <CardContent className="space-y-2">
                  {recomendacoesFields.map((field, i) => (
                     <div key={field.id} className="flex gap-2"><Input {...register(`recomendacoes.${i}.texto`)} placeholder="Ex: Não remover parede estrutural" className="text-sm" /><Button variant="ghost" size="icon" onClick={() => removeRecomendacoes(i)}><Trash2 className="w-3 h-3" /></Button></div>
                  ))}
                  <Button type="button" size="sm" variant="ghost" onClick={() => appendRecomendacoes({ texto: '', prioridade: 'media' })} className="text-indigo-600 font-bold">+ Diretriz</Button>
               </CardContent>
            </Card>
          </div>
        )}
      </form>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t z-50">
        <div className="max-w-3xl mx-auto flex gap-3">
          {currentStep > 0 && <Button variant="outline" size="lg" onClick={() => setCurrentStep(currentStep - 1)} className="rounded-xl flex-1">Voltar</Button>}
          {currentStep < 3 ? (
            <Button size="lg" onClick={async () => { if (await trigger()) setCurrentStep(currentStep + 1) }} className="bg-indigo-600 text-white rounded-xl flex-1">Próximo</Button>
          ) : (
            <Button size="lg" onClick={handleSubmit((d) => onSave(d, 'finalizado'))} disabled={saving} className="bg-emerald-600 text-white rounded-xl flex-1 font-bold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
              Finalizar Laudo NBR 16280
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
