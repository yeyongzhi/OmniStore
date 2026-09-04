# 配置与类型

```ts
interface OmniStoreOptions {
  driver: 'local' | 'session' | 'indexedDB' | 'cookie'
  namespace?: string
  ttl?: number | null
  serializer?: Serializer
  cookie?: CookieAttributes
  indexedDB?: IndexedDBOptions
}
```

## `OmniStoreOptions`

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `driver` | `DriverName` | 是 | — | 存储驱动：`local`、`session`、`indexedDB` 或 `cookie` |
| `namespace` | `string` | 否 | `omnistore` | 数据隔离名称；空字符串或纯空格也会使用默认值 |
| `ttl` | `number \| null` | 否 | `null` | 实例默认有效期，单位为毫秒；`null` 表示永久不过期 |
| `serializer` | `Serializer` | 否 | `jsonSerializer` | 值的序列化器，默认使用 JSON |
| `cookie` | `CookieAttributes` | 否 | 见下表 | 仅供 `cookie` 驱动使用 |
| `indexedDB` | `IndexedDBOptions` | 否 | 见下表 | 仅供 `indexedDB` 驱动使用 |

::: tip 默认不会过期
不传 `ttl` 与显式传入 `ttl: null` 的效果相同。保存的数据会一直存在，直到调用 `remove()`、`removeMany()`、`clear()`，或被浏览器/用户清理。
:::

## `SetOptions`

```ts
interface SetOptions {
  ttl?: number | null
}
```

单次写入的 `ttl` 会覆盖实例默认值：

```ts
const store = new OmniStore({ driver: 'local', ttl: 60_000 })

await store.set('a', 1)                  // 60 秒后过期
await store.set('b', 2, { ttl: 5_000 }) // 5 秒后过期
await store.set('c', 3, { ttl: null })  // 永不过期
```

`ttl` 必须是大于或等于 `0` 的有限数字，单位为毫秒。`ttl: 0` 表示写入后立即过期。

## `IndexedDBOptions`

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `databaseName` | `string` | `omnistore-${namespace}` | IndexedDB 数据库名称 |
| `storeName` | `string` | `entries` | Object Store 名称 |
| `version` | `number` | `1` | 数据库版本 |

```ts
const store = new OmniStore({
  driver: 'indexedDB',
  namespace: 'app-cache',
  indexedDB: {
    databaseName: 'my-app',
    storeName: 'cache',
    version: 1,
  },
})
```

## `CookieAttributes`

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `path` | `string` | `/` | Cookie 生效路径 |
| `domain` | `string` | 当前域名 | Cookie 生效域名 |
| `expires` | `Date` | — | 绝对过期时间 |
| `maxAge` | `number` | — | Cookie 有效秒数 |
| `sameSite` | `'strict' \| 'lax' \| 'none'` | `lax` | 跨站发送策略 |
| `secure` | `boolean` | `false` | 是否仅通过 HTTPS 发送 |
| `partitioned` | `boolean` | `false` | 是否启用分区 Cookie |

## `Serializer`

```ts
interface Serializer {
  serialize(value: unknown): string
  deserialize<T>(value: string): T
}
```

默认 JSON 序列化器适合字符串、数字、布尔值、数组和普通对象。`BigInt`、循环引用以及需要保留原始类型的 `Date`、`Map`、`Set` 等数据，应提供自定义序列化器。

## 其他公开类型

| 类型 | 含义 |
|---|---|
| `StorageKey` | 存储键，类型为 `string \| number`；各驱动会统一转换为字符串 |
| `StoreEntry<T>` | `entries()` 返回的单条 `{ key, value }` 数据 |
| `BatchResult<T>` | 批量操作结果，包含 `data`、`total`、`succeeded`、`failed` |
