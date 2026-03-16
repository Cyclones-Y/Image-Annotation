import { Button, ColorPicker, Divider, InputNumber, Select, Slider, Space, Tooltip } from 'antd'
import { ReactNode } from 'react'
import {
  BorderOutlined,
  ClearOutlined,
  DragOutlined,
  ExportOutlined,
  ImportOutlined,
  LineOutlined,
  NodeIndexOutlined,
  RadiusSettingOutlined,
  RedoOutlined,
  RollbackOutlined,
  StopOutlined,
  UndoOutlined
} from '@ant-design/icons'
import type { Color } from 'antd/es/color-picker'
import { AnnotationStyle, AnnotationTool, LabelDefinition } from '../../types/annotation'

type Props = {
  activeTool: AnnotationTool
  activeLabelId?: string
  labels: LabelDefinition[]
  style: AnnotationStyle
  canUndo: boolean
  canRedo: boolean
  onToolChange: (tool: AnnotationTool) => void
  onLabelChange: (labelId?: string) => void
  onStyleChange: (style: AnnotationStyle) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onImport: () => void
  onExport: () => void
}

export default function AnnotationToolbar({
  activeTool,
  activeLabelId,
  labels,
  style,
  canUndo,
  canRedo,
  onToolChange,
  onLabelChange,
  onStyleChange,
  onUndo,
  onRedo,
  onClear,
  onImport,
  onExport
}: Props) {
  const tools: Array<{ key: AnnotationTool; icon: ReactNode; label: string; shortcut: string }> = [
    { key: 'select', icon: <DragOutlined />, label: '选择', shortcut: 'V' },
    { key: 'pan', icon: <BorderOutlined />, label: '平移', shortcut: 'H' },
    { key: 'rect', icon: <BorderOutlined />, label: '矩形', shortcut: 'R' },
    { key: 'polygon', icon: <NodeIndexOutlined />, label: '多边形', shortcut: 'P' },
    { key: 'circle', icon: <RadiusSettingOutlined />, label: '圆形', shortcut: 'C' },
    { key: 'line', icon: <LineOutlined />, label: '线条', shortcut: 'L' },
    { key: 'point', icon: <StopOutlined />, label: '点', shortcut: 'O' }
  ]

  return (
    <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
      <Space wrap>
        {tools.map((tool) => (
          <Tooltip key={tool.key} title={`${tool.label} (${tool.shortcut})`}>
            <Button
              type={activeTool === tool.key ? 'primary' : 'default'}
              icon={tool.icon}
              onClick={() => onToolChange(tool.key)}
            >
              {tool.label}
            </Button>
          </Tooltip>
        ))}
      </Space>

      <Divider type="vertical" style={{ height: 32 }} />

      <Space wrap>
        <Select
          style={{ width: 220 }}
          placeholder="选择标签"
          allowClear
          value={activeLabelId}
          options={labels.map((label) => ({
            value: label.id,
            label: `${label.parentId ? '└ ' : ''}${label.name}`
          }))}
          onChange={(value) => onLabelChange(value)}
        />
        <ColorPicker
          value={style.stroke}
          onChange={(color: Color) => onStyleChange({ ...style, stroke: color.toHexString() })}
          showText
        />
        <ColorPicker
          value={style.fill}
          onChange={(color: Color) => onStyleChange({ ...style, fill: color.toHexString() })}
          showText
        />
        <InputNumber
          min={1}
          max={12}
          value={style.strokeWidth}
          onChange={(value) => onStyleChange({ ...style, strokeWidth: Number(value || 1) })}
          addonBefore="线宽"
        />
        <Space style={{ width: 180 }}>
          <span>透明度</span>
          <Slider
            min={0.1}
            max={1}
            step={0.05}
            value={style.opacity}
            onChange={(value) => onStyleChange({ ...style, opacity: Number(value) })}
          />
        </Space>
      </Space>

      <Divider type="vertical" style={{ height: 32 }} />

      <Space wrap>
        <Tooltip title="撤销 (Ctrl+Z)">
          <Button icon={<UndoOutlined />} disabled={!canUndo} onClick={onUndo}>
            撤销
          </Button>
        </Tooltip>
        <Tooltip title="重做 (Ctrl+Y)">
          <Button icon={<RedoOutlined />} disabled={!canRedo} onClick={onRedo}>
            重做
          </Button>
        </Tooltip>
        <Button danger icon={<ClearOutlined />} onClick={onClear}>
          清空
        </Button>
        <Button icon={<ImportOutlined />} onClick={onImport}>
          导入
        </Button>
        <Button icon={<ExportOutlined />} onClick={onExport}>
          导出
        </Button>
      </Space>
    </Space>
  )
}
