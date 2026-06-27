# CreatorOS

全球华人创造者社区 — 从线下酒馆活动开始，连接有趣的灵魂。

## 项目背景

经营两家线下酒馆（敞开酒馆 & Offen Bar），不定期举办分享 / 社交活动。CreatorOS 把线下活动线上化沉淀，提供活动报名、会员、社区入口，促进人与人之间的线下连接。

> 当前主形态：**微信小程序**（Taro），配套 **管理后台** 与 **用户端 H5**，共用同一套 NestJS 后端。

## 在线体验

| 端 | 地址 / 标识 | 说明 |
|---|------|------|
| 微信小程序 | AppID `wx0e0e6af43303ee67` | 发现 / 我的 两 Tab |
| 用户端 H5 | https://creatorbar.cn | 手机浏览器访问 |
| 管理后台 | https://admin.creatorbar.cn | 运营配置 |
| API | https://creatorbar.cn/api | RESTful |
| 健康检查 | https://creatorbar.cn/api/health | 服务状态 |

## 2.0 产品形态（当前）

小程序为 **两个 Tab：发现 / 我的**（2.0 已移除「首页」Tab 与 Creator 模块）。

- **发现页**：搜索框（服务端全字段搜索）+ 分类标签（按活动数排序）+ 三大专栏卡 + 活动竖图卡列表
- **专栏**：敞开精选（FEATURED）/ PlanF 专享（PLANF）/ 大咖分享（GUEST）；后台可配标题/简介/图标/背景图/排序（左移右移）
- **分类**：运营自定义（名称 / 图标 / 封面 / 会员每月免费）；发现页按有效活动数降序
- **PlanF 会员**：¥998/年，专享活动免费 + 日常活动 8 折 + 每月免费名额（大咖 / 聚会）
- **优惠券**：新人 10 元酒水券等
- **我的页**：头图（简介 + 编辑资料叠加）+ 会员卡 + 优惠券 + 我参与的

## 已完成功能

### 微信小程序（Taro 4.1.6）

**发现页**
- 顶部搜索框 → 服务端全字段搜索（标题 / 描述 / 亮点 / 流程 / 须知 / 发起人 / 大咖 / 场地），防抖 + 搜索结果态 + 无结果提示
- 分类标签横滑（lucide 图标，按活动数自动排序）
- 三大专栏卡（背景图 + 渐变 + 标题简介）
- 活动竖图卡（左 3:4 封面 + 右信息 + 报名头像栈最多 5，右压左）
- 卡片右下角按活动状态智能展示：报名中无人 → 彩色占位圈(末位 ?) +「立即报名」；已无法报名(报名结束/已结束)且本人未参与 →「下次参与」(有人报过显示头像、无人则彩色占位圈)；本人已参与或有人报名 →「X人已报名」
- 活动时间人性化展示（卡片 / 详情通用）：今天 / 明天 / 后天直接成词；未来 7 天内加（周几），如「6月28日（周五）」；今年省略年份只显「X月X日」；跨年显示完整「YYYY年M月D日」
- 返回静默刷新，保留滚动位置

**活动详情**
- 顶部 3:4 竖图（多图轮播 + 全屏预览）
- 富文本图文正文（后台 Quill → 小程序 rich-text，注入间距 / 空行 / 段距，左对齐公众号式排版）
- 报名按钮随状态自动变化；PlanF 引导气泡常驻报名按钮上方（crown 图标 + 查看）
- 费用区：价格与 PlanF 引导同行（可点击跳会员页）+ 费用说明文案（`priceNote`，解释价格含什么）；会员价 / 免费名额展示
- 分享到微信联系人 / 群 + 朋友圈（朋友圈卡片用活动封面；iOS 微信不支持小程序分享朋友圈，Android 可用）

**专栏页 / 分类页**
- 专栏页：顶部图标方块 + 标题简介 + 该专栏活动
- 分类页：banner + 该分类活动

