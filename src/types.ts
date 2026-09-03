export type StorageKey = string | number
export type DriverName = 'local' | 'session' | 'indexedDB' | 'cookie'
export interface Serializer { serialize(value: unknown): string; deserialize<T>(value: string): T }
export interface SetOptions { /** Time to live in milliseconds. */ ttl?: number | null }
export interface StorageDriver { readonly name: DriverName; get(key: StorageKey): Promise<string | null>; set(key: StorageKey, value: string, options?: SetOptions): Promise<void>; remove(key: StorageKey): Promise<boolean>; has(key: StorageKey): Promise<boolean>; keys(): Promise<string[]>; size(): Promise<number>; clear(): Promise<void>; dispose?(): Promise<void> | void }
export interface CookieAttributes { path?: string; domain?: string; expires?: Date; maxAge?: number; sameSite?: 'strict' | 'lax' | 'none'; secure?: boolean; partitioned?: boolean }
export interface IndexedDBOptions { databaseName?: string; storeName?: string; version?: number }
export interface OmniStoreOptions { driver: DriverName; namespace?: string; ttl?: number | null; serializer?: Serializer; cookie?: CookieAttributes; indexedDB?: IndexedDBOptions }
export interface BatchResult<T> { data: T; total: number; succeeded: number; failed: number }
export interface StoreEntry<T> { key: string; value: T }
