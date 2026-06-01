import type { SessionMeta, SessionData } from '../types';

const DB_NAME = 'TeamOrganiserDB';
const DB_VERSION = 1;
const METAS_STORE = 'session_metas';
const DATA_STORE = 'session_data';

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(METAS_STORE)) {
        db.createObjectStore(METAS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DATA_STORE)) {
        db.createObjectStore(DATA_STORE, { keyPath: 'id' });
      }
    };

    req.onsuccess = () => {
      _db = req.result;
      resolve(_db);
    };

    req.onerror = () => reject(req.error);
  });
}

function store<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const req = fn(tx.objectStore(storeName));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getAllMetas(): Promise<SessionMeta[]> {
  return store<SessionMeta[]>(METAS_STORE, 'readonly', (s) => s.getAll());
}

export async function getSessionData(id: string): Promise<SessionData | undefined> {
  return store<SessionData | undefined>(DATA_STORE, 'readonly', (s) => s.get(id));
}

export async function saveSessionMeta(meta: SessionMeta): Promise<void> {
  await store(METAS_STORE, 'readwrite', (s) => s.put(meta));
}

export async function saveSessionData(data: SessionData): Promise<void> {
  await store(DATA_STORE, 'readwrite', (s) => s.put(data));
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([METAS_STORE, DATA_STORE], 'readwrite');
    tx.objectStore(METAS_STORE).delete(id);
    tx.objectStore(DATA_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
