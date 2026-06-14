-- User 短数字编号（SERIAL 会为已有行回填 1..N，并设为自增默认）
ALTER TABLE "User" ADD COLUMN "uid" SERIAL NOT NULL;
CREATE UNIQUE INDEX "User_uid_key" ON "User"("uid");

-- Order 退款字段
ALTER TABLE "Order" ADD COLUMN "refundNo" TEXT;
ALTER TABLE "Order" ADD COLUMN "refundedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Order_refundNo_key" ON "Order"("refundNo");
