import React, { useState } from 'react'
import { Sparkles, Loader2, Check, Copy } from 'lucide-react'
import { Button } from './button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface AITextAssistantProps {
  // Aceita ambas as variações de prop usadas nas páginas
  currentText?: string
  context?: string
  onSelect?: (text: string) => void
  onApply?: (text: string) => void
  reportType?: string
  fieldName?: string
}

export function AITextAssistant({ currentText, context, onSelect, onApply, reportType = 'relatorio_tecnico', fieldName }: AITextAssistantProps) {
  const text = currentText || context || ''
  const handleResult = (result: string) => {
    onSelect?.(result)
    onApply?.(result)
  }
  const [loading, setLoading] = useState(false)
  const [generatedText, setGeneratedText] = useState('')

  const handleImprove = async () => {
    if (!text || text.length < 5) {
      toast.error('Escreva algumas notas ou tópicos primeiro para que a IA possa ajudar.')
      return
    }

    setLoading(true)
    setGeneratedText('')
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        toast.error('Sessão expirada. Faça login novamente.')
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            notes: text,
            action: 'improve',
            reportType,
            fieldName,
          }),
        }
      )

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Erro ${response.status}: ${body}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          // Strip trailing usage marker
          const cleanChunk = chunk.split('\n__RF_USAGE__:')[0]
          fullText += cleanChunk
          setGeneratedText(fullText)
        }
      }

      if (!fullText.trim()) throw new Error('Resposta vazia da IA')

      handleResult(fullText.trim())
      toast.success('Texto aprimorado com sucesso!')
    } catch (err: any) {
      toast.error(err?.message?.includes('401')
        ? 'Sem autorização para usar a IA. Faça login novamente.'
        : 'Erro ao conectar com a IA. Tente novamente em alguns segundos.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleImprove}
            disabled={loading}
            className="h-8 px-2 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 rounded-lg group transition-all"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1.5 group-hover:scale-110 transition-transform" />
            )}
            {loading ? 'Processando...' : 'Melhorar com IA'}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-slate-900 text-white border-slate-800">
          <p className="text-xs">Transforma suas notas em texto técnico formal</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
