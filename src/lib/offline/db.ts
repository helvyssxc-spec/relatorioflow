import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface ReportFlowDB extends DBSchema {
  drafts: {
    key: string
    value: {
      id: string
      type: 'daily' | 'technical'
      projectId: string
      content: any // Form state
      updatedAt: number
    }
  }
  sync_queue: {
    key: string
    value: {
      id: string
      type: 'photo_upload' | 'report_save'
      payload: any
      createdAt: number
      attempts: number
    }
  }
  blobs: {
    key: string
    value: {
      id: string
      blob: Blob
      type: string
    }
  }
}

let dbPromise: Promise<IDBPDatabase<ReportFlowDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ReportFlowDB>('RelatorioFlow_MVP', 1, {
      upgrade(db) {
        // drafts por ID
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'id' })
        }
        // fila de sincronização
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' })
        }
        // armazenamento de blobs de fotos offline
        if (!db.objectStoreNames.contains('blobs')) {
          db.createObjectStore('blobs', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function saveDraft(id: string, type: 'daily' | 'technical', projectId: string, content: any) {
  const db = await getDB()
  await db.put('drafts', {
    id,
    type,
    projectId,
    content,
    updatedAt: Date.now(),
  })
}

export async function getDraft(id: string) {
  const db = await getDB()
  return db.get('drafts', id)
}

export async function deleteDraft(id: string) {
  const db = await getDB()
  await db.delete('drafts', id)
}

export async function saveBlob(id: string, blob: Blob, type: string) {
  const db = await getDB()
  await db.put('blobs', { id, blob, type })
}

export async function getBlob(id: string) {
  const db = await getDB()
  return db.get('blobs', id)
}

export async function deleteBlob(id: string) {
  const db = await getDB()
  await db.delete('blobs', id)
}