**我的页 / 编辑资料**
- 头图叠加个人简介 + 编辑资料胶囊；性别 ♂蓝 / ♀粉 图标（lucide mars/venus）、MBTI / 星座 / 自定义标签
- PlanF 会员卡（有效期 + 本月免费名额）、优惠券入口（真实可用券数）
- 编辑资料：微信头像昵称填写能力 + 城市 / MBTI / 星座选择器 + 自定义标签
- 首次登录引导完善头像昵称

**会员 / 优惠券 / 报名**
- 开通 PlanF 会员（微信支付）、会员权益页
- 我的优惠券
- 活动报名（免费名额直接确认、付费走微信支付）

### 管理后台

**活动管理**
- 创建 / 编辑 / 复制 / 发布 / 下架 / 删除（已下架即可删除 + 二次确认）
- 多图上传、点选「设为封面」、3:4 居中裁剪、10MB 限制
- 分类 / 社区精选 / PlanF 专享 / 大咖分享 标记
- 报名详情 + **手动添加报名成员**（搜索选用户）+ 退款
- 富文本编辑器（Quill）图文正文

**分类管理**：名称 / 图标（全量 lucide 搜索选择）/ 封面 / 排序 / 会员每月免费
**专栏配置**：标题 / 简介 / 图标 / 背景图，左移右移排序，「敞开精选 / PlanF 专享 / 大咖分享」
**会员 / 优惠券 / 用户 / 场馆 / Banner 管理**

**隐私**：报名列表 / 用户列表手机号脱敏（`138****5678`）；用户管理页凭查看密码解锁完整号

**图标库**：lucide-static 全量 1986 图标，`/api/icons` 列表 + `/api/icon/:name?color=` SVG，后台带预览搜索选择

### 用户端 H5
- 活动 / 场馆浏览、详情、报名（与小程序共用后端）

## 技术栈

| 层 | 选型 |
|---|------|
| 小程序 | Taro 4.1.6（React + TypeScript）|
| H5 / 后台 | React 18 + TypeScript + Vite（后台 Ant Design 5）|
| 后端 | NestJS + TypeScript |
| 数据库 | PostgreSQL + Prisma 7（PrismaPg adapter）|
| 图片处理 | sharp（裁剪 / 压缩 / WebP / 缩略图）|
| 图标 | lucide-static（服务端全量 SVG）|
| Web 服务 | Nginx（gzip + 静态缓存）+ PM2 |

## 项目结构

```
creatoros/
├── app/      # Taro 小程序（发现 / 我的 + 详情 / 专栏 / 分类 / 会员 / 优惠券 / 编辑资料 / index 入口页）
├── admin/    # 管理后台（活动 / 分类 / 专栏 / 会员 / 优惠券 / 用户 / 场馆 / Banner / 报名）
├── h5/       # 用户端 H5
└── server/   # NestJS 后端
    └── src/
        ├── modules/  auth event signup venue banner upload user
        │             category column coupon membership icon health
        ├── common/   event-card.ts、lucide-icons.ts
        └── prisma/   schema.prisma（prisma.config.ts，generate 带 --schema）
```

## 数据库模型（2.0）

- **User**：`uid`（11 位运营编号，唯一）、微信、昵称、头像、城市、性别、MBTI、星座、`tags[]`
- **Event**：标题 / 富文本描述 / 亮点 / 流程 / 须知 / 多图 / 3:4 封面 / 价格 / `priceNote`（费用说明文案，解释价格含什么）/ 状态 + `categoryId` / `isPlanfExclusive` / `isGuestShare` / `guestName` / `featured`
- **Category**：名称 / 简介 / 封面 / `icon` / `order` / `memberFreeMonthly`
- **ColumnConfig**：`type`(FEATURED/PLANF/GUEST) / 标题 / 简介 / `icon` / `bgUrl` / `order`
- **Membership** + **MembershipBenefitUsage**：PlanF 会员 + 每月免费名额用量（periodKey + benefitType 唯一）
- **Coupon**：优惠券（类型 / 面额 / 状态 / 有效期）
- **Signup**：报名（用户 + 活动唯一约束，事务保护）
- **Order**：订单（`type` EVENT/MEMBERSHIP，微信支付，幂等确认）
- **Venue** / **Banner**

