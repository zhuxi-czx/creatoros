# CreatorOS 技术方案

## 1. 系统架构

```
┌─────────────────┐    ┌─────────────────┐
│  微信小程序 (Taro) │    │  管理后台 (React)  │
│  用户端           │    │  管理员端          │
└────────┬────────┘    └────────┬────────┘
         │                      │
         │    HTTPS / JWT       │
         ▼                      ▼
┌─────────────────────────────────────────┐
│           Nest.js API Server            │
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌───────┐  │
│  │ Auth │ │ User │ │Event │ │Signup │  │
│  │Module│ │Module│ │Module│ │Module │  │
│  └──────┘ └──────┘ └──────┘ └───────┘  │
│                                         │
│              Prisma ORM                 │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│            PostgreSQL                   │
│                                         │
│  users | events | signups | venues      │
└─────────────────────────────────────────┘
```

**核心原则：** 小程序和管理后台共享同一个 API Server 和数据库，通过不同的认证方式和权限控制区分用户角色。

---

## 2. 数据库设计 (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ 用户 ============
model User {
  id          String   @id @default(cuid())
  openId      String   @unique               // 微信 openId
  unionId     String?  @unique               // 微信 unionId (可选)
  nickname    String?                         // 昵称
  avatarUrl   String?                         // 头像 URL
  city        String?                         // 城市
  bio         String?                         // 个人简介
  gender      String?                         // 性别: male/female/other
  mbti        String?                         // MBTI 类型
  zodiac      String?                         // 星座
  generation  String?                         // 世代: 00后/95后/90后...
  phone       String?                         // 手机号 (可选)
  role        Role     @default(USER)         // 角色
  status      UserStatus @default(ACTIVE)     // 状态
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  signups     Signup[]                        // 报名记录
}

enum Role {
  USER
  ADMIN
}

enum UserStatus {
  ACTIVE
  DISABLED
}

// ============ 场所 ============
model Venue {
  id          String   @id @default(cuid())
  name        String                          // 场所名称
  address     String                          // 详细地址
  city        String                          // 城市
  description String?                         // 场所简介
  coverUrl    String?                         // 封面图 URL
  latitude    Float?                          // 纬度
  longitude   Float?                          // 经度
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  events      Event[]                         // 该场所的活动
}

// ============ 活动 ============
model Event {
  id          String      @id @default(cuid())
  title       String                          // 活动标题
  description String                          // 活动描述
  coverUrl    String?                         // 封面图 URL
  date        DateTime                        // 活动日期时间
  venueId     String                          // 场所 ID
  venue       Venue       @relation(fields: [venueId], references: [id])
  hostName    String                          // 发起人名称
  maxCapacity Int                             // 人数上限
  price       Int         @default(0)         // 费用 (分)
  status      EventStatus @default(DRAFT)     // 活动状态
  featured    Boolean     @default(false)     // 是否精选
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  signups     Signup[]                        // 报名记录
}

enum EventStatus {
  DRAFT       // 草稿
  PUBLISHED   // 已发布 (报名中)
  FULL        // 报名已满
  ONGOING     // 进行中
  ENDED       // 已结束
  CANCELLED   // 已取消
}

// ============ 报名 ============
model Signup {
  id          String       @id @default(cuid())
  userId      String
  user        User         @relation(fields: [userId], references: [id])
  eventId     String
  event       Event        @relation(fields: [eventId], references: [id])
  status      SignupStatus @default(CONFIRMED)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@unique([userId, eventId])                 // 一个用户只能报名一次
}

