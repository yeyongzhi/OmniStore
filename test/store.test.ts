import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OmniStore, OmniStoreError } from '../src/index.ts'

describe.each(['local', 'session'] as const)('%s driver', driver => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); vi.useRealTimers() })

  it('round-trips typed JSON values', async () => {
    const store = new OmniStore({ driver, namespace: 'app' })
    await store.set('user', { id: 1, roles: ['admin'] })
    expect(await store.get('user')).toEqual({ id: 1, roles: ['admin'] })
    expect(await store.has('user')).toBe(true)
    expect(await store.size()).toBe(1)
  })

  it('isolates namespaces and only clears its own keys', async () => {
    const first = new OmniStore({ driver, namespace: 'first' })
    const second = new OmniStore({ driver, namespace: 'second' })
    await first.set('key', 1); await second.set('key', 2); await first.clear()
    expect(await first.get('key')).toBeNull()
    expect(await second.get('key')).toBe(2)
  })

  it('expires and cleans values', async () => {
    vi.useFakeTimers()
    const store = new OmniStore({ driver, namespace: 'ttl', ttl: 10 })
    await store.set('expired', true); await store.set('alive', true, { ttl: null })
    vi.advanceTimersByTime(11)
    expect(await store.cleanupExpired()).toBe(1)
    expect(await store.keys()).toEqual(['alive'])
  })

  it('supports batch operations and entries', async () => {
    const store = new OmniStore({ driver, namespace: 'batch' })
    expect((await store.setMany([['a', 1], ['b', 2]])).succeeded).toBe(2)
    expect(await store.entries<number>()).toEqual([{ key: 'a', value: 1 }, { key: 'b', value: 2 }])
    expect((await store.removeMany(['a', 'missing'])).data).toBe(1)
  })

  it('reports getMany statistics per request, not per unique key', async () => {
    const store = new OmniStore({ driver, namespace: 'batch-stats' })
    await store.setMany([['a', 1], ['b', 2]])
    const result = await store.getMany<number>(['a', 'b', 'missing', 'a'])
    expect(result.total).toBe(4)
    expect(result.succeeded).toBe(4)
    expect(result.failed).toBe(0)
    expect(result.data.get('a')).toBe(1)
    expect(result.data.get('b')).toBe(2)
    expect(result.data.get('missing')).toBeNull()
  })
})

describe('validation and environment behavior', () => {
  it('rejects invalid TTL values', () => {
    expect(() => new OmniStore({ driver: 'local', ttl: -1 })).toThrow(OmniStoreError)
  })

  it('reports serialization failures', async () => {
    const store = new OmniStore({ driver: 'local' })
    const circular: Record<string, unknown> = {}; circular.self = circular
    await expect(store.set('bad', circular)).rejects.toMatchObject({ code: 'SERIALIZATION_FAILED' })
  })

  it('enforces secure SameSite=None cookies', () => {
    expect(() => new OmniStore({ driver: 'cookie', cookie: { sameSite: 'none' } })).toThrow(/Secure/)
  })

  it('normalizes remove failures into OmniStoreError', async () => {
    const store = new OmniStore({ driver: 'local' })
    const remove = vi.spyOn(localStorage, 'removeItem').mockImplementation(() => { throw new DOMException('denied', 'SecurityError') })
    await expect(store.remove('key')).rejects.toMatchObject({ code: 'OPERATION_FAILED' })
    remove.mockRestore()
  })
})

describe('cookie driver', () => {
  beforeEach(() => { document.cookie.split(';').forEach(item => { document.cookie = `${item.split('=')[0]}=; Max-Age=0; Path=/` }) })
  it('supports CRUD and namespace keys', async () => {
    const store = new OmniStore({ driver: 'cookie', namespace: 'cookie-test' })
    await store.set('theme', 'dark')
    expect(await store.get('theme')).toBe('dark')
    expect(await store.keys()).toEqual(['theme'])
    expect(await store.remove('theme')).toBe(true)
  })
})

describe('indexedDB driver', () => {
  const create = () => new OmniStore({ driver: 'indexedDB', indexedDB: { databaseName: `test-${crypto.randomUUID()}` } })

  it('supports CRUD, numeric keys and batches', async () => {
    const store = create()
    await store.set(1, { ok: true })
    expect(await store.get(1)).toEqual({ ok: true })
    await store.setMany([[2, 'two'], [3, 'three']])
    expect(await store.size()).toBe(3)
    expect(await store.remove(1)).toBe(true)
    expect(await store.remove(1)).toBe(false)
    await store.dispose()
  })

  it('removes expired records without recursive deletion', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000)
    const store = create(); await store.set('short', 1, { ttl: 5 }); now.mockReturnValue(1_006)
    expect(await store.get('short')).toBeNull()
    expect(await store.size()).toBe(0)
    await store.dispose(); now.mockRestore()
  })
})
