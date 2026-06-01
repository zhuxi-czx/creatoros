---
name: Mini-Program Launch Prep
description: 小程序上架前置准备进度、阻塞项与已决策事项（2026-05 起）
type: project
---

CreatorOS 小程序上架前置准备（截至 2026-05-30）

**审核中（外部阻塞）：**
- 域名备案（企业主体，已提交）— 阻塞 HTTPS、合法域名、支付 notify_url
- 微信支付商户号申请（已提交）— 阻塞支付配置填入与联调

**已决策：**
- MVP **需要小程序内线上付费报名** → 微信支付要做（JSAPI / APIv3）
- 当前推进两条轨道：合规材料 + 微信支付接入

**待用户拍板（见 docs/wechat-pay-design.md §11）：**
- 退款是否本期做最小版 / 第三方库 wechatpay-node-v3 / 超时15min / 关单cron

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
