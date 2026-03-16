import React from 'react'
import { Layout, Button, Space } from 'antd'
import { FormOutlined, HomeOutlined, ProjectOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../../components/AppHeader'
import ImageGallery from '../../components/ImageGallery'

export default function GalleryPage() {
  const navigate = useNavigate()

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <AppHeader
        title="Image Gallery"
        actions={
          <Space>
            <Button
              type="text"
              icon={<HomeOutlined />}
              style={{ color: 'rgba(255,255,255,0.8)' }}
              onClick={() => navigate('/home')}
            >
              首页
            </Button>
            <Button
              type="text"
              icon={<FormOutlined />}
              style={{ color: 'rgba(255,255,255,0.8)' }}
              onClick={() => navigate('/annotator')}
            >
              图像标注
            </Button>
            <Button
              type="text"
              icon={<ProjectOutlined />}
              style={{ color: 'rgba(255,255,255,0.8)' }}
              onClick={() => navigate('/projects')}
            >
              项目管理
            </Button>
          </Space>
        }
      />
      
      <Layout.Content style={{ padding: '24px', maxWidth: 1600, margin: '0 auto', width: '100%' }}>
        <ImageGallery />
      </Layout.Content>
    </Layout>
  )
}
