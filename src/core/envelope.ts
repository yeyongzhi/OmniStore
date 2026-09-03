export interface StorageEnvelope { version: 1; value: string; expiresAt: number | null }
export const createEnvelope = (value: string, ttl?: number | null): StorageEnvelope => ({ version: 1, value, expiresAt: ttl == null ? null : Date.now() + ttl })
export const isExpired = (value: StorageEnvelope): boolean => value.expiresAt !== null && value.expiresAt <= Date.now()
export function parseEnvelope(raw: string): StorageEnvelope | null { try { const value = JSON.parse(raw) as Partial<StorageEnvelope>; return value.version === 1 && typeof value.value === 'string' && (typeof value.expiresAt === 'number' || value.expiresAt === null) ? value as StorageEnvelope : null } catch { return null } }
