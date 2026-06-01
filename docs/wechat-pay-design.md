# 微信支付接入技术方案（付费报名）

> 状态：**待 review**，商户号审核中。代码框架可先开发，配置项（mchId/证书/APIv3 密钥）等商户号下来后填入即可上线。

## 1. 目标与范围

让用户在小程序内对 `price > 0` 的活动**付费报名**：下单 → 拉起微信支付 → 支付成功后确认报名。免费活动（`price === 0`）保持现有直接报名逻辑不变。

- 支付方式：**JSAPI（小程序支付）**，微信支付 **APIv3**
- 金额单位：分（与 `Event.price` 一致，无需换算）
- 不在本期范围：分账、优惠券、组合支付

## 2. 现状与约束

- 报名现状：`POST /signup` 直接创建 `Signup(status=CONFIRMED)`，事务内校验 `maxCapacity` 防超卖。
- 约束（来自 server_info / dev_workflow）：独立 `creatoros` 库；不影响现有服务；改动需 review → 自测 → 部署。

## 3. 数据模型变更（Prisma）

新增 `Order` 模型 + `Signup` 增加支付关联。**新增字段全部可空/带默认值，对现有免费报名零影响。**

```prisma
enum OrderStatus {
  PENDING    // 已下单待支付
  PAID       // 支付成功
  CLOSED     // 超时/主动关单
  REFUNDING  // 退款中
  REFUNDED   // 已退款
}

model Order {
  id            String      @id @default(cuid())
  outTradeNo    String      @unique          // 商户订单号，自定义生成
  userId        String
  eventId       String
  amount        Int                          // 支付金额（分），下单时锁定
  status        OrderStatus @default(PENDING)
  transactionId String?                      // 微信支付订单号（回调返回）
  prepayId      String?                      // 预支付会话标识
  paidAt        DateTime?
  refundedAt    DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  user  User  @relation(fields: [userId], references: [id])
  event Event @relation(fields: [eventId], references: [id])

  @@index([userId])
  @@index([eventId])
  @@index([status])
}

model Signup {
  // ...现有字段...
  orderId String? @unique   // 付费报名关联订单；免费报名为 null
  order   Order?  @relation(fields: [orderId], references: [id])
}
```

User / Event 各加 `orders Order[]` 反向关系。迁移用 `prisma migrate`，仅新增表与可空列，**不回填、不改现有数据**。

## 4. 报名流程（付费）

```
小程序                        服务端                         微信支付
  │  POST /signup/checkout      │                               │
  │ ───────────────────────────>│                               │
  │                             │ 事务：校验名额/未重复报名      │
  │                             │ 创建 Order(PENDING)            │
  │                             │ 调 JSAPI 下单 ────────────────>│
  │                             │<──────────── prepay_id          │
  │                             │ 用 APIv3 私钥生成 paySign      │
  │<──── {payParams, orderId} ──│                               │
  │  Taro.requestPayment(payParams)                              │
  │ ────────────────────────────────────────────────────────────>│
  │                             │<─── 支付结果回调(POST /pay/notify)
  │                             │ 验签 → 事务：Order→PAID         │
  │                             │ 创建/确认 Signup(CONFIRMED)     │
  │  (前端轮询/查单确认结果)     │                               │
```

要点：
- **以回调为准**：报名状态在 `notify` 里落库，前端 `requestPayment` 成功仅用于体验提示，另提供 `GET /orders/:id` 查单。
- **名额锁定时机**：下单时（checkout）即在事务里占名额，避免支付完成才发现满员；配套**超时关单**（见 §6）释放名额。
- **幂等**：`notify` 可能重复投递，按 `outTradeNo` 幂等处理（已是 PAID 直接返回成功）。
- **价格防篡改**：金额取服务端 `Event.price`，绝不信任前端传值。

## 5. 接口设计

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| POST | `/signup/checkout` | 付费活动下单，返回 `payParams`+`orderId` | JWT |
| GET | `/orders/:id` | 查询订单/报名状态（前端轮询） | JWT |
| POST | `/pay/notify` | 微信支付结果回调（APIv3 验签 + 解密） | 微信平台证书验签 |
| POST | `/orders/:id/refund` | 取消报名退款（可选，见 §7） | JWT / Admin |

免费活动仍走原 `POST /signup`，前端按 `event.price` 分流。

## 6. 关单与超时

- 下单设 `time_expire`（如 15 分钟）。
- 定时任务（复用现有每小时 cron 或新增每 5 分钟）：将超时未支付的 `PENDING` 订单关单 → 调微信 close → `Order=CLOSED` → 事务释放名额。

## 7. 退款（取消报名，建议本期做最小版）

- 用户/管理员对已 PAID 订单发起退款 → 调 APIv3 退款 → `REFUNDING`；退款回调 → `REFUNDED` + `Signup=CANCELLED` + 释放名额。
- 若 MVP 想再简化：本期只做「下单+支付+确认报名+超时关单」，退款走线下，留 `refund` 接口待后续。**需你拍板。**

## 8. 配置项（.env，商户号下来后填）

```
WX_PAY_MCH_ID=                  # 商户号
WX_PAY_API_V3_KEY=              # APIv3 密钥
WX_PAY_SERIAL_NO=               # 商户证书序列号
WX_PAY_PRIVATE_KEY_PATH=        # 商户私钥 apiclient_key.pem 路径
WX_PAY_NOTIFY_URL=https://<域名>/api/pay/notify   # 需 HTTPS，依赖备案
```

⚠️ `notify_url` 必须是 **HTTPS 已备案域名** → 与「域名去 IP 化 + HTTPS」轨道强相关；可先开发，回调联调需等备案。

## 9. 依赖库

建议用 `wechatpay-node-v3`（APIv3，封装签名/验签/解密），避免手写 RSA。需评审是否引入第三方依赖。

## 10. 风险与回滚

- 全部为新增模块/表，免费报名链路不动 → 回滚只需下线支付路由 + 前端按 price 分流降级为免费报名（或隐藏付费活动）。
- 证书/密钥经 `.env` 注入，不入库不进仓库。

## 11. 待你确认的决策点

1. **退款**：本期做最小退款，还是先不做、走线下？
2. **第三方库**：是否同意引入 `wechatpay-node-v3`？
3. **超时时长**：默认 15 分钟关单是否合适？
4. **关单 cron**：复用现有每小时任务，还是新增每 5 分钟任务（更及时释放名额）？
