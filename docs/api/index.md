# OmniStore API

## 创建实例

```ts
const store = new OmniStore(options)
```

`options.driver` 是唯一必填字段。`namespace`、`ttl`、`serializer`、`cookie` 和 `indexedDB` 均为可选配置，完整含义见[配置与类型](/api/options)。

## 读取和写入

| 方法 | 参数含义 | 返回值 | 说明 |
|---|---|---|---|
| `get<T>(key)` | `key`：字符串或数字键；`T`：期望的值类型 | `Promise<T \| null>` | 读取并反序列化；不存在或过期时返回 `null` |
| `set(key, value, options?)` | `key`：字符串或数字键；`value`：要保存的值；`options.ttl`：本次有效毫秒数 | `Promise<void>` | 单次 TTL 会覆盖实例默认 TTL |
| `has(key)` | `key`：要检查的键 | `Promise<boolean>` | 判断未过期的值是否存在 |
| `remove(key)` | `key`：要删除的键 | `Promise<boolean>` | 返回删除前是否存在 |

## 枚举和维护

| 方法 | 返回值 | 说明 |
|---|---|---|
| `keys()` | `Promise<string[]>` | 返回当前命名空间中的所有未过期键，并清理遇到的过期项 |
| `entries<T>()` | `Promise<Array<{ key, value }>>` | 返回当前命名空间中的有效键值对 |
| `size()` | `Promise<number>` | 返回当前命名空间中的未过期键数量 |
| `clear()` | `Promise<void>` | 清空当前实例管理的数据 |
| `cleanupExpired()` | `Promise<number>` | 主动清理过期项并返回清理数量 |
| `dispose()` | `Promise<void>` | 释放底层资源；IndexedDB 会关闭数据库连接 |

## 批量操作

| 方法 | 参数含义 | `data` 含义 |
|---|---|---|
| `setMany(entries, options?)` | 键值元组集合；`options.ttl` 应用于本批数据 | `undefined` |
| `getMany<T>(keys)` | 要读取的键集合 | `Map<StorageKey, T \| null>` |
| `removeMany(keys)` | 要删除的键集合 | 实际删除数量 |

三个方法都返回 `{ data, total, succeeded, failed }`。批量操作允许部分成功，调用方应检查统计字段。读取到不存在的键会得到 `null`，但查询本身仍然算成功。