enum SignupStatus {
  CONFIRMED   // 已确认
  CANCELLED   // 已取消
}
```

---

## 3. API 设计

### 3.1 认证相关

| 方法 | 路径 | 说明 | 端 |
|------|------|------|-----|
| POST | `/api/auth/wx-login` | 微信登录 (code 换 token) | 小程序 |
| POST | `/api/auth/admin-login` | 管理员账号密码登录 | 管理后台 |
| GET  | `/api/auth/profile` | 获取当前用户信息 | 通用 |

### 3.2 用户相关

| 方法 | 路径 | 说明 | 端 |
|------|------|------|-----|
| PUT  | `/api/users/profile` | 更新个人资料 | 小程序 |
| GET  | `/api/users/:id` | 获取用户公开信息 | 通用 |
| GET  | `/api/admin/users` | 用户列表 (分页) | 管理后台 |
| GET  | `/api/admin/users/:id` | 用户详情 | 管理后台 |
| PUT  | `/api/admin/users/:id/status` | 启用/禁用用户 | 管理后台 |

### 3.3 活动相关

| 方法 | 路径 | 说明 | 端 |
|------|------|------|-----|
| GET  | `/api/events` | 活动列表 (已发布, 分页) | 小程序 |
| GET  | `/api/events/featured` | 精选活动列表 | 小程序 |
| GET  | `/api/events/:id` | 活动详情 | 通用 |
| GET  | `/api/events/:id/signups` | 活动参与者列表 | 通用 |
| POST | `/api/admin/events` | 创建活动 | 管理后台 |
| PUT  | `/api/admin/events/:id` | 编辑活动 | 管理后台 |
| PUT  | `/api/admin/events/:id/status` | 更改活动状态 | 管理后台 |
| GET  | `/api/admin/events` | 活动列表 (全状态) | 管理后台 |
| GET  | `/api/admin/stats` | 统计数据 | 管理后台 |

### 3.4 报名相关

| 方法 | 路径 | 说明 | 端 |
|------|------|------|-----|
| POST | `/api/events/:id/signup` | 报名活动 | 小程序 |
| DELETE | `/api/events/:id/signup` | 取消报名 | 小程序 |
| GET  | `/api/users/signups` | 我参与的活动 | 小程序 |

### 3.5 场所相关

| 方法 | 路径 | 说明 | 端 |
|------|------|------|-----|
| GET  | `/api/venues/:id` | 场所详情 | 小程序 |
| GET  | `/api/venues/:id/events` | 场所下的活动 | 小程序 |

### 3.6 文件上传

| 方法 | 路径 | 说明 | 端 |
|------|------|------|-----|
| POST | `/api/upload/image` | 上传图片 (返回 URL) | 通用 |

---

## 4. 认证流程

### 4.1 小程序用户登录

```
用户打开小程序
    │
    ▼
wx.login() 获取 code
    │
    ▼
POST /api/auth/wx-login { code }
    │
    ▼
Server: code → 微信服务器换 openId + sessionKey
    │
    ├── 用户已存在 → 返回 JWT token
    │
    └── 用户不存在 → 创建用户记录 → 返回 JWT token
    │
    ▼
小程序存储 token → 后续请求携带 Authorization: Bearer <token>
    │
    ▼
(可选) 调用 wx.getUserProfile() 获取头像昵称
    │
    ▼
PUT /api/users/profile 更新用户信息
```

### 4.2 管理后台登录

```
管理员打开后台
    │
    ▼
输入账号 + 密码
    │
    ▼
POST /api/auth/admin-login { username, password }
    │
    ▼
Server: 验证账号密码 + 检查 role === ADMIN
    │
    ▼
返回 JWT token (包含 role: ADMIN)
    │
    ▼
