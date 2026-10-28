import type { ImageAsset } from "../../types/image";

const DATABASE_NAME = "pon-slide:assets";
const DATABASE_VERSION = 1;
const IMAGE_STORE = "images";

function openImageDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("このブラウザでは画像を保存できません。IndexedDBを利用できるブラウザで開いてください。"));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    let blocked = false;
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(IMAGE_STORE)) {
        database.createObjectStore(IMAGE_STORE, { keyPath: "id" });
      }
    };
    request.onblocked = () => {
      blocked = true;
      reject(new Error("別のタブを閉じてから、もう一度画像を読み込んでください。"));
    };
    request.onerror = () => reject(request.error ?? new Error("画像の保存先を開けませんでした。"));
    request.onsuccess = () => {
      const database = request.result;
      if (blocked) { database.close(); return; }
      database.onversionchange = () => database.close();
      resolve(database);
    };
  });
}

/** リクエストの成功ではなく、トランザクションの完了を待ってから成功を返す。 */
async function withImageStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T> | undefined,
): Promise<T | undefined> {
  const database = await openImageDatabase();
  return new Promise((resolve, reject) => {
    let transaction: IDBTransaction;
    try { transaction = database.transaction(IMAGE_STORE, mode); }
    catch (error) { database.close(); reject(error); return; }
    let request: IDBRequest<T> | undefined;
    transaction.oncomplete = () => {
      database.close();
      resolve(request?.result);
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("画像の保存処理が中断されました。"));
    };
    try {
      request = operation(transaction.objectStore(IMAGE_STORE));
    } catch (error) {
      transaction.abort();
      database.close();
      reject(error);
    }
  });
}

export async function getImageAsset(id: string): Promise<ImageAsset | undefined> {
  return withImageStore<ImageAsset | undefined>("readonly", (store) => store.get(id));
}

/** 複数画像は一括保存する。途中で失敗した場合は全件をロールバックする。 */
export async function saveImageAssets(assets: ImageAsset[]): Promise<void> {
  if (assets.length === 0) return;
  await withImageStore("readwrite", (store) => {
    for (const asset of assets) store.put(asset);
    return undefined;
  });
}

export function imageErrorMessage(error: unknown): string {
  if (error instanceof Error && error.name === "QuotaExceededError") {
    return "画像を保存する空き容量がありません。不要なサイトデータを整理してから再度お試しください。";
  }
  return error instanceof Error ? error.message : "画像の処理に失敗しました。";
}
