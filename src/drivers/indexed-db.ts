import { OmniStoreError, normalizeError } from '../core/errors'
import type { IndexedDBOptions, SetOptions, StorageDriver, StorageKey } from '../types'
interface RecordValue { key: string; value: string; expiresAt: number | null }
export class IndexedDBDriver implements StorageDriver {
  readonly name = 'indexedDB' as const
  private readonly options: Required<IndexedDBOptions>; private connection: Promise<IDBDatabase> | undefined
  constructor(namespace: string, options: IndexedDBOptions = {}) { this.options = { databaseName: options.databaseName ?? `omnistore-${namespace}`, storeName: options.storeName ?? 'entries', version: options.version ?? 1 } }
  private normalizeKey(key: StorageKey) { return String(key) }
  private open() { if (!globalThis.indexedDB) return Promise.reject(new OmniStoreError('DRIVER_UNAVAILABLE', 'IndexedDB is unavailable.')); return this.connection ??= new Promise<IDBDatabase>((resolve, reject) => { const r = indexedDB.open(this.options.databaseName, this.options.version); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(this.options.storeName)) r.result.createObjectStore(this.options.storeName, { keyPath: 'key' }) }; r.onsuccess = () => { r.result.onversionchange = () => r.result.close(); resolve(r.result) }; r.onerror = () => reject(normalizeError(r.error, 'open')); r.onblocked = () => reject(new OmniStoreError('OPERATION_FAILED', 'IndexedDB upgrade is blocked.')) }) }
  private async request<T>(mode: IDBTransactionMode, action: (s: IDBObjectStore) => IDBRequest<T>) { const db = await this.open(); return new Promise<T>((resolve, reject) => { const tx = db.transaction(this.options.storeName, mode); const r = action(tx.objectStore(this.options.storeName)); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(normalizeError(r.error, 'request')); tx.onabort = () => reject(normalizeError(tx.error, 'transaction')) }) }
  async get(key: StorageKey) { const normalized = this.normalizeKey(key); const item = await this.request<RecordValue | undefined>('readonly', s => s.get(normalized)); if (!item) return null; if (item.expiresAt !== null && item.expiresAt <= Date.now()) { await this.request('readwrite', s => s.delete(normalized)); return null } return item.value }
  async set(key: StorageKey, value: string, options: SetOptions = {}) { await this.request('readwrite', s => s.put({ key: this.normalizeKey(key), value, expiresAt: options.ttl == null ? null : Date.now() + options.ttl })) }
  async remove(key: StorageKey) { const normalized = this.normalizeKey(key); const existed = await this.request<number>('readonly', s => s.count(normalized)); await this.request('readwrite', s => s.delete(normalized)); return existed > 0 }
  async has(key: StorageKey) { return (await this.get(key)) !== null }
  private async rawKeys() { return (await this.request<IDBValidKey[]>('readonly', s => s.getAllKeys())).map(String) }
  async keys() { const keys = await this.rawKeys(); const values = await Promise.all(keys.map(key => this.get(key))); return keys.filter((_, index) => values[index] !== null) }
  async size() { return (await this.keys()).length }
  async clear() { await this.request('readwrite', s => s.clear()) }
  async cleanupExpired() { const before = await this.rawKeys(); await Promise.all(before.map(key => this.get(key))); return before.length - (await this.rawKeys()).length }
  async dispose() { (await this.open()).close(); this.connection = undefined }
}
