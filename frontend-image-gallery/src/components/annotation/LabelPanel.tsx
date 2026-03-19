import {
  Button,
  Card,
  Checkbox,
  ColorPicker,
  Input,
  InputNumber,
  List,
  Progress,
  Radio,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
  message
} from 'antd'
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { AnnotationItem, LabelDefinition, LabelTemplate } from '../../types/annotation'
import type { Color } from 'antd/es/color-picker'
import {
  createLabel,
  createTemplate,
  deleteLabel,
  deleteTemplate,
  fetchLabels,
  fetchTemplates,
  importLabels,
  LabelDto,
  LabelTemplateDto,
  updateTemplate
} from '../../services/labelApi'

type Props = {
  projectId?: string
  labels: LabelDefinition[]
  selectedAnnotation?: AnnotationItem
  activeLabelId?: string
  selectedLabelIds: string[]
  disabled?: boolean
  onLabelsChange: (labels: LabelDefinition[]) => void
  onActiveLabelChange: (id?: string) => void
  onSelectedLabelIdsChange: (ids: string[]) => void
  onAnnotationChange: (annotation: AnnotationItem) => void
}

function mapLabelDto(item: LabelDto): LabelDefinition {
  return {
    id: String(item.labelId),
    name: item.labelName,
    color: item.labelColor,
    type: item.labelType,
    category: item.labelCategory,
    usageCount: item.usageCount,
    lastUsedAt: item.lastUsedAt
  }
}

function mapTemplateDto(item: LabelTemplateDto): LabelTemplate {
  return {
    id: String(item.templateId),
    name: item.templateName,
    category: item.templateCategory,
    version: item.templateVersion,
    visibility: item.visibility,
    labels: item.labels.map(mapLabelDto)
  }
}

