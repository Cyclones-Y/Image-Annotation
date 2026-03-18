import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Layout,
  List,
  Row,
  Spin,
  Space,
  Tag,
  Typography,
  Upload,
  UploadProps,
  message
} from 'antd'
import { HomeOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AppHeader from '../../components/AppHeader'
import PageNavigation from '../../components/PageNavigation'
import AnnotationToolbar from '../../components/annotation/AnnotationToolbar'
import LabelPanel from '../../components/annotation/LabelPanel'
import AnnotationCanvas from '../../components/annotation/AnnotationCanvas'
import SaveExitActions from '../../components/annotation/SaveExitActions'
import { AnnotationItem, AnnotationStyle, AnnotationTool, ImageSize, LabelDefinition } from '../../types/annotation'
import { useNavigationGuardState } from '../../state/navigationGuard'
import { DraftSnapshot, persistAnnotationDraft } from '../../utils/annotationPersistence'
import { submitAnnotationDraft } from '../../services/annotationApi'

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

const emptyDraftSnapshot: DraftSnapshot = {
  imageSrc: undefined,
  labels: defaultLabels,
  annotations: []
}

export default function AnnotationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setUnsavedState, clearUnsavedState } = useNavigationGuardState()
  const [searchParams] = useSearchParams()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const projectId = searchParams.get('projectId') || ''
  const taskId = searchParams.get('taskId') || ''
  const taskItemId = searchParams.get('taskItemId') || ''
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
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const savedSnapshotRef = useRef<DraftSnapshot>(emptyDraftSnapshot)

  const selectedAnnotation = useMemo(
    () => annotations.find((item) => item.id === selectedId),
    [annotations, selectedId]
  )

  const buildSnapshot = useCallback(
    (targetImageSrc: string | undefined, targetLabels: LabelDefinition[], targetAnnotations: AnnotationItem[]): DraftSnapshot => ({
      imageSrc: targetImageSrc?.startsWith('blob:') ? undefined : targetImageSrc,
      labels: targetLabels,
      annotations: targetAnnotations
    }),
    []
  )

  const computeDirtyDetails = useCallback((saved: DraftSnapshot, current: DraftSnapshot) => {
    const details: string[] = []
    if ((saved.imageSrc || '') !== (current.imageSrc || '')) {
      details.push('图像来源有变更')
    }
    if (JSON.stringify(saved.labels) !== JSON.stringify(current.labels)) {
      details.push('标签配置有变更')
    }
    if (JSON.stringify(saved.annotations) !== JSON.stringify(current.annotations)) {
      details.push(`标注对象有变更（当前 ${current.annotations.length} 个）`)
    }
    return details
  }, [])

  const saveDraftNow = useCallback(async () => {
    const snapshot = buildSnapshot(imageSrc, labels, annotations)
    persistAnnotationDraft(DRAFT_KEY, snapshot)
    savedSnapshotRef.current = snapshot
    setLastSavedAt(new Date().toLocaleTimeString())
    setHasUnsavedChanges(false)
    setUnsavedState({
      isDirty: false,
      details: []
    })
  }, [annotations, buildSnapshot, imageSrc, labels])

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true)
      await new Promise((resolve) => window.setTimeout(resolve, 220))
      const payload = buildSnapshot(imageSrc, labels, annotations)
      if (taskItemId && !Number.isNaN(Number(taskItemId))) {
        await submitAnnotationDraft({
          taskItemId: Number(taskItemId),
          resultJson: payload,
          submit: false,
          schemaVersion: 1
        })
      }
      await saveDraftNow()
      if (taskItemId && !Number.isNaN(Number(taskItemId))) {
        message.success('已保存并同步后端')
      } else {
        message.success('已保存（本地草稿）')
      }
    } catch {
      message.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }, [annotations, buildSnapshot, imageSrc, labels, saveDraftNow, taskItemId])

  const handleExitConfirm = useCallback(() => {
    const from = typeof (location.state as any)?.from === 'string' ? (location.state as any).from : ''
    const current = `${location.pathname}${location.search}`
    const fallbackTarget = projectId ? '/projects' : '/home'
    const target = from && from !== current ? from : fallbackTarget
    navigate(target, { replace: true, state: { _exitAt: Date.now() } })
    window.setTimeout(() => {
      const stillRenderAnnotator = Boolean(document.querySelector('[data-testid="annotation-exit-btn"]'))
      if (stillRenderAnnotator) {
        window.location.replace(target)
      }
    }, 120)
  }, [location.pathname, location.search, location.state, navigate, projectId])

  const hasMeaningfulDraft = useCallback((draft: DraftSnapshot) => {
    const hasImage = Boolean((draft.imageSrc || '').trim())
    const hasAnnotations = Array.isArray(draft.annotations) && draft.annotations.length > 0
    const labelsChanged = JSON.stringify(draft.labels || defaultLabels) !== JSON.stringify(defaultLabels)
    return hasImage || hasAnnotations || labelsChanged
  }, [])

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
      if (isSaving) return false
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
      const draft = JSON.parse(raw) as DraftSnapshot
      const normalizedDraft = {
        imageSrc: draft.imageSrc,
        labels: draft.labels || defaultLabels,
        annotations: draft.annotations || []
      }
      if (!hasMeaningfulDraft(normalizedDraft)) {
        localStorage.removeItem(DRAFT_KEY)
        savedSnapshotRef.current = emptyDraftSnapshot
        return
      }
      if (window.confirm('检测到未保存的标注草稿，是否恢复？')) {
        savedSnapshotRef.current = normalizedDraft
        setLabels(normalizedDraft.labels || defaultLabels)
        setAnnotations(normalizedDraft.annotations || [])
        if (normalizedDraft.imageSrc) {
          setImageSrc(normalizedDraft.imageSrc)
          setImageUrlInput(normalizedDraft.imageSrc)
        }
      } else {
        localStorage.removeItem(DRAFT_KEY)
        savedSnapshotRef.current = emptyDraftSnapshot
      }
    } catch {
      return
    }
  }, [hasMeaningfulDraft])

  useEffect(() => {
    const currentSnapshot = buildSnapshot(imageSrc, labels, annotations)
    const details = computeDirtyDetails(savedSnapshotRef.current, currentSnapshot)
    setHasUnsavedChanges(details.length > 0)
    setUnsavedState({
      isDirty: details.length > 0,
      details,
      saveNow: saveDraftNow
    })
  }, [annotations, buildSnapshot, computeDirtyDetails, imageSrc, labels, saveDraftNow, setUnsavedState])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const currentSnapshot = buildSnapshot(imageSrc, labels, annotations)
      if (!hasMeaningfulDraft(currentSnapshot)) {
        localStorage.removeItem(DRAFT_KEY)
        savedSnapshotRef.current = emptyDraftSnapshot
        return
      }
      const hasChanges = computeDirtyDetails(savedSnapshotRef.current, currentSnapshot).length > 0
      if (!hasChanges) {
        return
      }
      persistAnnotationDraft(DRAFT_KEY, currentSnapshot)
      savedSnapshotRef.current = currentSnapshot
      setLastSavedAt(new Date().toLocaleTimeString())
    }, 800)
    return () => window.clearTimeout(timer)
  }, [annotations, buildSnapshot, computeDirtyDetails, hasMeaningfulDraft, imageSrc, labels])

  useEffect(() => {
    return () => {
      clearUnsavedState()
    }
  }, [clearUnsavedState])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isSaving) return
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
  }, [annotations, isSaving, selectedId])

  const ordered = useMemo(() => [...annotations].sort((a, b) => b.zIndex - a.zIndex), [annotations])

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <AppHeader
        title="图像标注模块"
        actions={
          <Space>
            <Button
              type="text"
              disabled={isSaving}
              icon={<HomeOutlined />}
              style={{ color: 'rgba(255,255,255,0.8)' }}
              onClick={() => navigate('/home')}
            >
              首页
            </Button>
            <Button
              type="text"
              disabled={isSaving}
              icon={<PictureOutlined />}
              style={{ color: 'rgba(255,255,255,0.8)' }}
              onClick={() => navigate('/gallery')}
            >
              图库
            </Button>
          </Space>
        }
      />
      <Layout.Content style={{ padding: 16, maxWidth: 1800, margin: '0 auto', width: '100%' }}>
        <Spin spinning={isSaving} tip="保存中，请稍候...">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <PageNavigation
            currentLabel="标注工作台"
            menuLabel="工作台"
            subMenuLabel="图像标注"
            fallbackPath={projectId ? '/projects' : '/home'}
            showBackButton={false}
          />
          <Alert
            type="info"
            showIcon
            message="支持快捷键：V选择 H平移 R矩形 P多边形 C圆形 L线条 O点标注 | Ctrl+Z/Ctrl+Y 撤销重做 | Delete 删除"
          />
          <Card size="small">
            <Space wrap>
              <Upload {...uploadProps}>
                <Button disabled={isSaving} icon={<UploadOutlined />}>上传图像</Button>
              </Upload>
              <Input
                disabled={isSaving}
                style={{ width: 420 }}
                placeholder="输入图像地址（支持 JPG/PNG/WEBP/GIF 等）"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onPressEnter={loadImageFromUrl}
              />
              <Button disabled={isSaving} onClick={loadImageFromUrl}>加载地址图像</Button>
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
            disabled={isSaving}
            onToolChange={setTool}
            onLabelChange={setActiveLabelId}
            onStyleChange={setStyle}
            onUndo={undo}
            onRedo={redo}
            onClear={clearCanvas}
            onImport={handleImport}
            onExport={handleExport}
            actionButtons={
              <SaveExitActions
                saving={isSaving}
                disabled={isSaving}
                hasUnsavedChanges={hasUnsavedChanges}
                onSave={handleSave}
                onExitConfirm={handleExitConfirm}
              />
            }
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
                disabled={isSaving}
                onChange={applyChange}
              />
            </Col>
            <Col xs={24} xl={7}>
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <LabelPanel
                  labels={labels}
                  selectedAnnotation={selectedAnnotation}
                  selectedLabelIds={selectedLabelIds}
                  disabled={isSaving}
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
        </Spin>
      </Layout.Content>
    </Layout>
  )
}
