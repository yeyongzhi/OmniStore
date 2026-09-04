import { expect, test } from '@playwright/test'
import path from 'node:path'

import type { OmniStore as OmniStoreClass } from '../../src/index'

declare global {
  interface Window {
    OmniStorageKit: {
      OmniStore: typeof OmniStoreClass
    }
  }
}

const browserBundle = path.resolve('.tmp-browser-test/index.global.js')

test.beforeEach(async ({ page }) => {
  await page.route('http://omnistore.test/', route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><html><body>OmniStore browser test</body></html>',
  }))
  await page.goto('http://omnistore.test/')
  await page.addScriptTag({ path: browserBundle })
})

test('uses real localStorage and isolates namespaces', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { OmniStore } = window.OmniStorageKit
    const first = new OmniStore({ driver: 'local', namespace: 'browser-first' })
    const second = new OmniStore({ driver: 'local', namespace: 'browser-second' })
    await first.set('theme', 'dark')
    await second.set('theme', 'light')
    return [await first.get('theme'), await second.get('theme')]
  })

  expect(result).toEqual(['dark', 'light'])
})

test('uses real sessionStorage', async ({ page }) => {
  const value = await page.evaluate(async () => {
    const { OmniStore } = window.OmniStorageKit
    const store = new OmniStore({ driver: 'session', namespace: 'browser-session' })
    await store.set('draft', { step: 2 })
    return store.get('draft')
  })

  expect(value).toEqual({ step: 2 })
})

test('normalizes IndexedDB keys and filters expired records', async ({ page }) => {
  const databaseName = `browser-idb-${Date.now()}-${Math.random()}`
  const result = await page.evaluate(async databaseName => {
    const { OmniStore } = window.OmniStorageKit
    const store = new OmniStore({
      driver: 'indexedDB',
      indexedDB: { databaseName },
    })

    await store.set(1, { id: 1 })
    await store.set('expired', true, { ttl: 1 })
    await new Promise(resolve => setTimeout(resolve, 5))
    const keys = await store.keys()
    const entries = await store.entries()
    const size = await store.size()
    await store.set('expired-again', true, { ttl: 1 })
    await new Promise(resolve => setTimeout(resolve, 5))
    const cleaned = await store.cleanupExpired()
    await store.dispose()
    indexedDB.deleteDatabase(databaseName)

    return { keys, entries, size, cleaned }
  }, databaseName)

  expect(result).toEqual({
    keys: ['1'],
    entries: [{ key: '1', value: { id: 1 } }],
    size: 1,
    cleaned: 1,
  })
})

test('uses real cookies and namespace keys', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { OmniStore } = window.OmniStorageKit
    const store = new OmniStore({ driver: 'cookie', namespace: 'browser-cookie' })
    await store.set('theme', 'dark')
    const value = await store.get('theme')
    const keys = await store.keys()
    await store.clear()
    return { value, keys }
  })

  expect(result).toEqual({ value: 'dark', keys: ['theme'] })
})
