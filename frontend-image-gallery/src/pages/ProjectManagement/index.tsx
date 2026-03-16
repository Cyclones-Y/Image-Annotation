import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Layout,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { HomeOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../../components/AppHeader'
import {
  ProjectItem,
  ProjectQuery,
  createMockProjects,
  createProject,
  getProject,
  listProjects,
  removeProject,
  updateProject
} from '../../services/projectApi'

type FormData = Omit<ProjectItem, 'projectId' | 'createTime'> & { projectId?: string }

export default function ProjectManagementPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [useMockMode, setUseMockMode] = useState(false)
  const [query, setQuery] = useState<ProjectQuery>({ pageNum: 1, pageSize: 10 })
  const [rows, setRows] = useState<ProjectItem[]>([])
  const [total, setTotal] = useState(0)
  const [mockRows, setMockRows] = useState<ProjectItem[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectItem | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [form] = Form.useForm<FormData>()

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await listProjects(query)
      setRows(result.rows)
      setTotal(result.total)
      setUseMockMode(false)
    } catch {
      setUseMockMode(true)
      const source = mockRows.length > 0 ? mockRows : createMockProjects()
      if (mockRows.length === 0) {
        setMockRows(source)
      }
      const filtered = source.filter((item) => {
        const matchName = !query.projectName || item.projectName.includes(query.projectName)
        const matchCode = !query.projectCode || item.projectCode.includes(query.projectCode)
        const matchOwner = !query.owner || item.owner.includes(query.owner)
        const matchStatus = !query.status || item.status === query.status
        return matchName && matchCode && matchOwner && matchStatus
      })
      const start = (query.pageNum - 1) * query.pageSize
      const end = start + query.pageSize
      setRows(filtered.slice(start, end))
      setTotal(filtered.length)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData().catch(() => {})
  }, [query])

  const statusOptions = useMemo(() => [
    { label: '进行中', value: '0' },
    { label: '已完成', value: '1' }
  ], [])

  const columns: ColumnsType<ProjectItem> = [
    { title: '项目编码', dataIndex: 'projectCode', width: 140 },
    { title: '项目名称', dataIndex: 'projectName', width: 200 },
    { title: '负责人', dataIndex: 'owner', width: 100 },
    { title: '任务总数', dataIndex: 'taskTotal', width: 100 },
    { title: '完成数', dataIndex: 'completedCount', width: 100 },
    {
      title: '进度',
      width: 220,
      render: (_, row) => {
        const percentage = row.taskTotal > 0 ? Math.round((row.completedCount / row.taskTotal) * 100) : 0
        return <Progress percent={Math.max(0, Math.min(percentage, 100))} size="small" />
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: ProjectItem['status']) =>
        value === '1' ? <Tag color="success">已完成</Tag> : <Tag color="processing">进行中</Tag>
    },
    { title: '截止时间', dataIndex: 'deadline', width: 170 },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      render: (_, row) => (
        <Space>
          <Button type="link" onClick={() => openEdit(row)}>编辑</Button>
          <Popconfirm title="确认删除该项目吗？" onConfirm={() => handleDelete(row)}>
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      status: '0',
      taskTotal: 0,
      completedCount: 0
    })
    setOpen(true)
  }

  const openEdit = async (row: ProjectItem) => {
    if (useMockMode) {
      setEditing(row)
      form.setFieldsValue({ ...row })
      setOpen(true)
      return
    }
    try {
      const detail = await getProject(row.projectId)
      setEditing(detail)
      form.setFieldsValue({ ...detail })
      setOpen(true)
    } catch {
      message.error('获取项目详情失败')
    }
  }

  const handleDelete = async (row: ProjectItem) => {
    if (useMockMode) {
      setMockRows((prev) => prev.filter((item) => item.projectId !== row.projectId))
      message.success('删除成功（演示数据）')
      await loadData()
      return
    }
    try {
      await removeProject(row.projectId)
      message.success('删除成功')
      await loadData()
    } catch {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (values.completedCount > values.taskTotal) {
      message.error('已完成数量不能大于任务总数')
      return
    }
    setSubmitLoading(true)
    try {
      if (useMockMode) {
        if (editing) {
          setMockRows((prev) =>
            prev.map((item) =>
              item.projectId === editing.projectId
                ? { ...item, ...values, projectId: editing.projectId, createTime: item.createTime }
                : item
            )
          )
          message.success('修改成功（演示数据）')
        } else {
          const newRow: ProjectItem = {
            ...values,
            projectId: Date.now().toString(),
            createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
          }
          setMockRows((prev) => [newRow, ...prev])
          message.success('新增成功（演示数据）')
        }
      } else {
        if (editing) {
          await updateProject({ ...values, projectId: editing.projectId, createTime: editing.createTime })
          message.success('修改成功')
        } else {
          await createProject(values)
          message.success('新增成功')
        }
      }
      setOpen(false)
      await loadData()
    } catch {
      message.error('保存失败')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <AppHeader
        title="项目管理"
        actions={
          <Button type="text" icon={<HomeOutlined />} style={{ color: 'rgba(255,255,255,0.8)' }} onClick={() => navigate('/home')}>
            首页
          </Button>
        }
      />
      <Layout.Content style={{ padding: '24px', maxWidth: 1600, margin: '0 auto', width: '100%' }}>
        <Card>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {useMockMode ? (
              <Alert message="当前为本地演示模式，后端 /system/project 接口不可用" type="warning" showIcon />
            ) : null}
            <Form
              layout="inline"
              onFinish={() => setQuery((prev) => ({ ...prev, pageNum: 1 }))}
            >
              <Form.Item label="项目名称">
                <Input
                  placeholder="请输入项目名称"
                  allowClear
                  value={query.projectName}
                  onChange={(e) => setQuery((prev) => ({ ...prev, projectName: e.target.value }))}
                />
              </Form.Item>
              <Form.Item label="项目编码">
                <Input
                  placeholder="请输入项目编码"
                  allowClear
                  value={query.projectCode}
                  onChange={(e) => setQuery((prev) => ({ ...prev, projectCode: e.target.value }))}
                />
              </Form.Item>
              <Form.Item label="负责人">
                <Input
                  placeholder="请输入负责人"
                  allowClear
                  value={query.owner}
                  onChange={(e) => setQuery((prev) => ({ ...prev, owner: e.target.value }))}
                />
              </Form.Item>
              <Form.Item label="状态">
                <Select
                  allowClear
                  placeholder="请选择状态"
                  style={{ width: 140 }}
                  value={query.status}
                  options={statusOptions}
                  onChange={(value) => setQuery((prev) => ({ ...prev, status: value }))}
                />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">查询</Button>
                  <Button
                    onClick={() =>
                      setQuery((prev) => ({
                        ...prev,
                        pageNum: 1,
                        projectName: undefined,
                        projectCode: undefined,
                        owner: undefined,
                        status: undefined
                      }))
                    }
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography.Title level={5} style={{ margin: 0 }}>项目列表</Typography.Title>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                新增项目
              </Button>
            </div>

            <Table<ProjectItem>
              rowKey="projectId"
              loading={loading}
              columns={columns}
              dataSource={rows}
              scroll={{ x: 1200 }}
              pagination={{
                current: query.pageNum,
                pageSize: query.pageSize,
                total,
                onChange: (pageNum, pageSize) => setQuery((prev) => ({ ...prev, pageNum, pageSize }))
              }}
            />
          </Space>
        </Card>
      </Layout.Content>

      <Modal
        title={editing ? '编辑项目' : '新增项目'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitLoading}
        width={560}
      >
        <Form<FormData> layout="vertical" form={form}>
          <Form.Item name="projectCode" label="项目编码" rules={[{ required: true, message: '请输入项目编码' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="projectName" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="owner" label="负责人" rules={[{ required: true, message: '请输入负责人' }]}>
            <Input />
          </Form.Item>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="taskTotal" label="任务总数" rules={[{ required: true, message: '请输入任务总数' }]} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="completedCount" label="完成数" rules={[{ required: true, message: '请输入完成数' }]} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="deadline" label="截止时间">
            <Input placeholder="例如：2026-04-10 18:00:00" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}