后续请求携带 token → AdminGuard 校验 role
```

### 4.3 JWT Token 结构

```json
{
  "sub": "user_cuid",
  "openId": "wx_openid",
  "role": "USER | ADMIN",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## 5. 核心业务流程

### 5.1 管理员创建活动 → 用户看到活动

```
管理员在后台填写活动信息
    │
    ▼
POST /api/admin/events (status: DRAFT)
    │
    ▼
活动保存为草稿 → 管理员可预览/编辑
    │
    ▼
管理员点击「发布活动」
    │
    ▼
PUT /api/admin/events/:id/status { status: PUBLISHED }
    │
    ▼
活动状态变为 PUBLISHED
    │
    ▼
小程序首页 GET /api/events 返回该活动
    │
    ▼
用户在「即将开始」列表中看到该活动
```

### 5.2 用户报名活动 → 管理员看到报名

```
用户点击「立即报名」
    │
    ▼
POST /api/events/:id/signup
    │
    ▼
Server 检查:
  ├── 活动状态是否为 PUBLISHED?
  ├── 报名人数是否已满?
  └── 用户是否已报名?
    │
    ▼
创建 Signup 记录 (status: CONFIRMED)
    │
    ▼
如果 signups.count >= event.maxCapacity
  → 自动将 event.status 更新为 FULL
    │
    ▼
管理后台活动列表中「报名/上限」数字更新
管理员可在活动详情中查看所有报名用户
```

### 5.3 用户注册 → 管理员看到用户

```
用户首次打开小程序
    │
    ▼
wx.login() → POST /api/auth/wx-login
    │
    ▼
Server 创建 User 记录 (仅 openId)
    │
    ▼
用户选择完善资料 → PUT /api/users/profile
    │
    ▼
管理后台 GET /api/admin/users
    │
    ▼
管理员可看到该用户及其资料完善情况
```

---

## 6. 项目目录结构 (详细)

```
creatoros/
├── app/                          # Taro 小程序
│   ├── src/
│   │   ├── app.ts
│   │   ├── app.config.ts
│   │   ├── pages/
│   │   │   ├── index/            # 首页 - 活动列表
│   │   │   │   ├── index.tsx
│   │   │   │   └── index.scss
│   │   │   ├── event-detail/     # 活动详情
│   │   │   │   ├── index.tsx
│   │   │   │   └── index.scss
│   │   │   ├── venue/            # 场所介绍
│   │   │   │   ├── index.tsx
│   │   │   │   └── index.scss
│   │   │   └── profile/          # 个人主页
│   │   │       ├── index.tsx
│   │   │       └── index.scss
│   │   ├── components/           # 通用组件
│   │   │   ├── EventCard/
│   │   │   ├── TabBar/
│   │   │   └── Tag/
│   │   ├── services/             # API 调用
│   │   │   ├── api.ts            # axios 实例 + 拦截器
│   │   │   ├── auth.ts
│   │   │   ├── event.ts
│   │   │   └── user.ts
│   │   ├── stores/               # 状态管理 (Zustand)
│   │   │   └── useAuthStore.ts
│   │   └── utils/
│   │       └── request.ts
│   ├── package.json
│   └── tsconfig.json
│
├── admin/                        # 管理后台
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Login/
│   │   │   ├── EventList/        # 活动管理列表
│   │   │   ├── EventForm/        # 新建/编辑活动
│   │   │   └── UserList/         # 用户管理列表
│   │   ├── components/
│   │   │   ├── Layout/           # 侧边栏布局
│   │   │   └── StatsCard/
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── stores/
│   ├── package.json
│   └── tsconfig.json
│
├── server/                       # Nest.js 后端
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── admin.guard.ts
│   │   │   ├── user/
│   │   │   │   ├── user.module.ts
│   │   │   │   ├── user.controller.ts
│   │   │   │   └── user.service.ts
│   │   │   ├── event/
│   │   │   │   ├── event.module.ts
│   │   │   │   ├── event.controller.ts
│   │   │   │   └── event.service.ts
│   │   │   ├── signup/
│   │   │   │   ├── signup.module.ts
│   │   │   │   ├── signup.controller.ts
│   │   │   │   └── signup.service.ts
│   │   │   ├── venue/
│   │   │   │   ├── venue.module.ts
│   │   │   │   ├── venue.controller.ts
│   │   │   │   └── venue.service.ts
│   │   │   └── upload/
│   │   │       ├── upload.module.ts
│   │   │       ├── upload.controller.ts
│   │   │       └── upload.service.ts
│   │   └── prisma/
│   │       ├── prisma.module.ts
│   │       ├── prisma.service.ts
│   │       └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
│
├── design/                       # 设计稿
│   ├── creatoros-mvp.pen
│   └── event-photo.png
│
├── docs/                         # 文档
│   └── technical-design.md
│
├── docker-compose.yml
├── .gitignore
├── README.md
└── MEMORY.md
```

---

## 7. 部署方案

### docker-compose.yml

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: creatoros
      POSTGRES_USER: creatoros
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  server:
    build: ./server
    environment:
      DATABASE_URL: postgresql://creatoros:${DB_PASSWORD}@postgres:5432/creatoros
      JWT_SECRET: ${JWT_SECRET}
      WX_APPID: ${WX_APPID}
      WX_SECRET: ${WX_SECRET}
      COS_SECRET_ID: ${COS_SECRET_ID}
      COS_SECRET_KEY: ${COS_SECRET_KEY}
      COS_BUCKET: ${COS_BUCKET}
      COS_REGION: ${COS_REGION}
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  admin:
    build: ./admin
    ports:
      - "3001:80"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - server
      - admin

volumes:
  pgdata:
```

### 环境变量 (.env)

```
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
WX_APPID=your_wx_appid
WX_SECRET=your_wx_secret
COS_SECRET_ID=your_cos_secret_id
COS_SECRET_KEY=your_cos_secret_key
COS_BUCKET=your_cos_bucket
COS_REGION=ap-hangzhou
```

---

## 8. 开发里程碑

### Phase 1: 基础框架 (第 1 周)
- [ ] 初始化 Nest.js 项目 + Prisma + PostgreSQL
- [ ] 初始化 Taro 小程序项目
- [ ] 初始化管理后台项目
- [ ] Docker Compose 本地开发环境

### Phase 2: 认证 + 用户 (第 2 周)
- [ ] 微信小程序登录流程
- [ ] JWT 认证中间件
- [ ] 用户资料 CRUD
- [ ] 管理后台登录
- [ ] 管理后台用户列表

### Phase 3: 活动 + 报名 (第 3-4 周)
- [ ] 活动 CRUD (管理后台)
- [ ] 活动列表 + 详情 (小程序)
- [ ] 报名/取消报名
- [ ] 活动状态自动流转 (报名满 → FULL)
- [ ] 场所信息页

### Phase 4: 完善 + 上线 (第 5-6 周)
- [ ] 图片上传 (COS)
- [ ] 社区精选功能
- [ ] 管理后台响应式适配
- [ ] 小程序审核提交
- [ ] 服务器部署
