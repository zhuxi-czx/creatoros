// PM2 部署配置模板 —— 复制为 ecosystem.config.js 并填入真实密钥。
// ⚠️ ecosystem.config.js 含密钥，已被 .gitignore 忽略，切勿提交到仓库。
module.exports = {
  apps: [
    {
      name: 'creatoros-server',
      cwd: '/root/creatoros/server',
      script: 'dist/src/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        DATABASE_URL: 'postgresql://creatoros:<DB_PASSWORD>@127.0.0.1:5432/creatoros',
        JWT_SECRET: '<RANDOM_LONG_SECRET>',
        ADMIN_PASSWORD: '<ADMIN_PASSWORD>',
        WX_APP_ID: '<WX_APP_ID>',
        WX_APP_SECRET: '<WX_APP_SECRET>',
        // 生产建议限定跨域来源（逗号分隔）；缺省则放行所有来源
        CORS_ORIGIN: 'https://creatorbar.cn,https://admin.creatorbar.cn',
        // 微信支付（商户号下来后填齐这 6 项；未配则支付链路不可用，免费报名不受影响）
        WX_PAY_MCH_ID: '<WX_PAY_MCH_ID>',
        WX_PAY_SERIAL_NO: '<WX_PAY_CERT_SERIAL_NO>',
        WX_PAY_API_V3_KEY: '<WX_PAY_APIV3_KEY>',
        WX_PAY_PRIVATE_KEY_PATH: '/root/creatoros/server/cert/apiclient_key.pem',
        WX_PAY_CERT_PATH: '/root/creatoros/server/cert/apiclient_cert.pem',
        WX_PAY_NOTIFY_URL: 'https://creatorbar.cn/api/payment/notify',
        // 微信订阅消息「活动开始提醒」模板 ID（小程序后台申请后填入；为空则 cron 不发送提醒）
        WX_SUBSCRIBE_TMPL_ID: '',
      },
    },
    {
      name: 'creatoros-admin',
      cwd: '/root/creatoros/admin',
      script: 'serve',
      args: '-s dist -p 4001',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
