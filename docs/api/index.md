# OmniStore API

## 读取和写入

| 方法 | 返回值 | 说明 |
|---|---|---|
| `get<T>(key)` | `Promise<T \| null>` | 读取并反序列化；不存在或过期时返回 null |
| `set(key, value, options?)` | `Promise<void>` | 写入任意 JSON 可序列化值 |
| `has(key)` | `Promise<boolean>` | 判断有效值是否存在 |
| `remove(key)` | `Promise<boolean>` | 删除并返回此前是否存在 |

## 枚举和维护

| 方法 | 返回值 |
|---|---|
| `keys()` | `Promise<string[]>` |
| `entries<T>()` | `Promise<Array<{ key, value }>>` |
| `size()` | `Promise<number>` |
| `clear()` | `Promise<void>` |
| `cleanupExpired()` | `Promise<number>`，返回清理数量 |
| `dispose()` | `Promise<void>`，关闭 IndexedDB 连接 |

## 批量操作

`setMany(entries)`、`getMany(keys)` 和 `removeMany(keys)` 返回 `{ data, total, succeeded, failed }`。批量操作允许部分成功，调用方应检查统计字段。
