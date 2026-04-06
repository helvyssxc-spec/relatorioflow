import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  Cloud, MapPin, Plus, Trash2, Save, FileDown, Loader2,
  Users, Wrench, ClipboardList, Camera, AlertCircle, ChevronLeft,
  Clock, Thermometer, CloudRain, CheckCircle2, FileCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useWeather } from '@/hooks/useWeather'
import { saveDraft, loadDraft, deleteDraft } from '@/lib/offline-db'
import { openDiarioObraPDF } from '@/lib/pdf/generateDiarioObra'
import { useProfile } from '@/hooks/useProfile'
import { toast } from 'sonner'
import { AITextAssistant } from '@/components/ui/AITextAssistant'
import { compressImage, formatBytes } from '@/lib/image-utils'
import { SyncStatus } from '@/components/ui/SyncStatus'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'

const CONDICOES_TEMPO = ['Ensolarado', 'Parcialmente nublado', 'Nublado', 'Chuvoso', 'Tempestade', 'Neblina']
const DISCIPLINAS = ['Estrutural', 'Alvenaria', 'Instalações Elétricas', 'Instalações Hidráulicas', 'Acabamento', 'Cobertura', 'Fundação', 'Terraplanagem', 'Outros']
const STATUS_EQUIP = ['operando', 'parado', 'manutencao'] as const

const schema = z.object({
  report_date: z.string().min(1, 'Data obrigatória'),
  responsavel: z.string().min(2, 'Responsável obrigatório'),
  condicao_tempo: z.string().min(1),
  temperatura: z.string().optional(),
  ocorrencias: z.string().optional(),
  equipe: z.array(z.object({
    nome: z.string().min(1, 'Nome obrigatório'),
    funcao: z.string().min(1, 'Função obrigatória'),
    horas: z.coerce.number().min(0).max(24),
  })),
  atividades: z.array(z.object({
    descricao: z.string().min(1, 'Descrição obrigatória'),
    disciplina: z.string().min(1),
    percentual_concluido: z.coerce.number().min(0).max(100),
    observacao: z.string().optional(),
  })),
  equipamentos: z.array(z.object({
    nome: z.string().min(1, 'Nome obrigatório'),
    quantidade: z.coerce.number().min(1),
    status: z.enum(STATUS_EQUIP),
  })),
})

type FormData = z.infer<typeof schema>

interface FotoItem { id: string; url: string; caption: string; uploading?: boolean }

const DRAFT_KEY = 'diario-obra-draft'

