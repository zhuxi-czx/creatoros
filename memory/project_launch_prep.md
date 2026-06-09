---
name: Mini-Program Launch Prep
description: CreatorOS 小程序上架进度、架构事实、关键坑（当前快照）
type: project
---

CreatorOS 小程序上架 — 当前状态（git 最新均已 push 到 main）

## 已就绪
- **HTTPS 全线**：域名 `creatorbar.cn` 已备案+DNS，Let's Encrypt 证书(certbot 自动续期)，nginx 443 反代
  - H5 `https://creatorbar.cn`、后台 `https://admin.creatorbar.cn`、API `https://creatorbar.cn/api`
- **小程序(Taro)** 三页+活动详情，已对齐设计稿 `~/Desktop/creatoros.pen`（注意：不是仓库里旧的 creatoros-mvp.pen）
  - 功能：微信登录(报名前静默引导)、报名(免费)、微信转发分享、登录卡片采集头像/昵称、已报名态+报名详情弹窗
- **活动展示模型**：上架=展示(含已结束 ENDED)，下架=CANCELLED=隐藏；状态按时间实时算(报名中→报名结束(到开始时间/满员)→已结束(活动次日0点))，见 app/src/utils/eventStatus.ts
- **活动删除**：仅「已下架+已结束」可删(级联删报名)；已结束可「重新上架」
- 后台「免费报名」开关；微信支付**代码框架就绪但未部署/未联调**(等商户号)

## 小程序账号（2026-06 换新）
- 新 AppID `wx0e0e6af43303ee67`（企业，旧账号主体有问题已弃用）；AppSecret 在生产 ecosystem.config.js
- **待用户在新账号后台做**：企业认证、小程序备案、服务器域名(request+uploadFile=`https://creatorbar.cn`)、服务类目(餐饮/酒吧+食品经营许可证)

## 外部阻塞
- 微信支付商户号审核中 → 下来后：填 .env 配置 + **部署 Order 迁移** + 联调回调；删除级联届时补 order 清理

## 关键坑（务必记住）
- Event.price 单位是**分**
- 小程序无 lucide 字体 → 图标用 SVG data-URI 背景图（app/src/utils/lucide.ts）
- prisma schema 在 `server/src/prisma/`，用 prisma.config.ts；generate 要 `--schema`
- PrismaService 手动暴露 delegate（加模型要补）；**生产 Prisma client 无 Order delegate**(支付迁移未上生产)→ 引用 tx.order 会编译失败
- 微信支付 notify 需 rawBody（main.ts 已开）

参见 [[server_info]] [[feedback_dev_workflow]]
