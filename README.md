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

## 已完成功能

### 用户端 H5
- **首页**：Banner 轮播、4 功能入口（主题分享/活动策划/PlanF/Creator）、场馆卡片横向滚动、精彩活动推荐
- **发现页**：Tag 分类筛选（全部/音乐/品鉴/沙龙/脱口秀/派对）、活动卡片列表（状态/时间/场馆/头像栈/报名按钮）
- **我的页**：风景背景图、头像/昵称/城市/标签、个人简介（编辑入口）、参与活动列表
- **活动详情**：多图轮播、活动信息、参与者头像、报名/取消报名
- **场馆详情**：封面图、场馆信息、详情图轮播、该场馆下的活动列表
- **图片加载**：LazyImage 组件（loading 动画 → 自动重试 → 淡入显示）、骨架屏加载态

### 管理后台（PC + 移动端自适应）
- **活动管理**：创建/编辑/发布活动、多图上传（上移/下移排序）、轮播设置（开关+时长）、统计数据
- **Banner 管理**：多 Banner 配置、多图上传、全局轮播设置（独立保存）
- **场馆管理**：封面图(4:3) + 详情图(16:9)分开上传、轮播设置、CRUD
- **用户管理**：用户列表、状态管理
- **图片上传**：格式校验(JPG/PNG/GIF/WebP)、5MB 大小限制、自动裁剪到目标宽高比、sharp 压缩

### 微信小程序（Taro）
- 代码已完成，模拟器可运行
- 三页面架构（首页/发现/我的）
- 微信登录接口已就绪（AppID/AppSecret 已配置）
- **待域名备案后上线**（计划使用 web-view 方案嵌入 H5，体验一致）

### 核心流程
- 管理员创建活动 → 上传多图 → 设置轮播 → 发布 → 用户端实时可见
- 用户报名 → 管理后台报名数据实时更新
- 报名满额 → 自动切换为"报名已满"状态
- Banner/场馆/活动图片均通过后台动态配置

## 技术栈

| 层 | 选型 |
|---|------|
| 用户端 H5 | React 18 + TypeScript + Vite |
| 用户端小程序 | Taro 4.1.6 (React + TypeScript) |
| 管理后台 | React 18 + TypeScript + Ant Design 5 + Vite |
| 后端 | Node.js 20 + NestJS 11 + TypeScript |
| 数据库 | PostgreSQL 16 + Prisma 7 |
| 图片处理 | sharp（自动裁剪 + 压缩） |
| 部署 | PM2 + Nginx (独立服务器) |

## 项目结构

```
creatoros/
├── h5/                   # 用户端 H5 Web App
│   ├── src/pages/        # 5 个页面（Home/Discover/Profile/EventDetail/Venue）
│   ├── src/components/   # TabBar、LazyImage、ImageCarousel
│   └── src/services/     # API 服务（banner/event/venue/user）
├── app/                  # Taro 微信小程序
│   ├── src/pages/        # 6 个页面
│   ├── src/components/   # NavBar、TabBar、EventCard
│   └── src/services/     # API 服务
├── admin/                # 管理后台 Web
│   ├── src/pages/        # EventList/EventForm/BannerList/VenueList/UserList
│   └── src/services/     # API 服务
├── server/               # NestJS 后端 API
│   └── src/
│       ├── modules/
│       │   ├── auth/     # 认证（微信登录 + 管理员登录 + JWT）
│       │   ├── user/     # 用户管理
│       │   ├── event/    # 活动管理（多图 + 轮播）
│       │   ├── signup/   # 报名管理
│       │   ├── venue/    # 场馆管理（封面图 + 详情图）
│       │   ├── banner/   # Banner 管理（多图 + 轮播）
│       │   └── upload/   # 文件上传（裁剪 + 压缩）
│       └── prisma/       # 数据库 Schema
├── design/               # 设计稿 (.pen 文件)
└── ecosystem.config.js   # PM2 部署配置
```

## 数据库模型

```
Users ←── Signups ──→ Events ──→ Venues
                      Banners (独立)
```

- **User**: 用户（微信 openId、昵称、头像、城市、MBTI、星座、年代等）
- **Event**: 活动（标题、描述、多图、轮播设置、时间、场馆、价格、状态、发起人）
- **Signup**: 报名记录（用户+活动，唯一约束）
- **Venue**: 场馆（名称、地址、城市、封面图、详情图、轮播设置）
- **Banner**: 首页轮播（标题、副标题、多图、轮播设置、排序、启用状态）

## API 端点

### 公开端点
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/banners | 获取启用的 Banner 列表 |
| GET | /api/venues | 获取场馆列表 |
| GET | /api/venues/:id | 场馆详情 |
| GET | /api/venues/:id/events | 场馆下的活动列表 |
| GET | /api/events | 已发布活动列表（含报名头像） |
| GET | /api/events/featured | 精选活动 |
| GET | /api/events/:id | 活动详情 |
| POST | /api/auth/wx-login | 微信登录 |
| POST | /api/auth/admin-login | 管理员登录 |

### 管理端点（需 JWT + Admin）
| 方法 | 路径 | 说明 |
|------|------|------|
| CRUD | /api/admin/banners | Banner 管理 |
| CRUD | /api/admin/venues | 场馆管理 |
| CRUD | /api/admin/events | 活动管理 |
| POST | /api/upload/image?type=banner\|event\|venue | 图片上传（自动裁剪压缩） |

## 部署信息

| 项目 | 配置 |
|------|------|
| 服务器 | 阿里云 ECS 2核4G (116.62.188.30) |
| 系统 | Ubuntu 24.04 LTS |
| Node | v20.20.2 |
| PostgreSQL | 16.14 |

| 服务 | 端口 | PM2 名称 |
|------|------|----------|
| API Server | 4000 | creatoros-server |
| 管理后台 | 4001 | creatoros-admin |
| 用户端 H5 | 4002 | creatoros-h5 |

## 待办事项

- [ ] 域名备案（企业主体）
- [ ] SSL 证书 + HTTPS 配置
- [ ] 微信小程序上线（web-view 嵌入 H5 方案）
- [ ] 微信后台配置域名白名单
- [ ] 小程序 UI 精细对齐
- [ ] 微信登录真机测试

## 微信小程序信息

| 项目 | 值 |
|------|------|
| AppID | wxe06a5dc36a7f7550 |
| 主体 | 企业 |
| 状态 | 待域名备案后上线 |

## License

MIT
