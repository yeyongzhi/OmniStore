# 存储驱动

- `local`：持久的小体积数据。
- `session`：当前标签页会话数据。
- `indexedDB`：较多结构化数据。
- `cookie`：需要随 HTTP 请求携带的小体积数据。

```ts
new OmniStore({ driver: 'cookie', namespace: 'app', cookie: { path: '/', sameSite: 'lax', secure: true } })
```

Cookie 通常限制在约 4 KB。JavaScript 无法创建或读取 HttpOnly Cookie，请勿用它保存敏感令牌。
