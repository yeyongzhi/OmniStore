# OmniStore

统一、类型安全的浏览器存储工具，支持 localStorage、sessionStorage、IndexedDB 和 Cookie。

```bash
pnpm add omni-store-kit
```

```ts
import { OmniStore } from 'omni-store-kit'

const store = new OmniStore({ driver: 'local', namespace: 'my-app' })
await store.set('user', { id: 1, name: 'Aurora' })
const user = await store.get<{ id: number; name: string }>('user')
```

四种驱动共享 Promise API：`get`、`set`、`remove`、`has`、`keys`、`size`、`clear`、`setMany` 和 `getMany`。

- 文档：<https://yeyongzhi.github.io/OmniStore/>
- 开发：`pnpm check`
- 文档预览：`pnpm docs:dev`

MIT License
