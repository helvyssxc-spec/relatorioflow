import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Camera, Mic, FileDown, Loader2, X, CheckCircle2,
  ChevronLeft, Sparkles, Square, RotateCcw, Volume2, CloudOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { openDiarioObraPDF } from '@/lib/pdf/generateDiarioObra'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useOfflineSync, useOfflineStatus } from '@/hooks/useOfflineSync'
import { getDB, saveBlob } from '@/lib/offline/db'

// ── Types ──────────────────────────────────────────────────────────────────
interface PhotoItem { id: string; url: string; publicUrl: string; caption: string; uploading?: boolean; offline?: boolean }
type GenerateState = 'idle' | 'generating' | 'done'
type RecordState   = 'idle' | 'recording' | 'done'

// ── AI streaming helper ────────────────────────────────────────────────────
async function streamGenerateRDO(payload: Record<string, unknown>): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  const authToken = session?.access_token ?? ''

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(err.error ?? `Erro ${response.status}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let result = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    result += decoder.decode(value)
  }
  return result.replace(/\n__RF_USAGE__:.*$/s, '').trim()
}

// ── Image compression ──────────────────────────────────────────────────────
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

// ── Waveform bars — pure CSS animation, no JS loop ────────────────────────
const WAVE_HEIGHTS = [40, 70, 55, 85, 60, 95, 50, 75, 45, 90, 65, 80, 55, 70, 40, 85, 60, 75, 50, 65]

function WaveformBars() {
  return (
    <div className="flex items-center gap-[2px] h-5 mt-1">
      {WAVE_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="w-[3px] bg-red-400 rounded-full"
          style={{
            height: `${h}%`,
            animation: `rdoWave ${0.6 + (i % 5) * 0.12}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.04}s`,
          }}
        />
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
export default function DiarioObra() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const projectId = searchParams.get('project')
  
  // ── Offline Sync ──
  useOfflineSync()

  // ── state ──
  const [projectData, setProjectData] = useState<any>(null)
  const [photos, setPhotos]           = useState<PhotoItem[]>([])
  const fileInputRef                  = useRef<HTMLInputElement>(null)

  const [recordState, setRecordState] = useState<RecordState>('idle')
  const [transcript, setTranscript]   = useState('')
  const [audioTime, setAudioTime]     = useState(0)
  const recognitionRef                = useRef<any>(null)
  const audioTimerRef                 = useRef<ReturnType<typeof setInterval> | null>(null)

  const [notes, setNotes]             = useState('')
  const [genState, setGenState]       = useState<GenerateState>('idle')
  const [generatedText, setGeneratedText] = useState('')
  const [sessionId]                   = useState(() => crypto.randomUUID())

  // ── structured data from AI ──
  const [weather, setWeather] = useState('')
  const [temp, setTemp]       = useState('')
  const [team, setTeam]       = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [occurrences, setOccurrences] = useState('')

  // ── load project ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId || !user) return
    ;(supabase as any).from('projects').select('*').eq('id', projectId).single()
      .then(({ data }: any) => { if (data) setProjectData(data) })
  }, [projectId, user])

  // ── PHOTOS ───────────────────────────────────────────────────────────────
  const isOnline = useOfflineStatus()

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const handlePhotos = useCallback(async (files: FileList | null) => {
    if (!files || !user) return
    for (const file of Array.from(files)) {
      const tempId  = crypto.randomUUID()
      const preview = URL.createObjectURL(file)
      setPhotos(p => [...p, { id: tempId, url: preview, publicUrl: '', caption: '', uploading: true }])
      setUploadProgress(prev => ({ ...prev, [tempId]: 0 }))

      try {
        const blob = await compressImg(file)
        await saveBlob(tempId, blob, file.type)

        const ext  = file.type === 'image/png' ? 'png' : 'jpg'
        const path = `${user.id}/diario/${sessionId}/${tempId}.${ext}`

        if (!isOnline) {
          // Offline: Simula progresso rápido até salvar no IDB
          let prog = 0
          const interval = setInterval(() => {
            prog += 15
            if (prog >= 100) {
              clearInterval(interval)
              setPhotos(p => p.map(x => x.id === tempId
                ? { ...x, url: preview, publicUrl: '', uploading: false, offline: true }
                : x
              ))
              toast.info('Foto salva localmente.')
            }
            setUploadProgress(prev => ({ ...prev, [tempId]: Math.min(prog, 100) }))
          }, 50)
          
          const db = await getDB()
          await db.put('sync_queue', {
            id: tempId,
            type: 'photo_upload',
            payload: { photoId: tempId, userId: user.id, path, type: file.type, bucket: 'report-images' },
            createdAt: Date.now(),
            attempts: 0
          })
        } else {
          // Online: Simula progresso fluido enquanto aguarda Supabase
          const interval = setInterval(() => {
            setUploadProgress(prev => {
              const current = prev[tempId] || 0
              if (current < 92) return { ...prev, [tempId]: current + (92 - current) * 0.1 }
              return prev
            })
          }, 200)

          const { error } = await supabase.storage.from('report-images').upload(path, blob, { contentType: 'image/jpeg' })
          
          clearInterval(interval)
          if (error) throw error
          
          setUploadProgress(prev => ({ ...prev, [tempId]: 100 }))
          const { data: urlData } = supabase.storage.from('report-images').getPublicUrl(path)
          
          setTimeout(() => {
            setPhotos(p => p.map(x => x.id === tempId
              ? { ...x, url: preview, publicUrl: urlData.publicUrl, uploading: false }
              : x
            ))
          }, 300)
        }
      } catch (e) {
        console.error(e)
        setPhotos(p => p.filter(x => x.id !== tempId))
        toast.error('Erro ao processar foto.')
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [user, isOnline, sessionId])

  // ── SPEECH-TO-TEXT ────────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      toast.error('Fala não suportada neste navegador. Use o Chrome.')
      return
    }
    const rec = new SR()
    rec.lang = 'pt-BR'
    rec.continuous = true
    rec.interimResults = true
    recognitionRef.current = rec

    let finals = transcript

    rec.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finals += (finals ? ' ' : '') + t
        else interim += t
      }
      setTranscript(finals + (interim ? ' ' + interim : ''))
    }
    rec.onerror = () => stopRecording()
    rec.onend   = () => { if (recordState === 'recording') stopRecording() }

    rec.start()
    setRecordState('recording')
    setAudioTime(0)
    audioTimerRef.current = setInterval(() => setAudioTime(t => t + 1), 1000)
  }, [transcript, recordState])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    if (audioTimerRef.current) { clearInterval(audioTimerRef.current); audioTimerRef.current = null }
    setRecordState('done')
  }, [])

  const resetAudio = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    if (audioTimerRef.current) { clearInterval(audioTimerRef.current); audioTimerRef.current = null }
    setTranscript('')
    setAudioTime(0)
    setRecordState('idle')
  }, [])

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // ── GENERATE ──────────────────────────────────────────────────────────────
  const hasContent = photos.length > 0 || transcript.trim().length > 0 || notes.trim().length > 0

  const generate = async () => {
    if (!hasContent) { toast.error('Adicione fotos, voz ou observações.'); return }
    if (!user)       { toast.error('Usuário não autenticado.'); return }

    setGenState('generating')
    setGeneratedText('')

    const today = new Date().toLocaleDateString('pt-BR')
    const rawNotes = [
      transcript ? `[Fala transcrita]: ${transcript.trim()}` : '',
      notes      ? `[Observações do campo]: ${notes.trim()}`  : '',
      photos.length > 0 ? `[Fotos capturadas]: ${photos.filter(p => !p.uploading).length}` : '',
      projectData?.name          ? `[Obra]: ${projectData.name}`          : '',
      projectData?.address       ? `[Endereço]: ${projectData.address}`   : '',
      projectData?.client_name   ? `[Cliente]: ${projectData.client_name}`: '',
      `[Data]: ${today}`,
    ].filter(Boolean).join('\n')

    try {
      const text = await streamGenerateRDO({
        reportType:      'diario_de_obra',
        notes:           rawNotes,
        responsibleName: profile?.full_name ?? 'Responsável Técnico',
        reportDate:      today,
        imagesCount:     photos.filter(p => !p.uploading).length,
      })
      
      // LOG DE AUDITORIA
      if (user) {
        await (supabase as any).from('audit_logs').insert({
          user_id: user.id,
          action: 'report.generated',
          metadata: {
            report_type: 'diario_de_obra',
            session_id: sessionId,
            images_count: photos.length,
            chars_input: rawNotes.length
          }
        })
      }

      // Tenta parsear o JSON retornado pela IA
      try {
        const parsed = JSON.parse(text)
        setWeather(parsed.clima ?? '')
        setTemp(parsed.temperatura ?? '')
        setTeam(parsed.equipe ?? [])
        setServices(parsed.servicos ?? [])
        setOccurrences(parsed.ocorrencias ?? '')
        setGeneratedText(parsed.texto_final ?? '')
      } catch {
        // Se falhar o parse (ex: markdown em volta), tenta extrair o que está entre chaves
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0])
            setWeather(parsed.clima ?? '')
            setTemp(parsed.temperatura ?? '')
            setTeam(parsed.equipe ?? [])
            setServices(parsed.servicos ?? [])
            setOccurrences(parsed.ocorrencias ?? '')
            setGeneratedText(parsed.texto_final ?? '')
          } catch {
            setGeneratedText(text) // Fallback para texto puro
          }
        } else {
          setGeneratedText(text)
        }
      }
      
      setGenState('done')
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao gerar relatório.')
      setGenState('idle')
    }
  }

  // ── EXPORT PDF ────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    const date = new Date().toISOString().split('T')[0]
    const reportData = {
      user_id:        user.id,
      project_id:     projectId,
      report_date:    date,
      responsavel:    profile?.full_name ?? 'Responsável Técnico',
      condicao_tempo: weather || 'Não informado',
      temperatura:    temp || '',
      clima_json:     {},
      equipe:         team,
      atividades:     services.map(s => ({ 
        descricao: s.desc, 
        disciplina: 'Geral', 
        percentual_concluido: s.percentual, 
        observacao: '' 
      })),
      equipamentos:   [],
      ocorrencias:    occurrences || transcript || notes || '',
      fotos:          photos.filter(p => !p.uploading).map(p => ({ id: p.id, url: p.publicUrl, caption: p.caption })),
      status:         'finalizado',
    }

    try {
      if (projectId && user) {
        if (!isOnline) {
          const db = await getDB()
          await db.put('sync_queue', {
            id: `report-${Date.now()}`,
            type: 'report_save',
            payload: { table: 'daily_reports', data: reportData },
            createdAt: Date.now(),
            attempts: 0
          })
          toast.info('Relatório salvo em modo offline. Será sincronizado em breve.')
        } else {
          await (supabase as any).from('daily_reports').upsert(reportData, { onConflict: 'project_id,report_date' })
        }
      }
    } catch (e) { console.error('Erro ao salvar:', e) }

    openDiarioObraPDF({
      projectName:     projectData?.name ?? 'Obra',
      projectAddress:  projectData?.address,
      clientName:      projectData?.client_name,
      artRrt:          projectData?.art_rrt,
      companyName:     profile?.company_name,
      companyLogo:     profile?.logo_url,
      responsavelNome: profile?.full_name ?? 'Responsável Técnico',
      creaCau:         profile?.crea_cau,
      reportDate:      date,
      condicaoTempo:   'Não informado',
      equipe:          [],
      atividades:      [{ descricao: generatedText, disciplina: 'Geral', percentual_concluido: 100 }],
      equipamentos:    [],
      ocorrencias:     generatedText,
      fotos:           photos.filter(p => !p.uploading).map(p => ({ url: p.publicUrl || p.url, caption: p.caption })),
    })

    toast.success('PDF aberto!')
    navigate('/app/reports')
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER — layout encaixa dentro do AppLayout (sem min-h-screen)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* CSS global para a waveform — injeta uma única vez */}
      <style>{`
        @keyframes rdoWave {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
      `}</style>

      <div className="max-w-lg mx-auto space-y-1 pb-28">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-5">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full -ml-2">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-black text-foreground">Diário de Obra</h1>
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
              {projectData?.name ?? 'Carregando obra...'}
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════
            BLOCO 1 — FOTOS
        ════════════════════════════════════════ */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-wider text-foreground">Fotos de Campo</span>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-full transition-colors"
            >
              + Adicionar
            </button>
          </div>

          <div className="p-3">
            {photos.length === 0 ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-28 rounded-xl border-2 border-dashed border-primary/15 bg-primary/3 flex flex-col items-center justify-center gap-2 hover:bg-primary/6 hover:border-primary/30 transition-all active:scale-[0.98]"
              >
                <Camera className="w-7 h-7 text-primary/30" />
                <span className="text-[11px] font-bold text-primary/40 uppercase tracking-wider">
                  Toque para capturar ou selecionar
                </span>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
                    {photo.uploading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px] space-y-2">
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span className="text-[10px] font-black text-white tabular-nums">
                          {Math.round(uploadProgress[photo.id] || 0)}%
                        </span>
                        <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300 ease-out" 
                            style={{ width: `${uploadProgress[photo.id] || 0}%` }} 
                          />
                        </div>
                      </div>
                    )}
                    
                    {!photo.uploading && (
                      <img src={photo.url} alt="evidência" className="w-full h-full object-cover" />
                    )}

                    {photo.offline && !photo.uploading && (
                      <div className="absolute top-1 left-1 bg-amber-500 rounded-full p-1 shadow-sm" title="Pendente de sincronização">
                        <CloudOff className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}

                    {!photo.uploading && (
                      <button
                        onClick={() => setPhotos(p => p.filter(x => x.id !== photo.id))}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>
                ))}
                {/* tile de adicionar mais */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-primary/20 bg-primary/3 flex items-center justify-center hover:bg-primary/6 transition-all active:scale-95"
                >
                  <span className="text-xl text-primary/30 font-bold">+</span>
                </button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handlePhotos(e.target.files)}
          />
        </div>

        {/* ════════════════════════════════════════
            BLOCO 2 — VOZ (Speech-to-Text)
        ════════════════════════════════════════ */}
        <div className={cn(
          "rounded-2xl border overflow-hidden transition-colors duration-300",
          recordState === 'recording'
            ? "border-red-400/50 bg-red-50/50 dark:bg-red-950/20"
            : recordState === 'done'
            ? "border-emerald-400/40 bg-emerald-50/40 dark:bg-emerald-950/10"
            : "border-border/60 bg-card"
        )}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-wider text-foreground">Ditado por Voz</span>
              <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-bold uppercase">
                Auto-transcrição
              </span>
            </div>
            {recordState !== 'idle' && (
              <button onClick={resetAudio} className="text-[11px] text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>

          <div className="p-4">
            {/* Botão + status */}
            <div className="flex items-center gap-4">
              {recordState === 'idle' && (
                <button
                  onClick={startRecording}
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25 flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
                >
                  <Mic className="w-6 h-6 text-white" />
                </button>
              )}

              {recordState === 'recording' && (
                <button
                  onClick={stopRecording}
                  className="relative w-14 h-14 rounded-full bg-red-500 shadow-lg shadow-red-500/30 flex items-center justify-center flex-shrink-0 active:scale-90"
                >
                  <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-25" />
                  <Square className="w-5 h-5 text-white" />
                </button>
              )}

              {recordState === 'done' && (
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                {recordState === 'idle' && (
                  <div>
                    <p className="text-sm font-semibold text-foreground">Toque para falar</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Descreva as atividades, ocorrências e observações do dia
                    </p>
                  </div>
                )}

                {recordState === 'recording' && (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-bold text-red-600">
                        Ouvindo — {fmtTime(audioTime)}
                      </span>
                    </div>
                    <WaveformBars />
                  </div>
                )}

                {recordState === 'done' && (
                  <div>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      Transcrição concluída — {fmtTime(audioTime)}
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      O texto abaixo será usado para gerar o relatório
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Transcrição */}
            {transcript && (
              <div className="mt-3 p-3 rounded-xl bg-background/60 border border-border/40">
                <div className="flex items-center gap-1.5 mb-2">
                  <Volume2 className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Transcrição</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{transcript}</p>
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════
            BLOCO 3 — NOTAS OPCIONAIS
        ════════════════════════════════════════ */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
            <span className="text-base">📝</span>
            <span className="text-xs font-black uppercase tracking-wider text-foreground">Observações</span>
            <span className="text-[9px] text-muted-foreground font-semibold ml-1">(opcional)</span>
          </div>
          <div className="p-3">
            <Textarea
              placeholder="Descreva o que foi feito, materiais usados, interferências, visitas técnicas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[90px] rounded-xl resize-none border-border/40 bg-transparent focus-visible:ring-1 focus-visible:ring-primary/30 text-sm"
            />
          </div>
        </div>

        {/* ════════════════════════════════════════
            BLOCO 4 — RESULTADO DA IA
        ════════════════════════════════════════ */}
        {genState !== 'idle' && (
          <div className={cn(
            "rounded-2xl border overflow-hidden transition-all",
            genState === 'generating'
              ? "border-primary/20 bg-primary/3"
              : "border-blue-500/30 bg-blue-50/5 dark:bg-blue-900/10"
          )}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-inherit">
              {genState === 'generating'
                ? <Loader2 className="w-4 h-4 animate-spin text-primary" />
                : <Sparkles className="w-4 h-4 text-blue-500" />
              }
              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                {genState === 'generating' ? 'Gerando dados técnicos...' : 'Dados Extraídos com Sucesso ✓'}
              </span>
            </div>

            {genState === 'generating' && (
              <div className="p-6 space-y-4">
                {[90, 80, 95, 70].map((w, i) => (
                  <div key={i} className="h-3 bg-primary/10 rounded-full animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }} />
                ))}
                <p className="text-center text-xs text-muted-foreground animate-pulse p-4">A IA está transformando seu áudio e fotos em dados técnicos...</p>
              </div>
            )}

            {genState === 'done' && (
              <div className="p-6 space-y-8">
                {/* Cabeçalho Rápido */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Clima</label>
                    <Input value={weather} onChange={e => setWeather(e.target.value)} className="h-9 rounded-xl bg-background/50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Temp.</label>
                    <Input value={temp} onChange={e => setTemp(e.target.value)} className="h-9 rounded-xl bg-background/50" />
                  </div>
                </div>

                {/* Efetivo */}
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Efetivo em Campo</label>
                    <Button variant="ghost" size="sm" onClick={() => setTeam([...team, { cargo: 'Novo', qtd: 1 }])} className="h-6 text-[10px] uppercase font-bold text-primary">Add</Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {team.map((m, i) => (
                      <div key={i} className="flex gap-2 p-2 rounded-xl bg-background/40 border border-white/5">
                        <Input value={m.cargo} onChange={e => {
                          const nt = [...team]; nt[i].cargo = e.target.value; setTeam(nt);
                        }} className="h-7 text-xs bg-transparent border-none p-0 focus-visible:ring-0" />
                        <Input type="number" value={m.qtd} onChange={e => {
                          const nt = [...team]; nt[i].qtd = Number(e.target.value); setTeam(nt);
                        }} className="h-7 w-12 text-center text-xs bg-white/5 border-none rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Atividades */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Serviços Executados</label>
                    <Button variant="ghost" size="sm" onClick={() => setServices([...services, { desc: '', percentual: 100 }])} className="h-6 text-[10px] uppercase font-bold text-primary">Add</Button>
                  </div>
                  <div className="space-y-3">
                    {services.map((s, i) => (
                      <div key={i} className="p-3 rounded-xl bg-background/40 border border-white/5 space-y-2">
                        <Textarea value={s.desc} onChange={e => {
                          const ns = [...services]; ns[i].desc = e.target.value; setServices(ns);
                        }} className="min-h-[50px] text-xs bg-transparent border-none p-0 resize-none focus-visible:ring-0" />
                        <div className="flex items-center gap-2">
                          <input type="range" value={s.percentual} onChange={e => {
                            const ns = [...services]; ns[i].percentual = Number(e.target.value); setServices(ns);
                          }} className="flex-1 accent-primary h-1 bg-white/10 rounded-full appearance-none cursor-pointer" />
                          <span className="text-[10px] font-mono text-primary font-bold">{s.percentual}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ocorrências */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Ocorrências / Observações</label>
                  <Textarea
                    value={occurrences}
                    onChange={e => setOccurrences(e.target.value)}
                    className="min-h-[80px] text-xs rounded-xl bg-background/50 border-white/5 p-4"
                  />
                </div>

                {/* Texto Final */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Relatório Descritivo (Texto Final)</label>
                  <Textarea
                    value={generatedText}
                    onChange={e => setGeneratedText(e.target.value)}
                    className="min-h-[200px] text-sm leading-relaxed rounded-xl bg-background/50 border-white/5 p-4"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pb-2">
                  <Button variant="outline" className="rounded-xl h-11 text-xs font-bold uppercase tracking-wider" onClick={() => setGenState('idle')}>Limpar</Button>
                  <Button className="bg-primary text-primary-foreground rounded-xl h-11 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20" onClick={exportPDF}>
                    <FileDown className="w-4 h-4 mr-1" /> Exportar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            STATUS BAR — fotos prontas
        ════════════════════════════════════════ */}
        {(photos.length > 0 || transcript || notes) && genState === 'idle' && (
          <div className="flex items-center gap-3 px-1 py-1 text-[11px] text-muted-foreground font-semibold">
            {photos.filter(p => !p.uploading).length > 0 && (
              <span className="flex items-center gap-1">
                <Camera className="w-3 h-3" />
                {photos.filter(p => !p.uploading).length} foto{photos.filter(p => !p.uploading).length > 1 ? 's' : ''}
              </span>
            )}
            {transcript && (
              <span className="flex items-center gap-1">
                <Mic className="w-3 h-3" />
                {transcript.split(' ').length} palavras
              </span>
            )}
            {notes && (
              <span className="flex items-center gap-1">
                <span>📝</span>
                {notes.length} chars
              </span>
            )}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          BOTTOM BAR — flutua sobre o conteúdo
      ════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
        <div className="pointer-events-auto max-w-lg mx-auto px-4 pb-4 pt-6 bg-gradient-to-t from-background via-background/95 to-transparent">

          {genState !== 'done' ? (
            <Button
              size="lg"
              onClick={generate}
              disabled={!hasContent || genState === 'generating' || !isOnline}
              className={cn(
                "w-full h-13 rounded-2xl font-black text-sm shadow-xl tracking-wide transition-all",
                hasContent && isOnline
                  ? "bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]"
                  : "bg-muted text-muted-foreground shadow-none cursor-not-allowed"
              )}
            >
              {!isOnline 
                ? <><CloudOff className="w-4 h-4 mr-2" /> IA indisponível sem conexão</>
                : genState === 'generating'
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando com IA...</>
                  : <><Sparkles className="w-4 h-4 mr-2" /> Gerar Relatório</>
              }
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => { setGenState('idle'); setGeneratedText('') }}
                className="rounded-2xl h-13 border-border/60 font-bold px-5 shrink-0"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" /> Refazer
              </Button>
              <Button
                size="lg"
                onClick={exportPDF}
                className="flex-1 h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xl shadow-emerald-500/25 active:scale-[0.98] tracking-wide"
              >
                <FileDown className="w-4 h-4 mr-2" /> Baixar PDF
              </Button>
            </div>
          )}

          {!hasContent && genState === 'idle' && (
            <p className="text-center text-[11px] text-muted-foreground mt-2 font-medium">
              Adicione pelo menos uma foto, voz ou observação
            </p>
          )}
        </div>
      </div>
    </>
  )
}
