# CreatorOS

全球华人创造者社区 — 从线下酒馆活动开始，连接有趣的灵魂。

## 项目背景

我们经营一家线下酒馆（敞开酒馆 Often Bar），不定期举办各种分享活动和社交活动。CreatorOS 旨在将线下活动用户做线上化沉淀，提供活动报名入口，促进人与人之间的线下连接。

## MVP 功能

### 用户端（微信小程序）
- **微信授权登录** — 一键登录，获取微信头像/昵称作为默认值
- **个人名片** — 昵称、头像、城市、简介、标签（性别/星座/MBTI/世代）
- **活动浏览** — 首页活动列表（社区精选 + 即将开始）、活动详情
- **活动报名** — 在线报名/取消，查看参与者名片
- **场所介绍** — 酒馆信息、地址、近期活动

### 管理后台（H5 Web，PC/移动端自适应）
- **活动管理** — 创建/编辑/发布活动，查看报名情况
- **用户管理** — 查看注册用户列表及详情

## 技术栈

| 层 | 选型 |
|---|------|
| 前端 - 小程序 | Taro (React + TypeScript) |
| 前端 - 管理后台 | React + TypeScript + Ant Design |
| 后端 | Node.js + Nest.js + TypeScript |
| 数据库 | PostgreSQL |
| ORM | Prisma |
| 文件存储 | 腾讯云 COS |
| 部署 | Docker Compose (Nginx + Node.js + PostgreSQL) |

## 项目结构

```
creatoros/
├── app/                  # Taro 小程序 + H5
├── admin/                # 管理后台 Web
├── server/               # Nest.js 后端 API
├── design/               # 设计稿 (.pen 文件)
├── docs/                 # 技术文档
└── docker-compose.yml
```

## 设计稿

设计稿位于 `design/creatoros-mvp.pen`，包含：
- 小程序：首页、活动详情、场所介绍、个人主页（共 4 个页面）
- 管理后台：活动管理列表、用户管理列表、新建/编辑活动（共 3 个页面）

## 开发计划

详见 [技术方案文档](docs/technical-design.md)

## License

MIT
