---
name: Mini-Program Launch Prep
description: 小程序上架前置准备进度、阻塞项与已决策事项（2026-05 起）
type: project
---

CreatorOS 小程序上架前置准备（截至 2026-05-30）

**HTTPS 已就绪（2026-06-06，commit 2059589）：**
- 域名 `creatorbar.cn` 备案通过 + DNS 已解析到 116.62.188.30（apex+www）
- Let's Encrypt 证书签发（webroot，有效期至 2026-09-04，certbot 自动续期）
- nginx `/etc/nginx/conf.d/creatorbar.conf`：443 反代 `/api`→4000、`/uploads`→4000、`/`→H5静态(h5/dist)，80→443 跳转。**独立 conf，未碰其他项目**
- 阿里云安全组已放行 443（外部 https 直通）
- 前端接口全切到 `https://creatorbar.cn`（Taro+H5+图片host）；H5 已重新构建部署到服务器
- 小程序合法域名 = `https://creatorbar.cn`；支付 notify_url = `https://creatorbar.cn/api/pay/notify`
- ⚠️ 改 nginx 后用 `nginx -t && nginx -s reload`；nginx 1.24 不支持 `http2 on;`，用 `listen 443 ssl http2;`

**审核中（外部阻塞）：**
- 域名备案（企业主体，已提交）— 阻塞 HTTPS、合法域名、支付 notify_url
- 微信支付商户号申请（已提交）— 阻塞支付配置填入与联调

**已决策：**
- MVP **需要小程序内线上付费报名** → 微信支付要做（JSAPI / APIv3）
- 当前推进两条轨道：合规材料 + 微信支付接入

**微信支付决策（已定 2026-06-01）：**
- 退款本期不做（走线下，协议写明不可线上退款）/ 用 wechatpay-node-v3 / 15分钟关单 / 新增每5分钟关单任务
- 本期范围：下单+支付+确认报名+超时关单

**支付框架已开发完成（2026-06-01，commit 4fa95bd，在本地 main 未push）：**
- 后端 server/src/modules/payment/：WechatPayService(懒加载)+OrderService+OrderController+每5分钟Cron
- Order 模型 + Signup.orderId；迁移 server/prisma/migrations/20260601_add_order_model（非破坏性，已审）
- 前端 Taro 详情页按 price 分流付费流程；main.ts 启用 rawBody
- 关键：schema 在 src/prisma/，prisma 用 prisma.config.ts；generate 必须 --schema 或靠 config
- 关键：PrismaService 手动暴露 delegate（加 Order 时要在 prisma.service.ts 补 order）
- **未端到端测试**（缺商户号）。待商户号：填 .env(§8) + 部署迁移 + 联调回调
- ⚠️ 部署时迁移与代码要一起上：cron 每5分钟查 Order 表，表不存在会持续报错

**关键技术事实：**
- `Event.price` 单位是**分**，与微信支付一致，无需换算
- 报名现状：`POST /signup` 直接建 Signup，事务防超卖；免费报名链路不能动
- 代码硬编码裸IP+HTTP（app `121.196.149.0:4000`、h5 拼 `:4000`）→ 上架前必须去IP化走HTTPS域名+443，这是独立可先做的轨道
- ⚠️ 2024起小程序需单独「小程序备案」，与域名ICP备案是两回事，待确认

**2026-06-01 安全事故处置（已完成）：**
- 发现 `ecosystem.config.js` 明文密钥曾 push 到**公开** GitHub（含 DB/JWT/admin/旧WX secret）→ 已 `git rm --cached` + 加 .gitignore + 建 example 模板（本地，未提交）
- 已拿到 116 的 SSH（公钥已装），在 116 上完成：新 appid `wx1155fe9224e648e8` + 新 WX secret、轮换 JWT、轮换 admin 密码、轮换 PG `creatoros` 密码并同步 DATABASE_URL
- **重大坑**：`pm2 restart --update-env` 不会重载 ecosystem.config.js（进程 7 天来一直用首次启动的旧 env）；必须 `pm2 delete + pm2 start ecosystem.config.js` 才生效。已修复 + `pm2 save`
- 验证：health ok / events 200 / 新 admin 密码登录 201、旧密码 401 / wx-login 返回 invalid code（凭据有效，真机真 code 即可登录，无 IP 白名单限制）
- ⚠️ 旧密钥仍在 GitHub **历史**里（已全部轮换作废，无实际风险，可选 filter-repo 清史）
- 本地 git 改动（gitignore/example/appid/docs/memory）**尚未 commit**，待用户确认

**已产出文档：**
- docs/wechat-pay-design.md（支付技术方案，待review再编码）
- docs/privacy-protection-guide.md（隐私保护指引填报底稿）
- docs/legal-privacy-policy.md、docs/legal-user-agreement.md（隐私政策/用户协议底稿，需填企业主体后落地为 /privacy /terms 页面）

参见 [[server_info]] [[feedback_dev_workflow]]
