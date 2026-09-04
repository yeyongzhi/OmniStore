# 存储驱动

`driver` 是创建 `OmniStore` 时唯一必填的字段，它决定数据实际保存在哪里。四种驱动暴露相同的异步 API。

| `driver` 值 | 底层存储 | 适用场景 | 生命周期 |
|---|---|---|---|
| `local` | `localStorage` | 主题、偏好、少量持久配置 | 手动删除或过期前一直存在 |
| `session` | `sessionStorage` | 临时表单、当前标签页状态 | 当前标签页关闭后清除 |
| `indexedDB` | IndexedDB | 较多结构化数据、离线缓存 | 手动删除或过期前一直存在 |
| `cookie` | Cookie | 需要随 HTTP 请求携带的小体积数据 | 由 Cookie 属性或 TTL 决定 |

## localStorage

```ts
const store = new OmniStore({
  driver: 'local',
  namespace: 'app-settings',
})
```

| 字段 | 含义 |
|---|---|
| `driver: 'local'` | 使用浏览器的 `localStorage` |
| `namespace` | 为实际键增加隔离前缀；例如 `theme` 会以 `app-settings:theme` 保存 |

## sessionStorage

```ts
const store = new OmniStore({
  driver: 'session',
  namespace: 'checkout-draft',
})
```

字段含义与 `local` 相同，但数据仅属于当前标签页会话，不会与其他标签页共享。

## IndexedDB

```ts
const store = new OmniStore({
  driver: 'indexedDB',
  namespace: 'app-cache',
  indexedDB: {
    databaseName: 'my-app',
    storeName: 'entries',
    version: 1,
  },
})
```

| 字段 | 是否必填 | 默认值 | 含义 |
|---|---|---|---|
| `driver: 'indexedDB'` | 是 | — | 使用 IndexedDB |
| `namespace` | 否 | `omnistore` | 未指定 `databaseName` 时参与生成数据库名称 |
| `indexedDB.databaseName` | 否 | `omnistore-${namespace}` | 数据库名称 |
| `indexedDB.storeName` | 否 | `entries` | Object Store 名称 |
| `indexedDB.version` | 否 | `1` | 数据库版本；变更 Object Store 时需要递增 |

不需要自定义数据库结构时，只写下面两项即可：

```ts
const store = new OmniStore({
  driver: 'indexedDB',
  namespace: 'app-cache',
})
```

## Cookie

```ts
const store = new OmniStore({
  driver: 'cookie',
  namespace: 'app',
  cookie: {
    path: '/',
    sameSite: 'lax',
    secure: true,
  },
})
```

| 字段 | 是否必填 | 默认值 | 含义 |
|---|---|---|---|
| `cookie.path` | 否 | `/` | Cookie 生效路径 |
| `cookie.domain` | 否 | 当前域名 | Cookie 生效域名 |
| `cookie.expires` | 否 | — | 绝对过期时间，类型为 `Date` |
| `cookie.maxAge` | 否 | — | Cookie 有效秒数，注意它的单位是秒 |
| `cookie.sameSite` | 否 | `lax` | 跨站策略：`strict`、`lax` 或 `none` |
| `cookie.secure` | 否 | `false` | 是否仅通过 HTTPS 发送 |
| `cookie.partitioned` | 否 | `false` | 是否使用分区 Cookie |

`sameSite: 'none'` 必须同时设置 `secure: true`。

Cookie 通常限制在约 4 KB。JavaScript 无法创建或读取 HttpOnly Cookie，请勿用它保存敏感令牌。

## 所有驱动共有的字段

| 字段 | 是否必填 | 默认值 | 含义 |
|---|---|---|---|
| `driver` | 是 | — | 选择底层存储 |
| `namespace` | 否 | `omnistore` | 隔离不同应用或模块的数据 |
| `ttl` | 否 | `null` | 默认有效期，单位为毫秒；`null` 表示永久不过期 |
| `serializer` | 否 | `jsonSerializer` | 自定义值的序列化与反序列化方式 |
