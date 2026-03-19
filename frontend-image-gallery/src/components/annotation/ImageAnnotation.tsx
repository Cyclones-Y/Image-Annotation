import { Button, Card, Checkbox, Empty, Input, Layout, Select, Space, Tag, Typography, message } from 'antd'
import { ChangeEventHandler, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AnnotationCanvas from './AnnotationCanvas'
import AnnotationToolbar from './AnnotationToolbar'
import { submitAnnotationDraft } from '../../services/annotationApi'
import { fetchImagesPage, ImageListItem } from '../../services/imageApi'
import { fetchLabels, LabelDto } from '../../services/labelApi'
import { AnnotationItem, AnnotationStyle, AnnotationTool, LabelDefinition } from '../../types/annotation'

type Props = {
  projectId?: string
  taskItemId?: string
}

type WorkSnapshot = {
  currentIndex: number
  activeTool: AnnotationTool
  activeLabelId?: string
  selectedLabelIds: string[]
  annotationsByImage: Record<string, AnnotationItem[]>
  imageTimestamps: Record<string, { startedAt: string; updatedAt: string }>
  savedAt: string
}

const defaultStyle: AnnotationStyle = {
  stroke: '#1677ff',
  fill: '#1677ff33',
  strokeWidth: 2,
  opacity: 0.35
}

function toLabel(item: LabelDto): LabelDefinition {
  return {
    id: String(item.labelId),
    name: item.labelName,
    color: item.labelColor || '#1677ff',
    category: item.labelCategory,
    type: item.labelType,
    usageCount: item.usageCount
  }
}

function getStorageKey(projectId?: string, taskItemId?: string) {
  return `annotation-work-state-v3:${projectId || 'default'}:${taskItemId || 'default'}`
}

function nowText() {
  return new Date().toISOString()
}

export default function ImageAnnotation({ projectId, taskItemId }: Props) {
  const navigate = useNavigate()
  const [images, setImages] = useState<ImageListItem[]>([])
  const [labels, setLabels] = useState<LabelDefinition[]>([])
  const [keyword, setKeyword] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeTool, setActiveTool] = useState<AnnotationTool>('rect')
  const [activeLabelId, setActiveLabelId] = useState<string>()
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])
  const [style, setStyle] = useState<AnnotationStyle>(defaultStyle)
  const [annotationsByImage, setAnnotationsByImage] = useState<Record<string, AnnotationItem[]>>({})
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string>()
  const [historyByImage, setHistoryByImage] = useState<Record<string, AnnotationItem[][]>>({})
  const [futureByImage, setFutureByImage] = useState<Record<string, AnnotationItem[][]>>({})
  const [imageTimestamps, setImageTimestamps] = useState<Record<string, { startedAt: string; updatedAt: string }>>({})
  const [submitting, setSubmitting] = useState(false)
  const restoringRef = useRef(false)
  const saveDebounceRef = useRef<number | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  const currentImage = images[currentIndex]
  const currentImageId = String(currentImage?.imageId || '')
  const currentAnnotations = useMemo(
    () => (currentImageId ? annotationsByImage[currentImageId] || [] : []),
    [annotationsByImage, currentImageId]
  )
  const categoryOptions = useMemo(() => {
    const categories = Array.from(new Set(labels.map((item) => item.category || 'default')))
    return [{ value: 'all', label: '全部分类' }, ...categories.map((item) => ({ value: item, label: item }))]
  }, [labels])
  const filteredLabels = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    return labels.filter((item) => {
      const categoryMatched = activeCategory === 'all' || (item.category || 'default') === activeCategory
      const keywordMatched = normalized ? item.name.toLowerCase().includes(normalized) : true
      return categoryMatched && keywordMatched
    })
  }, [labels, keyword, activeCategory])
  const selectedAnnotation = useMemo(
    () => currentAnnotations.find((item) => item.id === selectedAnnotationId),
    [currentAnnotations, selectedAnnotationId]
  )

  const persistSnapshot = () => {
    if (restoringRef.current) return
    const snapshot: WorkSnapshot = {
      currentIndex,
      activeTool,
      activeLabelId,
      selectedLabelIds,
      annotationsByImage,
      imageTimestamps,
      savedAt: nowText()
    }
    localStorage.setItem(getStorageKey(projectId, taskItemId), JSON.stringify(snapshot))
  }

  const restoreSnapshot = () => {
    if (restoringRef.current || images.length === 0) return
    const raw = localStorage.getItem(getStorageKey(projectId, taskItemId))
    if (!raw) return
    try {
      const snapshot = JSON.parse(raw) as WorkSnapshot
      restoringRef.current = true
      setActiveTool(snapshot.activeTool || 'rect')
      setActiveLabelId(snapshot.activeLabelId)
      setSelectedLabelIds(snapshot.selectedLabelIds || [])
      setAnnotationsByImage(snapshot.annotationsByImage || {})
      setImageTimestamps(snapshot.imageTimestamps || {})
      const idx = Number(snapshot.currentIndex || 0)
      setCurrentIndex(idx >= 0 && idx < images.length ? idx : 0)
      message.success('已恢复上次标注进度')
    } catch {
      localStorage.removeItem(getStorageKey(projectId, taskItemId))
    } finally {
      setTimeout(() => {
        restoringRef.current = false
      }, 0)
    }
  }

  useEffect(() => {
    fetchImagesPage(1, 50)
      .then((res) => {
        if (res.rows.length > 0) {
          setImages(res.rows)
          return
        }
        setImages([{ imageId: 'mock-1', imageUrl: 'https://picsum.photos/1600/900?random=21' }])
      })
      .catch(() => {
        setImages([{ imageId: 'mock-1', imageUrl: 'https://picsum.photos/1600/900?random=22' }])
      })
  }, [])

  useEffect(() => {
    const pid = Number(projectId || 0)
    if (!pid) {
      setLabels([
        { id: '1', name: '正常', color: '#52c41a' },
        { id: '2', name: '轻微异常', color: '#faad14' },
        { id: '3', name: '严重异常', color: '#ff4d4f' }
      ])
      return
    }
    fetchLabels(pid)
      .then((rows) => setLabels(rows.map(toLabel)))
      .catch(() => {
        setLabels([
          { id: '1', name: '正常', color: '#52c41a' },
          { id: '2', name: '轻微异常', color: '#faad14' },
          { id: '3', name: '严重异常', color: '#ff4d4f' }
        ])
      })
  }, [projectId])

  useEffect(() => {
    restoreSnapshot()
  }, [images.length])

  useEffect(() => {
    if (!currentImageId) return
    setImageTimestamps((prev) => {
      if (prev[currentImageId]) return prev
      return {
        ...prev,
        [currentImageId]: { startedAt: nowText(), updatedAt: nowText() }
      }
    })
  }, [currentImageId])

  useEffect(() => {
    if (saveDebounceRef.current) {
      window.clearTimeout(saveDebounceRef.current)
    }
    saveDebounceRef.current = window.setTimeout(() => {
      persistSnapshot()
    }, 250)
    return () => {
      if (saveDebounceRef.current) window.clearTimeout(saveDebounceRef.current)
    }
  }, [currentIndex, activeTool, activeLabelId, selectedLabelIds, annotationsByImage, imageTimestamps])

  const updateCurrentAnnotations = (next: AnnotationItem[], pushHistory: boolean) => {
    if (!currentImageId) return
    const prev = currentAnnotations
    if (pushHistory) {
      setHistoryByImage((hist) => ({
        ...hist,
        [currentImageId]: [...(hist[currentImageId] || []), prev]
      }))
      setFutureByImage((fut) => ({ ...fut, [currentImageId]: [] }))
    }
    setAnnotationsByImage((map) => ({ ...map, [currentImageId]: next }))
    setImageTimestamps((map) => ({
      ...map,
      [currentImageId]: {
        startedAt: map[currentImageId]?.startedAt || nowText(),
        updatedAt: nowText()
      }
    }))
  }

  const handleCanvasChange = (next: AnnotationItem[], options?: { history?: boolean }) => {
    updateCurrentAnnotations(next, Boolean(options?.history))
  }

  const canUndo = (historyByImage[currentImageId] || []).length > 0
  const canRedo = (futureByImage[currentImageId] || []).length > 0

  const handleUndo = () => {
    if (!currentImageId) return
    const stack = historyByImage[currentImageId] || []
    if (stack.length === 0) return
    const previous = stack[stack.length - 1]
    setHistoryByImage((hist) => ({ ...hist, [currentImageId]: stack.slice(0, -1) }))
    setFutureByImage((fut) => ({ ...fut, [currentImageId]: [...(fut[currentImageId] || []), currentAnnotations] }))
    setAnnotationsByImage((map) => ({ ...map, [currentImageId]: previous }))
  }

  const handleRedo = () => {
    if (!currentImageId) return
    const stack = futureByImage[currentImageId] || []
    if (stack.length === 0) return
    const next = stack[stack.length - 1]
    setFutureByImage((fut) => ({ ...fut, [currentImageId]: stack.slice(0, -1) }))
    setHistoryByImage((hist) => ({ ...hist, [currentImageId]: [...(hist[currentImageId] || []), currentAnnotations] }))
    setAnnotationsByImage((map) => ({ ...map, [currentImageId]: next }))
  }

  const handleClear = () => {
    updateCurrentAnnotations([], true)
    setSelectedAnnotationId(undefined)
  }

  const handleImport = () => {
    importInputRef.current?.click()
  }

  const onImportFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    file.text()
      .then((raw) => {
        const data = JSON.parse(raw)
        if (!Array.isArray(data)) {
          message.error('导入文件格式错误')
          return
        }
        updateCurrentAnnotations(data as AnnotationItem[], true)
        message.success('标注导入成功')
      })
      .catch(() => message.error('导入失败'))
      .finally(() => {
        if (importInputRef.current) importInputRef.current.value = ''
      })
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(currentAnnotations, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `annotation-${currentImageId || 'current'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const buildResultJson = () => ({
    progress: {
      currentIndex,
      total: images.length,
      imageId: currentImageId
    },
    selectedLabelIds,
    activeLabelId,
    annotationsByImage,
    currentImageAnnotations: currentAnnotations,
    imageTimestamps,
    savedAt: nowText()
  })

  const submitCurrentAndNext = async () => {
    if (!currentImage) return
    if (selectedLabelIds.length === 0) {
      message.warning('请至少选择一个标签')
      return
    }
    if (currentAnnotations.length === 0) {
      message.warning('请先完成至少一个标注对象')
      return
    }
    setSubmitting(true)
    try {
      const taskId = Number(taskItemId || 0)
      if (taskId > 0) {
        await submitAnnotationDraft({
          taskItemId: taskId,
          resultJson: buildResultJson(),
          submit: true,
          schemaVersion: 1
        })
      }
      if (currentIndex < images.length - 1) {
        setCurrentIndex((prev) => prev + 1)
        setSelectedAnnotationId(undefined)
        message.success('提交成功，已进入下一张')
      } else {
        message.success('提交成功，已完成最后一张')
      }
    } catch (error: any) {
      message.error(error?.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const saveAndExit = async () => {
    setSubmitting(true)
    try {
      persistSnapshot()
      const taskId = Number(taskItemId || 0)
      if (taskId > 0) {
        await submitAnnotationDraft({
          taskItemId: taskId,
          resultJson: buildResultJson(),
          submit: false,
          schemaVersion: 1
        })
      }
      message.success('已保存进度')
      navigate('/home')
    } catch (error: any) {
      message.error(error?.message || '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const updateSelectedAnnotation = (next: AnnotationItem) => {
    updateCurrentAnnotations(currentAnnotations.map((item) => (item.id === next.id ? next : item)), true)
  }

  return (
    <Layout style={{ background: 'transparent' }}>
      <Layout.Content style={{ maxWidth: 1800, margin: '0 auto', width: '100%' }}>
        <input ref={importInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={onImportFileChange} />
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnnotationToolbar
            activeTool={activeTool}
            activeLabelId={activeLabelId}
            labels={labels}
            style={style}
            canUndo={canUndo}
            canRedo={canRedo}
            onToolChange={setActiveTool}
            onLabelChange={setActiveLabelId}
            onStyleChange={setStyle}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClear}
            onImport={handleImport}
            onExport={handleExport}
            disabled={submitting}
            actionButtons={
              <>
                <Button onClick={saveAndExit} disabled={submitting}>
                  保存并退出
                </Button>
                <Button type="primary" loading={submitting} onClick={submitCurrentAndNext}>
                  提交并下一张
                </Button>
              </>
            }
          />

          <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12, justifyContent: 'center' }}>
            <div style={{ flex: 1, minWidth: 920 }}>
              <AnnotationCanvas
                imageSrc={currentImage?.imageUrl}
                imageSize={{ width: Number(currentImage?.width || 1920), height: Number(currentImage?.height || 1080) }}
                tool={activeTool}
                style={style}
                activeLabelId={activeLabelId}
                annotations={currentAnnotations}
                selectedId={selectedAnnotationId}
                disabled={submitting}
                onSelect={setSelectedAnnotationId}
                onChange={handleCanvasChange}
              />
            </div>

            <Space direction="vertical" style={{ width: 360, flexShrink: 0 }}>
              <Card size="small" title="任务进度">
                {currentImage ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Typography.Text>
                      当前：{currentIndex + 1} / {images.length}
                    </Typography.Text>
                    <Typography.Text type="secondary">图像ID：{String(currentImage.imageId)}</Typography.Text>
                    <Typography.Text type="secondary">
                      开始时间：{imageTimestamps[currentImageId]?.startedAt || '-'}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      更新时间：{imageTimestamps[currentImageId]?.updatedAt || '-'}
                    </Typography.Text>
                  </Space>
                ) : (
                  <Empty description="暂无图像" />
                )}
              </Card>

              <Card size="small" title="多选标签">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Select
                    value={activeCategory}
                    options={categoryOptions}
                    onChange={setActiveCategory}
                    disabled={submitting}
                  />
                  <Input
                    placeholder="搜索标签"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    disabled={submitting}
                  />
                  <Checkbox.Group
                    value={selectedLabelIds}
                    onChange={(values) => {
                      const next = values.map(String)
                      setSelectedLabelIds(next)
                      if (next.length > 0 && (!activeLabelId || !next.includes(activeLabelId))) {
                        setActiveLabelId(next[next.length - 1])
                      }
                      if (next.length === 0) {
                        setActiveLabelId(undefined)
                      }
                    }}
                    style={{ width: '100%' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {filteredLabels.map((label) => (
                        <Checkbox key={label.id} value={label.id}>
                          <Tag color={label.color} style={{ marginInlineEnd: 8 }}>
                            {label.name}
                          </Tag>
                          <Typography.Text type="secondary">{label.category || 'default'}</Typography.Text>
                        </Checkbox>
                      ))}
                    </Space>
                  </Checkbox.Group>
                  <Space wrap>
                    {selectedLabelIds.map((id) => {
                      const target = labels.find((item) => item.id === id)
                      if (!target) return null
                      return (
                        <Tag
                          key={id}
                          color={target.color}
                          closable
                          onClose={(event) => {
                            event.preventDefault()
                            setSelectedLabelIds((prev) => prev.filter((item) => item !== id))
                            if (activeLabelId === id) setActiveLabelId(undefined)
                          }}
                          onClick={() => setActiveLabelId(id)}
                        >
                          {target.name}
                        </Tag>
                      )
                    })}
                  </Space>
                </Space>
              </Card>

              <Card size="small" title="对象属性">
                {selectedAnnotation ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Typography.Text type="secondary">对象ID：{selectedAnnotation.id}</Typography.Text>
                    <Checkbox
                      checked={Boolean(selectedAnnotation.labelId)}
                      onChange={(event) => {
                        if (!event.target.checked) {
                          updateSelectedAnnotation({ ...selectedAnnotation, labelId: undefined })
                          return
                        }
                        updateSelectedAnnotation({ ...selectedAnnotation, labelId: activeLabelId })
                      }}
                    >
                      绑定当前活动标签
                    </Checkbox>
                    <Button
                      onClick={() => {
                        if (!activeLabelId) {
                          message.warning('请先选择活动标签')
                          return
                        }
                        updateSelectedAnnotation({ ...selectedAnnotation, labelId: activeLabelId })
                      }}
                    >
                      使用活动标签
                    </Button>
                  </Space>
                ) : (
                  <Typography.Text type="secondary">请选择画布中的一个对象</Typography.Text>
                )}
              </Card>
            </Space>
          </div>
        </div>
      </Layout.Content>
    </Layout>
  )
}
