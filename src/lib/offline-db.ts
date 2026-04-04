/**
 * 🛠️ Native IndexedDB Wrapper for RelatórioFlow
 * 
 * Provides offline persistence for report drafts without external dependencies.
 */

const DB_NAME = "relatorioflow_offline";
const DB_VERSION = 1;
const STORE_NAME = "drafts";

export interface DraftData {
  id: string;
  data: any;
  updated_at: string;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event: any) => reject(event.target.error);
  });
};

export const saveDraft = async (id: string, data: any): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    
    const entry: DraftData = {
      id,
      data,
      updated_at: new Date().toISOString(),
    };

    const request = store.put(entry);
    request.onsuccess = () => resolve();
    request.onerror = (event: any) => reject(event.target.error);
  });
};

export const getDraft = async (id: string): Promise<DraftData | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = (event: any) => resolve(event.target.result || null);
    request.onerror = (event: any) => reject(event.target.error);
  });
};

export const deleteDraft = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = (event: any) => reject(event.target.error);
  });
};
