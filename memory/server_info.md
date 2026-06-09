---
name: Server Info
description: 生产服务器、部署方式、关键运维约束
type: reference
---

**生产服务器：`root@116.62.188.30`**（阿里云 ECS Ubuntu 24.04，SSH 公钥已配，可直连）。
~~121.196.149.0~~ 是旧/备用机，creatoros 不在那跑。服务器上还有大量其他项目，**绝不能影响**。

- 端口：4000(API/PM2 creatoros-server)、4001(后台 nginx)、4002(H5 nginx)；443 nginx 反代到上述
- 域名：creatorbar.cn(H5)、admin.creatorbar.cn(后台)、creatorbar.cn/api(API)
- 代码目录 `/root/creatoros`；H5/后台是 nginx 静态(`h5/dist`、`admin/dist`)
- nginx 配置 `/etc/nginx/conf.d/creatorbar.conf`（独立，勿动其他）；nginx 1.24 用 `listen 443 ssl http2`（不支持独立 http2 on）

**环境变量**：在 `/root/creatoros/ecosystem.config.js`(PM2 注入，**不是 .env**，已 gitignore，含密钥勿入库)。
DB 密码也在 `~/.pgpass`(cron 脚本用，chmod 600)。

**部署方式（重要）**：
- 改 ecosystem 环境变量 → 必须 `pm2 delete creatoros-server && pm2 start ecosystem.config.js --only creatoros-server`（`--update-env` 不会重载文件！）+ `pm2 save`
- 改后端代码 → `scp` 改动文件到生产对应路径 + `npm run build` + `pm2 restart creatoros-server`
- **生产 git 有本地分叉，不能 git pull**；尤其**不能全量同步**(会带入未配置的 payment 模块+Order 迁移导致报错)。只 scp 改动的单个文件
- H5/后台 → 本地 build 后 `rsync -az --delete <绝对路径>/dist/ root@116...:/root/creatoros/<h5|admin>/dist/`
- ssh 远程命令前加 `export LC_ALL=C` 消除 perl locale 噪音

**Why/约束**：共享服务器、生产 git 脏、Prisma client 落后(无 Order)，所以用最小化定点部署。
