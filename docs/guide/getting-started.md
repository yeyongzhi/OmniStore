# 快速开始

安装：`pnpm add omni-store-kit`

```ts
import { OmniStore } from 'omni-store-kit'
const store = new OmniStore({ driver: 'local', namespace: 'app', ttl: 60_000 })
await store.set('profile', { name: 'Aurora' })
const profile = await store.get<{ name: string }>('profile')
```

所有操作均返回 Promise，因此切换驱动时无需改写调用流程。
