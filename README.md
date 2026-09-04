# OmniStore

统一、类型安全的浏览器存储工具。使用同一套 Promise API 操作 localStorage、sessionStorage、IndexedDB 和 Cookie，支持命名空间、TTL、批量操作以及 TypeScript 类型声明。

## 特性

- 一套异步 API，随时切换四种浏览器存储驱动
- 命名空间隔离，避免不同应用和业务模块的键冲突
- 实例级与单次写入 TTL，默认永久不过期
- 支持 ESM、CommonJS 和完整 TypeScript 声明
- 无运行时依赖，支持 SSR 构建分析

## 安装

```bash
pnpm add omni-storage-kit
```

也可以使用 `npm install omni-storage-kit` 或 `yarn add omni-storage-kit`。

## 快速开始

```ts
import { OmniStore } from 'omni-storage-kit'

const store = new OmniStore({
  driver: 'local',
  namespace: 'my-app',
})

await store.set('user', { id: 1, name: 'Aurora' })

const user = await store.get<{ id: number; name: string }>('user')
```

- `driver`：必填，选择底层存储。
- `namespace`：可选，用于隔离数据，默认是 `omnistore`。
- `ttl`：可选，单位为毫秒；默认是 `null`，即永久不过期。

## 选择驱动

| 驱动 | 适用场景 | 生命周期 |
|---|---|---|
| `local` | 主题、偏好、少量持久配置 | 删除、过期或浏览器清理前一直存在 |
| `session` | 临时表单、当前标签页状态 | 标签页关闭后清除 |
| `indexedDB` | 较多结构化数据、离线缓存 | 删除、过期或浏览器清理前一直存在 |
| `cookie` | 需要随 HTTP 请求携带的小体积数据 | 由 Cookie 属性或 TTL 决定 |

### IndexedDB 示例

```ts
const database = new OmniStore({
  driver: 'indexedDB',
  namespace: 'my-app-cache',
  indexedDB: {
    databaseName: 'my-app',
    storeName: 'entries',
    version: 1,
  },
})

await database.set('products', [
  { id: 1, name: 'Keyboard' },
  { id: 2, name: 'Mouse' },
])

const products = await database.get<Array<{ id: number; name: string }>>('products')

await database.dispose()
```

不传 `indexedDB` 配置时，数据库名默认为 `omnistore-${namespace}`，Object Store 默认为 `entries`，版本默认为 `1`。

## TTL

```ts
const cache = new OmniStore({
  driver: 'local',
  namespace: 'cache',
  ttl: 60_000,
})

await cache.set('default', 1)                   // 60 秒后过期
await cache.set('short', 2, { ttl: 5_000 })    // 5 秒后过期
await cache.set('permanent', 3, { ttl: null }) // 永久不过期
```

`get()`、`has()`、`keys()`、`size()` 和 `entries()` 都会把过期数据视为不存在。`cleanupExpired()` 可以主动清理过期数据并返回清理数量。

## API

```ts
await store.get<T>(key)
await store.set(key, value, options?)
await store.has(key)
await store.remove(key)
await store.keys()
await store.size()
await store.entries<T>()
await store.clear()
await store.cleanupExpired()
await store.dispose()

await store.setMany(entries, options?)
await store.getMany<T>(keys)
await store.removeMany(keys)
```

批量方法返回 `{ data, total, succeeded, failed }`，允许部分操作失败，调用方应检查 `failed`。

## 错误处理

```ts
import { OmniStoreError } from 'omni-storage-kit'

try {
  await store.set('key', value)
} catch (error) {
  if (error instanceof OmniStoreError) {
    console.error(error.code, error.cause)
  }
}
```

错误码包括 `DRIVER_UNAVAILABLE`、`INVALID_OPTION`、`SERIALIZATION_FAILED`、`QUOTA_EXCEEDED` 和 `OPERATION_FAILED`。

## 数据类型说明

默认使用 JSON 序列化，适合字符串、数字、布尔值、数组和普通对象。`Date` 会变成字符串；`BigInt`、循环引用以及需要保留类型的 `Map`、`Set` 等数据需要自定义 `serializer`。

Cookie 通常限制在约 4 KB，且 JavaScript 无法创建或读取 HttpOnly Cookie，请勿用它保存敏感令牌。

## 框架与 SSR

OmniStore 在模块导入阶段不会访问浏览器全局对象，因此可以被 SSR 工具安全分析；实际存储操作仍应在浏览器客户端执行。Vue 中可在 `onMounted` 使用，React 中可在 `useEffect` 使用。

- [完整文档](https://yeyongzhi.github.io/OmniStore/)
- [问题反馈](https://github.com/yeyongzhi/OmniStore/issues)

## 开发

```bash
pnpm install
pnpm check
```

## License

[MIT](./LICENSE)
