import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  Layout,
  Modal,
  Popconfirm,
  Progress,
  Radio,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
  message
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CloudUploadOutlined,
  DownloadOutlined,
  FileAddOutlined,
  HomeOutlined,
  PlusOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import AppHeader from '../../components/AppHeader'
import PageNavigation from '../../components/PageNavigation'
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
import { UserSelectOption, listUserOptions } from '../../services/userApi'
import {
  createProjectTask,
  exportAnnotations,
  getTaskConfig,
  getWorkflowSnapshot,
  importDataset,
  listProjectTasks,
  saveTaskConfig
} from '../../services/workflowApi'
import { AnnotationTask, DatasetImportJob, ExportJob, TaskConfig, TaskStatus, WorkflowSnapshot } from '../../types/workflow'
import './index.css'

type FormData = Omit<ProjectItem, 'projectId' | 'createTime'> & { projectId?: string }
type ProjectFormData = FormData & {
  projectScene?: string
  annotationType?: string
  reviewMode?: string
  datasetType?: string
  qualityLevel?: string
}
type TaskFormData = { taskName: string; assignee: string; priority: AnnotationTask['priority'] }
type ImportFormData = { datasetName: string; totalImages: number }
type TaskListRow = AnnotationTask & { projectName: string; projectCode: string }

function generateProjectCode() {
  const date = new Date()
  const yyyy = date.getFullYear()
  const mm = `${date.getMonth() + 1}`.padStart(2, '0')
  const dd = `${date.getDate()}`.padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `IMG-ANNO-${yyyy}${mm}${dd}-${rand}`
}

