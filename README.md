# CreatorOS

全球华人创造者社区 — 从线下酒馆活动开始，连接有趣的灵魂。

## 项目背景

我们经营两家线下酒馆（敞开酒馆 & Offen Bar），不定期举办各种分享活动和社交活动。CreatorOS 旨在将线下活动用户做线上化沉淀，提供活动报名入口，促进人与人之间的线下连接。

## 在线体验

| 端 | 地址 | 说明 |
|---|------|------|
| 用户端 H5 | http://116.62.188.30:4002 | 手机浏览器访问 |
| 管理后台 | http://116.62.188.30:4001 | admin / CreatorOS@admin |
| API Server | http://116.62.188.30:4000/api | RESTful API |
| 健康检查 | http://116.62.188.30:4000/api/health | 服务状态 |

## 已完成功能

### 用户端 H5

**首页**
- Banner 轮播（后台配置多图、自动轮播、时长可调）
- 4 功能入口（主题分享/活动策划/PlanF/Creator）
- 场馆卡片横向滚动（点击进入场馆详情）
- 精彩活动推荐（横向滚动卡片）
- 数据预加载 + 内存缓存（二次访问秒显示）

**发现页**
- Tag 分类筛选（全部/音乐/品鉴/沙龙/脱口秀/派对）
- 活动卡片列表（状态/时间/场馆/头像栈/剩余名额/报名按钮）
- 骨架屏加载态，不闪现"暂无活动"

**活动详情**
- 多图轮播 + 点击全屏预览（左右滑动切换）
- 结构化信息展示（亮点✨/流程📋/注意事项📌）
- 剩余名额显示（≤5 红色高亮"仅剩N个名额"）
- 时间到期自动显示"已结束"
- 报名按钮（金色渐变 + 阴影 + 按下反馈）
- 参与者头像列表
- 失败自动重试 + 骨架屏加载

**场馆详情**
- 封面图点击预览（合并封面+详情图浏览）
- 详情图轮播 + 点击全屏预览
- 场馆下活动列表（可点击进入详情）

**我的页**
- 风景背景图 + 头像/昵称/城市/标签
- 个人简介卡片（编辑入口）
- 参与活动列表

**交互体验**
- 渐进式图片加载（模糊缩略图 → 高清图淡入）
- WebP 格式 + sharp 压缩（比 JPEG 小 30-50%）
- 全局点击态反馈（卡片按下缩放效果）
- 响应式适配（iPhone SE ~ Pro Max + 安全区域）
- API 全局自动重试（网络失败重试 2 次）
- 3 栏药丸式 TabBar（首页/发现/我的）

### 管理后台

**数据概览**
- 统计卡片（总活动/进行中/总报名/总用户）
- 热门活动 Top 5（按报名数排序）
- 最近活动列表

**活动管理**
- 创建/编辑/复制/发布/下架活动
- 多图上传（上移/下移排序，首图为封面）
- 轮播设置（开关 + 时长）
- 结构化描述（活动亮点/流程/注意事项）
- 社区精选标记
- 发布/下架二次确认弹窗
- 手机预览（iPhone 壳 iframe 实时预览）
- 报名详情查看

**Banner 管理**
- 多 Banner 配置（标题/副标题/多图）
- 列表排序（上移/下移按钮）
- 启用/禁用开关
- 全局轮播设置（底部独立设置区，保存并生效）

**场馆管理**
- 封面图(4:3) + 详情图(16:9) 分开上传
- 详情图上移/下移排序 + 轮播设置
- CRUD 完整操作

**图片上传**
- 格式校验（JPG/PNG/GIF/WebP）
- 5MB 大小限制 + 用户提示
- 自动裁剪到目标宽高比（居中裁剪）
- 自动压缩（WebP 格式，quality 80，最大 1200px）
- 生成模糊缩略图（~100 字节，用于渐进加载）

### 微信小程序（Taro）
- 代码已完成，模拟器可运行
- 三页面架构（首页/发现/我的）
- 微信登录接口已就绪
- **待域名备案后上线**（web-view 嵌入 H5 方案）

## 技术栈

