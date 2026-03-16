import { Button, Card, Checkbox, ColorPicker, Input, InputNumber, List, Select, Space, Tag, Typography, message } from 'antd'
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { useMemo, useState } from 'react'
import { AnnotationItem, LabelDefinition, LabelTemplate } from '../../types/annotation'
import { createId } from '../../utils/annotationMath'
import type { Color } from 'antd/es/color-picker'

type Props = {
  labels: LabelDefinition[]
  selectedAnnotation?: AnnotationItem
  selectedLabelIds: string[]
  onLabelsChange: (labels: LabelDefinition[]) => void
  onSelectedLabelIdsChange: (ids: string[]) => void
  onAnnotationChange: (annotation: AnnotationItem) => void
}

const TEMPLATE_KEY = 'annotation-label-templates-v1'

function readTemplates(): LabelTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATE_KEY)
    return raw ? (JSON.parse(raw) as LabelTemplate[]) : []
  } catch {
    return []
  }
}

function writeTemplates(templates: LabelTemplate[]) {
  try {
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates))
  } catch {
    return
  }
}

export default function LabelPanel({
  labels,
  selectedAnnotation,
  selectedLabelIds,
  onLabelsChange,
  onSelectedLabelIdsChange,
  onAnnotationChange
}: Props) {
  const [keyword, setKeyword] = useState('')
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#1677ff')
  const [newParentId, setNewParentId] = useState<string | undefined>()
  const [templateName, setTemplateName] = useState('')
  const [templates, setTemplates] = useState<LabelTemplate[]>(readTemplates())
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>()

  const filteredLabels = useMemo(() => {
    if (!keyword) return labels
    return labels.filter((item) => item.name.toLowerCase().includes(keyword.toLowerCase()))
  }, [labels, keyword])

  const addLabel = () => {
    if (!newName.trim()) {
      message.warning('请输入标签名称')
      return
    }
    const next: LabelDefinition = {
      id: createId('label'),
      name: newName.trim(),
      color: newColor,
      parentId: newParentId
    }
    onLabelsChange([...labels, next])
    setNewName('')
    setNewParentId(undefined)
  }

  const removeLabels = () => {
    if (selectedLabelIds.length === 0) return
    onLabelsChange(labels.filter((item) => !selectedLabelIds.includes(item.id)))
    onSelectedLabelIdsChange([])
  }

  const saveTemplate = () => {
    if (!templateName.trim()) {
      message.warning('请输入模板名称')
      return
    }
    const nextTemplate: LabelTemplate = {
      id: createId('tpl'),
      name: templateName.trim(),
      labels
    }
    const next = [nextTemplate, ...templates]
    setTemplates(next)
    writeTemplates(next)
    setTemplateName('')
    message.success('模板已保存')
  }

  const loadTemplate = () => {
    const target = templates.find((tpl) => tpl.id === selectedTemplateId)
    if (!target) return
    onLabelsChange(target.labels)
    onSelectedLabelIdsChange([])
    message.success('模板已加载')
  }

  const deleteTemplate = () => {
    if (!selectedTemplateId) return
    const next = templates.filter((tpl) => tpl.id !== selectedTemplateId)
    setTemplates(next)
    writeTemplates(next)
    setSelectedTemplateId(undefined)
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Card size="small" title="标签管理">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input.Search placeholder="搜索标签" allowClear value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Space.Compact style={{ width: '100%' }}>
            <Input placeholder="新标签名称" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <ColorPicker value={newColor} onChange={(color: Color) => setNewColor(color.toHexString())} />
          </Space.Compact>
          <Select
            allowClear
            placeholder="可选上级标签"
            value={newParentId}
            options={labels.map((label) => ({ value: label.id, label: label.name }))}
            onChange={(value) => setNewParentId(value)}
          />
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={addLabel}>
              添加标签
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={removeLabels} disabled={selectedLabelIds.length === 0}>
              批量删除
            </Button>
          </Space>
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
                      checked={selectedLabelIds.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSelectedLabelIdsChange([...selectedLabelIds, item.id])
                        } else {
                          onSelectedLabelIdsChange(selectedLabelIds.filter((id) => id !== item.id))
                        }
                      }}
                    />
                    <Tag color={item.color}>{item.name}</Tag>
                    {item.parentId ? <Typography.Text type="secondary">子级</Typography.Text> : null}
                  </Space>
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
              value={selectedAnnotation.labelId}
              options={labels.map((label) => ({ value: label.id, label: label.name }))}
              onChange={(value) => onAnnotationChange({ ...selectedAnnotation, labelId: value })}
            />
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={1}
              step={0.01}
              value={selectedAnnotation.confidence}
              placeholder="置信度 0~1"
              onChange={(value) => onAnnotationChange({ ...selectedAnnotation, confidence: Number(value ?? 0) })}
            />
            <Input.TextArea
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
            placeholder="模板名称"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            addonAfter={<SaveOutlined onClick={saveTemplate} />}
          />
          <Select
            allowClear
            placeholder="选择模板"
            value={selectedTemplateId}
            options={templates.map((tpl) => ({ value: tpl.id, label: tpl.name }))}
            onChange={(value) => setSelectedTemplateId(value)}
          />
          <Space>
            <Button onClick={loadTemplate} disabled={!selectedTemplateId}>
              加载模板
            </Button>
            <Button danger onClick={deleteTemplate} disabled={!selectedTemplateId}>
              删除模板
            </Button>
          </Space>
        </Space>
      </Card>
    </Space>
  )
}
