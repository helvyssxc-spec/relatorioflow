import { getDB, saveBlob } from './db'
import { supabase } from '@/integrations/supabase/client'

export type ReportType = 'daily' | 'technical' | 'maintenance';

interface SyncItem {
  table: string;
  data: any;
}

export async function queueReportSave(table: string, data: any) {
  const db = await getDB()
  const id = crypto.randomUUID()
  
  // Adiciona na fila de sincronização
  await db.put('sync_queue', {
    id,
    type: 'report_save',
    payload: { table, data },
    createdAt: Date.now(),
    attempts: 0
  })
  
  return id
}

export async function queuePhotoUpload(file: File, path: string, bucket: string = 'reports') {
  const db = await getDB()
  const photoId = crypto.randomUUID()
  
  // 1. Salva o binário (blob) para não perder a foto
  await saveBlob(photoId, file, file.type)
  
  // 2. Adiciona na fila de upload
  await db.put('sync_queue', {
    id: crypto.randomUUID(),
    type: 'photo_upload',
    payload: {
      photoId,
      path,
      bucket,
      type: file.type
    },
    createdAt: Date.now(),
    attempts: 0
  })
  
  return photoId
}

/**
 * Tenta sincronizar um item específico imediatamente 
 * ou retorna falso para deixar na fila de background
 */
export async function tryImmediateSync(itemId: string) {
  const db = await getDB()
  const item = await db.get('sync_queue', itemId)
  if (!item) return false

  try {
    if (item.type === 'report_save') {
      const { table, data } = item.payload
      const { error } = await (supabase as any).from(table).upsert(data)
      if (error) throw error
    } 
    // Se sucesso, remove da fila
    await db.delete('sync_queue', itemId)
    return true
  } catch (e) {
    console.warn('Sync imediato falhou, item mantido na fila offline:', e)
    return false
  }
}
