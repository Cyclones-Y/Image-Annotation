import { Alert, Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, Upload, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import {
  createLabel,
  deleteLabel,
  fetchLabels,
  importLabels,
  LabelDto,
  updateLabel
} from '../../services/labelApi'
import { buildLabelTree, flattenTree } from '../../utils/labelTree'
import {
  buildCreateDiff,
  buildDeleteDiff,
  buildImportDiff,
  buildUpdateDiff,
  createOperationLog,
  OperationLog
} from '../../utils/labelManagerOps'
import { exportHierarchyText, parseHierarchyText } from '../../utils/labelHierarchyFormat'

type Props = {
  projectId?: string
}

function now() {
  return new Date().toLocaleString()
}

function getCurrentUserName() {
  return 'current-user'
}

async function confirmTwice(title: string, content: string) {
  const first = await new Promise<boolean>((resolve) => {
    Modal.confirm({
      title,
      content,
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
      content: '请再次确认写操作',
      okText: '确认执行',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false)
    })
  })
}

export default function LabelManager({ projectId }: Props) {
  const [form] = Form.useForm()
  const [labels, setLabels] = useState<LabelDto[]>([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<OperationLog[]>([])
  const pid = Number(projectId || 0)
  const canOperate = Number.isFinite(pid) && pid > 0

  const refresh = async () => {
    if (!pid) return
    setLoading(true)
    try {
      const data = await fetchLabels(pid)
      setLabels(data)
    } catch {
      message.error('标签加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [pid])

  const treeRows = useMemo(() => {
    const flat = labels.map((item) => ({
      id: String(item.labelId),
      name: item.labelName,
      parentId: item.labelCategory.includes(':') ? item.labelCategory.split(':')[0] : undefined,
      level: Number(item.labelCategory.split(':')[1] || 1)
    }))
    const tree = buildLabelTree(flat)
    return flattenTree(tree).map((item) => {
      const source = labels.find((row) => String(row.labelId) === item.id)
      return {
        key: item.id,
        labelId: Number(item.id),
        name: item.name,
        parentId: item.parentId,
        level: item.level,
        type: source?.labelType || 'object',
        color: source?.labelColor || '#1677ff'
      }
    })
  }, [labels])

  const appendLog = (action: OperationLog['action'], diff: string) => {
    setLogs((prev) =>
      [createOperationLog({ time: now(), user: getCurrentUserName(), action, diff }), ...prev].slice(0, 30)
    )
  }

  const saveTextFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  const importHierarchyText = async (raw: string) => {
    const parsed = parseHierarchyText(raw)
    if (parsed.length === 0) {
      throw new Error('层级文本中未解析到有效标签')
    }
    const pathToLabelId = new Map<string, string>()
    const labelById = new Map(labels.map((item) => [String(item.labelId), item]))
    const pathCache = new Map<string, string>()
    const buildPathKeyById = (id: string): string | undefined => {
      if (pathCache.has(id)) return pathCache.get(id)
      const node = labelById.get(id)
      if (!node) return undefined
      const [parentIdRaw = 'root'] = String(node.labelCategory || 'root:1').split(':')
      if (!parentIdRaw || parentIdRaw === 'root') {
        const rootPath = node.labelName
        pathCache.set(id, rootPath)
        return rootPath
      }
      const parentPath = buildPathKeyById(parentIdRaw)
      const nextPath = parentPath ? `${parentPath}/${node.labelName}` : node.labelName
      pathCache.set(id, nextPath)
      return nextPath
    }
    labels.forEach((item) => {
      const path = buildPathKeyById(String(item.labelId))
      if (path) {
        pathToLabelId.set(path, String(item.labelId))
      }
    })
    for (const node of parsed) {
      const parentId = node.parentPathKey ? pathToLabelId.get(node.parentPathKey) : undefined
      if (pathToLabelId.has(node.pathKey)) {
        continue
      }
      const created = await createLabel({
        projectId: pid,
        labelName: node.name,
        labelType: 'object',
        labelCategory: `${parentId || 'root'}:${node.level}`,
        labelColor: '#1677ff'
      })
      const createdId = String(created.labelId)
      pathToLabelId.set(node.pathKey, createdId)
    }
  }

  const onExportHierarchy = () => {
    const content = exportHierarchyText(labels)
    saveTextFile(`labels-${Date.now()}.txt`, content)
    message.success('层级标签已导出')
  }

  const onCreate = async () => {
    if (!pid) {
      message.warning('缺少项目ID')
      return
    }
    const values = await form.validateFields()
    const ok = await confirmTwice('新增节点', `确认新增标签「${values.name}」吗？`)
    if (!ok) return
    setLoading(true)
    try {
      const level = values.parentId ? Number((treeRows.find((item) => item.key === values.parentId)?.level || 0) + 1) : 1
      await createLabel({
        projectId: pid,
        labelName: values.name,
        labelType: values.type,
        labelCategory: `${values.parentId || 'root'}:${level}`,
        labelColor: values.color
      })
      appendLog('create', buildCreateDiff({ name: values.name, parentId: values.parentId, level }))
      form.resetFields()
      await refresh()
      message.success('新增成功')
    } catch (error: any) {
      message.error(error?.message || '新增失败')
    } finally {
      setLoading(false)
    }
  }

  const onEdit = async (row: any) => {
    const current = labels.find((item) => item.labelId === row.labelId)
    if (!current) return
    const nextName = window.prompt('输入新名称', current.labelName)
    if (!nextName || nextName === current.labelName) return
    const ok = await confirmTwice('编辑节点', `确认将「${current.labelName}」改为「${nextName}」吗？`)
    if (!ok) return
    setLoading(true)
    try {
      await updateLabel({ labelId: current.labelId as number, labelName: nextName })
      appendLog('update', buildUpdateDiff({ labelId: Number(current.labelId), before: current.labelName, after: nextName }))
      await refresh()
      message.success('编辑成功')
    } catch (error: any) {
      message.error(error?.message || '编辑失败')
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async (row: any) => {
    const ok = await confirmTwice('删除节点', `确认删除标签「${row.name}」吗？`)
    if (!ok) return
    setLoading(true)
    try {
      await deleteLabel(row.labelId)
      appendLog('delete', buildDeleteDiff({ labelId: Number(row.labelId), name: row.name }))
      await refresh()
      message.success('删除成功')
    } catch (error: any) {
      message.error(error?.message || '删除失败')
    } finally {
      setLoading(false)
    }
  }

  const onImport = async (file: File) => {
    if (!canOperate) {
      message.warning('请先从项目入口进入标签管理，再执行导入')
      return false
    }
    const ok = await confirmTwice('批量导入', `确认导入文件「${file.name}」吗？`)
    if (!ok) return false
    setLoading(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'json') {
        const raw = await file.text()
        const rows = JSON.parse(raw) as Array<{ name: string; parentId?: string; level?: number }>
        for (const item of rows) {
          await createLabel({
            projectId: pid,
            labelName: item.name,
            labelType: 'object',
            labelCategory: `${item.parentId || 'root'}:${item.level || 1}`,
            labelColor: '#1677ff'
          })
        }
      } else if (ext === 'txt' || ext === 'text') {
        const raw = await file.text()
        await importHierarchyText(raw)
      } else {
        await importLabels({ projectId: pid, file })
      }
      appendLog('import', buildImportDiff(file.name))
      await refresh()
      message.success('导入完成')
    } catch (error: any) {
      message.error(error?.message || '导入失败')
    } finally {
      setLoading(false)
    }
    return false
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Card title="标签管理中心">
        {!canOperate ? <Alert type="warning" showIcon message="当前未绑定项目，新增/编辑/导入操作不可用。请从项目或标注页进入并携带 projectId。" /> : null}
        <Space style={{ width: '100%', alignItems: 'flex-start' }}>
          <Form
            form={form}
            layout="vertical"
            style={{ minWidth: 360 }}
            initialValues={{ type: 'object', color: '#1677ff' }}
          >
            <Form.Item name="name" label="节点名称" rules={[{ required: true, message: '请输入节点名称' }]}>
              <Input placeholder="如：树皮颜色" />
            </Form.Item>
            <Form.Item name="parentId" label="父节点">
              <Select
                allowClear
                options={treeRows.map((item) => ({ value: item.key, label: `${'　'.repeat(Math.max(item.level - 1, 0))}${item.name}` }))}
                placeholder="可不选，默认根节点"
              />
            </Form.Item>
            <Form.Item name="type" label="节点类型">
              <Select options={[{ value: 'object', label: '目标标签' }, { value: 'attribute', label: '属性标签' }]} />
            </Form.Item>
            <Form.Item name="color" label="颜色">
              <Input />
            </Form.Item>
            <Space>
              <Button type="primary" onClick={onCreate} loading={loading}>
                新增节点
              </Button>
              <Upload showUploadList={false} beforeUpload={onImport} accept=".xlsx,.xls,.csv,.json,.txt,.text" disabled={!canOperate}>
                <Button icon={<UploadOutlined />} loading={loading} disabled={!canOperate}>
                  批量导入（Excel/JSON/TXT）
                </Button>
              </Upload>
              <Button icon={<DownloadOutlined />} onClick={onExportHierarchy} loading={loading} disabled={!canOperate}>
                导出层级文本
              </Button>
            </Space>
          </Form>
          <Table
            rowKey="key"
            loading={loading}
            style={{ flex: 1 }}
            dataSource={treeRows}
            pagination={false}
            size="small"
            columns={[
              { title: '名称', dataIndex: 'name' },
              { title: '层级', dataIndex: 'level', width: 80 },
              { title: '颜色', dataIndex: 'color', width: 120, render: (value: string) => <Tag color={value}>{value}</Tag> },
              {
                title: '操作',
                width: 200,
                render: (_: any, row: any) => (
                  <Space>
                    <Button size="small" onClick={() => onEdit(row)}>
                      编辑
                    </Button>
                    <Popconfirm title="确认删除？" onConfirm={() => onDelete(row)}>
                      <Button size="small" danger>
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                )
              }
            ]}
          />
        </Space>
      </Card>
      <Card title="操作日志（写操作）">
        <Space direction="vertical" style={{ width: '100%' }}>
          {logs.length === 0 ? <Typography.Text type="secondary">暂无日志</Typography.Text> : null}
          {logs.map((item, index) => (
            <Card key={`${item.time}-${index}`} size="small">
              <Typography.Text>{item.time}</Typography.Text>
              <Typography.Text style={{ marginLeft: 12 }}>{item.user}</Typography.Text>
              <Tag style={{ marginLeft: 12 }}>{item.action}</Tag>
              <Typography.Text style={{ marginLeft: 12 }}>{item.diff}</Typography.Text>
            </Card>
          ))}
        </Space>
      </Card>
    </Space>
  )
}
