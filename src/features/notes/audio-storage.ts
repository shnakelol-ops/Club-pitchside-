const DB_NAME = "pitchflow_notes_audio_v1";
const DB_VERSION = 1;
const STORE_NAME = "audioBlobs";

function getIndexedDbFactory(): IDBFactory | null {
  if (typeof window === "undefined") return null;
  return window.indexedDB ?? null;
}

function requestToPromise<T>(
  request: IDBRequest<T>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

let openDatabasePromise: Promise<IDBDatabase> | null = null;

async function openDatabase(): Promise<IDBDatabase> {
  if (openDatabasePromise) return openDatabasePromise;

  const indexedDbFactory = getIndexedDbFactory();
  if (!indexedDbFactory) {
    throw new Error("IndexedDB is not available in this environment");
  }

  openDatabasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDbFactory.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        openDatabasePromise = null;
      };
      resolve(database);
    };

    request.onerror = () => {
      openDatabasePromise = null;
      reject(request.error ?? new Error("Failed to open IndexedDB"));
    };
  });

  return openDatabasePromise;
}

export async function saveAudioBlob(audioBlobId: string, blob: Blob): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.put(blob, audioBlobId);
  await transactionDone(transaction);
}

export async function readAudioBlob(audioBlobId: string): Promise<Blob | null> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const result = await requestToPromise(store.get(audioBlobId));
  await transactionDone(transaction);
  return result instanceof Blob ? result : null;
}

export async function deleteAudioBlob(audioBlobId: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.delete(audioBlobId);
  await transactionDone(transaction);
}

export async function hasAudioBlob(audioBlobId: string): Promise<boolean> {
  const blob = await readAudioBlob(audioBlobId);
  return blob != null;
}

