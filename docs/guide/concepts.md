# 核心概念

## 统一异步接口

四种驱动均返回 Promise，业务代码切换驱动时无需改变控制流。

## 命名空间

local、session 和 Cookie 的键会自动增加命名空间前缀。`clear()` 只清除当前实例的键，不会误删同域其他应用数据。IndexedDB 默认为每个命名空间创建独立数据库。

## 序列化与 TTL

默认使用 JSON，可通过 `serializer` 注入自定义实现。实例级 TTL 和单条 TTL 均使用毫秒；单条设置 `{ ttl: null }` 可取消默认过期时间。过期数据在读取时惰性删除，也可调用 `cleanupExpired()` 主动清理。
