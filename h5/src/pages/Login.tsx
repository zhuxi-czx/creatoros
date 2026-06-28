import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!nickname.trim()) {
      setError('请输入昵称')
      return
    }
    setLoading(true)
    setError('')
    // H5 preview: just store nickname as guest
    localStorage.setItem('h5_nickname', nickname.trim())
    localStorage.setItem('h5_token', 'guest_' + Date.now())
    setTimeout(() => {
      setLoading(false)
      navigate('/')
    }, 300)
  }

  return (
    <div className="page-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 4, color: '#666', fontSize: 14 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px 80px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
            margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>C</span>
          </div>
          <h1 className="gradient-text" style={{ fontSize: 24, fontWeight: 700 }}>敞开酒馆</h1>
          <p style={{ marginTop: 6, fontSize: 14, color: '#999' }}>创作者社区</p>
        </div>

        {/* Form */}
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#666' }}>昵称</label>
        <input
          type="text"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="输入你的昵称"
          autoFocus
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 12,
            border: '1.5px solid #E5E5E5', fontSize: 16, outline: 'none',
            background: '#FAFAFA',
          }}
          onFocus={e => { e.target.style.borderColor = '#8B5CF6' }}
          onBlur={e => { e.target.style.borderColor = '#E5E5E5' }}
        />
        {error && <p style={{ marginTop: 8, fontSize: 13, color: '#EF4444' }}>{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            marginTop: 20, width: '100%', padding: '14px', borderRadius: 12,
            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
            color: '#fff', fontSize: 16, fontWeight: 600,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '登录中...' : '体验登录'}
        </button>

        <p style={{ marginTop: 16, fontSize: 12, color: '#CCC', textAlign: 'center', lineHeight: 1.6 }}>
          H5 体验版，输入昵称即可浏览社区活动
        </p>
      </div>
    </div>
  )
}
