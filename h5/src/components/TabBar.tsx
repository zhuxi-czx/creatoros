import { useNavigate } from 'react-router-dom'

type TabKey = 'home' | 'discover' | 'profile'

interface TabBarProps {
  active: TabKey
}

const tabs: { key: TabKey; label: string; path: string; icon: (color: string) => JSX.Element }[] = [
  {
    key: 'home',
    label: '首页',
    path: '/',
    icon: (color: string) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    key: 'discover',
    label: '发现',
    path: '/discover',
    icon: (color: string) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    key: 'profile',
    label: '我的',
    path: '/profile',
    icon: (color: string) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function TabBar({ active }: TabBarProps) {
  const navigate = useNavigate()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      width: '100%',
      background: '#fff',
      padding: '12px 21px calc(12px + env(safe-area-inset-bottom, 8px)) 21px',
      zIndex: 100,
    }}>
      <div style={{
        height: 54,
        borderRadius: 28,
        border: '1px solid #E5E5E5',
        background: '#fff',
        display: 'flex',
        flexDirection: 'row',
        padding: 4,
      }}>
        {tabs.map((tab) => {
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              style={{
                flex: 1,
                borderRadius: 22,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                background: isActive ? '#1A1A1A' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {tab.icon(isActive ? '#fff' : '#999')}
              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#fff' : '#999',
                letterSpacing: 0.5,
                lineHeight: 1,
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
