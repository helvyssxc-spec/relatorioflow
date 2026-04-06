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
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          notes: text,
          action: 'improve',
          reportType: reportType,
          fieldName: fieldName
        }
      })

      if (error) throw error

      // Note: The edge function returns a stream or a body. 
      // Current supabase-js invoke might not support full streaming easily without manual fetch
      // But for a start, let's assume it returns the text or we handle the text response
      
      // If the function returns a stream, we'd use fetch directly. 
      // Let's check how the function is implemented. It uses 'serve' and returns a 'Response(readable)'.
      
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          notes: text,
          action: 'improve',
          reportType: reportType,
          fieldName: fieldName
        })
      })

      if (!response.ok) throw new Error('Falha na resposta da IA')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          // Look for the usage token at the end and strip it
          const cleanChunk = chunk.split('\n__RF_USAGE__:')[0]
          fullText += cleanChunk
          setGeneratedText(fullText)
        }
      }
      
      handleResult(fullText)
      toast.success('Texto aprimorado com sucesso!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao conectar com a IA. Verifique suas chaves de API.')
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
