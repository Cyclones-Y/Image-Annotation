import { Layout, Typography, Button, Tooltip } from 'antd'
import { LogoutOutlined, PictureOutlined } from '@ant-design/icons'
import Cookies from 'js-cookie'
import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface Props {
  title: string
  actions?: ReactNode
}

export default function AppHeader({ title, actions }: Props) {
  const navigate = useNavigate()

  const handleLogout = () => {
    Cookies.remove('Admin-Token')
    navigate('/login')
  }

  return (
    <Layout.Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#001529',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 10
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <PictureOutlined style={{ fontSize: 24, color: '#1890ff' }} />
        <Typography.Title level={4} style={{ margin: 0, color: '#fff', letterSpacing: 1 }}>
          {title}
        </Typography.Title>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {actions}
        <Tooltip title="退出登录">
          <Button
            type="text"
            icon={<LogoutOutlined />}
            style={{ color: 'rgba(255,255,255,0.65)' }}
            onClick={handleLogout}
          >
            退出
          </Button>
        </Tooltip>
      </div>
    </Layout.Header>
  )
}
