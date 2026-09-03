import { OmniStoreError } from './errors'
import type { Serializer } from '../types'
export const jsonSerializer: Serializer = { serialize(value) { try { const result = JSON.stringify(value); if (result === undefined) throw new TypeError(); return result } catch (error) { throw new OmniStoreError('SERIALIZATION_FAILED', 'Failed to serialize value.', error) } }, deserialize<T>(value: string) { try { return JSON.parse(value) as T } catch (error) { throw new OmniStoreError('SERIALIZATION_FAILED', 'Failed to deserialize value.', error) } } }
export function assertTtl(ttl: number | null | undefined): void { if (ttl != null && (!Number.isFinite(ttl) || ttl < 0)) throw new OmniStoreError('INVALID_OPTION', 'ttl must be a finite non-negative number or null.') }
