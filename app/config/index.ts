import { defineConfig, type UserConfigExport } from '@tarojs/cli'

export default defineConfig<'webpack5'>({
  projectName: 'creatoros',
  date: '2024-01-01',
  designWidth: 375,
  deviceRatio: {
    375: 2 / 1,
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [
    '@tarojs/plugin-framework-react',
    '@tarojs/plugin-platform-weapp',
    '@tarojs/plugin-platform-h5'
  ],
  defineConstants: {},
  copy: {
    patterns: [
      { from: 'src/assets/', to: 'dist/assets/', ignore: ['*.js'] }
    ],
    options: {}
  },
  framework: 'react',
  compiler: {
    type: 'webpack5',
    prebundle: { enable: false }
  },
  mini: {
    webpackChain(chain) {
      // Force ES5 output so WeChat devtools ES6->ES5 transform won't break anything
      chain.module
        .rule('script')
        .use('babelLoader')
        .tap(options => {
          return {
            ...options,
            presets: [
              ...(options?.presets || []),
              ['@babel/preset-env', {
                targets: { ios: '9', android: '4.4' },
                modules: false,
                useBuiltIns: false,
              }]
            ]
          }
        })
    },
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    esnextModules: [],
    postcss: {
      autoprefixer: {
        enable: true,
        config: {}
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    }
  }
} as UserConfigExport<'webpack5'>)
