import { Button, Layout, Modal, Space } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppHeader from '../../components/AppHeader'
import LabelManager from '../../components/annotation/LabelManager'

async function confirmReturn() {
  const first = await new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: '返回标注工作区',
      content: '即将离开标签管理页面，是否继续？',
      okText: '继续',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false)
    })
  })
  if (!first) return false
  return await new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: '二次确认',
      content: '请再次确认返回主工作区',
      okText: '确认返回',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false)
    })
  })
}

export default function LabelManagementPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('projectId') || ''

  const handleBack = async () => {
    const ok = await confirmReturn()
    if (!ok) return
    const query = projectId ? `?projectId=${projectId}` : ''
    navigate(`/annotator${query}`)
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <AppHeader
        title="标签管理"
        actions={
          <Space>
            <Button onClick={handleBack}>返回标注工作区</Button>
          </Space>
        }
      />
      <Layout.Content style={{ padding: 16, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <LabelManager projectId={projectId} />
      </Layout.Content>
    </Layout>
  )
}
