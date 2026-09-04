# 框架示例

以下示例中，`driver` 用于选择底层存储，`namespace` 用于隔离当前应用的数据。`namespace` 不传时默认为 `omnistore`，`ttl` 不传时默认永久不过期。完整字段说明见[配置与类型](/api/options)。

## Vue

```ts
import { shallowRef, onMounted } from 'vue'
import { OmniStore } from 'omni-storage-kit'
const store = new OmniStore({ driver: 'local', namespace: 'vue-app' })
const profile = shallowRef<{ name: string } | null>(null)
onMounted(async () => { profile.value = await store.get('profile') })
```

## React

```ts
const store = new OmniStore({ driver: 'indexedDB', namespace: 'react-app' })
useEffect(() => { void store.get('profile').then(setProfile); return () => { void store.dispose() } }, [])
```

## 原生 JavaScript

```ts
const preferences = new OmniStore({ driver: 'session' })
await preferences.set('theme', 'dark')
```
