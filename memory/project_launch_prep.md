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
- 后台「免费报名」开关
- **微信支付已上线联调通过**（2026-06-14）：商户号 1113363458，JSAPI 下单→支付→报名确认全链路 OK；真实付款 ¥1 已验证

## 小程序账号（2026-06 换新）
- 新 AppID `wx0e0e6af43303ee67`（企业，旧账号主体有问题已弃用）；AppSecret 在生产 ecosystem.config.js
- **待用户在新账号后台做**：企业认证、小程序备案、服务器域名(request+uploadFile=`https://creatorbar.cn`)、服务类目(餐饮/酒吧+食品经营许可证)

## 微信支付实现要点（踩坑后定型）
- 验证回调**不走平台证书 RSA 验签**（新商户拉不到平台证书，verifySign 报「拉取平台证书失败」）→ 改为**用 APIv3 密钥直接 AES-GCM 解密**，解密成功即证明来自微信（GCM 自带认证）。见 wechat-pay.service.ts verifyAndDecryptNotify
- **查单兜底**：OrderService.getOrder 对 PENDING/CLOSED 单主动 `query({out_trade_no})`（商户证书签名，不需平台证书/APIv3），SUCCESS 则补 confirmPaid——回调丢失也能确认，避免收钱不报名
- 库 `wechatpay-node-v3`：下单/查单返回值在 `res.data`（不是顶层）
- APIv3 密钥须**生产 ecosystem 与商户平台一致**，否则回调解密失败
- **退款（仅后台操作）**：报名详情页对 PAID 订单点退款。退款以「订单 PAID」为准而非报名状态（已取消但已付款仍可退）。乐观锁 PAID→REFUNDING 防重复退款；微信受理(SUCCESS/PROCESSING)即取消报名+释放名额；REFUNDING 由 5min cron 查 find_refunds 对账落地 REFUNDED。已验证真实退款 ¥1 原路退回成功
- **付费报名取消即自动原路退款**（用户自助）：SignupService.cancelSignup 对 PAID 订单调 OrderService.refundSignup（PaymentModule 导出、SignupModule 引入），退款+取消+释放名额一气呵成；免费报名接口拦截付费活动防绕过支付。后台退款仍可用（两条路都走 refundSignup）
- 用户 UID = 11 位随机数字字符串（全局唯一），auth.service genUid/createUser 登录时分配、撞号重试

## 关键坑（务必记住）
- Event.price 单位是**分**
- 小程序无 lucide 字体 → 图标用 SVG data-URI 背景图（app/src/utils/lucide.ts）
- prisma schema 在 `server/src/prisma/`，用 prisma.config.ts；generate 要 `--schema`
- PrismaService 手动暴露 delegate（加模型要补）；Prisma 7 + PrismaPg adapter，构造要传 `{adapter: new PrismaPg({connectionString})}`（写一次性脚本时别忘）
- 生产 Order 迁移**已部署**、Prisma client 已含 order delegate（支付上线时完成）
- 微信支付 notify 需 rawBody（main.ts 已开）

参见 [[server_info]] [[feedback_dev_workflow]]
