import { createEnvelope, isExpired, parseEnvelope } from '../core/envelope'
import { OmniStoreError, normalizeError } from '../core/errors'
import type { DriverName, SetOptions, StorageDriver, StorageKey } from '../types'
export class WebStorageDriver implements StorageDriver {
  readonly name: DriverName
  constructor(private readonly kind: 'localStorage' | 'sessionStorage', private readonly namespace: string) { this.name = kind === 'localStorage' ? 'local' : 'session' }
  private get storage(): Storage { const value = globalThis.window?.[this.kind]; if (!value) throw new OmniStoreError('DRIVER_UNAVAILABLE', `${this.kind} is unavailable.`); return value }
  private scoped(key: StorageKey) { return `${this.namespace}:${String(key)}` }
  private rawKeys() { const prefix = `${this.namespace}:`; const result: string[] = []; for (let i = 0; i < this.storage.length; i++) { const key = this.storage.key(i); if (key?.startsWith(prefix)) result.push(key.slice(prefix.length)) } return result }
  async get(key: StorageKey) { try { const raw = this.storage.getItem(this.scoped(key)); if (raw === null) return null; const item = parseEnvelope(raw); if (!item) return null; if (isExpired(item)) { this.storage.removeItem(this.scoped(key)); return null } return item.value } catch (error) { throw normalizeError(error, 'get') } }
  async set(key: StorageKey, value: string, options: SetOptions = {}) { try { this.storage.setItem(this.scoped(key), JSON.stringify(createEnvelope(value, options.ttl))) } catch (error) { throw normalizeError(error, 'set') } }
  async remove(key: StorageKey) { try { const scoped = this.scoped(key); const existed = this.storage.getItem(scoped) !== null; this.storage.removeItem(scoped); return existed } catch (error) { throw normalizeError(error, 'remove') } }
  async has(key: StorageKey) { return (await this.get(key)) !== null }
  async keys() { const keys = this.rawKeys(); const values = await Promise.all(keys.map(key => this.get(key))); return keys.filter((_, index) => values[index] !== null) }
  async size() { return (await this.keys()).length }
  async clear() { try { for (const key of await this.keys()) this.storage.removeItem(this.scoped(key)) } catch (error) { throw normalizeError(error, 'clear') } }
  async cleanupExpired() { const before = this.rawKeys(); await Promise.all(before.map(key => this.get(key))); return before.length - this.rawKeys().length }
}