export default function ProjectManagementPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [useMockMode, setUseMockMode] = useState(false)
  const [query, setQuery] = useState<ProjectQuery>({ pageNum: 1, pageSize: 10 })
  const [rows, setRows] = useState<ProjectItem[]>([])
  const [total, setTotal] = useState(0)
  const [mockRows, setMockRows] = useState<ProjectItem[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectItem | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [ownerOptions, setOwnerOptions] = useState<UserSelectOption[]>([])
  const [ownerLoading, setOwnerLoading] = useState(false)
  const [form] = Form.useForm<ProjectFormData>()
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null)
  const [tasks, setTasks] = useState<AnnotationTask[]>([])
  const [config, setConfig] = useState<TaskConfig>()
  const [snapshot, setSnapshot] = useState<WorkflowSnapshot>()
  const [lastImportJob, setLastImportJob] = useState<DatasetImportJob>()
  const [lastExportJob, setLastExportJob] = useState<ExportJob>()
  const [workflowMockMode, setWorkflowMockMode] = useState(false)
  const [taskPanelMode, setTaskPanelMode] = useState<'current' | 'all'>('current')
  const [taskPanelRows, setTaskPanelRows] = useState<TaskListRow[]>([])
  const [taskPanelLoading, setTaskPanelLoading] = useState(false)
  const [taskPanelStatus, setTaskPanelStatus] = useState<TaskStatus | undefined>()
  const [taskPanelAssignee, setTaskPanelAssignee] = useState('')
  const [taskPanelUpdatedAt, setTaskPanelUpdatedAt] = useState('')

  const [taskOpen, setTaskOpen] = useState(false)
  const [taskSubmitting, setTaskSubmitting] = useState(false)
  const [taskForm] = Form.useForm<TaskFormData>()
  const [configOpen, setConfigOpen] = useState(false)
  const [configSubmitting, setConfigSubmitting] = useState(false)
  const [configForm] = Form.useForm<TaskConfig>()
  const [importOpen, setImportOpen] = useState(false)
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [importForm] = Form.useForm<ImportFormData>()
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportJob['format']>('COCO')
  const [annotateOpen, setAnnotateOpen] = useState(false)
  const [annotateProject, setAnnotateProject] = useState<ProjectItem | null>(null)
  const [annotateTaskId, setAnnotateTaskId] = useState<string>()
  const [annotateMode, setAnnotateMode] = useState<'task' | 'quick'>('task')

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

  const loadWorkflowData = async (project: ProjectItem) => {
    setActiveProject(project)
    const [taskRes, configRes, snapshotRes] = await Promise.all([
      listProjectTasks(project.projectId),
      getTaskConfig(project.projectId),
      getWorkflowSnapshot(project.projectId)
    ])
    setTasks(taskRes.rows)
    setConfig(configRes.config)
    setSnapshot(snapshotRes.snapshot)
    setWorkflowMockMode(taskRes.isMock || configRes.isMock || snapshotRes.isMock)
    return {
      tasks: taskRes.rows,
      config: configRes.config,
      snapshot: snapshotRes.snapshot,
      isMock: taskRes.isMock || configRes.isMock || snapshotRes.isMock
    }
  }

  const extractErrorMessage = (error: any, fallback: string) => {
    return error?.response?.data?.msg || error?.message || fallback
  }

  const loadOwnerOptions = useCallback(async () => {
    setOwnerLoading(true)
    try {
      const options = await listUserOptions()
      setOwnerOptions(options)
    } catch (error: any) {
      message.error(extractErrorMessage(error, '加载负责人列表失败'))
    } finally {
      setOwnerLoading(false)
    }
  }, [])

  const loadTaskPanelData = useCallback(async () => {
    if (rows.length === 0) {
      setTaskPanelRows([])
      return
    }
    setTaskPanelLoading(true)
    try {
      const targets =
        taskPanelMode === 'current'
          ? activeProject
            ? [activeProject]
            : [rows[0]]
          : rows
      const result = await Promise.all(
        targets.map(async (project) => {
          const res = await listProjectTasks(project.projectId)
          return res.rows.map((task) => ({
            ...task,
            projectName: project.projectName,
            projectCode: project.projectCode
          }))
        })
      )
      setTaskPanelRows(
        result
          .flat()
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      )
      setTaskPanelUpdatedAt(new Date().toLocaleString())
    } finally {
      setTaskPanelLoading(false)
    }
  }, [activeProject, rows, taskPanelMode])

  useEffect(() => {
    loadData().catch(() => {})
  }, [query])

  useEffect(() => {
    if (rows.length > 0 && !activeProject) {
      loadWorkflowData(rows[0]).catch(() => {})
    }
  }, [rows, activeProject])

  useEffect(() => {
    if (open && ownerOptions.length === 0) {
      loadOwnerOptions().catch(() => {})
    }
  }, [open, ownerOptions.length, loadOwnerOptions])

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
      width: 360,
      fixed: 'right',
      render: (_, row) => (
        <Space>
          <Button type="link" icon={<FileAddOutlined />} onClick={() => openTaskModal(row)}>任务</Button>
          <Button type="link" icon={<SettingOutlined />} onClick={() => openConfigModal(row)}>配置</Button>
          <Button type="link" icon={<CloudUploadOutlined />} onClick={() => openImportModal(row)}>导入</Button>
          <Button type="link" icon={<DownloadOutlined />} onClick={() => handleExport(row)}>导出</Button>
          <Button type="link" onClick={() => openAnnotateModal(row)}>标注</Button>
          <Button type="link" onClick={() => openEdit(row)}>编辑</Button>
          <Popconfirm title="确认删除该项目吗？" onConfirm={() => handleDelete(row)}>
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const taskPanelColumns: ColumnsType<TaskListRow> = [
    {
      title: '任务名称',
      dataIndex: 'taskName',
      width: 240,
      ellipsis: true
    },
    {
      title: '所属项目',
      width: 260,
      render: (_, row) => `${row.projectName} (${row.projectCode})`
    },
    {
      title: '执行人',
      dataIndex: 'assignee',
      width: 120
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 110,
      render: (value: AnnotationTask['priority']) => {
        if (value === 'high') return <Tag color="error">高</Tag>
        if (value === 'low') return <Tag color="default">低</Tag>
        return <Tag color="warning">中</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (value: TaskStatus) => {
        if (value === 'completed') return <Tag color="success">已完成</Tag>
        if (value === 'in_progress') return <Tag color="processing">进行中</Tag>
        return <Tag>待开始</Tag>
      }
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180
    }
  ]

  const filteredTaskPanelRows = useMemo(() => {
    return taskPanelRows.filter((item) => {
      const statusMatched = !taskPanelStatus || item.status === taskPanelStatus
      const assigneeMatched = !taskPanelAssignee || item.assignee.includes(taskPanelAssignee.trim())
      return statusMatched && assigneeMatched
    })
  }, [taskPanelRows, taskPanelStatus, taskPanelAssignee])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      projectCode: generateProjectCode(),
      projectScene: '通用图像',
      annotationType: '目标检测',
      reviewMode: '双人复审',
      datasetType: '图片',
      qualityLevel: '标准',
      status: '0',
      taskTotal: 0,
      completedCount: 0
    })
    setOpen(true)
  }

  const openTaskModal = async (row: ProjectItem) => {
    await loadWorkflowData(row)
    taskForm.resetFields()
    taskForm.setFieldsValue({ assignee: row.owner, priority: 'medium' })
    setTaskOpen(true)
  }

  const openConfigModal = async (row: ProjectItem) => {
    await loadWorkflowData(row)
    const value = config ?? {
      projectId: row.projectId,
      autosaveIntervalSec: 15,
      reviewRequired: true,
      maxObjectsPerImage: 50,
      qualityThreshold: 0.8,
      allowSkip: true
    }
    configForm.setFieldsValue(value)
    setConfigOpen(true)
  }

  const openImportModal = async (row: ProjectItem) => {
    await loadWorkflowData(row)
    importForm.resetFields()
    importForm.setFieldsValue({
      datasetName: `${row.projectName}-dataset`,
      totalImages: 1000
    })
    setImportOpen(true)
  }

  const openAnnotateModal = async (row: ProjectItem) => {
    const res = await loadWorkflowData(row)
    setAnnotateProject(row)
    if (res.tasks.length > 0) {
      setAnnotateMode('task')
      setAnnotateTaskId(res.tasks[0].taskId)
    } else {
      setAnnotateMode('quick')
      setAnnotateTaskId(undefined)
    }
    setAnnotateOpen(true)
  }

  const openEdit = async (row: ProjectItem) => {
    if (useMockMode) {
      setEditing(row)
      form.setFieldsValue({ ...row, projectScene: undefined, annotationType: undefined, reviewMode: undefined, datasetType: undefined, qualityLevel: undefined })
      setOpen(true)
      return
    }
    try {
      const detail = await getProject(row.projectId)
      setEditing(detail)
      form.setFieldsValue({ ...detail, projectScene: undefined, annotationType: undefined, reviewMode: undefined, datasetType: undefined, qualityLevel: undefined })
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
    } catch (error: any) {
      message.error(extractErrorMessage(error, '删除失败'))
    }
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (values.completedCount > values.taskTotal) {
      message.error('已完成数量不能大于任务总数')
      return
    }
    const mergedRemark = [
      values.remark?.trim(),
      `流程配置: 场景=${values.projectScene || '-'}; 标注类型=${values.annotationType || '-'}; 复审模式=${values.reviewMode || '-'}; 数据类型=${values.datasetType || '-'}; 质量等级=${values.qualityLevel || '-'}`
    ].filter(Boolean).join('\n')
    const payload: Omit<ProjectItem, 'projectId' | 'createTime'> = {
      projectCode: values.projectCode || generateProjectCode(),
      projectName: values.projectName,
      owner: values.owner,
      taskTotal: Number(values.taskTotal),
      completedCount: Number(values.completedCount),
      status: values.status,
      deadline: values.deadline,
      remark: mergedRemark
    }
    setSubmitLoading(true)
    try {
      if (useMockMode) {
        if (editing) {
          setMockRows((prev) =>
            prev.map((item) =>
              item.projectId === editing.projectId
                ? { ...item, ...payload, projectId: editing.projectId, createTime: item.createTime }
                : item
            )
          )
          message.success('修改成功（演示数据）')
        } else {
          const newRow: ProjectItem = {
            ...payload,
            projectId: Date.now().toString(),
            createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
          }
          setMockRows((prev) => [newRow, ...prev])
          message.success('新增成功（演示数据）')
        }
      } else {
        if (editing) {
          await updateProject({ ...payload, projectId: editing.projectId, createTime: editing.createTime })
          message.success('修改成功')
        } else {
          await createProject(payload)
          message.success('新增成功')
        }
      }
      setOpen(false)
      await loadData()
    } catch (error: any) {
      message.error(extractErrorMessage(error, '保存失败'))
    } finally {
      setSubmitLoading(false)
    }
  }

  const submitTask = async () => {
    if (!activeProject) return
    const values = await taskForm.validateFields()
    setTaskSubmitting(true)
    try {
      const res = await createProjectTask({
        projectId: activeProject.projectId,
        taskName: values.taskName,
        assignee: values.assignee,
        priority: values.priority
      })
      message.success(res.isMock ? '任务创建成功（演示）' : '任务创建成功')
      setTaskOpen(false)
      await loadWorkflowData(activeProject)
    } catch {
      message.error('任务创建失败')
    } finally {
      setTaskSubmitting(false)
    }
  }

  const submitConfig = async () => {
    if (!activeProject) return
    const values = await configForm.validateFields()
    setConfigSubmitting(true)
    try {
      const res = await saveTaskConfig({
        ...values,
        projectId: activeProject.projectId
      })
      setConfig(res.config)
      message.success(res.isMock ? '配置保存成功（演示）' : '配置保存成功')
      setConfigOpen(false)
      await loadWorkflowData(activeProject)
    } catch {
      message.error('配置保存失败')
    } finally {
      setConfigSubmitting(false)
    }
  }

  const submitImport = async () => {
    if (!activeProject) return
    const values = await importForm.validateFields()
    setImportSubmitting(true)
    try {
      const res = await importDataset({
        projectId: activeProject.projectId,
        datasetName: values.datasetName,
        totalImages: values.totalImages
      })
      setLastImportJob(res.job)
      message.success(res.isMock ? '数据集导入成功（演示）' : '数据集导入成功')
      setImportOpen(false)
      await loadWorkflowData(activeProject)
    } catch {
      message.error('数据集导入失败')
    } finally {
      setImportSubmitting(false)
    }
  }

  const handleExport = async (project: ProjectItem) => {
    setExporting(true)
    try {
      const res = await exportAnnotations({
        projectId: project.projectId,
        format: exportFormat
      })
      setLastExportJob(res.job)
      message.success(res.isMock ? `导出任务已完成（演示），格式：${exportFormat}` : '导出任务已提交')
      if (activeProject?.projectId === project.projectId) {
        await loadWorkflowData(project)
      }
    } catch {
      message.error('导出失败')
    } finally {
      setExporting(false)
    }
  }

  const handleStartAnnotate = () => {
    if (!annotateProject) return
    if (annotateMode === 'task') {
      if (!annotateTaskId) {
        message.warning('请先选择任务后再开始标注')
        return
      }
      navigate(`/annotator?projectId=${annotateProject.projectId}&taskId=${annotateTaskId}`, {
        state: { from: `${location.pathname}${location.search}` }
      })
      setAnnotateOpen(false)
      return
    }
    navigate(`/annotator?projectId=${annotateProject.projectId}`, {
      state: { from: `${location.pathname}${location.search}` }
    })
    setAnnotateOpen(false)
  }

  const currentStep = snapshot?.currentStep || 'project_created'
  const stepIndexMap = {
    project_created: 0,
    task_created: 1,
    configured: 2,
    dataset_imported: 3,
    annotating: 4,
    exported: 5
  }

  return (
    <Layout className="project-management-page" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <AppHeader
        title="项目管理"
        actions={
          <Button type="text" icon={<HomeOutlined />} style={{ color: 'rgba(255,255,255,0.8)' }} onClick={() => navigate('/home')}>
            首页
          </Button>
        }
      />
      <Layout.Content style={{ padding: '24px', maxWidth: 1600, margin: '0 auto', width: '100%' }}>
        <PageNavigation currentLabel="项目管理面板" menuLabel="工作台" subMenuLabel="项目管理" />
        <Card>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {useMockMode ? (
              <Alert message="当前为本地演示模式，后端 /system/project 接口不可用" type="warning" showIcon />
            ) : null}
            {workflowMockMode ? (
              <Alert message="流程链路当前使用演示模式（任务/配置/导入/导出）" type="info" showIcon />
            ) : null}
            <Alert
              type="success"
              showIcon
              message="关系说明：项目是业务容器（标签、规则、数据范围）；任务是执行单元（分配给具体人员与批次）。建议先创建任务再标注，便于协作与审查追踪。"
            />

            <Card size="small" title="标注流程看板">
              {activeProject ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Descriptions size="small" column={4}>
                    <Descriptions.Item label="当前项目">{activeProject.projectName}</Descriptions.Item>
                    <Descriptions.Item label="任务数">{snapshot?.taskCount ?? 0}</Descriptions.Item>
                    <Descriptions.Item label="完成度">
                      <Progress percent={snapshot?.completionPercent ?? 0} size="small" style={{ width: 120 }} />
                    </Descriptions.Item>
                    <Descriptions.Item label="导出格式">
                      <Space>
                        <Select
                          value={exportFormat}
                          style={{ width: 120 }}
                          options={[
                            { value: 'COCO', label: 'COCO' },
                            { value: 'VOC', label: 'VOC' },
                            { value: 'YOLO', label: 'YOLO' }
                          ]}
                          onChange={(value) => setExportFormat(value)}
                        />
                        <Button loading={exporting} onClick={() => handleExport(activeProject)}>
                          立即导出
                        </Button>
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                  <Steps
                    current={stepIndexMap[currentStep]}
                    items={[
                      { title: '创建任务' },
                      { title: '任务配置' },
                      { title: '导入数据集' },
                      { title: '执行标注' },
                      { title: '导出结果' },
                      { title: '闭环完成' }
                    ]}
                  />
                  <Space split={<Divider type="vertical" />}>
                    <Typography.Text>最新任务：{snapshot?.latestTaskName || '-'}</Typography.Text>
                    <Typography.Text>导入状态：{snapshot?.latestImportStatus || '-'}</Typography.Text>
                    <Typography.Text>导出状态：{snapshot?.latestExportStatus || '-'}</Typography.Text>
                    <Typography.Text>
                      最近导入：{lastImportJob ? `${lastImportJob.datasetName} (${lastImportJob.totalImages}张)` : '-'}
                    </Typography.Text>
                    <Typography.Text>
                      最近导出：{lastExportJob ? `${lastExportJob.format} / ${lastExportJob.status}` : '-'}
                    </Typography.Text>
                  </Space>
                </Space>
              ) : (
                <Typography.Text type="secondary">请选择项目后查看流程看板</Typography.Text>
              )}
            </Card>
            <Card
              size="small"
              title="任务列表栏"
              extra={
                <Space>
                  <Typography.Text type="secondary">最近刷新：{taskPanelUpdatedAt || '-'}</Typography.Text>
                  <Button size="small" onClick={() => loadTaskPanelData().catch(() => {})}>
                    刷新
                  </Button>
                </Space>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Space wrap>
                  <Radio.Group
                    optionType="button"
                    buttonStyle="solid"
                    value={taskPanelMode}
                    onChange={(e) => setTaskPanelMode(e.target.value)}
                    options={[
                      { label: '当前项目', value: 'current' },
                      { label: '跨项目总览', value: 'all' }
                    ]}
                  />
                  <Select
                    allowClear
                    placeholder="任务状态"
                    style={{ width: 150 }}
                    value={taskPanelStatus}
                    options={[
                      { value: 'pending', label: '待开始' },
                      { value: 'in_progress', label: '进行中' },
                      { value: 'completed', label: '已完成' }
                    ]}
                    onChange={(value) => setTaskPanelStatus(value)}
                  />
                  <Input
                    allowClear
                    placeholder="按执行人筛选"
                    style={{ width: 200 }}
                    value={taskPanelAssignee}
                    onChange={(e) => setTaskPanelAssignee(e.target.value)}
                  />
                </Space>
                <Table<TaskListRow>
                  rowKey="taskId"
                  loading={taskPanelLoading}
                  columns={taskPanelColumns}
                  dataSource={filteredTaskPanelRows}
                  scroll={{ x: 1000 }}
                  pagination={{
                    pageSize: 8,
                    showSizeChanger: false
                  }}
                />
              </Space>
            </Card>
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
              onRow={(record) => ({
                onClick: () => {
                  loadWorkflowData(record).catch(() => {})
                }
              })}
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
        className="project-management-modal project-create-modal"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitLoading}
        width={760}
      >
        <Form<ProjectFormData> layout="vertical" form={form} className="project-create-form">
          <Alert
            style={{ marginBottom: 16 }}
            type="info"
            showIcon
            message="建议先完善项目基础信息与流程配置，再创建任务并导入数据集。"
          />
          <Typography.Title level={5} style={{ marginTop: 0 }}>基础信息</Typography.Title>
          <Row gutter={12}>
            <Col span={10}>
              <Form.Item name="projectCode" label="项目编码" rules={[{ required: true, message: '项目编码生成失败，请重试' }]}>
                <Input readOnly />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item
                name="projectName"
                label="项目名称"
                rules={[{ required: true, message: '请输入项目名称' }]}
              >
                <Input placeholder="请输入业务可识别的项目名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="owner" label="负责人" rules={[{ required: true, message: '请选择负责人' }]}>
                <Select
                  showSearch
                  options={ownerOptions}
                  loading={ownerLoading}
                  placeholder="请选择负责人"
                  optionFilterProp="label"
                  popupClassName="project-management-select-dropdown"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
                <Select options={statusOptions} popupClassName="project-management-select-dropdown" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="deadline" label="截止时间">
                <Input placeholder="例如：2026-04-10 18:00:00" />
              </Form.Item>
            </Col>
          </Row>
          <Divider style={{ margin: '8px 0 16px' }} />

          <Typography.Title level={5} style={{ marginTop: 0 }}>流程配置</Typography.Title>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="projectScene" label="业务场景">
                <Select
                  popupClassName="project-management-select-dropdown"
                  popupMatchSelectWidth={260}
                options={[
                  { value: '通用图像', label: '通用图像' },
                  { value: '自动驾驶', label: '自动驾驶' },
                  { value: '医疗影像', label: '医疗影像' },
                  { value: '工业质检', label: '工业质检' }
                ]}
              />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="annotationType" label="标注类型">
                <Select
                  popupClassName="project-management-select-dropdown"
                  popupMatchSelectWidth={260}
                options={[
                  { value: '目标检测', label: '目标检测' },
                  { value: '语义分割', label: '语义分割' },
                  { value: '关键点', label: '关键点' },
                  { value: '分类', label: '分类' }
                ]}
              />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="reviewMode" label="复审模式">
                <Select
                  popupClassName="project-management-select-dropdown"
                  popupMatchSelectWidth={260}
                options={[
                  { value: '单人质检', label: '单人质检' },
                  { value: '双人复审', label: '双人复审' },
                  { value: '专家终审', label: '专家终审' }
                ]}
              />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="datasetType" label="数据类型">
                <Select
                  popupClassName="project-management-select-dropdown"
                  popupMatchSelectWidth={260}
                options={[
                  { value: '图片', label: '图片' },
                  { value: '视频帧', label: '视频帧' },
                  { value: '多光谱', label: '多光谱' }
                ]}
              />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="qualityLevel" label="质量等级">
                <Select
                  popupClassName="project-management-select-dropdown"
                  popupMatchSelectWidth={260}
                options={[
                  { value: '标准', label: '标准' },
                  { value: '严格', label: '严格' },
                  { value: '科研级', label: '科研级' }
                ]}
              />
              </Form.Item>
            </Col>
          </Row>
          <Divider style={{ margin: '8px 0 16px' }} />

          <Typography.Title level={5} style={{ marginTop: 0 }}>任务规模</Typography.Title>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="taskTotal" label="任务总数" rules={[{ required: true, message: '请输入任务总数' }]} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="completedCount" label="完成数" rules={[{ required: true, message: '请输入完成数' }]} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="补充项目背景、验收要求、风险说明等" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`创建任务${activeProject ? ` - ${activeProject.projectName}` : ''}`}
        className="project-management-modal"
        open={taskOpen}
        onCancel={() => setTaskOpen(false)}
        onOk={submitTask}
        confirmLoading={taskSubmitting}
        width={520}
      >
        <Form<TaskFormData> layout="vertical" form={taskForm}>
          <Form.Item name="taskName" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="assignee" label="执行人" rules={[{ required: true, message: '请输入执行人' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请选择优先级' }]}>
            <Select
              popupClassName="project-management-select-dropdown"
              options={[
                { value: 'high', label: '高' },
                { value: 'medium', label: '中' },
                { value: 'low', label: '低' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`任务配置${activeProject ? ` - ${activeProject.projectName}` : ''}`}
        className="project-management-modal"
        open={configOpen}
        onCancel={() => setConfigOpen(false)}
        onOk={submitConfig}
        confirmLoading={configSubmitting}
        width={620}
      >
        <Form<TaskConfig> layout="vertical" form={configForm}>
          <Form.Item name="autosaveIntervalSec" label="自动保存间隔（秒）" rules={[{ required: true, message: '请输入自动保存间隔' }]}>
            <InputNumber min={3} max={120} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="maxObjectsPerImage" label="单图最大标注目标数" rules={[{ required: true, message: '请输入最大目标数' }]}>
            <InputNumber min={1} max={1000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="qualityThreshold" label="质量阈值（0~1）" rules={[{ required: true, message: '请输入质量阈值' }]}>
            <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reviewRequired" label="是否强制审核">
            <Select
              popupClassName="project-management-select-dropdown"
              options={[
                { value: true, label: '是' },
                { value: false, label: '否' }
              ]}
            />
          </Form.Item>
          <Form.Item name="allowSkip" label="是否允许跳过低质量图片">
            <Select
              popupClassName="project-management-select-dropdown"
              options={[
                { value: true, label: '允许' },
                { value: false, label: '不允许' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`导入数据集${activeProject ? ` - ${activeProject.projectName}` : ''}`}
        className="project-management-modal"
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        onOk={submitImport}
        confirmLoading={importSubmitting}
        width={520}
      >
        <Form<ImportFormData> layout="vertical" form={importForm}>
          <Form.Item name="datasetName" label="数据集名称" rules={[{ required: true, message: '请输入数据集名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="totalImages" label="图像数量" rules={[{ required: true, message: '请输入图像数量' }]}>
            <InputNumber min={1} max={1000000} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`开始标注${annotateProject ? ` - ${annotateProject.projectName}` : ''}`}
        className="project-management-modal"
        open={annotateOpen}
        onCancel={() => setAnnotateOpen(false)}
        onOk={handleStartAnnotate}
        okText="进入标注"
        width={620}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Alert
            type="info"
            showIcon
            message="推荐模式：按任务标注（可追踪执行人、进度与审查记录）。快速标注适用于个人临时处理，不建议用于正式协作。"
          />
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
            <Form layout="vertical">
              <Form.Item label="选择任务">
                <Select
                  placeholder={tasks.length > 0 ? '请选择任务' : '当前项目还没有任务，请先创建任务'}
                  popupClassName="project-management-select-dropdown"
                  value={annotateTaskId}
                  onChange={(value) => setAnnotateTaskId(value)}
                  options={tasks.map((task) => ({
                    value: task.taskId,
                    label: `${task.taskName}（${task.assignee} / ${task.status}）`
                  }))}
                />
              </Form.Item>
            </Form>
          ) : (
            <Alert
              type="warning"
              showIcon
              message="你正在使用快速标注模式：本次标注不会绑定到具体任务，建议仅用于临时标注或功能验证。"
            />
          )}
        </Space>
      </Modal>
    </Layout>
  )
}
