import React from 'react'
import { Layout, Typography, Button, Tooltip } from 'antd'
import { LogoutOutlined, PictureOutlined } from '@ant-design/icons'
import Cookies from 'js-cookie'
import { useNavigate } from 'react-router-dom'
import ImageGallery from '../../components/ImageGallery'

export default function GalleryPage() {
  const navigate = useNavigate()

  const handleLogout = () => {
    Cookies.remove('Admin-Token')
    navigate('/login')
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
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
            Image Gallery
          </Typography.Title>
        </div>
        
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
      </Layout.Header>
      
      <Layout.Content style={{ padding: '24px', maxWidth: 1600, margin: '0 auto', width: '100%' }}>
        <ImageGallery />
      </Layout.Content>
    </Layout>
  )
}