export default function DiarioObra() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { fetchByGeolocation, loading: weatherLoading } = useWeather()
  const projectId = searchParams.get('project')

  const [saving, setSaving] = useState(false)
  const [fotos, setFotos] = useState<FotoItem[]>([])
  const [weatherData, setWeatherData] = useState<{ temperature: number; description: string } | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectData, setProjectData] = useState<any>(null)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle')
  const [lastSynced, setLastSynced] = useState<string>('')
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { title: 'Identificação', description: 'Data e Responsável' },
    { title: 'Clima e Pessoal', description: 'Tempo e Equipe' },
    { title: 'Atividades', description: 'Produção do Dia' },
    { title: 'Conclusão', description: 'Fotos e Ocorrências' },
  ]

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      report_date: format(new Date(), 'yyyy-MM-dd'),
      responsavel: profile?.full_name || '',
      condicao_tempo: 'Ensolarado',
      temperatura: '',
      ocorrencias: '',
      equipe: [],
      atividades: [],
      equipamentos: [],
    },
  })

  const { fields: equipeFields, append: appendEquipe, remove: removeEquipe } = useFieldArray({ control, name: 'equipe' })
  const { fields: atividadesFields, append: appendAtividades, remove: removeAtividades } = useFieldArray({ control, name: 'atividades' })
  const { fields: equipamentosFields, append: appendEquipamentos, remove: removeEquipamentos } = useFieldArray({ control, name: 'equipamentos' })

  useEffect(() => {
    if (!projectId || !user) return
    (supabase as any).from('projects').select('*').eq('id', projectId).single()
      .then(({ data }: any) => {
        if (data) { setProjectName(data.name); setProjectData(data) }
      })
  }, [projectId, user])

  useEffect(() => {
    loadDraft(DRAFT_KEY).then((draft) => {
      if (draft) { reset(draft as FormData); toast.info('Rascunho local carregado') }
    })
  }, [reset])

  const formValues = watch()
  const debouncedFormValues = useDebounce(formValues, 3000)

  useEffect(() => {
    const timer = setInterval(() => { saveDraft(DRAFT_KEY, formValues) }, 30000)
    return () => clearInterval(timer)
  }, [formValues])

  useEffect(() => {
    const syncToCloud = async () => {
      if (!projectId || !user || !debouncedFormValues.report_date) return
      setSyncStatus('syncing')
      try {
        const { error } = await (supabase as any).from('daily_reports').upsert({
          user_id: user.id,
          project_id: projectId,
          report_date: debouncedFormValues.report_date,
          responsavel: debouncedFormValues.responsavel,
          condicao_tempo: debouncedFormValues.condicao_tempo,
          temperatura: debouncedFormValues.temperatura || '',
          clima_json: weatherData || {},
          equipe: debouncedFormValues.equipe,
          atividades: debouncedFormValues.atividades,
          equipamentos: debouncedFormValues.equipamentos,
          ocorrencias: debouncedFormValues.ocorrencias || '',
          fotos: fotos.filter((f) => !f.uploading).map((f) => ({ id: f.id, url: f.url, caption: f.caption })),
          status: 'draft',
        }, { onConflict: 'project_id,report_date' })

        if (error) throw error
        setSyncStatus('synced')
        setLastSynced(format(new Date(), 'HH:mm'))
      } catch (err) {
        console.error('Cloud Sync Error:', err)
        setSyncStatus('error')
      }
    }

    if (debouncedFormValues.responsavel || debouncedFormValues.ocorrencias || fotos.length > 0) {
      syncToCloud()
    }
  }, [debouncedFormValues, projectId, user, fotos, weatherData])

  const fetchClima = useCallback(async () => {
    const data = await fetchByGeolocation()
    if (data) {
      setValue('condicao_tempo', data.condition)
      setValue('temperatura', `${data.temperature}°C`)
      setWeatherData({ temperature: data.temperature, description: data.description })
      toast.success(`Clima: ${data.temperature}°C, ${data.description}`)
    }
  }, [fetchByGeolocation, setValue])

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!user || files.length === 0) return
    
    for (const file of files) {
      const originalSize = file.size
      const tempId = crypto.randomUUID()
      setFotos((prev) => [...prev, { id: tempId, url: URL.createObjectURL(file), caption: '', uploading: true }])
      
      try {
        const compressedBlob = await compressImage(file, 1920, 0.8)
        const path = `${user.id}/diario/${tempId}.${file.type.split('/').pop()}`
        const { error } = await supabase.storage.from('reports').upload(path, compressedBlob, {
          contentType: file.type,
          upsert: false
        })

        if (error) throw error
        const { data: urlData } = supabase.storage.from('reports').getPublicUrl(path)
        setFotos((prev) => prev.map((f) => f.id === tempId ? { ...f, url: urlData.publicUrl, uploading: false } : f))
        
        if (originalSize > 1024 * 1024) {
          const red = Math.round((1 - (compressedBlob.size / originalSize)) * 100)
          toast.success(`Foto otimizada: -${red}% de dados.`)
        }
      } catch (err) {
        console.error(err)
        setFotos((prev) => prev.filter((f) => f.id !== tempId))
        toast.error(`Erro ao enviar ${file.name}`)
      }
    }
    e.target.value = ''
  }

  const onSave = async (data: FormData, status: 'draft' | 'finalizado' = 'draft') => {
    if (!projectId || !user) { toast.error('Selecione uma obra'); return }
    setSaving(true)
    
    const { data: saved, error } = await (supabase as any).from('daily_reports').upsert({
      user_id: user.id,
      project_id: projectId,
      report_date: data.report_date,
      responsavel: data.responsavel,
      condicao_tempo: data.condicao_tempo,
      temperatura: data.temperatura || '',
      clima_json: weatherData || {},
      equipe: data.equipe as any,
      atividades: data.atividades as any,
      equipamentos: data.equipamentos as any,
      ocorrencias: data.ocorrencias || '',
      fotos: fotos.filter((f) => !f.uploading).map((f) => ({ id: f.id, url: f.url, caption: f.caption })),
      status,
    }, { onConflict: 'project_id,report_date' }).select().single()

    setSaving(false)

    if (error) {
      if (error.code === '23505') toast.error('Já existe um Diário para essa data.')
      else toast.error('Erro ao salvar.')
      return
    }

    if (status === 'finalizado' && saved) {
      openDiarioObraPDF({
        projectName: projectData?.name || projectName,
        projectAddress: projectData?.address,
        clientName: projectData?.client_name,
        artRrt: projectData?.art_rrt,
        companyName: profile?.company_name,
        companyLogo: profile?.logo_url,
        responsavelNome: data.responsavel,
        creaCau: profile?.crea_cau,
        reportDate: data.report_date,
        condicaoTempo: data.condicao_tempo,
        temperatura: data.temperatura,
        equipe: data.equipe as any,
        atividades: data.atividades as any,
        equipamentos: data.equipamentos as any,
        ocorrencias: data.ocorrencias,
        fotos: fotos.filter((f) => !f.uploading),
      })
    }

    await deleteDraft(DRAFT_KEY)
    toast.success(status === 'finalizado' ? 'Finalizado! PDF aberto.' : 'Rascunho salvo!')
    navigate('/app/dashboard')
  }

  const nextStep = () => { if (currentStep < steps.length - 1) { setCurrentStep(currentStep + 1); window.scrollTo(0, 0) } }
  const prevStep = () => { if (currentStep > 0) { setCurrentStep(currentStep - 1); window.scrollTo(0, 0) } }

  return (
    <div className="max-w-3xl space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-muted/50">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground truncate">Diário de Obra</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              {projectName || 'Obra não selecionada'}
            </p>
          </div>
        </div>
        <SyncStatus status={syncStatus} lastSynced={lastSynced} />
      </div>

      {/* Progress Stepper */}
      <div className="space-y-3 bg-muted/20 p-4 rounded-2xl border border-primary/5">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
          <span className="text-primary">Passo {currentStep + 1} de {steps.length}</span>
          <span className="text-muted-foreground">{steps[currentStep].title}</span>
        </div>
        <div className="flex gap-2 h-2 w-full">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-full flex-1 rounded-full transition-all duration-700",
                i <= currentStep ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      <form className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Step 0: Identificação */}
        {currentStep === 0 && (
          <Card className="glass overflow-hidden border-primary/10">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-primary">
                <Clock className="w-5 h-5" />
                <CardTitle className="text-lg font-bold">Identificação do Relatório</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Data do Diário</Label>
                  <Input type="date" {...register('report_date')} className="rounded-xl h-11 border-primary/10 focus:ring-1 focus:ring-primary/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Responsável Técnico</Label>
                  <Input placeholder="Nome do engenheiro" {...register('responsavel')} className="rounded-xl h-11 border-primary/10 focus:ring-1 focus:ring-primary/30" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Clima e Equipe */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <Card className="glass border-primary/10">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <CloudRain className="w-5 h-5" />
                  <CardTitle className="text-lg font-bold">Condições do Tempo</CardTitle>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={fetchClima} className="text-xs rounded-full text-primary hover:bg-primary/5">
                  <MapPin className="w-3.5 h-3.5 mr-1" /> GPS
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Céu</Label>
                  <Select value={watch('condicao_tempo')} onValueChange={(v) => setValue('condicao_tempo', v)}>
                    <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>{CONDICOES_TEMPO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Temperatura</Label>
                  <div className="relative">
                    <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                    <Input placeholder="C°" {...register('temperatura')} className="pl-9 h-11 rounded-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-2 text-primary">
                  <Users className="w-5 h-5" />
                  <CardTitle className="text-lg font-bold">Equipe e Mão de Obra</CardTitle>
                </div>
                <Button type="button" size="sm" onClick={() => appendEquipe({ nome: '', funcao: '', horas: 8 })} className="rounded-full">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {equipeFields.length === 0 && <div className="text-center py-6 text-muted-foreground text-sm italic">Nenhum profissional listado.</div>}
                {equipeFields.map((field, i) => (
                  <div key={field.id} className="flex gap-2 p-3 rounded-xl bg-muted/30 border border-primary/5">
                    <div className="flex-1 space-y-1">
                      <Input placeholder="Nome" {...register(`equipe.${i}.nome`)} className="h-9 text-sm" />
                      <Input placeholder="Função" {...register(`equipe.${i}.funcao`)} className="h-8 text-[10px]" />
                    </div>
                    <div className="w-16 space-y-1">
                      <Input type="number" placeholder="8h" {...register(`equipe.${i}.horas`)} className="h-9 text-center text-sm" />
                      <Button variant="ghost" size="icon" onClick={() => removeEquipe(i)} className="h-8 w-full text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Atividades */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Card className="glass border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-2 text-primary">
                  <ClipboardList className="w-5 h-5" />
                  <CardTitle className="text-lg font-bold">Resumo de Atividades</CardTitle>
                </div>
                <Button type="button" size="sm" onClick={() => appendAtividades({ descricao: '', disciplina: 'Estrutural', percentual_concluido: 0 })} className="rounded-full">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {atividadesFields.map((field, i) => (
                  <div key={field.id} className="p-4 rounded-2xl bg-muted/30 border border-primary/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="text-[10px] font-bold">ATIVIDADE #{i+1}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => removeAtividades(i)} className="text-red-500 h-6 px-2 text-[10px]">Remover</Button>
                    </div>
                    <Input placeholder="O que foi feito?" {...register(`atividades.${i}.descricao`)} className="h-10 text-sm" />
                    <div className="flex gap-2">
                       <Select value={watch(`atividades.${i}.disciplina`)} onValueChange={(v) => setValue(`atividades.${i}.disciplina`, v)}>
                        <SelectTrigger className="h-9 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{DISCIPLINAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                      <div className="relative w-24">
                        <Input type="number" placeholder="%" {...register(`atividades.${i}.percentual_concluido`)} className="h-9 pr-7 text-sm" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]">%</span>
                      </div>
                    </div>
                    <AITextAssistant onApply={(t) => setValue(`atividades.${i}.observacao`, t)} context={`Refine a atividade: ${watch(`atividades.${i}.descricao`)}`} />
                    <Textarea placeholder="Observações..." {...register(`atividades.${i}.observacao`)} className="text-xs h-20 resize-none" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2"><Wrench className="w-5 h-5" />Equipamentos</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={() => appendEquipamentos({ nome: '', quantidade: 1, status: 'operando' })} className="rounded-full">Add</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {equipamentosFields.map((field, i) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <Input placeholder="Máquina" {...register(`equipamentos.${i}.nome`)} className="h-9 text-sm flex-1" />
                    <Select value={watch(`equipamentos.${i}.status`)} onValueChange={(v: any) => setValue(`equipamentos.${i}.status`, v)}>
                      <SelectTrigger className="w-28 h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operando">Ativo</SelectItem>
                        <SelectItem value="parado">Parado</SelectItem>
                        <SelectItem value="manutencao">Manut.</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => removeEquipamentos(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Fotos e Ocorrências */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card className="glass border-primary/10">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <Camera className="w-5 h-5" />
                  <CardTitle className="text-lg font-bold">Evidências Fotográficas</CardTitle>
                </div>
                <label className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild className="rounded-full text-xs">
                    <span><Plus className="w-3.5 h-3.5 mr-1" /> Add Fotos</span>
                  </Button>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={onFileChange} />
                </label>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {fotos.map((f) => (
                    <div key={f.id} className="relative aspect-square rounded-2xl overflow-hidden glass border border-primary/10 group">
                      {f.uploading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50"><Loader2 className="animate-spin text-primary w-6 h-6" /></div>
                      ) : (
                        <img src={f.url} alt="Evidência" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Input placeholder="Legenda..." value={f.caption} onChange={(e) => setFotos(prev => prev.map(p => p.id === f.id ? { ...p, caption: e.target.value } : p))} className="h-8 text-xs bg-white/20 border-none text-white placeholder:text-white/60" />
                        <Button variant="destructive" size="icon" onClick={() => setFotos(prev => prev.filter(p => p.id !== f.id))} className="absolute top-2 right-2 h-7 w-7"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-primary/10 flex flex-col items-center justify-center text-muted-foreground gap-2 cursor-pointer hover:bg-primary/5 transition-all">
                    <Camera className="w-6 h-6 opacity-30" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Clique para Foto</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={onFileChange} />
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2"><AlertCircle className="w-5 h-5" />Notas de Campo</CardTitle>
                <AITextAssistant onApply={(t) => setValue('ocorrencias', t)} context={`Crie um resumo técnico para: ${watch('ocorrencias')}`} />
              </CardHeader>
              <CardContent>
                <Textarea placeholder="Ocorrências, acidentes, visitas..." {...register('ocorrencias')} className="min-h-32 rounded-2xl resize-none font-medium" />
              </CardContent>
            </Card>
          </div>
        )}
      </form>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent backdrop-blur-sm z-50">
        <div className="max-w-3xl mx-auto flex gap-3">
          {currentStep > 0 ? (
            <Button variant="outline" size="lg" onClick={prevStep} className="rounded-full shadow-lg border-primary/10 bg-background/50 hover:bg-muted font-bold px-8">
              Voltar
            </Button>
          ) : <div className="flex-1" />}
          
          {currentStep < steps.length - 1 ? (
            <Button size="lg" onClick={nextStep} className="flex-1 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/20 font-bold">
              Próximo Passo
            </Button>
          ) : (
            <Button size="lg" onClick={handleSubmit((d) => onSave(d, 'finalizado'))} disabled={saving} className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20 font-bold">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileCheck className="w-4 h-4 mr-2" />}
              Finalizar PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
