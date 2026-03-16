import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Layout,
  List,
  Row,
  Space,
  Tag,
  Typography,
  Upload,
  UploadProps,
  message
} from 'antd'
import { HomeOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppHeader from '../../components/AppHeader'
import AnnotationToolbar from '../../components/annotation/AnnotationToolbar'
import LabelPanel from '../../components/annotation/LabelPanel'
import AnnotationCanvas from '../../components/annotation/AnnotationCanvas'
import { AnnotationItem, AnnotationStyle, AnnotationTool, ImageSize, LabelDefinition } from '../../types/annotation'

type HistoryState = {
  past: AnnotationItem[][]
  future: AnnotationItem[][]
}

const DRAFT_KEY = 'annotation-draft-v1'

const initialStyle: AnnotationStyle = {
  stroke: '#1677ff',
  fill: '#1677ff',
  strokeWidth: 2,
  opacity: 0.25
}

const defaultLabels: LabelDefinition[] = [
  { id: 'label_car', name: '车辆', color: '#1677ff' },
  { id: 'label_person', name: '行人', color: '#52c41a' },
  { id: 'label_sign', name: '交通标志', color: '#faad14' }
]

export default function AnnotationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const projectId = searchParams.get('projectId') || ''
  const taskId = searchParams.get('taskId') || ''
  const [imageSrc, setImageSrc] = useState<string>()
  const [imageSize, setImageSize] = useState<ImageSize>({ width: 1280, height: 720 })
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([])
  const [selectedId, setSelectedId] = useState<string>()
  const [tool, setTool] = useState<AnnotationTool>('select')
  const [style, setStyle] = useState<AnnotationStyle>(initialStyle)
  const [labels, setLabels] = useState<LabelDefinition[]>(defaultLabels)
  const [activeLabelId, setActiveLabelId] = useState<string>()
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] })
  const [lastSavedAt, setLastSavedAt] = useState<string>()

  const selectedAnnotation = useMemo(
    () => annotations.find((item) => item.id === selectedId),
    [annotations, selectedId]
  )

  const applyChange = (next: AnnotationItem[], options?: { history?: boolean }) => {
    const shouldRecord = options?.history ?? true
    setAnnotations(next)
    if (shouldRecord) {
      setHistory((prev) => ({
        past: [...prev.past, annotations.map((item) => ({ ...item }))],
        future: []
      }))
    }
  }

  const undo = () => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev
      const previous = prev.past[prev.past.length - 1]
      setAnnotations(previous)
      setSelectedId(undefined)
      return {
        past: prev.past.slice(0, -1),
        future: [annotations, ...prev.future]
      }
    })
  }

  const redo = () => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev
      const next = prev.future[0]
      setAnnotations(next)
      setSelectedId(undefined)
      return {
        past: [...prev.past, annotations],
        future: prev.future.slice(1)
      }
    })
  }

  const clearCanvas = () => {
    applyChange([], { history: true })
    setSelectedId(undefined)
  }

  const updateSelectedAnnotation = (next: AnnotationItem) => {
    const updated = annotations.map((item) => (item.id === next.id ? next : item))
    applyChange(updated, { history: true })
  }

  const bringForward = () => {
    if (!selectedId) return
    const sorted = [...annotations].sort((a, b) => a.zIndex - b.zIndex)
    const index = sorted.findIndex((item) => item.id === selectedId)
    if (index < 0 || index === sorted.length - 1) return
    const current = sorted[index]
    const next = sorted[index + 1]
    const swapped = sorted.map((item) => {
      if (item.id === current.id) return { ...item, zIndex: next.zIndex }
      if (item.id === next.id) return { ...item, zIndex: current.zIndex }
      return item
    })
    applyChange(swapped, { history: true })
  }

  const sendBackward = () => {
    if (!selectedId) return
    const sorted = [...annotations].sort((a, b) => a.zIndex - b.zIndex)
    const index = sorted.findIndex((item) => item.id === selectedId)
    if (index <= 0) return
    const current = sorted[index]
    const prev = sorted[index - 1]
    const swapped = sorted.map((item) => {
      if (item.id === current.id) return { ...item, zIndex: prev.zIndex }
      if (item.id === prev.id) return { ...item, zIndex: current.zIndex }
      return item
    })
    applyChange(swapped, { history: true })
  }

  const handleExport = () => {
    const payload = {
      version: '1.0',
      imageSrc: imageSrc?.startsWith('blob:') ? undefined : imageSrc,
      labels,
      annotations
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `annotations_${Date.now()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    importInputRef.current?.click()
  }

  const handleImportFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result))
        const importedAnnotations = Array.isArray(raw.annotations) ? (raw.annotations as AnnotationItem[]) : []
        const importedLabels = Array.isArray(raw.labels) ? (raw.labels as LabelDefinition[]) : defaultLabels
        setAnnotations(importedAnnotations)
        setLabels(importedLabels)
        if (typeof raw.imageSrc === 'string') {
          setImageSrc(raw.imageSrc)
          setImageUrlInput(raw.imageSrc)
        }
        setHistory({ past: [], future: [] })
        message.success('标注结果导入成功')
      } catch {
        message.error('导入失败，文件格式不正确')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const uploadProps: UploadProps = {
    accept: 'image/*',
    showUploadList: false,
    beforeUpload: (file) => {
      const objectUrl = URL.createObjectURL(file)
      setImageSrc(objectUrl)
      setImageUrlInput('')
      const img = new Image()
      img.onload = () => {
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.src = objectUrl
      return false
    }
  }

  const loadImageFromUrl = () => {
    if (!imageUrlInput.trim()) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImageSrc(imageUrlInput.trim())
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
      message.success('图像加载成功')
    }
    img.onerror = () => {
      message.error('图像地址加载失败')
    }
    img.src = imageUrlInput.trim()
  }

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    try {
      const draft = JSON.parse(raw) as {
        imageSrc?: string
        labels: LabelDefinition[]
        annotations: AnnotationItem[]
      }
      if (window.confirm('检测到未保存的标注草稿，是否恢复？')) {
        setLabels(draft.labels || defaultLabels)
        setAnnotations(draft.annotations || [])
        if (draft.imageSrc) {
          setImageSrc(draft.imageSrc)
          setImageUrlInput(draft.imageSrc)
        }
      }
    } catch {
      return
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const payload = {
        imageSrc: imageSrc?.startsWith('blob:') ? undefined : imageSrc,
        labels,
        annotations
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
      setLastSavedAt(new Date().toLocaleTimeString())
    }, 800)
    return () => window.clearTimeout(timer)
  }, [imageSrc, labels, annotations])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undo()
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo()
      }
      if (event.key === 'Delete' && selectedId) {
        applyChange(annotations.filter((item) => item.id !== selectedId), { history: true })
        setSelectedId(undefined)
      }
      const lower = event.key.toLowerCase()
      const mapper: Record<string, AnnotationTool> = {
        v: 'select',
        h: 'pan',
        r: 'rect',
        p: 'polygon',
        c: 'circle',
        l: 'line',
        o: 'point'
      }
      if (mapper[lower]) {
        setTool(mapper[lower])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [annotations, selectedId])

  const ordered = useMemo(() => [...annotations].sort((a, b) => b.zIndex - a.zIndex), [annotations])

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <AppHeader
        title="图像标注模块"
        actions={
          <Space>
            <Button type="text" icon={<HomeOutlined />} style={{ color: 'rgba(255,255,255,0.8)' }} onClick={() => navigate('/home')}>
              首页
            </Button>
            <Button type="text" icon={<PictureOutlined />} style={{ color: 'rgba(255,255,255,0.8)' }} onClick={() => navigate('/gallery')}>
              图库
            </Button>
          </Space>
        }
      />
      <Layout.Content style={{ padding: 16, maxWidth: 1800, margin: '0 auto', width: '100%' }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="支持快捷键：V选择 H平移 R矩形 P多边形 C圆形 L线条 O点标注 | Ctrl+Z/Ctrl+Y 撤销重做 | Delete 删除"
          />
          <Card size="small">
            <Space wrap>
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>上传图像</Button>
              </Upload>
              <Input
                style={{ width: 420 }}
                placeholder="输入图像地址（支持 JPG/PNG/WEBP/GIF 等）"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onPressEnter={loadImageFromUrl}
              />
              <Button onClick={loadImageFromUrl}>加载地址图像</Button>
              <Tag color="blue">自动保存：{lastSavedAt || '未保存'}</Tag>
              {projectId ? <Tag color="purple">项目ID：{projectId}</Tag> : null}
              {taskId ? <Tag color="geekblue">任务ID：{taskId}</Tag> : null}
            </Space>
          </Card>

          <AnnotationToolbar
            activeTool={tool}
            activeLabelId={activeLabelId}
            labels={labels}
            style={style}
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
            onToolChange={setTool}
            onLabelChange={setActiveLabelId}
            onStyleChange={setStyle}
            onUndo={undo}
            onRedo={redo}
            onClear={clearCanvas}
            onImport={handleImport}
            onExport={handleExport}
          />
          <input ref={importInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportFile} />

          <Row gutter={[12, 12]}>
            <Col xs={24} xl={17}>
              <AnnotationCanvas
                imageSrc={imageSrc}
                imageSize={imageSize}
                tool={tool}
                style={style}
                activeLabelId={activeLabelId}
                annotations={annotations}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onChange={applyChange}
              />
            </Col>
            <Col xs={24} xl={7}>
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <LabelPanel
                  labels={labels}
                  selectedAnnotation={selectedAnnotation}
                  selectedLabelIds={selectedLabelIds}
                  onLabelsChange={setLabels}
                  onSelectedLabelIdsChange={setSelectedLabelIds}
                  onAnnotationChange={updateSelectedAnnotation}
                />

                <Card size="small" title="图层管理">
                  {ordered.length > 0 ? (
                    <List
                      size="small"
                      dataSource={ordered}
                      renderItem={(item) => (
                        <List.Item
                          style={{
                            cursor: 'pointer',
                            background: selectedId === item.id ? '#e6f4ff' : undefined
                          }}
                          onClick={() => setSelectedId(item.id)}
                        >
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Space>
                              <Tag>{item.type}</Tag>
                              <Typography.Text ellipsis style={{ maxWidth: 160 }}>
                                {item.id}
                              </Typography.Text>
                            </Space>
                            {selectedId === item.id ? (
                              <Space>
                                <Button size="small" onClick={bringForward}>
                                  前移
                                </Button>
                                <Button size="small" onClick={sendBackward}>
                                  后移
                                </Button>
                              </Space>
                            ) : null}
                          </Space>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Typography.Text type="secondary">暂无图层对象</Typography.Text>
                  )}
                </Card>

                <Card size="small" title="实时预览与历史">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Typography.Text>对象总数：{annotations.length}</Typography.Text>
                    <Typography.Text>历史记录：{history.past.length}</Typography.Text>
                    <Typography.Text>可重做：{history.future.length}</Typography.Text>
                    <Typography.Text type="secondary" style={{ whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(
                        annotations.slice(0, 2).map((item) => ({ id: item.id, type: item.type, labelId: item.labelId })),
                        null,
                        2
                      )}
                    </Typography.Text>
                  </Space>
                </Card>
              </Space>
            </Col>
          </Row>
        </Space>
      </Layout.Content>
    </Layout>
  )
}
