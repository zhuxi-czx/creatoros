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
