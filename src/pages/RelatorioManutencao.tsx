import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  Wrench, Plus, Trash2, FileDown, Loader2, Mic, Square, Sparkles,
  ChevronLeft, Settings, ClipboardList, PenTool, CheckCircle2,
  Package, Clock, AlertCircle, HardDrive, Camera, X, CloudOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { openRelatorioManutencaoPDF } from '@/lib/pdf/generateRelatorioManutencao'
import { queueReportSave, tryImmediateSync } from '@/lib/offline/sync-helper'
import { useOfflineStatus } from '@/hooks/useOfflineSync'
import { saveBlob, getDB } from '@/lib/offline/db'

// -- Image compression helper
async function compressImg(file: File, maxW = 1920, quality = 0.82): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width)
      const canvas = document.createElement('canvas')
      canvas.width  = img.width  * scale
      canvas.height = img.height * scale
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', quality)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

const schema = z.object({
  report_type: z.enum(['preventiva', 'corretiva']),
  report_date: z.string().min(1, 'Data obrigatória'),
  tecnico_nome: z.string().min(2, 'Nome do técnico obrigatório'),
  ativo_nome: z.string().min(2, 'Nome do ativo obrigatório'),
  ativo_tag: z.string().optional(),
  sistema: z.string().min(1, 'Sistema obrigatório'),
  status_anterior: z.string(),
  status_posterior: z.string(),
  descricao_servico: z.string().optional(),
  checklists: z.array(z.object({
    item: z.string(),
    concluido: z.boolean()
  })).optional(),
  pecas_substituidas: z.array(z.object({
    nome: z.string(),
    qtd: z.number()
  })).optional(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function RelatorioManutencao() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const projectId = searchParams.get('project')

  const [saving, setSaving] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [photos, setPhotos] = useState<any[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const isOnline = useOfflineStatus()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  // ── Global AI Assistant ──
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)

  const handlePhotos = async (files: FileList | null) => {
    if (!files || !user) return
    for (const file of Array.from(files)) {
      const tempId = crypto.randomUUID()
      const preview = URL.createObjectURL(file)
      setPhotos(p => [...p, { id: tempId, url: preview, uploading: true }])
      setUploadProgress(prev => ({ ...prev, [tempId]: 0 }))

      try {
        const blob = await compressImg(file)
        await saveBlob(tempId, blob, file.type)
        const path = `${user.id}/manutencao/${tempId}.${file.type === 'image/png' ? 'png' : 'jpg'}`

        if (!isOnline) {
          let prog = 0
          const interval = setInterval(() => {
            prog += 20; if (prog >= 100) clearInterval(interval)
            setUploadProgress(prev => ({ ...prev, [tempId]: Math.min(prog, 100) }))
          }, 50)
          
          const db = await getDB()
          await db.put('sync_queue', {
            id: tempId, type: 'photo_upload',
            payload: { photoId: tempId, userId: user.id, path, type: file.type, bucket: 'report-images' },
            createdAt: Date.now(), attempts: 0
          })
          setPhotos(p => p.map(x => x.id === tempId ? { ...x, uploading: false, offline: true } : x))
        } else {
          const interval = setInterval(() => {
            setUploadProgress(prev => ({ ...prev, [tempId]: Math.min((prev[tempId] || 0) + 5, 95) }))
          }, 200)

          const { error } = await supabase.storage.from('report-images').upload(path, blob)
          clearInterval(interval)
          if (error) throw error
          
          setUploadProgress(prev => ({ ...prev, [tempId]: 100 }))
          const { data: { publicUrl } } = supabase.storage.from('report-images').getPublicUrl(path)
          setPhotos(p => p.map(x => x.id === tempId ? { ...x, publicUrl, uploading: false } : x))
        }
      } catch (e) {
        toast.error('Erro ao processar foto');
        setPhotos(p => p.filter(x => x.id !== tempId))
      }
    }
  }

  const { register, control, handleSubmit, watch, setValue, reset, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      report_type: 'preventiva',
      report_date: format(new Date(), 'yyyy-MM-dd'),
      tecnico_nome: profile?.full_name || '',
      status_anterior: 'operacional',
      status_posterior: 'operacional',
      checklists: [],
      pecas_substituidas: []
    }
  })

  const { fields: pecasFields, append: appendPeca, remove: removePeca } = useFieldArray({ control, name: 'pecas_substituidas' })
  const reportType = watch('report_type')

  useEffect(() => {
    // Audit Mock: Set a dummy project name
    const isAudit = (import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') || !import.meta.env.VITE_SUPABASE_URL);
    if ((!projectId || projectId === 'audit-id') && isAudit) {
      setProjectName('Residencial Aurora (Audit Mode)');
      return;
    }
    if (!projectId || !user) return
    supabase.from('projects').select('name').eq('id', projectId).single()
      .then(({ data }: any) => { if (data) setProjectName(data.name) })
  }, [projectId, user])

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
    if (isRecording) { recognition?.stop() }
    else { setTranscript(''); recognition?.start() }
    setIsRecording(!isRecording)
  }

  const handleGlobalAI = async () => {
    if (!transcript.trim()) { toast.error('Grave um áudio primeiro!'); return }
    setIsGenerating(true)
    try {
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;
      const isAudit = (import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') || !import.meta.env.VITE_SUPABASE_URL);
      
      if (groqKey) {
        // --- REAL GROQ INTEGRATION ---
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: 'llama3-70b-8192',
            messages: [
              {
                role: 'system',
                content: 'Você é um assistente técnico especializado em manutenção industrial e predial. Converta a transcrição de voz fornecida em um JSON estruturado para um relatório técnico. Responda APENAS o JSON, sem textos explicativos.'
              },
              {
                role: 'user',
                content: `Transcrição: "${transcript}". \nUse este formato JSON: {"ativo_nome": string, "sistema": string, "descricao_servico": string, "status_anterior": "operacional"|"falha_parcial"|"parado", "status_posterior": "operacional"|"falha_parcial"|"parado", "pecas_substituidas": [{"nome": string, "qtd": number}]}`
              }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          })
        });

        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        
        if (parsed.ativo_nome) setValue('ativo_nome', parsed.ativo_nome);
        if (parsed.sistema) setValue('sistema', parsed.sistema);
        if (parsed.descricao_servico) setValue('descricao_servico', parsed.descricao_servico);
        if (parsed.status_anterior) setValue('status_anterior', parsed.status_anterior);
        if (parsed.status_posterior) setValue('status_posterior', parsed.status_posterior);
        if (parsed.pecas_substituidas) setValue('pecas_substituidas', parsed.pecas_substituidas);
        
        toast.success('Laudo técnico processado via Groq IA!');
        return;
      }

      if (isAudit) {
         setValue('ativo_nome', 'Chiller 01');
         setValue('sistema', 'HVAC - Central');
         setValue('descricao_servico', 'Verificação de níveis de refrigerante e limpeza de filtros.');
         toast.success('Simulação: Laudo preenchido pela IA!');
         return;
      }
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ notes: transcript, reportType: `manutencao_${reportType}`, action: 'generate' })
      })
      const text = await res.text()
      const jsonMatch = text.split('\n__RF_USAGE__')[0].match(/\{[\s\S]*\}/)
      if (jsonMatch) {
         const parsed = JSON.parse(jsonMatch[0])
         if (parsed.ativo_nome) setValue('ativo_nome', parsed.ativo_nome)
         if (parsed.sistema) setValue('sistema', parsed.sistema)
         if (parsed.descricao_servico) setValue('descricao_servico', parsed.descricao_servico)
         toast.success('Laudo técnico preenchido pela IA!')
      }
    } catch (e) { toast.error('Erro ao processar áudio') } 
    finally { setIsGenerating(false) }
  }

  const saveReport = async (data: FormData) => {
    const isAudit = (import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') || !import.meta.env.VITE_SUPABASE_URL);
    if (!isAudit && (!projectId || !user)) return
    setSaving(true)
    const reportData = { 
      ...data, 
      user_id: user?.id || '12345', 
      project_id: projectId || 'audit-id', 
      status: 'finalizado',
      fotos: photos.filter(p => !p.uploading).map(p => ({ url: p.publicUrl || p.url }))
    }
    try {
      if (!isAudit) {
        const itemId = await queueReportSave('maintenance_reports', reportData)
        await tryImmediateSync(itemId)
      }
      openRelatorioManutencaoPDF({
         projectName: projectName || 'Residencial Aurora', reportDate: data.report_date, tecnicoNome: data.tecnico_nome,
         ativoNome: data.ativo_nome, ativoTag: data.ativo_tag, sistema: data.sistema, reportType: data.report_type,
         statusAnterior: data.status_anterior, statusPosterior: data.status_posterior,
         descricaoServico: data.descricao_servico, pecasSubstituidas: data.pecas_substituidas,
         fotos: photos.filter(p => !p.uploading).map(p => ({ url: p.publicUrl || p.url })),
         observacoes: data.observacoes, companyName: profile?.company_name || 'RelatórioFlow Audit', companyLogo: profile?.logo_url
      })
      toast.success(isAudit ? 'Simulação: Relatório gerado com sucesso!' : 'Relatório salvo e sincronizado!')
      navigate('/app/dashboard')
    } catch (e) { toast.error('Erro ao salvar relatório.') } 
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-3xl space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full"><ChevronLeft className="w-5 h-5" /></Button>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight">Manutenção {reportType === 'preventiva' ? 'Preventiva' : 'Corretiva'}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold tracking-widest text-emerald-600">
              <HardDrive className="w-3 h-3" /> {projectName || 'Obra não selecionada'}
            </p>
          </div>
        </div>
      </div>

       <Card className="border-emerald-200 bg-emerald-50/20 overflow-hidden backdrop-blur-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <Button
            type="button"
            onClick={toggleRecording}
            variant={isRecording ? "destructive" : "outline"}
            className={cn("h-12 w-12 rounded-full shadow-lg", isRecording && "animate-pulse")}
          >
            {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5 text-emerald-600" />}
          </Button>
          <div className="flex-1">
             <p className="text-[10px] font-black uppercase text-emerald-900 mb-1">Assistente Técnico IA</p>
             <p className="text-xs text-muted-foreground line-clamp-1">{transcript || 'Descreva a manutenção para preenchimento automático'}</p>
          </div>
          {(transcript || isGenerating) && (
            <Button onClick={handleGlobalAI} disabled={isGenerating || isRecording} className="bg-emerald-600 text-white">
              {isGenerating ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isGenerating ? 'Processando...' : 'Preencher'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs value={reportType} onValueChange={(v: any) => setValue('report_type', v)} className="w-full">
        <TabsList className="grid grid-cols-2 w-full h-12 bg-white/50 border">
          <TabsTrigger value="preventiva" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold h-full rounded-lg">Preventiva</TabsTrigger>
          <TabsTrigger value="corretiva" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white font-bold h-full rounded-lg">Corretiva</TabsTrigger>
        </TabsList>
      </Tabs>

      <form className="space-y-6">
        <Card className="glass border-emerald-100">
          <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><Settings className="w-4 h-4" /> Identificação do Ativo</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase opacity-70">Nome do Ativo</Label>
              <Input {...register('ativo_nome')} placeholder="Ex: Chiller 01, Elevador Social" className="rounded-xl h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase opacity-70">TAG / Identificação</Label>
              <Input {...register('ativo_tag')} placeholder="Ex: TAG-HVAC-001" className="rounded-xl h-10" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[10px] font-bold uppercase opacity-70">Sistema / Disciplina</Label>
              <Input {...register('sistema')} placeholder="Ex: HVAC, Elétrica de Potência" className="rounded-xl h-10" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-emerald-100">
           <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" />Status Operacional</CardTitle></CardHeader>
           <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase opacity-70">Encontrado em</Label>
                <select {...register('status_anterior')} className="w-full h-10 rounded-xl border bg-background text-sm px-3">
                  <option value="operacional">Operacional</option>
                  <option value="falha_parcial">Falha Parcial</option>
                  <option value="parado">Fora de Operação</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase opacity-70">Entregue em</Label>
                <select {...register('status_posterior')} className="w-full h-10 rounded-xl border bg-background text-sm px-3">
                  <option value="operacional">Operacional</option>
                  <option value="falha_parcial">Falha Parcial</option>
                  <option value="parado">Fora de Operação</option>
                </select>
              </div>
           </CardContent>
        </Card>

        <Card className="glass border-emerald-100">
          <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Descrição Técnica</CardTitle></CardHeader>
          <CardContent>
            <Textarea 
              {...register('descricao_servico')} 
              placeholder={reportType === 'preventiva' ? "Relate as tarefas realizadas..." : "Descreva a falha encontrada e a solução aplicada..."}
              className="min-h-32 rounded-2xl p-4" 
            />
          </CardContent>
        </Card>

        <Card className="glass border-emerald-100">
           <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2"><Package className="w-4 h-4" /> Peças Substituídas</CardTitle>
              <Button type="button" size="sm" variant="ghost" onClick={() => appendPeca({ nome: '', qtd: 1 })} className="text-emerald-700 text-xs font-bold">+ Add Peça</Button>
           </CardHeader>
           <CardContent className="space-y-2">
              {pecasFields.map((field, i) => (
                <div key={field.id} className="flex gap-2">
                  <Input {...register(`pecas_substituidas.${i}.nome`)} placeholder="Nome da peça" className="h-9 text-sm flex-1" />
                  <Input {...register(`pecas_substituidas.${i}.qtd`, { valueAsNumber: true })} type="number" className="h-9 w-16 text-center" />
                  <Button variant="ghost" size="icon" onClick={() => removePeca(i)} className="text-red-500 h-9 w-9"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
           </CardContent>
        </Card>
        <Card className="glass border-emerald-100">
           <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2"><Camera className="w-4 h-4" /> Evidências Fotográficas</CardTitle>
              <Button type="button" size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()} className="text-emerald-700 text-xs font-bold">+ Capturar</Button>
           </CardHeader>
           <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                 {photos.map((photo) => (
                   <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-emerald-900/5 group border border-emerald-100">
                     {photo.uploading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px] space-y-2">
                           <Loader2 className="w-5 h-5 animate-spin text-white" />
                           <span className="text-[10px] font-black text-white tabular-nums">{Math.round(uploadProgress[photo.id] || 0)}%</span>
                        </div>
                     ) : (
                        <>
                          <img src={photo.url} alt="evidência" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setPhotos(p => p.filter(x => x.id !== photo.id))}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </>
                     )}
                     {photo.offline && !photo.uploading && (
                        <div className="absolute top-1 left-1 bg-amber-500 rounded-full p-1 shadow-sm">
                           <CloudOff className="w-2.5 h-2.5 text-white" />
                        </div>
                     )}
                   </div>
                 ))}
                 <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 flex flex-col items-center justify-center gap-1 hover:bg-emerald-50 transition-all active:scale-95"
                 >
                    <Plus className="w-5 h-5 text-emerald-400" />
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">Adicionar</span>
                 </button>
              </div>
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handlePhotos(e.target.files)} />
           </CardContent>
        </Card>
      </form>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent backdrop-blur-sm z-50">
        <div className="max-w-3xl mx-auto">
          <Button size="lg" onClick={handleSubmit(saveReport)} disabled={saving} className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20 font-bold h-12">
            {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Finalizar e Exportar Manutenção
          </Button>
        </div>
      </div>
    </div>
  )
}