## 后端要点

- **搜索**：`/api/events?keyword=` 全字段 OR contains（大小写不敏感）
- **图标**：`/api/icons`（全量名）+ `/api/icon/:name?color=`（SVG）；分类 / 专栏数据附 `iconPath` 供小程序渲染
- **会员定价**：`MembershipService.computePricing` 返回会员价 / 免费类型 / 免费名额；免费名额按会员月周期（periodKey）计
- **图片**：sharp 居中裁剪到目标比例（event 3:4 / maxWidth 1500 / quality 88）+ WebP + 模糊缩略图

## 安全 / 性能 / 定时任务

- JWT 密钥与管理员密码启动时校验；报名 / 订单事务保护（防超卖）；图片格式 + 大小校验
- 接口限流（全局 + 后台登录防撞库）；全局异常过滤器（统一响应、不泄露内部细节）；外部请求（微信）超时保护
- WebP + 渐进缩略图；详情页轮播图预加载（去 lazyLoad，左右切换更顺）；Nginx gzip + 静态长缓存；Cache-Control 头 + 数据库索引
- 每天 2:00 数据库自动备份（保留 7 天）；每小时整点将过期活动标记「已结束」

## 部署

| 项 | 配置 |
|---|------|
| 服务器 | 阿里云 ECS `116.62.188.30`（**共享服务器，勿影响其他项目**）|
| API | 端口 4000 / PM2 `creatoros-server` |
| 后台 / H5 | Nginx 静态（`admin.creatorbar.cn` / `creatorbar.cn`）|
| 环境变量 | 生产 `ecosystem.config.js`（PM2 注入，已 gitignore，本地有 `.example`）|

**部署约定**：
- 改后端 → `rsync server/src` + `npm run build` + `pm2 restart creatoros-server`
- schema 变更 → `prisma db push --accept-data-loss`（需带 `DATABASE_URL`，从 ecosystem 读）+ `prisma generate`
- 后台 / H5 → 本地 build + `rsync dist`
- **生产 git 有本地分叉，禁止 `git pull` / 全量同步**；push 到 GitHub 不影响生产

## 进度（截至 2026-06）

**已完成**
- [x] 三端 HTTPS 上线（`creatorbar.cn` / `admin.creatorbar.cn` / `creatorbar.cn/api`）
- [x] **2.0 大改版**：移除 Creator / 首页 Tab → 分类 + 专栏 + PlanF 会员 + 优惠券 + 活动竖图卡（3:4）
- [x] 服务端全字段搜索、全量 lucide 图标库、富文本公众号式排版、报名手动加成员、专栏左移右移排序、分类按活动数排序
- [x] 微信支付（活动报名 + 会员开通）、首次登录引导填头像昵称
- [x] 真机白屏根治（入口页规避冷启动 + custom tabBar component 声明）
- [x] 稳定性加固：接口限流 / 全局异常过滤器 / 配置校验 / 外部请求超时 / 定时任务健壮化；架构精简（PrismaService 继承、会员逻辑去重、`@Body` 全量 DTO 校验）
- [x] 手机号脱敏 + 凭密码查看；活动卡片状态化展示（立即报名 / 下次参与 / 已报名）；活动详情朋友圈分享

**待办**
- [ ] 小程序正式版提交审核上线
- [ ] 用户报名通知（微信模板消息）

## 微信小程序

| 项 | 值 |
|---|------|
| AppID | `wx0e0e6af43303ee67` |
| 主体 | 企业（已认证）|
| 合法域名 | https://creatorbar.cn |
| Tab | 发现 / 我的 |

## License

MIT
