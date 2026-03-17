import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Layout,
  List,
  Modal,
  Progress,
  Radio,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Timeline,
  Typography,
  message
} from 'antd'
import {
  BarChartOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  FolderOpenOutlined,
  FormOutlined,
  PictureOutlined,
  ProjectOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../../components/AppHeader'
import { HomeDashboardData, fetchHomeDashboard, fetchHomeRealtime } from '../../services/homeApi'
import { createMockProjects, listProjects, ProjectItem } from '../../services/projectApi'
import { listProjectTasks } from '../../services/workflowApi'
import { AnnotationTask } from '../../types/workflow'

const defaultData: HomeDashboardData = {
  overview: { totalProjects: 0, activeProjects: 0, delayedProjects: 0, completedProjects: 0 },
  tasks: { pendingAnnotate: 0, annotating: 0, pendingReview: 0, reviewed: 0, todayDone: 0 },
  workbenchTasks: [],
  activities: [],
  projectProgressTop: [],
  onlineUsers: 0,
  queueBacklog: 0,
  apiSuccessRate: 0,
  avgResponseMs: 0
}

export default function HomePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isMockMode, setIsMockMode] = useState(false)
  const [data, setData] = useState<HomeDashboardData>(defaultData)
  const [annotateOpen, setAnnotateOpen] = useState(false)
  const [annotateLoading, setAnnotateLoading] = useState(false)
  const [annotateProjectId, setAnnotateProjectId] = useState<string>()
  const [annotateMode, setAnnotateMode] = useState<'task' | 'quick'>('task')
  const [annotateTaskId, setAnnotateTaskId] = useState<string>()
  const [projectOptions, setProjectOptions] = useState<ProjectItem[]>([])
  const [projectTasks, setProjectTasks] = useState<AnnotationTask[]>([])

  const [annotateForm] = Form.useForm<{ projectId: string; taskId?: string }>()

  const loadData = async () => {
    setLoading(true)
    const { data: dashboard, isMock } = await fetchHomeDashboard(true)
    setData(dashboard)
    setIsMockMode(isMock)
    setLoading(false)
  }

  useEffect(() => {
    loadData().catch(() => {
      setLoading(false)
    })
  }, [])

  const loadProjectOptions = async () => {
    setAnnotateLoading(true)
    try {
      const res = await listProjects({ pageNum: 1, pageSize: 100 })
      if (res.rows.length > 0) {
        setProjectOptions(res.rows)
        const firstId = res.rows[0].projectId
        setAnnotateProjectId(firstId)
        annotateForm.setFieldsValue({ projectId: firstId, taskId: undefined })
        return
      }
      setProjectOptions([])
    } catch {
      const mockRows = createMockProjects()
      setProjectOptions(mockRows)
      if (mockRows.length > 0) {
        const firstId = mockRows[0].projectId
        setAnnotateProjectId(firstId)
        annotateForm.setFieldsValue({ projectId: firstId, taskId: undefined })
      }
    } finally {
      setAnnotateLoading(false)
    }
  }

  const loadProjectTaskOptions = async (projectId?: string) => {
    if (!projectId) {
      setProjectTasks([])
      setAnnotateTaskId(undefined)
      annotateForm.setFieldsValue({ taskId: undefined })
      return
    }
    const res = await listProjectTasks(projectId)
    setProjectTasks(res.rows)
    if (res.rows.length > 0) {
      setAnnotateTaskId(res.rows[0].taskId)
      annotateForm.setFieldsValue({ taskId: res.rows[0].taskId })
    } else {
      setAnnotateTaskId(undefined)
      annotateForm.setFieldsValue({ taskId: undefined })
    }
  }

  useEffect(() => {
    loadProjectTaskOptions(annotateProjectId).catch(() => {})
  }, [annotateProjectId])

  const openAnnotateEntry = async () => {
    setAnnotateMode('task')
    setAnnotateTaskId(undefined)
    annotateForm.resetFields()
    await loadProjectOptions()
    setAnnotateOpen(true)
  }

  const startAnnotate = async () => {
    const values = await annotateForm.validateFields()
    if (!values.projectId) {
      message.warning('请先选择项目')
      return
    }
    if (annotateMode === 'task') {
      if (!values.taskId) {
        message.warning('请先选择任务后再开始标注')
        return
      }
      navigate(`/annotator?projectId=${values.projectId}&taskId=${values.taskId}`)
      setAnnotateOpen(false)
      return
    }
    navigate(`/annotator?projectId=${values.projectId}`)
    setAnnotateOpen(false)
  }

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const realtime = await fetchHomeRealtime()
      if (!realtime) return
      setData((prev) => ({
        ...prev,
        ...realtime
      }))
    }, 5000)
    return () => window.clearInterval(timer)
  }, [])

  const overviewItems = useMemo(
    () => [
      { title: '项目总数', value: data.overview.totalProjects, icon: <ProjectOutlined /> },
      { title: '进行中项目', value: data.overview.activeProjects, icon: <FolderOpenOutlined /> },
      { title: '延期项目', value: data.overview.delayedProjects, icon: <DashboardOutlined /> },
      { title: '已完成项目', value: data.overview.completedProjects, icon: <CheckCircleOutlined /> }
    ],
    [data.overview]
  )

  const taskCards = useMemo(
    () => [
      { label: '待标注', value: data.tasks.pendingAnnotate, color: '#faad14' },
      { label: '标注中', value: data.tasks.annotating, color: '#1677ff' },
      { label: '待审核', value: data.tasks.pendingReview, color: '#722ed1' },
      { label: '已通过', value: data.tasks.reviewed, color: '#52c41a' },
      { label: '今日完成', value: data.tasks.todayDone, color: '#13c2c2' }
    ],
    [data.tasks]
  )

  const quickActions = [
    { title: '进入图库', icon: <PictureOutlined />, onClick: () => navigate('/gallery') },
    { title: '图像标注', icon: <FormOutlined />, onClick: () => openAnnotateEntry().catch(() => {}) },
    { title: '项目管理', icon: <ProjectOutlined />, onClick: () => navigate('/projects') },
    { title: '任务统计', icon: <BarChartOutlined />, onClick: () => navigate('/projects') }
  ]

  const priorityTag = (priority: 'high' | 'medium' | 'low') => {
    if (priority === 'high') return <Tag color="error">高</Tag>
    if (priority === 'medium') return <Tag color="warning">中</Tag>
    return <Tag color="default">低</Tag>
  }

  const content = loading ? (
    <Card>
      <Skeleton active paragraph={{ rows: 8 }} />
    </Card>
  ) : (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {isMockMode ? <Alert message="首页当前使用演示数据（接口不可用时自动降级）" type="warning" showIcon /> : null}
      <Row gutter={[16, 16]}>
        {overviewItems.map((item) => (
          <Col key={item.title} xs={24} sm={12} lg={6}>
            <Card>
              <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Statistic title={item.title} value={item.value} />
                <div style={{ fontSize: 22, color: '#1677ff' }}>{item.icon}</div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title="任务统计" extra={<Typography.Text type="secondary">数据更新延迟目标 ≤ 5秒</Typography.Text>}>
            <Row gutter={[12, 12]}>
              {taskCards.map((item) => (
                <Col key={item.label} xs={12} md={8}>
                  <Card size="small" bordered style={{ borderColor: '#f0f0f0' }}>
                    <Typography.Text type="secondary">{item.label}</Typography.Text>
                    <Typography.Title level={4} style={{ margin: '8px 0 0', color: item.color }}>
                      {item.value}
                    </Typography.Title>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="快捷入口">
            <Space direction="vertical" style={{ width: '100%' }}>
              {quickActions.map((action) => (
                <Button key={action.title} icon={action.icon} block onClick={action.onClick}>
                  {action.title}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={10}>
          <Card title="用户工作台">
            {data.workbenchTasks.length > 0 ? (
              <List
                dataSource={data.workbenchTasks}
                renderItem={(item) => (
                  <List.Item>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        {priorityTag(item.priority)}
                        <Typography.Text>{item.title}</Typography.Text>
                      </Space>
                      <Typography.Text type="secondary">{item.dueAt || '-'}</Typography.Text>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无个人待办" />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="项目进度">
            {data.projectProgressTop.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {data.projectProgressTop.map((item) => (
                  <div key={item.projectId}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Typography.Text>{item.projectName}</Typography.Text>
                      <Typography.Text type="secondary">{item.progress}%</Typography.Text>
                    </Space>
                    <Progress percent={item.progress} showInfo={false} />
                  </div>
                ))}
              </Space>
            ) : (
              <Empty description="暂无项目进度数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={6}>
          <Card title="系统状态">
            <Space direction="vertical" size={10}>
              <Typography.Text>在线人数：{data.onlineUsers}</Typography.Text>
              <Typography.Text>队列积压：{data.queueBacklog}</Typography.Text>
              <Typography.Text>接口成功率：{data.apiSuccessRate}%</Typography.Text>
              <Typography.Text>平均响应：{data.avgResponseMs}ms</Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="最近操作记录">
        {data.activities.length > 0 ? (
          <Timeline
            items={data.activities.map((item) => ({
              children: (
                <Space>
                  <Typography.Text type="secondary">{item.time}</Typography.Text>
                  <Typography.Text>{item.action}</Typography.Text>
                  <Typography.Text type="secondary">{item.target}</Typography.Text>
                </Space>
              )
            }))}
          />
        ) : (
          <Empty description="暂无操作记录" />
        )}
      </Card>
    </Space>
  )

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <AppHeader
        title="标注平台首页"
        actions={
          <Button type="text" icon={<PictureOutlined />} style={{ color: 'rgba(255,255,255,0.8)' }} onClick={() => navigate('/gallery')}>
            图库
          </Button>
        }
      />
      <Layout.Content style={{ padding: '24px', maxWidth: 1600, margin: '0 auto', width: '100%' }}>
        {content}
      </Layout.Content>
      <Modal
        title="开始标注"
        className="project-management-modal"
        open={annotateOpen}
        onCancel={() => setAnnotateOpen(false)}
        onOk={() => startAnnotate().catch(() => {})}
        okText="进入标注"
        confirmLoading={annotateLoading}
        width={620}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Alert
            type="info"
            showIcon
            message="请先选择项目，再按任务标注或快速标注进入。按任务标注可追踪执行人、进度与审查记录。"
          />
          <Form form={annotateForm} layout="vertical">
            <Form.Item name="projectId" label="选择项目" rules={[{ required: true, message: '请选择项目' }]}>
              <Select
                placeholder={projectOptions.length > 0 ? '请选择项目' : '暂无可用项目，请先在项目管理中创建'}
                popupClassName="project-management-select-dropdown"
                options={projectOptions.map((item) => ({
                  value: item.projectId,
                  label: `${item.projectName}（${item.projectCode}）`
                }))}
                onChange={(value) => setAnnotateProjectId(value)}
              />
            </Form.Item>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={annotateMode}
              onChange={(e) => setAnnotateMode(e.target.value)}
              options={[
                { label: '按任务标注', value: 'task' },
                { label: '快速标注', value: 'quick' }
              ]}
            />
            {annotateMode === 'task' ? (
              <Form.Item name="taskId" label="选择任务" rules={[{ required: true, message: '请选择任务' }]}>
                <Select
                  placeholder={projectTasks.length > 0 ? '请选择任务' : '当前项目还没有任务，请先创建任务'}
                  popupClassName="project-management-select-dropdown"
                  value={annotateTaskId}
                  onChange={(value) => setAnnotateTaskId(value)}
                  options={projectTasks.map((task) => ({
                    value: task.taskId,
                    label: `${task.taskName}（${task.assignee} / ${task.status}）`
                  }))}
                />
              </Form.Item>
            ) : (
              <Alert
                type="warning"
                showIcon
                message="快速标注不会绑定到具体任务，建议仅用于临时标注或功能验证。"
              />
            )}
          </Form>
        </Space>
      </Modal>
    </Layout>
  )
}
