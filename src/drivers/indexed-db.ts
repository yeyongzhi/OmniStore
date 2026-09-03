import { OmniStoreError, normalizeError } from '../core/errors'
import type { IndexedDBOptions, SetOptions, StorageDriver, StorageKey } from '../types'
interface RecordValue { key: IDBValidKey; value: string; expiresAt: number | null }
export class IndexedDBDriver implements StorageDriver {
  readonly name = 'indexedDB' as const
  private readonly options: Required<IndexedDBOptions>; private connection: Promise<IDBDatabase> | undefined
  constructor(namespace: string, options: IndexedDBOptions = {}) { this.options = { databaseName: options.databaseName ?? `omnistore-${namespace}`, storeName: options.storeName ?? 'entries', version: options.version ?? 1 } }
  private open() { if (!globalThis.indexedDB) return Promise.reject(new OmniStoreError('DRIVER_UNAVAILABLE', 'IndexedDB is unavailable.')); return this.connection ??= new Promise<IDBDatabase>((resolve, reject) => { const r = indexedDB.open(this.options.databaseName, this.options.version); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(this.options.storeName)) r.result.createObjectStore(this.options.storeName, { keyPath: 'key' }) }; r.onsuccess = () => { r.result.onversionchange = () => r.result.close(); resolve(r.result) }; r.onerror = () => reject(normalizeError(r.error, 'open')); r.onblocked = () => reject(new OmniStoreError('OPERATION_FAILED', 'IndexedDB upgrade is blocked.')) }) }
  private async request<T>(mode: IDBTransactionMode, action: (s: IDBObjectStore) => IDBRequest<T>) { const db = await this.open(); return new Promise<T>((resolve, reject) => { const tx = db.transaction(this.options.storeName, mode); const r = action(tx.objectStore(this.options.storeName)); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(normalizeError(r.error, 'request')); tx.onabort = () => reject(normalizeError(tx.error, 'transaction')) }) }
  async get(key: StorageKey) { const item = await this.request<RecordValue | undefined>('readonly', s => s.get(key)); if (!item) return null; if (item.expiresAt !== null && item.expiresAt <= Date.now()) { await this.request('readwrite', s => s.delete(key)); return null } return item.value }
  async set(key: StorageKey, value: string, options: SetOptions = {}) { await this.request('readwrite', s => s.put({ key, value, expiresAt: options.ttl == null ? null : Date.now() + options.ttl })) }
  async remove(key: StorageKey) { const existed = await this.request<number>('readonly', s => s.count(key)); await this.request('readwrite', s => s.delete(key)); return existed > 0 }
  async has(key: StorageKey) { return (await this.get(key)) !== null }
  async keys() { return (await this.request<IDBValidKey[]>('readonly', s => s.getAllKeys())).map(String) }
  async size() { return this.request<number>('readonly', s => s.count()) }
  async clear() { await this.request('readwrite', s => s.clear()) }
  async dispose() { (await this.open()).close(); this.connection = undefined }
}
