import { useEffect, useState, useCallback } from 'react'
import { getDB, deleteBlob, getBlob } from '@/lib/offline/db'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return isOnline
}

export function useOfflineSync() {
  const isOnline = useOfflineStatus()
  const [syncing, setSyncing] = useState(false)

  const triggerSync = useCallback(async () => {
    if (!isOnline || syncing) return
    setSyncing(true)

    const db = await getDB()
    const queue = await db.getAll('sync_queue')

    if (queue.length === 0) {
      setSyncing(false)
      return
    }

    toast.info(`Sincronizando ${queue.length} pendências...`)

    for (const item of queue) {
      try {
        if (item.type === 'photo_upload') {
          const { photoId, userId, path, type, bucket = 'reports' } = item.payload
          const blobData = await getBlob(photoId)

          if (blobData) {
            const { error: uploadError } = await supabase.storage.from(bucket).upload(
              path,
              blobData.blob,
              { contentType: type, upsert: true }
            )
            if (uploadError) throw uploadError
            await deleteBlob(photoId)
          }
        } else if (item.type === 'report_save') {
           const { table, data } = item.payload
           const { error } = await (supabase as any).from(table).upsert(data)
           if (error) throw error
        }

        // Se deu sucesso, remove da fila
        await db.delete('sync_queue', item.id)
      } catch {
        const retries = (item.retries ?? 0) + 1
        if (retries >= 3) {
          await db.delete('sync_queue', item.id)
          toast.error('Falha ao sincronizar um item após 3 tentativas. Verifique sua conexão.')
        } else {
          await db.put('sync_queue', { ...item, retries })
        }
      }
    }

    setSyncing(false)
    toast.success('Sincronização concluída!')
  }, [isOnline, syncing])

  useEffect(() => {
    if (isOnline) triggerSync()
  }, [isOnline, triggerSync])

  return { isOnline, syncing, triggerSync }
}
