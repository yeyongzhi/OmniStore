# SSR 与错误处理

OmniStore 在模块导入阶段不会访问 `window`、`document` 或 IndexedDB，因此可以被 SSR 构建工具安全分析。实际存储操作必须在浏览器客户端执行。

```ts
import { OmniStoreError } from 'omni-storage-kit'
try { await store.set('key', value) } catch (error) {
  if (error instanceof OmniStoreError) console.error(error.code, error.cause)
}
```

错误码包括 `DRIVER_UNAVAILABLE`、`INVALID_OPTION`、`SERIALIZATION_FAILED`、`QUOTA_EXCEEDED` 和 `OPERATION_FAILED`。
