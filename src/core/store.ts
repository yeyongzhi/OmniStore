import { assertTtl, jsonSerializer } from './serializer'
import { CookieDriver } from '../drivers/cookie'
import { IndexedDBDriver } from '../drivers/indexed-db'
import { WebStorageDriver } from '../drivers/web-storage'
import type { BatchResult, OmniStoreOptions, Serializer, SetOptions, StorageDriver, StorageKey, StoreEntry } from '../types'
function makeDriver(o: OmniStoreOptions, ns: string): StorageDriver { switch (o.driver) { case 'local': return new WebStorageDriver('localStorage', ns); case 'session': return new WebStorageDriver('sessionStorage', ns); case 'cookie': return new CookieDriver(ns, o.cookie); case 'indexedDB': return new IndexedDBDriver(ns, o.indexedDB) } }
export class OmniStore {
  readonly driver: StorageDriver; private readonly serializer: Serializer; private readonly ttl: number | null
  constructor(options: OmniStoreOptions) { assertTtl(options.ttl); this.ttl = options.ttl ?? null; this.serializer = options.serializer ?? jsonSerializer; this.driver = makeDriver(options, options.namespace?.trim() || 'omnistore') }
  async get<T>(key: StorageKey) { const raw = await this.driver.get(key); return raw === null ? null : this.serializer.deserialize<T>(raw) }
  async set<T>(key: StorageKey, value: T, options: SetOptions = {}) { assertTtl(options.ttl); await this.driver.set(key, this.serializer.serialize(value), { ttl: options.ttl === undefined ? this.ttl : options.ttl }) }
  remove(key: StorageKey) { return this.driver.remove(key) }
  has(key: StorageKey) { return this.driver.has(key) }
  keys() { return this.driver.keys() }
  size() { return this.driver.size() }
  clear() { return this.driver.clear() }
  async entries<T>(): Promise<StoreEntry<T>[]> { const keys = await this.keys(); const values = await Promise.all(keys.map(key => this.get<T>(key))); return keys.flatMap((key, index) => values[index] === null ? [] : [{ key, value: values[index]! }]) }
  async cleanupExpired(): Promise<number> { const before = await this.keys(); await Promise.all(before.map(key => this.driver.get(key))); return before.length - (await this.keys()).length }
  async dispose() { await this.driver.dispose?.() }
  async setMany<T>(entries: Iterable<readonly [StorageKey, T]>, options: SetOptions = {}): Promise<BatchResult<void>> { const list = [...entries]; const r = await Promise.allSettled(list.map(([k, v]) => this.set(k, v, options))); const succeeded = r.filter(x => x.status === 'fulfilled').length; return { data: undefined, total: list.length, succeeded, failed: list.length - succeeded } }
  async getMany<T>(keys: Iterable<StorageKey>): Promise<BatchResult<Map<StorageKey, T | null>>> { const list = [...keys], data = new Map<StorageKey, T | null>(); const r = await Promise.allSettled(list.map(k => this.get<T>(k))); const succeeded = r.filter(x => x.status === 'fulfilled').length; r.forEach((x, i) => { if (x.status === 'fulfilled') data.set(list[i]!, x.value) }); return { data, total: list.length, succeeded, failed: list.length - succeeded } }
  async removeMany(keys: Iterable<StorageKey>): Promise<BatchResult<number>> { const list = [...keys]; const r = await Promise.allSettled(list.map(key => this.remove(key))); const succeeded = r.filter(x => x.status === 'fulfilled').length; const removed = r.filter(x => x.status === 'fulfilled' && x.value).length; return { data: removed, total: list.length, succeeded, failed: list.length - succeeded } }
}
