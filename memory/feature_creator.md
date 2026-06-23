---
name: Creator & 敞开对谈 Feature
description: Creator 身份 + 敞开对谈图文内容功能的模型/导航/约定（2026-06 上线）
metadata:
  type: project
---

CreatorOS 大改：新增 **Creator 身份** 和 **敞开对谈图文内容**（2026-06-23 全栈实现并部署）。

## 数据模型
- `User.isCreator`（管理员后台开关，与 role 独立；普通成员可被设为 Creator）
- `CreatorProfile`（与 User 1:1，本人在小程序「编辑资料」填）：title 头衔 / tagline 一句话亮点 / intro 简介 / coverUrl 封面大图 / tags / order 排序
- `Content`（敞开对谈内容）：creatorId(必关联Creator) / title / body(富文本HTML) / coverUrl / status(DRAFT|PUBLISHED) / publishedAt。**无阅读量/点赞/关注**

## 导航 IA（重要，曾反复）
- **首页不改版**：保留原宫格，点宫格里的「Creator」图标 → `creator-channel` 频道页。Pencil 里的「首页改版」「发现页挪场馆」方案**已废弃**，没实现。
- creator-channel：Creator 人物横滑卡 + 敞开对谈内容列表 → 点人物进 `creator-detail`（简介+TA内容），点内容进 `content-detail`（RichText 图文）

## 富文本约定
- 后台用 `react-quill-new`（admin/src/components/RichEditor.tsx），正文存 HTML
- **正文内插图必须存绝对地址** `https://creatorbar.cn/uploads/...`（RichEditor 里 MEDIA_BASE 拼接），否则小程序 RichText 加载不到
- 小程序用 `<RichText nodes={html}>` 渲染；活动详情的「活动介绍」也改成了富文本
- 内容由**管理后台**发布（敞开对谈管理页），必选一个 Creator 关联

## 接口
- 前台：GET /api/creators、/api/creators/:id、/api/contents、/api/contents/:id
- 后台：PUT /api/admin/users/:id/creator(开关)、/api/admin/contents CRUD
- getProfile 返回 creatorProfile 供编辑资料预填

参见 [[project_launch_prep]] [[server_info]]
