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
  Search, ListChecks, Award
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
  objetivo: z.string().min(10, 'Objetivo deve ter pelo menos 10 caracteres'),
  metodologia: z.string().min(10, 'Metodologia deve ter pelo menos 10 caracteres'),
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

const DRAFT_KEY = 'relatorio-tecnico-draft'

export default function RelatorioTecnico() {
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

  // ── Global AI Assistant ──
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'pt-BR'
      rec.onresult = (e: any) => {
        let text = ''
        for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript
        setTranscript(text)
      }
      setRecognition(rec)
    }
  }, [])

  const toggleRecording = () => {
    if (isRecording) {
      recognition?.stop()
    } else { 
      setTranscript('')
      recognition?.start() 
    }
    setIsRecording(!isRecording)
  }

  const handleGlobalAI = async () => {
    if (!transcript.trim()) { 
       toast.error('Grave um áudio primeiro!')
       return 
    }
    
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
          reportType: 'relatorio_tecnico',
          action: 'generate'
        })
      })
      
      const text = await res.text()
      const cleanText = text.split('\n__RF_USAGE__')[0]
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
         const parsed = JSON.parse(jsonMatch[0])
         if (parsed.objetivo) setValue('objetivo', parsed.objetivo)
         if (parsed.metodologia) setValue('metodologia', parsed.metodologia)
         if (parsed.conclusao) setValue('conclusao', parsed.conclusao)
         
         // Diagnóstico e Recomendações (mais complexos com fieldArrays)
         if (parsed.diagnostico) {
            reset({ ...watch(), diagnostico: parsed.diagnostico })
         }
         if (parsed.recomendacoes) {
            reset({ ...watch(), recomendacoes: parsed.recomendacoes })
         }
         
         // Registro de Telemetria (Giroscópio de IA)
         const inputTokens = Math.ceil(transcript.length / 4);
         const outputTokens = Math.ceil(jsonMatch[0].length / 4);
         await (supabase as any).rpc('record_ai_usage', {
           p_user_id: user?.id,
           p_report_type: 'tecnico',
           p_input_tokens: inputTokens,
           p_output_tokens: outputTokens
         });

         toast.success('Campos preenchidos pela IA!')
      }
    } catch (e: any) {
      toast.error('Erro ao processar com IA: ' + e.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const steps = [
    { title: 'Identificação', description: 'Dados Gerais' },
    { title: 'Escopo', description: 'Objetivo e Métodos' },
    { title: 'Análise', description: 'Diagnóstico e Fotos' },
    { title: 'Finalização', description: 'Conclusão' },
  ]

  const { register, control, handleSubmit, watch, setValue, reset, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      numero_relatorio: `${format(new Date(), 'yyyy')}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      report_date: format(new Date(), 'yyyy-MM-dd'),
      responsavel_tecnico: profile?.full_name || '',
      crea_cau: profile?.crea_cau || '',
      objetivo: '',
      metodologia: '',
      diagnostico: [{ titulo: 'Análise Técnica', conteudo: '' }],
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

  useEffect(() => {
    loadDraft(DRAFT_KEY).then((draft) => {
      if (draft) { reset(draft as FormData); toast.info('Rascunho local carregado') }
    })
  }, [reset])

  const formValues = watch()
  const debouncedFormValues = useDebounce(formValues, 3000)

  useEffect(() => {
    const syncToCloud = async () => {
      if (!projectId || !user || !debouncedFormValues.numero_relatorio) return
      setSyncStatus('syncing')
      try {
        const { error } = await (supabase as any).from('technical_reports').upsert({
          user_id: user.id,
          project_id: projectId,
          report_date: debouncedFormValues.report_date,
          numero_relatorio: debouncedFormValues.numero_relatorio,
          responsavel_tecnico: debouncedFormValues.responsavel_tecnico,
          crea_cau: debouncedFormValues.crea_cau,
          objetivo: debouncedFormValues.objetivo,
          metodologia: debouncedFormValues.metodologia,
          diagnostico: debouncedFormValues.diagnostico,
          conclusao: debouncedFormValues.conclusao,
          recomendacoes: debouncedFormValues.recomendacoes,
          fotos_gerais: fotosGerais.filter((f) => !f.uploading),
          status: 'draft',
        }, { onConflict: 'project_id,numero_relatorio' })

        if (error) throw error
        setSyncStatus('synced')
        setLastSynced(format(new Date(), 'HH:mm'))
      } catch {
        setSyncStatus('offline')
      }
    }
    if (debouncedFormValues.objetivo || debouncedFormValues.conclusao || fotosGerais.length > 0) {
      syncToCloud()
    }
  }, [debouncedFormValues, projectId, user, fotosGerais])

  const uploadFoto = async (file: File, target: 'geral' | string) => {
    if (!user) return
    const tempId = crypto.randomUUID()
    const newFoto: FotoItem = { id: tempId, url: URL.createObjectURL(file), caption: '', uploading: true }
    
    if (target === 'geral') setFotosGerais((prev) => [...prev, newFoto])
    else {
      setFotosSections((prev) => {
        const s = prev.find(x => x.secaoId === target)
        if (!s) return [...prev, { secaoId: target, fotos: [newFoto] }]
        return prev.map(x => x.secaoId === target ? { ...x, fotos: [...x.fotos, newFoto] } : x)
      })
    }

    try {
      const compressed = await compressImage(file, 1920, 0.8)
      const rawExt = file.type.split('/').pop() ?? 'jpg'
      const ext = rawExt.includes('+') ? rawExt.split('+')[0] : rawExt
      const path = `${user.id}/tecnico/${tempId}.${ext}`
      const { error } = await supabase.storage.from('reports').upload(path, compressed)
      if (error) throw error
      const { data: urlData } = supabase.storage.from('reports').getPublicUrl(path)
      
      if (target === 'geral') {
        setFotosGerais((prev) => prev.map(f => f.id === tempId ? { ...f, url: urlData.publicUrl, uploading: false } : f))
      } else {
        setFotosSections((prev) => prev.map(s => s.secaoId === target ? { ...s, fotos: s.fotos.map(f => f.id === tempId ? { ...f, url: urlData.publicUrl, uploading: false } : f) } : s))
      }
    } catch (err) {
      toast.error('Erro no upload');
      if (target === 'geral') setFotosGerais(p => p.filter(f => f.id !== tempId))
      else setFotosSections(p => p.map(s => s.secaoId === target ? { ...s, fotos: s.fotos.filter(f => f.id !== tempId) } : s))
    }
  }

  const onSave = async (data: FormData, status: 'draft' | 'finalizado' = 'draft') => {
    if (!projectId || !user) { toast.error('Selecione uma obra'); return }
    setSaving(true)
    const finalDiagnostico = data.diagnostico.map((d: any, i: number) => {
      const secao = fotosSections.find((s) => s.secaoId === String(i))
      return { 
        titulo: d.titulo || `Seção ${i+1}`, 
        conteudo: d.conteudo, 
        fotos: (secao?.fotos || []).filter(f => !f.uploading) 
      }
    })

    const { data: saved, error } = await (supabase as any).from('technical_reports').upsert({
      user_id: user.id, project_id: projectId,
      report_date: data.report_date,
      numero_relatorio: data.numero_relatorio,
      responsavel_tecnico: data.responsavel_tecnico,
      crea_cau: data.crea_cau,
      objetivo: data.objetivo, metodologia: data.metodologia,
      diagnostico: finalDiagnostico,
      conclusao: data.conclusao,
      recomendacoes: data.recomendacoes,
      fotos_gerais: fotosGerais.filter(f => !f.uploading),
      status,
    }, { onConflict: 'project_id,numero_relatorio' }).select().single()

    setSaving(false)
    if (error) { toast.error('Erro ao salvar'); return }

    if (status === 'finalizado' && saved) {
      openRelatorioTecnicoPDF({
        projectName: projectData?.name || projectName,
        projectAddress: projectData?.address,
        clientName: projectData?.client_name,
        artRrt: projectData?.art_rrt,
        companyName: profile?.company_name,
        companyLogo: profile?.logo_url,
        numeroRelatorio: data.numero_relatorio,
        reportDate: data.report_date,
        responsavelTecnico: data.responsavel_tecnico,
        creaCau: data.crea_cau,
        objetivo: data.objetivo, metodologia: data.metodologia,
        diagnostico: finalDiagnostico,
        conclusao: data.conclusao,
        recomendacoes: data.recomendacoes as any,
        fotosGerais: fotosGerais.filter(f => !f.uploading),
      })
    }

    await deleteDraft(DRAFT_KEY)
    toast.success(status === 'finalizado' ? 'Relatório finalizado!' : 'Rascunho salvo!')
    navigate('/app/dashboard')
  }

  const prevStep = () => { if (currentStep > 0) { setCurrentStep(currentStep - 1); window.scrollTo(0, 0) } }

  // Campos obrigatórios por passo
  const stepFields: Record<number, (keyof FormData)[]> = {
    0: ['numero_relatorio', 'report_date', 'responsavel_tecnico'],
    1: ['objetivo', 'metodologia'],
    2: ['diagnostico'],
    3: ['conclusao'],
  }

  const nextStep = async () => {
    if (currentStep >= steps.length - 1) return
    const fields = stepFields[currentStep] || []
    const isValid = await trigger(fields as any)
    if (!isValid) {
      toast.error('Preencha os campos obrigatórios antes de continuar.')
      return
    }
    setCurrentStep(currentStep + 1)
    window.scrollTo(0, 0)
  }

  return (
    <div className="max-w-3xl space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full"><ChevronLeft className="w-5 h-5" /></Button>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight">Relatório Técnico</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              {projectName || 'Obra não selecionada'}
            </p>
          </div>
        </div>
        <SyncStatus status={syncStatus} lastSynced={lastSynced} />
      </div>

      {/* ── ASSISTENTE GLOBAL ── */}
      <Card className="border-indigo-200 bg-indigo-50/30 overflow-hidden">
        <CardContent className="p-4 flex items-center gap-4">
           <Button
            type="button"
            onClick={toggleRecording}
            variant={isRecording ? "destructive" : "outline"}
            className={cn("h-12 w-12 rounded-full", isRecording && "animate-pulse")}
          >
            {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5 text-indigo-600" />}
          </Button>
          
          <div className="flex-1 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-900">Assistente de Voz Global</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {transcript || (isRecording ? 'Ouvindo vistoria...' : 'Grave um resumo da vistoria para preencher o formulário')}
            </p>
          </div>

          {(transcript || isGenerating) && (
            <Button 
              onClick={handleGlobalAI} 
              disabled={isGenerating || isRecording}
              className="bg-indigo-600 text-white shadow-lg"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isGenerating ? 'Preenchendo...' : 'Preencher Tudo'}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-indigo-900">
          <span>Passo {currentStep + 1} de {steps.length}</span>
          <span>{steps[currentStep].title}</span>
        </div>
        <div className="flex gap-2 h-2 w-full">
          {steps.map((_, i) => (
            <div key={i} className={cn("h-full flex-1 rounded-full transition-all duration-700", i <= currentStep ? "bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.3)]" : "bg-indigo-200/50")} />
          ))}
        </div>
      </div>

      <form className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {currentStep === 0 && (
          <Card className="glass border-indigo-100">
            <CardHeader><CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-900"><Award className="w-5 h-5" />Identificação</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Log / Número</Label>
                  <Input placeholder="RT-2024-001" {...register('numero_relatorio')} className="rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Data da Inspeção</Label>
                  <Input type="date" {...register('report_date')} className="rounded-xl h-11" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Responsável</Label>
                  <Input placeholder="Eng. Responsável" {...register('responsavel_tecnico')} className="rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">CREA / CAU</Label>
                  <Input placeholder="D/UF" {...register('crea_cau')} className="rounded-xl h-11" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <Card className="glass border-indigo-100 text-indigo-900">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2"><Target className="w-5 h-5" />Objetivo</CardTitle>
                <AITextAssistant onApply={(t) => setValue('objetivo', t)} context="Refine o objetivo deste relatório técnico." />
              </CardHeader>
              <CardContent><Textarea placeholder="Qual a finalidade deste relatório?" {...register('objetivo')} className="min-h-32 rounded-2xl resize-none" /></CardContent>
            </Card>
            <Card className="glass border-indigo-100">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2"><Search className="w-5 h-5" />Metodologia</CardTitle>
                <AITextAssistant onApply={(t) => setValue('metodologia', t)} context="Refine a metodologia de inspeção." />
              </CardHeader>
              <CardContent><Textarea placeholder="Como foi realizada a análise?" {...register('metodologia')} className="min-h-32 rounded-2xl resize-none" /></CardContent>
            </Card>
            <Card className="glass border-indigo-100">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2"><Camera className="w-5 h-5" />Fotos de Visão Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {fotosGerais.map(f => (
                    <div key={f.id} className="relative aspect-square rounded-xl overflow-hidden glass group">
                      <img src={f.url} className="w-full h-full object-cover" />
                      <Button variant="destructive" size="icon" onClick={() => setFotosGerais(p => p.filter(x => x.id !== f.id))} className="absolute top-1 right-1 h-6 w-6"><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-indigo-200 flex items-center justify-center cursor-pointer hover:bg-indigo-50"><Camera className="w-5 h-5 text-indigo-300" /><input type="file" multiple className="hidden" onChange={(e) => Array.from(e.target.files || []).forEach(f => uploadFoto(f, 'geral'))} /></label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Análise por Seções</p>
              <Button type="button" size="sm" onClick={() => {
                const id = String(diagnosticoFields.length)
                appendDiagnostico({ titulo: '', conteudo: '' })
                setFotosSections(p => [...p, { secaoId: id, fotos: [] }])
              }} className="rounded-full"><Plus className="w-4 h-4 mr-1" /> Add Seção</Button>
            </div>
            {diagnosticoFields.map((field, i) => (
              <Card key={field.id} className="glass border-indigo-100 overflow-hidden">
                <CardHeader className="bg-indigo-50/50 pb-3">
                  <div className="flex gap-2">
                    <Input placeholder="Título da Seção (ex: Fachada Norte)" {...register(`diagnostico.${i}.titulo`)} className="bg-white" />
                    <Button variant="ghost" size="icon" onClick={() => removeDiagnostico(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex justify-end"><AITextAssistant onApply={(t) => setValue(`diagnostico.${i}.conteudo`, t)} context={`Refine o diagnóstico de: ${watch(`diagnostico.${i}.titulo`)}`} /></div>
                  <Textarea placeholder="Achados técnicos e diagnóstico..." {...register(`diagnostico.${i}.conteudo`)} className="min-h-24 rounded-xl" />
                  <div className="grid grid-cols-4 gap-2">
                    {(fotosSections.find(s => s.secaoId === String(i))?.fotos || []).map(f => (
                      <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden border">
                        <img src={f.url} className="w-full h-full object-cover" />
                        <Input placeholder="Foto..." value={f.caption} onChange={(e) => setFotosSections(p => p.map(s => s.secaoId === String(i) ? { ...s, fotos: s.fotos.map(ph => ph.id === f.id ? { ...ph, caption: e.target.value } : ph) } : s))} className="absolute bottom-0 h-6 text-[10px] bg-black/60 border-none text-white rounded-none" />
                      </div>
                    ))}
                    <label className="aspect-square rounded-lg border-2 border-dashed border-indigo-100 flex items-center justify-center cursor-pointer"><Camera className="w-4 h-4 text-indigo-200" /><input type="file" multiple className="hidden" onChange={(e) => Array.from(e.target.files || []).forEach(f => uploadFoto(f, String(i)))} /></label>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <Card className="glass border-indigo-100">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-indigo-600" />Parecer Final</CardTitle>
                <AITextAssistant onApply={(t) => setValue('conclusao', t)} context="Refine a conclusão executiva deste relatório." />
              </CardHeader>
              <CardContent><Textarea placeholder="Conclusão técnica e parecer final..." {...register('conclusao')} className="min-h-40 rounded-2xl resize-none" /></CardContent>
            </Card>

            <Card className="glass border-indigo-100">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2"><ListChecks className="w-5 h-5 text-indigo-600" />Plano de Ação</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={() => appendRecomendacoes({ texto: '', prioridade: 'media' })} className="rounded-full">Add</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recomendacoesFields.map((field, i) => (
                  <div key={field.id} className="flex gap-2">
                    <select {...register(`recomendacoes.${i}.prioridade`)} className="h-9 px-2 rounded-lg border bg-background text-[10px] font-bold">
                      <option value="alta">🔴 ALTA</option>
                      <option value="media">🟡 MÉDIA</option>
                      <option value="baixa">🟢 BAIXA</option>
                    </select>
                    <Input placeholder="Recomendação técnica..." {...register(`recomendacoes.${i}.texto`)} className="h-9 text-sm flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => removeRecomendacoes(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </form>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent backdrop-blur-sm z-50">
        <div className="max-w-3xl mx-auto flex gap-3">
          {currentStep > 0 ? (
            <Button variant="outline" size="lg" onClick={prevStep} className="rounded-full shadow-lg font-bold px-8">Voltar</Button>
          ) : <div className="flex-1" />}
          
          {currentStep < steps.length - 1 ? (
            <Button size="lg" onClick={nextStep} className="flex-1 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 font-bold">Próximo Passo</Button>
          ) : (
            <Button size="lg" onClick={handleSubmit((d) => onSave(d, 'finalizado'))} disabled={saving} className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20 font-bold">
              {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
              Gerar Relatório Final
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
