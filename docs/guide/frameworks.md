# 框架示例

## Vue

```ts
import { shallowRef, onMounted } from 'vue'
import { OmniStore } from 'omni-store-kit'
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
