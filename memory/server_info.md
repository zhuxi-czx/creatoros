---
name: Server Info
description: 生产服务器地址和端口约束，服务器上有其他服务在运行
type: reference
---

⚠️ 实测（2026-06）：**真正在跑 creatoros 的生产机是 `116.62.188.30`**（API health 正常），但**我没有它的 SSH 密钥**（permission denied）。
`121.196.149.0` 我能 SSH，且 `~/creatoros` 代码在，但 **4000 未监听、PM2 无 creatoros 进程**（疑似迁移中/备用机）。
部署目标到底用哪台、116 的访问方式，待用户确认。

- 可用端口: 4000(API) / 4001(管理后台) / 4002(H5)
- **重要约束:** 服务器上运行着大量其他项目（clawmate/xteam/zaoxiangpai/dialogcam/tokenuni/deckly 等），绝不能影响现有服务
- 环境变量通过 `ecosystem.config.js`（PM2）注入，**不是 .env**；该文件已从 git 移除并加入 .gitignore（曾明文泄露密钥到公开仓库，见 [[project_launch_prep]]）

**How to apply:** 部署只用指定端口，不改全局 nginx；密钥只写服务器本地 ecosystem.config.js，永不入库。
