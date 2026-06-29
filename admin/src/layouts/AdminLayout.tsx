import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Typography, Avatar, Dropdown, Space, Drawer } from 'antd'
import {
  DashboardOutlined,
  CalendarOutlined,
  PictureOutlined,
  EnvironmentOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
  ReadOutlined,
  AlertOutlined,
  AccountBookOutlined
} from '@ant-design/icons'
import { logout, getCurrentUser } from '../stores/useAuthStore'

const { Header, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '数据概览' },
  { key: '/events', icon: <CalendarOutlined />, label: '活动管理' },
  { key: '/banners', icon: <PictureOutlined />, label: 'Banner管理' },
  { key: '/venues', icon: <EnvironmentOutlined />, label: '场馆管理' },
  { key: '/categories', icon: <ReadOutlined />, label: '分类管理' },
  { key: '/columns', icon: <PictureOutlined />, label: '专栏配置' },
  { key: '/users', icon: <UserOutlined />, label: '用户管理' },
  { key: '/orders', icon: <AccountBookOutlined />, label: '订单管理' },
  { key: '/logs', icon: <AlertOutlined />, label: '系统监控' }
]

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()
  const isMobile = useIsMobile()

  const handleMenuSelect = ({ key }: { key: string }) => {
    navigate(key)
    setDrawerOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const selectedKey = location.pathname === '/' || location.pathname === '/dashboard'
    ? '/'
    : menuItems.find(item => item.key !== '/' && location.pathname.startsWith(item.key))?.key || '/'

  const siderContent = (
    <>
      <div style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 8,
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0
        }}>C</div>
        <Text strong style={{ fontSize: 16 }}>敞开酒馆</Text>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onSelect={handleMenuSelect}
        style={{ border: 'none', marginTop: 8 }}
      />
    </>
  )

  return (
    <Layout style={{ height: '100vh' }}>
      {/* Desktop Sider */}
      {!isMobile && (
        <Layout.Sider
          width={220}
          style={{ background: '#fff', borderRight: '1px solid #f0f0f0', overflow: 'auto' }}
        >
          {siderContent}
        </Layout.Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={260}
          styles={{ body: { padding: 0 } }}
          closable={false}
        >
          {siderContent}
        </Drawer>
      )}

      <Layout>
        <Header style={{
          background: '#fff',
          padding: isMobile ? '0 12px' : '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          height: 56
        }}>
          {isMobile ? (
            <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />
          ) : (
            <div />
          )}
          <Dropdown menu={{ items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }] }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                size="small"
              >
                {user?.nickname?.charAt(0)?.toUpperCase() || 'A'}
              </Avatar>
              {!isMobile && <Text>{user?.nickname || 'Admin'}</Text>}
            </Space>
          </Dropdown>
        </Header>

        <Content style={{
          padding: isMobile ? 12 : 24,
          overflow: 'auto'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
