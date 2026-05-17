---
name: Development Workflow
description: 每次迭代必须 review → 自测 → 发布，不能影响服务器现有服务
type: feedback
---

每次迭代必须按照以下流程：review 代码 → 自测 → 发布。

**Why:** 用户明确要求，确保代码质量和生产环境安全。

**How to apply:**
1. 完成一个功能模块后，先 review 代码（检查安全性、逻辑正确性）
2. 本地或服务器上自测通过
3. 确认无误后发布上线
4. 服务器上有很多其他服务，部署时绝不能影响现有服务和数据
5. PostgreSQL 使用独立的 creatoros 用户和数据库，与其他业务完全隔离
