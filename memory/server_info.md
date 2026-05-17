---
name: Server Info
description: 生产服务器地址和端口约束，服务器上有其他服务在运行
type: reference
---

- 服务器地址: root@121.196.149.0
- 可用端口: 4000 / 4001 / 4002
- **重要约束:** 服务器上运行着其他服务，不能影响现有服务

**端口分配方案:**
- 4000: Nest.js API Server
- 4001: 管理后台 Web
- 4002: PostgreSQL (或使用已有的 PG 实例)

**Why:** 共享服务器，必须谨慎操作，避免影响其他服务。
**How to apply:** 部署时只使用指定端口，不修改 nginx 全局配置，使用 Docker 隔离。
