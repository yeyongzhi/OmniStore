import { createEnvelope, isExpired, parseEnvelope } from '../core/envelope'
import { OmniStoreError } from '../core/errors'
import type { CookieAttributes, SetOptions, StorageDriver, StorageKey } from '../types'
export class CookieDriver implements StorageDriver {
  readonly name = 'cookie' as const
  private readonly attributes: CookieAttributes
  constructor(private readonly namespace: string, attributes: CookieAttributes = {}) { if (attributes.sameSite === 'none' && !attributes.secure) throw new OmniStoreError('INVALID_OPTION', 'SameSite=None requires Secure.'); this.attributes = { path: '/', sameSite: 'lax', ...attributes } }
  private get doc() { if (!globalThis.document) throw new OmniStoreError('DRIVER_UNAVAILABLE', 'Cookies are unavailable.'); return globalThis.document }
  private scoped(key: StorageKey) { return encodeURIComponent(`${this.namespace}:${String(key)}`) }
  private suffix(attributes = this.attributes) { const p: string[] = []; if (attributes.path) p.push(`Path=${attributes.path}`); if (attributes.domain) p.push(`Domain=${attributes.domain}`); if (attributes.expires) p.push(`Expires=${attributes.expires.toUTCString()}`); if (attributes.maxAge !== undefined) p.push(`Max-Age=${attributes.maxAge}`); if (attributes.sameSite) p.push(`SameSite=${attributes.sameSite}`); if (attributes.secure) p.push('Secure'); if (attributes.partitioned) p.push('Partitioned'); return p.length ? `; ${p.join('; ')}` : '' }
  private raw(name: string) { for (const part of this.doc.cookie ? this.doc.cookie.split('; ') : []) { const i = part.indexOf('='); if (part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1)) } return null }
  private rawKeys() { const prefix = `${this.namespace}:`; return (this.doc.cookie ? this.doc.cookie.split('; ') : []).map(p => decodeURIComponent(p.slice(0, p.indexOf('=')))).filter(k => k.startsWith(prefix)).map(k => k.slice(prefix.length)) }
  async get(key: StorageKey) { const raw = this.raw(this.scoped(key)); const item = raw === null ? null : parseEnvelope(raw); if (!item) return null; if (isExpired(item)) { await this.remove(key); return null } return item.value }
  async set(key: StorageKey, value: string, options: SetOptions = {}) { const item = createEnvelope(value, options.ttl); const attrs = { ...this.attributes }; if (item.expiresAt !== null) attrs.expires = new Date(item.expiresAt); this.doc.cookie = `${this.scoped(key)}=${encodeURIComponent(JSON.stringify(item))}${this.suffix(attrs)}` }
  async remove(key: StorageKey) { const existed = this.raw(this.scoped(key)) !== null; this.doc.cookie = `${this.scoped(key)}=; Max-Age=0${this.suffix()}`; return existed }
  async has(key: StorageKey) { return (await this.get(key)) !== null }
  async keys() { const keys = this.rawKeys(); const values = await Promise.all(keys.map(key => this.get(key))); return keys.filter((_, index) => values[index] !== null) }
  async size() { return (await this.keys()).length }
  async clear() { for (const key of await this.keys()) await this.remove(key) }
  async cleanupExpired() { const before = this.rawKeys(); await Promise.all(before.map(key => this.get(key))); return before.length - this.rawKeys().length }
}
