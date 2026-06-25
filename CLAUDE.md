# CLAUDE.md

CreatorOS — 全球华人创造者社区。从线下酒馆（敞开酒馆 / Offen Bar）活动起步，微信小程序 + H5 + 管理后台。

## 换台电脑接手必读（顺序）
1. **先读 `MEMORY.md`（知识索引）+ `memory/` 下全部文件** —— 项目背景、生产环境、运维红线、踩过的坑都在那里，是"继续工作"的核心上下文。
2. 读本文件了解结构与命令。
3. `README.md` 有完整功能清单与在线地址。
4. 与用户对话**全程用中文**。

## 仓库结构
- `server/` — NestJS + Prisma 7（PrismaPg adapter）+ PostgreSQL。schema 在 `server/src/prisma/`（用 prisma.config.ts，generate 要带 `--schema`）
- `admin/` — React + Vite + Antd 管理后台
- `app/` — Taro 微信小程序（Tab：首页/发现/我的 + 活动详情 + Creator 频道/敞开对谈图文）
- `h5/` — 用户端 H5
- `docs/` — 设计与运维文档
- `design/` — Pencil 设计稿。⚠️ 当前主用设计稿是 `~/Desktop/creatoros.pen`，**在仓库外，换电脑会丢**；`design/creatoros-mvp.pen` 是已废弃旧稿

## 构建 / 自测命令
- 后端类型检查：`cd server && npx tsc --noEmit`
- 后端构建：`cd server && npm run build`
- 后台构建：`cd admin && npm run build`
- 小程序构建：`cd app && npm run build:weapp`
- Prisma client：`cd server && npx prisma generate --schema src/prisma/schema.prisma`
- 本机**没有数据库**，DATABASE_URL 指向的是生产机本地库；本地无法直连，调试数据走生产后台接口

## 生产 / 部署（务必先读 `memory/server_info.md`）
- 生产机 `root@116.62.188.30`（阿里云，SSH 公钥直连），**共享服务器，绝不能影响其他项目**
- 域名：creatorbar.cn(H5) / admin.creatorbar.cn(后台) / creatorbar.cn/api
- 环境变量在生产 `ecosystem.config.js`（PM2 注入，已 gitignore，本地有 `.example`）
- **生产 git 有本地分叉，禁止 git pull / 全量同步**；改后端 → scp 单文件 + `npm run build` + `pm2 restart creatoros-server`；H5/后台 → 本地 build + `rsync dist`
- push 到 GitHub **不影响生产**（生产不 git pull），可放心同步

## 开发约定（`memory/feedback_dev_workflow.md`）
技术方案 → 编码 → review → 自测 → 部署。代码简洁高效，不过度设计；部署绝不影响现有服务与数据。
