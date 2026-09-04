# 方法使用示例

OmniStore 对四种底层存储暴露**完全相同**的异步 API。下面分别演示 `local` / `session` / `indexedDB` / `cookie` 四种驱动下，**每个方法**的典型用法。

所有示例都基于一个独立的 `namespace`，彼此互不干扰。方法分为三类：

- 读取与写入：`get` · `set` · `has` · `remove`
- 枚举与维护：`keys` · `size` · `entries` · `clear` · `cleanupExpired` · `dispose`
- 批量操作：`setMany` · `getMany` · `removeMany`

示例中的 `driver` 表示底层存储类型，`namespace` 表示数据隔离名称。两者及 `ttl`、驱动专属配置的完整含义见[配置与类型](/api/options)。其中只有 `driver` 必填；`ttl` 默认是 `null`，不设置时数据不会自动过期。

---

## localStorage

适合**持久化、小体积**数据：同一浏览器跨标签页共享，关闭页面后仍然存在，直到手动清除或过期。

```ts
import { OmniStore } from 'omni-storage-kit'

const store = new OmniStore({ driver: 'local', namespace: 'demo-local' })

// set —— 写入任意 JSON 可序列化的值
await store.set('theme', 'dark')
await store.set('count', 42)
await store.set('user', { id: 1, name: 'Aurora' })

// get —— 读取并反序列化；不存在或已过期返回 null
const theme = await store.get<string>('theme')                 // 'dark'
const user = await store.get<{ id: number; name: string }>('user')

// has —— 判断有效值是否存在
await store.has('theme')                                        // true

// remove —— 删除并返回删除前是否存在
await store.remove('count')                                     // true

// keys —— 当前命名空间下的所有键
await store.keys()                                              // ['theme', 'user']

// size —— 当前命名空间下的键数量
await store.size()                                              // 2

// entries —— 所有键值对（自动跳过已过期项）
await store.entries()                                           // [{ key: 'theme', value: 'dark' }, ...]

// clear —— 清空当前命名空间
await store.clear()

// setMany —— 批量写入（允许部分成功，不抛出）
await store.setMany([['a', 1], ['b', 2], ['c', 3]])

// getMany —— 批量读取，data 为 Map<key, value | null>
const res = await store.getMany(['a', 'b', 'missing'])
res.data.get('a')                                               // 1
res.data.get('missing')                                        // null
res.succeeded                                                   // 3（键不存在不算操作失败）
res.failed                                                      // 0

// removeMany —— 批量删除，data 为实际删除数量
await store.removeMany(['a', 'b'])                              // { data: 2, total: 2, succeeded: 2, failed: 0 }

// cleanupExpired —— 主动清理过期项，返回清理条数
await store.cleanupExpired()                                    // 0

// dispose —— 释放底层资源（localStorage 无需，调用安全）
await store.dispose()
```

---

## sessionStorage

API 与 `local` **完全一致**，区别仅在于数据**只在当前标签页会话内有效**，关闭标签页即被清除，不会跨标签页共享。

```ts
import { OmniStore } from 'omni-storage-kit'

const store = new OmniStore({ driver: 'session', namespace: 'demo-session' })

// set —— 写入会话级数据（例如临时表单草稿）
await store.set('draft', { title: '未保存的文章', body: '...' })

// get
const draft = await store.get<{ title: string; body: string }>('draft')

// has
await store.has('draft')                                        // true

// remove
await store.remove('draft')                                     // true

// keys
await store.keys()                                              // []

// size
await store.size()                                              // 0

// entries
await store.entries()                                           // []

// clear
await store.clear()

// setMany
await store.setMany([['step', 1], ['token', 'abc']])

// getMany
await store.getMany(['step', 'token', 'absent'])                // data 含前两项的真实值，'absent' 为 null

// removeMany
await store.removeMany(['step', 'token'])                       // { data: 2, total: 2, succeeded: 2, failed: 0 }

// cleanupExpired
await store.cleanupExpired()                                    // 0

// dispose
await store.dispose()
```

---

## IndexedDB

适合**较多 / 结构化**数据，不受 5 MB 左右的体积限制。API 仍与上面两种驱动一致；`dispose()` 会关闭底层数据库连接，建议在应用卸载时调用。

```ts
import { OmniStore } from 'omni-storage-kit'

const store = new OmniStore({ driver: 'indexedDB', namespace: 'demo-idb' })

// set —— 支持较大的对象
await store.set('records', [
  { id: 1, name: 'A' },
  { id: 2, name: 'B' },
])

// get
const records = await store.get<Array<{ id: number; name: string }>>('records')

// has
await store.has('records')                                      // true

// remove
await store.remove('records')                                   // true

// keys
await store.keys()                                              // []

// size
await store.size()                                              // 0

// entries
await store.entries()                                           // []

// clear
await store.clear()

// setMany
await store.setMany([['u1', { v: 1 }], ['u2', { v: 2 }]])

// getMany
await store.getMany(['u1', 'u2', 'u3'])                         // data 为包含三项的 Map

// removeMany
await store.removeMany(['u1', 'u2'])                            // { data: 2, total: 2, succeeded: 2, failed: 0 }

// cleanupExpired
await store.cleanupExpired()                                    // 0

// dispose —— IndexedDB 会真正关闭连接，页面卸载前建议调用
await store.dispose()
```

---

## Cookie

适合需要**随 HTTP 请求自动携带**的小体积数据（约 4 KB 上限）。可通过 `cookie` 选项设置 `path` / `maxAge` / `sameSite` / `secure` / `partitioned` / `expires`。

> 注意：`secure: true` 只在 HTTPS 下才真正生效；`HttpOnly` Cookie 无法被 JavaScript 读写，请勿用它保存敏感令牌。

```ts
import { OmniStore } from 'omni-storage-kit'

const store = new OmniStore({
  driver: 'cookie',
  namespace: 'demo-cookie',
  cookie: { path: '/', maxAge: 60 * 60 * 24, sameSite: 'lax', secure: true },
})

// set —— 写入 Cookie（受 maxAge 等属性约束）
await store.set('theme', 'dark')

// get
const theme = await store.get<string>('theme')                 // 'dark'

// has
await store.has('theme')                                        // true

// remove
await store.remove('theme')                                     // true

// keys
await store.keys()                                              // []

// size
await store.size()                                              // 0

// entries
await store.entries()                                           // []

// clear
await store.clear()

// setMany
await store.setMany([['sid', 'x1'], ['tid', 'x2']])

// getMany
await store.getMany(['sid', 'tid', 'absent'])                  // data 为包含三项的 Map

// removeMany
await store.removeMany(['sid', 'tid'])                         // { data: 2, total: 2, succeeded: 2, failed: 0 }

// cleanupExpired
await store.cleanupExpired()                                    // 0

// dispose —— Cookie 无需关闭连接，调用安全
await store.dispose()
```

---

## 共通说明

- **TTL（过期时间）**：TTL 默认是 `null`，数据永久不过期。`new OmniStore({ ttl: 60_000 })` 可设置默认过期毫秒数，或在单次 `set` 时覆盖：`await store.set('code', 123, { ttl: 30_000 })`。`get` 读取到已过期项会自动视为不存在并返回 `null`。
- **批量操作部分成功**：`setMany` / `getMany` / `removeMany` 返回 `{ data, total, succeeded, failed }`，调用方应检查 `failed` 字段，不要假设全部成功。
- **命名空间隔离**：不同 `namespace` 的键互不冲突，可安全在同一页面中使用多个 `OmniStore` 实例。
