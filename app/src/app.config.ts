export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/event-detail/index',
    'pages/venue/index',
    'pages/profile/index',
    'pages/profile-edit/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'CreatorOS',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#6366f1',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tab-home.png',
        selectedIconPath: 'assets/tab-home-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/tab-profile.png',
        selectedIconPath: 'assets/tab-profile-active.png'
      }
    ]
  }
})
