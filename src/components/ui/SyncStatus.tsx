import React from 'react'
import { Cloud, Check, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SyncStatusProps {
  status: 'idle' | 'syncing' | 'synced' | 'error'
  lastSynced?: string;
  className?: string;
}

export function SyncStatus({ status, lastSynced, className }: SyncStatusProps) {
  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all", 
      status === 'syncing' && "text-blue-500 bg-blue-500/10",
      status === 'synced' && "text-emerald-500 bg-emerald-500/10",
      status === 'error' && "text-red-500 bg-red-500/10",
      status === 'idle' && "text-muted-foreground bg-muted/30",
      className
    )}>
      {status === 'syncing' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {status === 'synced' && <Check className="w-3.5 h-3.5" />}
      {status === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
      {status === 'idle' && <Cloud className="w-3.5 h-3.5 opacity-40" />}
      
      <span className="shrink-0">
        {status === 'syncing' && 'Sincronizando rascunho...'}
        {status === 'synced' && (lastSynced ? `Nuvem atualizada ${lastSynced}` : 'Sincronizado na Nuvem')}
        {status === 'error' && 'Erro ao sincronizar'}
        {status === 'idle' && 'Aguardando mudanças'}
      </span>
    </div>
  )
}
