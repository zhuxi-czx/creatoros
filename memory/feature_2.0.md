---
name: CreatorOS 2.0 改版 技术方案
description: 2.0 大改版的完整技术方案：数据模型/API/前后台关联/折扣逻辑/分期（2026-06 确认，开发中）
metadata:
  type: project
---

CreatorOS **2.0 大改版**（2026-06-25 设计定稿 + 技术方案确认，开发中）。设计稿在 `~/Desktop/creatoros.pen` 的「CreatorOS 2.0 设计版本」区（12 个页面/弹窗）。

## 总体方向
- 底部 Tab 3→2（去首页，留**发现/我的**）
- 去掉全部 **Creator/敞开对谈**（前端+后端+数据彻底删）
- 新增：**分类**、**专栏**(社区精选/PlanF专享/大咖分享)、**PlanF 会员**、**优惠券**、活动卡左竖图新样式、会员价/折扣

## 数据模型（Prisma）变更
**删除**：`CreatorProfile`、`Content` 模型，`User.isCreator`，`ContentStatus` enum（drop 表+删生产数据）

**新增模型**：
- `Category`：name / intro / coverUrl / icon / order / **memberFreeMonthly**(Bool, 标记"群友聚会"类，会员每月免费1场)
- `ColumnConfig`(专栏配置,3条种子)：type(FEATURED|PLANF|GUEST) / title / intro / icon / bgUrl
- `Membership`：userId(1:1) / status / startAt / expireAt(一年期)
- `MembershipBenefitUsage`：membershipId / periodKey(按入会日算的"会员月") / benefitType(GUEST_FREE|GATHERING_FREE) / eventId —— 记录每月免费名额是否已用
- `Coupon`：userId / type(DRINK_10) / amount(分) / status(UNUSED|USED|EXPIRED) / expireAt / usedAt —— 纯线下核销，状态流转，不接支付

**Event 新增**：categoryId? / featured(社区精选,已有) / isPlanfExclusive(PlanF专享) / isGuestShare + guestName(大咖分享)。封面图 imageUrls 改 **3:4 或 9:16 竖图**（sharp 居中裁剪），详情页轮播
**User 改造**：gender Int→String(男/女/其他) / tags String[](自定义标签)；mbti/zodiac 已有
**Order 改造**：eventId 改可空 + 新增 type(EVENT|MEMBERSHIP)，复用现有微信支付链路下会员单(998/年)

## 价格/折扣规则（核心）
会员价 = `round(原价 × 0.8)`（分）。
| 活动 | 非会员 | 会员 |
|---|---|---|
| 普通付费 | 原价 | 8折 |
| 大咖活动(付费, isGuestShare) | 原价 | 本月免费名额未用→免费(名额-1)；用完→8折 |
| 群友聚会(付费, memberFreeMonthly分类) | 原价 | 同上，独立名额 |
| 免费/专享活动 | 免费 | 免费 |
- **PlanF专享活动** = 免费 + isPlanfExclusive；所有人免费报名**不拦截**，详情页对非会员轻引导开通会员
- 酒水8.8折 + 10元券：纯线下，不进支付

## 前后台强关联（务必同步改）
- 活动表单：选/建**分类**(可快速新建) + 三开关(社区精选/PlanF专享/大咖分享+大咖名) + 封面3:4/9:16裁剪 → 前台分类标签/分类页/专栏页/卡片大咖标识/详情价格
- **分类管理**页(名/介绍/封面/图标/排序/群友聚会标记) / **专栏配置**页(背景图/icon/名/简介) → 前台展示
- 用户**会员状态**(后台可查/手动调) → 会员卡/会员价/专享引导
- **优惠券**：注册自动送10元券(有效期1月)；后台可查

## 小程序页面(2.0)
2 Tab。发现页(专栏卡+分类标签置顶+活动列表) / 分类页 / 专栏页×3(纯色低饱和顶) / 活动详情(竖图轮播+圆角内容区+会员价/轻引导) / 会员简介页(998/4权益) / 我的页(简介上移背景图+会员卡+优惠券入口+编辑入口) / 优惠券列表 / 使用确认弹窗 / 编辑资料(性别男女其他+MBTI+星座+自定义标签)。删 creator-channel/detail、content-detail、index 首页

## 开发分期（进度，2026-06-25）
1. ✅ 后端 Prisma 迁移 + 删 Creator（schema 改完编译过；迁移 SQL 待部署执行）
2. ✅ 后端 API（分类/专栏/会员/优惠券/折扣/活动字段/支付集成，tsc 过）
3. ✅ 管理后台（删 Creator、分类管理、专栏配置、活动表单新字段、upload 竖图 3:4，tsc 过）
4. ✅ 小程序（2Tab/发现改版/分类页/专栏页/EventCard竖图/详情会员价+轻引导+free报名/会员页/优惠券页+弹窗/profile会员卡+券入口/profile-edit性别·MBTI·星座·标签/删 creator·content·index；taro build 过）
5. ✅ 部署完成（2026-06-25）：备份生产库（/root/creatoros_backup_20260625_225350.sql 28K）→ rsync server/src → `prisma db push --accept-data-loss`（drop Content/CreatorProfile/isCreator、gender Int→String 零数据、建 5 新表）→ generate → nest build → pm2 restart；后台 rsync dist 上线。API 验证 health/categories/columns/events/banners 全 200，专栏种子 3 条到位。**小程序待用户在微信开发者工具上传**。⚠️ db push 顺带删了 Banner 旧冗余列 imageUrl（2 条，备份可恢复，接口正常无碍）。
   ——以下为当时的部署清单（已执行）——
   - 生产 Prisma 迁移（**破坏性**）：drop CreatorProfile/Content 表、User.gender Int→String（需 `USING gender::text` 或先清空）、删 User.isCreator、建 Category/ColumnConfig/Membership/MembershipBenefitUsage/Coupon 表、Event 加 5 字段、Order 加 type+eventId 可空、User 加 tags。**先备份 DB**
   - 后端：scp 改动文件 + `npm run build` + `pm2 restart creatoros-server`（含新模块整目录 modules/{category,column,coupon,membership}、common/event-card.ts、改动的 payment/event/auth/user/upload/prisma/app.module）
   - 后台：本地 build + `rsync dist`
   - 小程序：微信开发者工具上传（用户操作）
   - 小程序端 Image 加载 picsum/外链需在合法域名；活动封面已存 /uploads

### 关键文件（已建/改）
- 后端新模块：`server/src/modules/{category,column,coupon,membership}/`；`common/event-card.ts`
- 折扣核心：`membership.service.ts` computePricing/consumeFreeQuota；`payment/order.service.ts` checkout 会员价+免费名额、checkoutMembership、confirmPaid 开通
- 注册送券：`auth.service.ts` createUser；活动新字段：`event` 模块；详情 pricing：`event.service.getEventById`
- 后台新页：`admin/src/pages/{CategoryList,ColumnConfig}.tsx`；services `{category,column}.ts`；`EventForm.tsx` 新字段

## 部署注意
生产 git 脏不能 pull，scp 单文件；Prisma 迁移按 [[server_info]] 流程；Event.price 单位分；勿影响其他服务。参见 [[feature_creator]](将废弃) [[project_launch_prep]] [[server_info]]
