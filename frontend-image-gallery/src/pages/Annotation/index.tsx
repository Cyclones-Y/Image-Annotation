import { Button, Layout, Space, Typography } from 'antd'
import { TagsOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppHeader from '../../components/AppHeader'
import ImageAnnotation from '../../components/annotation/ImageAnnotation'

export default function AnnotationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('projectId') || ''
  const taskItemId = searchParams.get('taskItemId') || ''
  const openLabelManagement = () => {
    const query = projectId ? `?projectId=${projectId}` : ''
    navigate(`/label-management${query}`)
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <AppHeader
        title="图像标注"
        actions={
          <Button type="text" icon={<TagsOutlined />} style={{ color: 'rgba(255,255,255,0.85)' }} onClick={openLabelManagement}>
            标签管理
          </Button>
        }
      />
      <Layout.Content style={{ padding: 16, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Typography.Text type="secondary">
            主工作区保留完整标注工具，手动提交后进入下一张，支持保存并退出后恢复进度。
          </Typography.Text>
          <ImageAnnotation projectId={projectId} taskItemId={taskItemId} />
        </Space>
      </Layout.Content>
    </Layout>
  )
}
