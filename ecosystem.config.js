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
        WX_APP_ID: '',
        WX_APP_SECRET: '',
      },
    },
    {
      name: 'creatoros-admin',
      cwd: '/root/creatoros/admin',
      script: 'serve',
      args: '-s dist -l 4001',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
