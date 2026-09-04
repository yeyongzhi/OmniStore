# 核心概念

## 统一异步接口

四种驱动均返回 Promise，业务代码切换驱动时无需改变控制流。

## 命名空间

local、session 和 Cookie 的键会自动增加命名空间前缀。`clear()` 只清除当前实例的键，不会误删同域其他应用数据。IndexedDB 默认为每个命名空间创建独立数据库。

```ts
const users = new OmniStore({ driver: 'local', namespace: 'users' })
const settings = new OmniStore({ driver: 'local', namespace: 'settings' })

await users.set('current', { id: 1 })
await settings.set('current', { theme: 'dark' })
```

两个实例虽然都使用 `current` 键，但数据互不冲突。`namespace` 不传、传空字符串或只传空格时，默认使用 `omnistore`。

## 序列化与 TTL

默认使用 JSON，可通过 `serializer` 注入自定义实现。实例级 TTL 和单条 TTL 均使用毫秒；单条设置 `{ ttl: null }` 可取消默认过期时间。过期数据在读取时惰性删除，也可调用 `cleanupExpired()` 主动清理。

`get()`、`has()`、`keys()`、`size()` 和 `entries()` 都会把过期项视为不存在；枚举时遇到的过期项也会被清理。

TTL 是可选能力，默认值为 `null`，即永久不过期：

```ts
const permanent = new OmniStore({ driver: 'local' })
const cache = new OmniStore({ driver: 'local', ttl: 60_000 })
```
