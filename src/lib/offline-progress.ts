/**
 * Small, local-only persistence layer for curriculum checkpoints.
 *
 * It uses IndexedDB when available and falls back to memory in restrictive
 * browser contexts. It never performs a network request or keeps a sync queue.
 */
export type OfflineStorageMode = 'indexeddb' | 'memory';

export interface CheckpointProgressRecord {
  key: string;
  profileId: string;
  checkpointId: string;
  completed: boolean;
  completedAt: string | null;
  updatedAt: string;
}

export interface SaveCheckpointProgressInput {
  profileId: string;
  checkpointId: string;
  completed: boolean;
  updatedAt?: string | Date;
}

export interface OfflineProgressExport {
  version: 2;
  exportedAt: string;
  checkpoints: CheckpointProgressRecord[];
}

// Keep the original checkpoint store so an existing learner does not lose
// locally completed checkpoints when upgrading to the private local-only MVP.
const DATABASE_NAME = 'sectrilha-offline-progress';
const DATABASE_VERSION = 2;
const STORE_NAME = 'checkpoint-progress';
const PROFILE_INDEX = 'by-profile';
const LEGACY_SYNC_QUEUE_STORE = 'progress-sync-queue';
const memoryRecords = new Map<string, CheckpointProgressRecord>();
let databasePromise: Promise<IDBDatabase | null> | undefined;

function normalize(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized || normalized.length > 512) throw new Error(`${label} inválido.`);
  return normalized;
}

function recordKey(profileId: string, checkpointId: string) {
  return `${profileId}\u0000${checkpointId}`;
}

function clone(record: CheckpointProgressRecord) {
  return { ...record };
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha no IndexedDB.'));
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = transaction.onerror = () => reject(transaction.error ?? new Error('Falha no IndexedDB.'));
  });
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    } catch {
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const store = request.result.objectStoreNames.contains(STORE_NAME)
        ? request.transaction!.objectStore(STORE_NAME)
        : request.result.createObjectStore(STORE_NAME, { keyPath: 'key' });
      if (!store.indexNames.contains(PROFILE_INDEX)) store.createIndex(PROFILE_INDEX, 'profileId');
      if (request.result.objectStoreNames.contains(LEGACY_SYNC_QUEUE_STORE)) {
        request.result.deleteObjectStore(LEGACY_SYNC_QUEUE_STORE);
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        databasePromise = undefined;
      };
      resolve(database);
    };
    request.onerror = request.onblocked = () => resolve(null);
  });

  return databasePromise;
}

async function useStorage<T>(
  indexedDbOperation: (database: IDBDatabase) => Promise<T>,
  memoryOperation: () => T | Promise<T>,
): Promise<T> {
  const database = await openDatabase();
  if (!database) return memoryOperation();
  try {
    return await indexedDbOperation(database);
  } catch {
    database.close();
    databasePromise = undefined;
    return memoryOperation();
  }
}

export async function getOfflineStorageMode(): Promise<OfflineStorageMode> {
  return (await openDatabase()) ? 'indexeddb' : 'memory';
}

export async function saveCheckpointProgress(input: SaveCheckpointProgressInput): Promise<CheckpointProgressRecord> {
  const profileId = normalize(input.profileId, 'Perfil');
  const checkpointId = normalize(input.checkpointId, 'Checkpoint');
  const updatedAt = input.updatedAt
    ? new Date(input.updatedAt).toISOString()
    : new Date().toISOString();
  if (Number.isNaN(Date.parse(updatedAt))) throw new Error('Data inválida.');

  const record: CheckpointProgressRecord = {
    key: recordKey(profileId, checkpointId),
    profileId,
    checkpointId,
    completed: Boolean(input.completed),
    completedAt: input.completed ? updatedAt : null,
    updatedAt,
  };

  return useStorage(
    async (database) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(record);
      await transactionDone(transaction);
      return clone(record);
    },
    () => {
      memoryRecords.set(record.key, clone(record));
      return clone(record);
    },
  );
}

export async function listCheckpointProgress(profileId: string): Promise<CheckpointProgressRecord[]> {
  const normalizedProfileId = normalize(profileId, 'Perfil');
  return useStorage(
    async (database) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const records = await requestResult<CheckpointProgressRecord[]>(
        transaction.objectStore(STORE_NAME).index(PROFILE_INDEX).getAll(normalizedProfileId),
      );
      await transactionDone(transaction);
      return records.map(clone).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    () => Array.from(memoryRecords.values())
      .filter((record) => record.profileId === normalizedProfileId)
      .map(clone)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );
}

export async function listCompletedCheckpointIds(profileId: string): Promise<string[]> {
  const records = await listCheckpointProgress(profileId);
  return records.filter((record) => record.completed).map((record) => record.checkpointId);
}

export async function clearOfflineProgress(profileId: string): Promise<void> {
  const normalizedProfileId = normalize(profileId, 'Perfil');
  await useStorage(
    async (database) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const keys = await requestResult<IDBValidKey[]>(store.index(PROFILE_INDEX).getAllKeys(normalizedProfileId));
      keys.forEach((key) => store.delete(key));
      await transactionDone(transaction);
    },
    () => {
      for (const [key, record] of memoryRecords) {
        if (record.profileId === normalizedProfileId) memoryRecords.delete(key);
      }
    },
  );
}

export async function exportOfflineProgress(profileId: string): Promise<OfflineProgressExport> {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    checkpoints: await listCheckpointProgress(profileId),
  };
}
