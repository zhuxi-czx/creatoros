import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

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
    try {
      const res = await api.post('/auth/admin-login', {
        username: 'admin',
        password: import.meta.env.VITE_ADMIN_PASSWORD ?? 'admin123',
      }) as unknown as { token?: string; access_token?: string }
      const token = res?.token ?? res?.access_token ?? ''
      if (token) {
        localStorage.setItem('h5_token', token)
        localStorage.setItem('h5_nickname', nickname.trim())
        navigate(-1)
      } else {
        // No auth backend — just store nickname and continue browsing
        localStorage.setItem('h5_nickname', nickname.trim())
        navigate('/')
      }
    } catch {
      // API not available — allow guest browsing with nickname
      localStorage.setItem('h5_nickname', nickname.trim())
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="page-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Back button */}
      <div style={{ padding: '52px 20px 0' }}>
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

      {/* Logo area */}
      <div style={{ padding: '48px 20px 0', textAlign: 'center' }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
        }}>
          🎯
        </div>
        <h1 className="gradient-text" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
          CreatorOS
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: '#999' }}>
          创作者社区 · 体验版
        </p>
      </div>

      {/* Form */}
      <div style={{ padding: '48px 24px 0' }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#666' }}>
          昵称
        </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的昵称"
          autoFocus
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 14,
            border: '1.5px solid #E5E5E5',
            fontSize: 16,
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s',
            background: '#FAFAFA',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#8B5CF6' }}
          onBlur={(e) => { e.target.style.borderColor = '#E5E5E5' }}
        />

        {error && (
          <p style={{ marginTop: 8, fontSize: 13, color: '#EF4444' }}>{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            marginTop: 20,
            width: '100%',
            padding: '15px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? '登录中…' : '体验登录'}
        </button>

        <p style={{ marginTop: 16, fontSize: 12, color: '#CCC', textAlign: 'center', lineHeight: 1.6 }}>
          这是 H5 预览版，仅供开发调试使用。<br />
          点击登录即可以访客身份体验社区活动。
        </p>
      </div>
    </div>
  )
}
