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

TTL 单位是毫秒。`namespace` 默认为 `omnistore`。Cookie 支持 `path`、`domain`、`expires`、`maxAge`、`sameSite`、`secure` 和 `partitioned`。
