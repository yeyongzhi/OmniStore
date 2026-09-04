# 快速开始

安装：

```bash
pnpm add omni-storage-kit
```

```ts
import { OmniStore } from 'omni-storage-kit'

const store = new OmniStore({
  driver: 'local',
  namespace: 'app',
})

await store.set('profile', { name: 'Aurora' })
const profile = await store.get<{ name: string }>('profile')
```

### 示例字段说明

| 字段或参数 | 是否必填 | 含义 |
|---|---|---|
| `driver` | 是 | 使用的存储驱动。可选 `local`、`session`、`indexedDB`、`cookie` |
| `namespace` | 否 | 命名空间，用来隔离不同应用或模块的同名键；默认是 `omnistore` |
| `ttl` | 否 | 实例的默认有效期，单位为毫秒；不传或设为 `null` 时永久不过期 |
| `'profile'` | 是 | 存储键，类型为 `string \| number`；数字键会被统一转换为字符串 |
| `{ name: 'Aurora' }` | 是 | 要保存的值，默认必须能被 JSON 序列化 |
| `<{ name: string }>` | 否 | `get` 返回值的 TypeScript 类型，用于类型提示，不会改变运行时数据 |

::: tip TTL 可以省略
`ttl` 默认是 `null`，所以通常不需要设置。只有缓存、验证码、临时会话等需要自动失效的数据才设置 TTL。
:::

如果需要让当前实例写入的数据默认在 60 秒后过期：

```ts
const cache = new OmniStore({
  driver: 'local',
  namespace: 'app-cache',
  ttl: 60_000,
})
```

所有操作均返回 Promise，因此切换驱动时无需改写调用流程。
