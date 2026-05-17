import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Typography, Avatar, Dropdown, Space } from 'antd'
import {
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { logout, getCurrentUser } from '../stores/useAuthStore'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const menuItems = [
  {
    key: '/events',
    icon: <CalendarOutlined />,
    label: '活动管理'
  },
  {
    key: '/users',
    icon: <UserOutlined />,
    label: '用户管理'
  }
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()

  const handleMenuSelect = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  // Determine selected key based on path
  const selectedKey = menuItems.find(item => location.pathname.startsWith(item.key))?.key || '/events'

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          overflow: 'auto'
        }}
        width={220}
      >
        {/* Logo */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: collapsed ? '0 24px' : '0 20px',
          borderBottom: '1px solid #f0f0f0',
          gap: 8
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0
          }}>
            C
          </div>
          {!collapsed && (
            <Text strong style={{ fontSize: 16, color: '#1d1d1f' }}>
              CreatorOS
            </Text>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onSelect={handleMenuSelect}
          style={{
            border: 'none',
            marginTop: 8
          }}
        />
      </Sider>

      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          height: 64
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                size="small"
              >
                {user?.nickname?.charAt(0)?.toUpperCase() || 'A'}
              </Avatar>
              <Text>{user?.nickname || 'Admin'}</Text>
            </Space>
          </Dropdown>
        </Header>

        <Content style={{
          margin: 24,
          overflow: 'auto'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
