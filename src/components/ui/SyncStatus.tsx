import { useEffect, useState } from 'react'
import { Cloud, CloudOff, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SyncState = 'syncing' | 'synced' | 'offline'

interface SyncStatusProps {
  /** Estado controlado externamente (syncing/synced). O estado 'offline'
   *  é detectado automaticamente via navigator.onLine. */
  status: SyncState
  /** Hora da última sincronização (ex: "às 14:32") */
  lastSynced?: string
  className?: string
}

/** Hook interno — detecta conectividade em tempo real */
function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online',  on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

export function SyncStatus({ status, lastSynced, className }: SyncStatusProps) {
  const isOnline = useOnlineStatus()

  // Offline tem prioridade sobre o estado informado pelo pai
  const effective: SyncState = !isOnline ? 'offline' : status

  const config = {
    syncing: {
      label: 'Sincronizando...',
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      pill: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    synced: {
      label: lastSynced ? `Sincronizado ${lastSynced}` : 'Sincronizado',
      icon: <Check className="w-3.5 h-3.5" />,
      pill: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    offline: {
      label: 'Offline — salvo localmente',
      icon: <CloudOff className="w-3.5 h-3.5" />,
      pill: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
  }

  const { label, icon, pill } = config[effective]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border',
        'text-[10px] font-semibold uppercase tracking-widest',
        'transition-all duration-500',
        pill,
        className
      )}
      title={
        effective === 'offline'
          ? 'Sem conexão. Seus dados estão salvos no dispositivo e serão enviados automaticamente quando a rede voltar.'
          : effective === 'syncing'
          ? 'Enviando alterações para a nuvem...'
          : 'Todas as alterações foram salvas na nuvem.'
      }
    >
      {icon}
      <span className="shrink-0 leading-none">{label}</span>
    </div>
  )
}

/** Componente minimalista para usar no header (sem texto, só ícone + tooltip) */
export function SyncDot({ status, className }: { status: SyncState; className?: string }) {
  const isOnline = useOnlineStatus()
  const effective: SyncState = !isOnline ? 'offline' : status

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors duration-500',
        effective === 'synced'  && 'text-emerald-500',
        effective === 'syncing' && 'text-blue-400',
        effective === 'offline' && 'text-amber-400',
        className
      )}
    >
      {effective === 'syncing' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {effective === 'synced'  && <Cloud   className="w-3.5 h-3.5" />}
      {effective === 'offline' && <CloudOff className="w-3.5 h-3.5" />}
    </span>
  )
}