| 层 | 选型 |
|---|------|
| 用户端 H5 | React 18 + TypeScript + Vite |
| 用户端小程序 | Taro 4.1.6 (React + TypeScript) |
| 管理后台 | React 18 + TypeScript + Ant Design 5 + Vite |
| 后端 | Node.js 20 + NestJS 11 + TypeScript |
| 数据库 | PostgreSQL 16 + Prisma 7 |
| 图片处理 | sharp（裁剪 + 压缩 + WebP + 缩略图） |
| Web 服务 | Nginx（gzip + 静态缓存）+ PM2 |

## 项目结构

```
creatoros/
├── h5/                     # 用户端 H5 Web App
│   ├── src/pages/          # Home, Discover, Profile, EventDetail, Venue, Login
│   ├── src/components/     # TabBar, LazyImage, ImageCarousel, ImageViewer
│   └── src/services/       # api, banner, event, venue, user, cache
├── app/                    # Taro 微信小程序
│   ├── src/pages/          # 6 个页面
│   ├── src/components/     # NavBar, TabBar, EventCard
│   └── src/services/       # api, banner, event, venue, auth, user
├── admin/                  # 管理后台
│   ├── src/pages/          # Dashboard, EventList, EventForm, BannerList, VenueList, UserList, EventSignups
│   └── src/services/       # api, auth, banner, event, venue, user
├── server/                 # NestJS 后端
│   ├── src/modules/
│   │   ├── auth/           # 微信登录 + 管理员登录 + JWT
│   │   ├── event/          # 活动 CRUD + 复制 + 状态管理
│   │   ├── signup/         # 报名（事务保护）
│   │   ├── venue/          # 场馆 CRUD
│   │   ├── banner/         # Banner CRUD
│   │   ├── upload/         # 图片上传（裁剪+压缩+缩略图）
│   │   ├── user/           # 用户管理
│   │   └── health/         # 健康检查
│   ├── src/prisma/         # 数据库 Schema
│   └── scripts/            # 备份脚本 + 状态更新脚本
└── ecosystem.config.js     # PM2 部署配置
```

## 数据库模型

```
Users ←── Signups ──→ Events ──→ Venues
                      Banners (独立)
```

- **User**: 微信 openId、昵称、头像、城市、MBTI、星座、年代等
- **Event**: 标题、描述、亮点/流程/注意事项、多图、轮播设置、时间、价格、状态
- **Signup**: 用户+活动（唯一约束，事务保护）
- **Venue**: 名称、地址、封面图(4:3)、详情图(16:9)、轮播设置
- **Banner**: 标题、副标题、多图、轮播设置、排序、启用状态

## 安全措施

- JWT 密钥必须配置（启动时校验，无默认值）
- 管理员密码必须配置（启动时校验）
- CORS 可配置（默认允许，生产环境应限定域名）
- 图片上传格式+大小校验
- 报名操作事务保护（防并发超卖）
- 图片存储相对路径（换域名不用改数据库）

## 性能优化

- **Nginx**: gzip 压缩（JS 减少 68%）+ 静态资源 1 年缓存
- **图片**: WebP 格式 + 模糊缩略图渐进加载 + sharp 压缩
- **前端**: 数据预加载 + 内存缓存 + 骨架屏 + API 自动重试
- **服务端**: Cache-Control 头 + 数据库索引
- **响应式**: CSS zoom 缩放适配不同屏幕

## 定时任务

| 时间 | 任务 |
|------|------|
| 每天 2:00 | 数据库自动备份（保留 7 天） |
| 每小时整点 | 自动将过期活动标记为"已结束" |

## 部署信息

| 项目 | 配置 |
|------|------|
| 服务器 | 阿里云 ECS 2核4G (116.62.188.30) |
| 系统 | Ubuntu 24.04 LTS |
| Node | v20.20.2 |
| PostgreSQL | 16.14 |

| 服务 | 端口 | 运行方式 |
|------|------|----------|
| API Server | 4000 | PM2 (creatoros-server) |
| 管理后台 | 4001 | Nginx 静态服务 |
| 用户端 H5 | 4002 | Nginx 静态服务 |

## 待办事项

- [ ] 域名备案（企业主体，已提交）
- [ ] SSL 证书 + HTTPS 配置
- [ ] 微信小程序上线（web-view 嵌入 H5）
- [ ] 微信后台配置域名白名单
- [ ] 微信登录真机测试
- [ ] 用户报名通知（微信模板消息）

## 微信小程序

| 项目 | 值 |
|------|------|
| AppID | wxe06a5dc36a7f7550 |
| 主体 | 企业 |
| 状态 | 待域名备案后上线 |

## License

MIT
