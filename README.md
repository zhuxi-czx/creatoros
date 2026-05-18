# CreatorOS

全球华人创造者社区 — 从线下酒馆活动开始，连接有趣的灵魂。

## 项目背景

我们经营一家线下酒馆（敞开酒馆 Often Bar），不定期举办各种分享活动和社交活动。CreatorOS 旨在将线下活动用户做线上化沉淀，提供活动报名入口，促进人与人之间的线下连接。

## 在线体验

| 端 | 地址 | 说明 |
|---|------|------|
| 用户端 H5 | http://121.196.149.0:4002 | 手机浏览器访问 |
| 管理后台 | http://121.196.149.0:4001 | admin / CreatorOS@admin |
| API Server | http://121.196.149.0:4000/api | RESTful API |

## 已完成功能

### 用户端（H5 / 微信小程序）
- 首页：线下社区入口、社区精选横滑、即将开始活动列表
- 活动详情：封面、信息、参与者头像、报名/取消报名
- 场所介绍：场所信息、地址、近期活动
- 个人主页：资料展示、参与过的活动列表
- 登录：H5 体验登录 / 微信授权登录（API 已就绪）

### 管理后台（PC + 移动端自适应）
- 管理员登录
- 活动管理：创建、发布、统计数据
- 用户管理：用户列表、状态管理

### 核心流程
- 管理员创建活动 → 发布 → 用户端实时可见
- 用户报名 → 管理后台报名数据实时更新
- 报名满额 → 自动切换为"报名已满"状态

## 技术栈

| 层 | 选型 |
|---|------|
| 用户端 H5 | React + TypeScript + Vite |
| 用户端小程序 | Taro (React + TypeScript) |
| 管理后台 | React + TypeScript + Ant Design + Vite |
| 后端 | Node.js + Nest.js + TypeScript |
| 数据库 | PostgreSQL + Prisma ORM |
| 部署 | PM2 + Nginx (共享服务器) |

## 项目结构

```
creatoros/
├── h5/                   # 用户端 H5 Web App
├── app/                  # Taro 微信小程序（开发中）
├── admin/                # 管理后台 Web
├── server/               # Nest.js 后端 API
│   └── src/
│       ├── modules/
│       │   ├── auth/     # 认证（微信登录 + 管理员登录 + JWT）
│       │   ├── user/     # 用户管理
│       │   ├── event/    # 活动管理
│       │   ├── signup/   # 报名管理
│       │   ├── venue/    # 场所管理
│       │   └── upload/   # 文件上传
│       └── prisma/       # 数据库 Schema
├── design/               # 设计稿 (.pen 文件)
├── docs/                 # 技术文档
└── ecosystem.config.js   # PM2 部署配置
```

## 数据库模型

```
Users ←── Signups ──→ Events ──→ Venues
```

- **User**: 用户（微信 openId、昵称、头像、MBTI、星座等）
- **Event**: 活动（标题、时间、场所、价格、状态、发起人）
- **Signup**: 报名记录（用户+活动，唯一约束）
- **Venue**: 场所（名称、地址、城市）

## 部署

服务器：121.196.149.0，使用 PM2 管理进程。

| 服务 | 端口 | PM2 名称 |
|------|------|----------|
| API Server | 4000 | creatoros-server |
| 管理后台 | 4001 | creatoros-admin |
| 用户端 H5 | 4002 | creatoros-h5 |
| PostgreSQL | 5432 | 系统服务（独立用户隔离） |

详见 [技术方案文档](docs/technical-design.md)

## 开发流程

```
技术方案 → 编码 → Review → 自测 → 部署
```

## License

MIT
