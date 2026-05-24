module.exports = {
  apps: [
    {
      name: 'creatoros-server',
      cwd: '/root/creatoros/server',
      script: 'dist/src/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        DATABASE_URL: 'postgresql://creatoros:Creatoros2024!@127.0.0.1:5432/creatoros',
        JWT_SECRET: 'creatoros_jwt_secret_2024',
        ADMIN_PASSWORD: 'CreatorOS@admin',
        WX_APP_ID: 'wxe06a5dc36a7f7550',
        WX_APP_SECRET: 'fb2f306b7bd95f51ed56dca7dce5c7f9',
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
