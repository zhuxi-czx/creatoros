-- uid 由自增整数改为 11 位随机数字字符串（全局唯一）
-- 唯一索引 User_uid_key 保留（对 text 同样有效）；已有行的值由应用层脚本回填
ALTER TABLE "User" ALTER COLUMN "uid" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "uid" TYPE TEXT USING "uid"::text;
DROP SEQUENCE IF EXISTS "User_uid_seq";
