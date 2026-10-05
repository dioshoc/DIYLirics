const DB_NAME = 'diylirics-session';
const DB_VERSION = 1;
const STORE_NAME = 'files';

export type SessionBlobKey = 'audio' | 'cover' | 'customBackground';

type StoredFileRecord = {
  name: string;
  type: string;
  blob: Blob;
};

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open IndexedDB'));
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });

export const saveSessionBlob = async (
  key: SessionBlobKey,
  file: File,
): Promise<void> => {
  const db = await openDb();
  const record: StoredFileRecord = {
    name: file.name,
    type: file.type,
    blob: file,
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('IndexedDB write failed'));
    };
    tx.objectStore(STORE_NAME).put(record, key);
  });
};

export const loadSessionBlob = async (
  key: SessionBlobKey,
): Promise<File | null> => {
  const db = await openDb();

  const record = await new Promise<StoredFileRecord | undefined>(
    (resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => {
        resolve(request.result as StoredFileRecord | undefined);
      };
      request.onerror = () => {
        reject(request.error ?? new Error('IndexedDB read failed'));
      };
      tx.oncomplete = () => {
        db.close();
      };
    },
  );

  if (!record?.blob) {
    return null;
  }

  return new File([record.blob], record.name, { type: record.type });
};

export const deleteSessionBlob = async (key: SessionBlobKey): Promise<void> => {
  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('IndexedDB delete failed'));
    };
    tx.objectStore(STORE_NAME).delete(key);
  });
};