export default function LabelPanel({
  projectId,
  labels,
  selectedAnnotation,
  activeLabelId,
  selectedLabelIds,
  disabled = false,
  onLabelsChange,
  onActiveLabelChange,
  onSelectedLabelIdsChange,
  onAnnotationChange
}: Props) {
  const [keyword, setKeyword] = useState('')
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#1677ff')
  const [newCategory, setNewCategory] = useState('default')
  const [newType, setNewType] = useState('object')
  const [selectionMode, setSelectionMode] = useState<'single' | 'multiple'>('single')
  const [templateName, setTemplateName] = useState('')
  const [templateCategory, setTemplateCategory] = useState('default')
  const [templateVisibility, setTemplateVisibility] = useState<'private' | 'project' | 'public'>('project')
  const [templates, setTemplates] = useState<LabelTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(0)

  const projectIdNumber = Number(projectId)
  const canUseBackend = Number.isFinite(projectIdNumber) && projectIdNumber > 0

  const filteredLabels = useMemo(() => {
    if (!keyword) return labels
    return labels.filter((item) => item.name.toLowerCase().includes(keyword.toLowerCase()))
  }, [labels, keyword])

  const refreshData = async () => {
    if (!canUseBackend) return
    const [labelRows, templateRows] = await Promise.all([fetchLabels(projectIdNumber), fetchTemplates(projectIdNumber)])
    onLabelsChange(labelRows.map(mapLabelDto))
    setTemplates(templateRows.map(mapTemplateDto))
  }

  useEffect(() => {
    if (!canUseBackend) return
    setLoading(true)
    refreshData()
      .catch(() => message.error('标签数据加载失败'))
      .finally(() => setLoading(false))
  }, [canUseBackend, projectIdNumber])

  const addLabel = async () => {
    if (!canUseBackend) {
      message.warning('缺少项目ID，无法写入标签库')
      return
    }
    if (!newName.trim()) {
      message.warning('请输入标签名称')
      return
    }
    setLoading(true)
    try {
      const created = await createLabel({
        projectId: projectIdNumber,
        labelName: newName.trim(),
        labelType: newType,
        labelCategory: newCategory,
        labelColor: newColor
      })
      onLabelsChange([mapLabelDto(created), ...labels])
      setNewName('')
      message.success('标签已创建')
    } catch (error: any) {
      message.error(error?.message || '创建标签失败')
    } finally {
      setLoading(false)
    }
  }

  const removeLabels = async () => {
    if (!canUseBackend) {
      message.warning('缺少项目ID，无法删除标签')
      return
    }
    if (selectedLabelIds.length === 0) return
    setLoading(true)
    try {
      await Promise.all(selectedLabelIds.map((id) => deleteLabel(Number(id))))
      onLabelsChange(labels.filter((item) => !selectedLabelIds.includes(item.id)))
      onSelectedLabelIdsChange([])
      if (activeLabelId && selectedLabelIds.includes(activeLabelId)) {
        onActiveLabelChange(undefined)
      }
      message.success('标签已删除')
    } catch (error: any) {
      message.error(error?.message || '删除标签失败')
    } finally {
      setLoading(false)
    }
  }

  const saveTemplate = async () => {
    if (!canUseBackend) {
      message.warning('缺少项目ID，无法保存模板')
      return
    }
    if (!templateName.trim()) {
      message.warning('请输入模板名称')
      return
    }
    const labelIds = labels.map((item) => Number(item.id)).filter((item) => Number.isFinite(item))
    setLoading(true)
    try {
      const created = await createTemplate({
        projectId: projectIdNumber,
        templateName: templateName.trim(),
        templateCategory,
        visibility: templateVisibility,
        labelIds
      })
      const mapped = mapTemplateDto(created)
      setTemplates([mapped, ...templates])
      setTemplateName('')
      message.success('模板已保存')
    } catch (error: any) {
      message.error(error?.message || '保存模板失败')
    } finally {
      setLoading(false)
    }
  }

  const loadTemplate = () => {
    const target = templates.find((tpl) => tpl.id === selectedTemplateId)
    if (!target) return
    onLabelsChange(target.labels)
    onSelectedLabelIdsChange([])
    message.success('模板已加载')
  }

  const removeTemplate = async () => {
    if (!selectedTemplateId) return
    setLoading(true)
    try {
      await deleteTemplate(Number(selectedTemplateId))
      const next = templates.filter((tpl) => tpl.id !== selectedTemplateId)
      setTemplates(next)
      setSelectedTemplateId(undefined)
      message.success('模板已删除')
    } catch (error: any) {
      message.error(error?.message || '删除模板失败')
    } finally {
      setLoading(false)
    }
  }

  const publishTemplateVersion = async () => {
    if (!selectedTemplateId) return
    const target = templates.find((item) => item.id === selectedTemplateId)
    if (!target) return
    const labelIds = labels.map((item) => Number(item.id)).filter((item) => Number.isFinite(item))
    setLoading(true)
    try {
      const updated = await updateTemplate({
        templateId: Number(selectedTemplateId),
        templateName: target.name,
        templateCategory: target.category || 'default',
        visibility: target.visibility || 'project',
        labelIds
      })
      const mapped = mapTemplateDto(updated)
      setTemplates((prev) => [mapped, ...prev.filter((item) => item.id !== selectedTemplateId)])
      setSelectedTemplateId(mapped.id)
      message.success('模板已生成新版本')
    } catch (error: any) {
      message.error(error?.message || '发布模板版本失败')
    } finally {
      setLoading(false)
    }
  }

  const toggleQuickSelect = (labelId: string, checked: boolean) => {
    if (selectionMode === 'single') {
      const next = checked ? [labelId] : []
      onSelectedLabelIdsChange(next)
      onActiveLabelChange(checked ? labelId : undefined)
      return
    }
    const next = checked ? [...new Set([...selectedLabelIds, labelId])] : selectedLabelIds.filter((id) => id !== labelId)
    onSelectedLabelIdsChange(next)
    if (checked && !activeLabelId) {
      onActiveLabelChange(labelId)
    }
  }

  const clearSelected = () => {
    onSelectedLabelIdsChange([])
    onActiveLabelChange(undefined)
  }

  const uploadFile = async (file: File) => {
    if (!canUseBackend) {
      message.warning('缺少项目ID，无法导入标签')
      return false
    }
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['csv', 'xlsx', 'xls'].includes(ext)) {
      message.error('仅支持CSV/Excel文件')
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      message.error('文件大小不能超过10MB')
      return false
    }
    setUploadPercent(0)
    setLoading(true)
    try {
      const result = await importLabels(
        {
          projectId: projectIdNumber,
          file
        },
        setUploadPercent
      )
      await refreshData()
      if ((result.failedCount || 0) > 0) {
        message.warning(`导入完成：成功${result.successCount}，失败${result.failedCount}`)
      } else {
        message.success(`导入成功：${result.successCount} 条`)
      }
    } catch (error: any) {
      message.error(error?.message || '导入失败')
    } finally {
      setLoading(false)
      setUploadPercent(0)
    }
    return false
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Card size="small" title="标签管理">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input.Search placeholder="搜索标签" allowClear disabled={disabled} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Upload showUploadList={false} beforeUpload={uploadFile} accept=".csv,.xlsx,.xls" disabled={disabled || loading}>
            <Button icon={<UploadOutlined />} block disabled={disabled || loading}>
              导入标签（CSV/Excel）
            </Button>
          </Upload>
          {uploadPercent > 0 ? <Progress percent={uploadPercent} size="small" /> : null}
          <Space.Compact style={{ width: '100%' }}>
            <Input disabled={disabled || loading} placeholder="新标签名称" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <ColorPicker disabled={disabled || loading} value={newColor} onChange={(color: Color) => setNewColor(color.toHexString())} />
          </Space.Compact>
          <Space.Compact style={{ width: '100%' }}>
            <Select
              style={{ width: '50%' }}
              disabled={disabled || loading}
              value={newCategory}
              options={[
                { value: 'default', label: '默认分类' },
                { value: 'defect', label: '缺陷分类' },
                { value: 'scene', label: '场景分类' }
              ]}
              onChange={setNewCategory}
            />
            <Select
              style={{ width: '50%' }}
              disabled={disabled || loading}
              value={newType}
              options={[
                { value: 'object', label: '目标标签' },
                { value: 'attribute', label: '属性标签' }
              ]}
              onChange={setNewType}
            />
          </Space.Compact>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={addLabel} disabled={disabled || loading}>
              添加标签
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={removeLabels} disabled={selectedLabelIds.length === 0 || disabled || loading}>
              批量删除
            </Button>
            <Button onClick={clearSelected} disabled={selectedLabelIds.length === 0 || disabled || loading}>
              一键清除
            </Button>
          </Space>
          <Radio.Group
            value={selectionMode}
            onChange={(e) => setSelectionMode(e.target.value)}
            options={[
              { label: '单选', value: 'single' },
              { label: '多选', value: 'multiple' }
            ]}
            optionType="button"
            disabled={disabled || loading}
          />
          <List
            size="small"
            bordered
            dataSource={filteredLabels}
            locale={{ emptyText: '暂无标签' }}
            renderItem={(item) => (
              <List.Item>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <Checkbox
                      disabled={disabled || loading}
                      checked={selectedLabelIds.includes(item.id)}
                      onChange={(e) => toggleQuickSelect(item.id, e.target.checked)}
                    />
                    <Tag color={item.color}>{item.name}</Tag>
                    {item.category ? <Typography.Text type="secondary">{item.category}</Typography.Text> : null}
                  </Space>
                  <Typography.Text type={selectedLabelIds.includes(item.id) ? undefined : 'secondary'}>
                    使用{item.usageCount || 0}
                  </Typography.Text>
                </Space>
              </List.Item>
            )}
          />
        </Space>
      </Card>

      <Card size="small" title="属性配置">
        {selectedAnnotation ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              placeholder="绑定标签"
              disabled={disabled || loading}
              value={selectedAnnotation.labelId}
              options={labels.map((label) => ({ value: label.id, label: label.name }))}
              onChange={(value) => onAnnotationChange({ ...selectedAnnotation, labelId: value })}
            />
            <InputNumber
              disabled={disabled || loading}
              style={{ width: '100%' }}
              min={0}
              max={1}
              step={0.01}
              value={selectedAnnotation.confidence}
              placeholder="置信度 0~1"
              onChange={(value) => onAnnotationChange({ ...selectedAnnotation, confidence: Number(value ?? 0) })}
            />
            <Input.TextArea
              disabled={disabled || loading}
              rows={3}
              value={selectedAnnotation.remark}
              placeholder="备注"
              onChange={(e) => onAnnotationChange({ ...selectedAnnotation, remark: e.target.value })}
            />
          </Space>
        ) : (
          <Typography.Text type="secondary">请选择一个标注对象后配置属性</Typography.Text>
        )}
      </Card>

      <Card size="small" title="标签模板">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            disabled={disabled || loading}
            placeholder="模板名称"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
          <Space.Compact style={{ width: '100%' }}>
            <Select
              style={{ width: '50%' }}
              disabled={disabled || loading}
              value={templateCategory}
              options={[
                { value: 'default', label: '默认模板' },
                { value: 'inspection', label: '质检模板' },
                { value: 'production', label: '生产模板' }
              ]}
              onChange={setTemplateCategory}
            />
            <Select
              style={{ width: '50%' }}
              disabled={disabled || loading}
              value={templateVisibility}
              options={[
                { value: 'private', label: '私有' },
                { value: 'project', label: '项目内' },
                { value: 'public', label: '公共' }
              ]}
              onChange={setTemplateVisibility}
            />
          </Space.Compact>
          <Select
            allowClear
            disabled={disabled || loading}
            placeholder="选择模板"
            value={selectedTemplateId}
            options={templates.map((tpl) => ({
              value: tpl.id,
              label: `${tpl.name} v${tpl.version || 1} · ${tpl.visibility === 'public' ? '公共' : tpl.visibility === 'private' ? '私有' : '项目内'}`
            }))}
            onChange={(value) => setSelectedTemplateId(value)}
          />
          <Space>
            <Button type="primary" onClick={saveTemplate} disabled={disabled || loading}>
              保存模板
            </Button>
            <Button onClick={loadTemplate} disabled={!selectedTemplateId || disabled || loading}>
              加载模板
            </Button>
            <Button onClick={publishTemplateVersion} disabled={!selectedTemplateId || disabled || loading}>
              发布版本
            </Button>
            <Button danger onClick={removeTemplate} disabled={!selectedTemplateId || disabled || loading}>
              删除模板
            </Button>
          </Space>
        </Space>
      </Card>
    </Space>
  )
}
