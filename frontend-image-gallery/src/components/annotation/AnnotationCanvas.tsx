import { Button, Card, Empty, Slider, Space, Typography } from 'antd'
import { DeleteOutlined, RotateLeftOutlined, RotateRightOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons'
import { PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  AnnotationItem,
  AnnotationStyle,
  AnnotationTool,
  CircleAnnotation,
  ImageSize,
  LineAnnotation,
  Point,
  PolygonAnnotation,
  RectAnnotation,
  ViewportState
} from '../../types/annotation'
import { clamp, createId, distance, imageToScreen, normalizeRect, screenToImage } from '../../utils/annotationMath'

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'start' | 'end' | 'radius'

type Props = {
  imageSrc?: string
  imageSize: ImageSize
  tool: AnnotationTool
  style: AnnotationStyle
  activeLabelId?: string
  annotations: AnnotationItem[]
  selectedId?: string
  disabled?: boolean
  onSelect: (id?: string) => void
  onChange: (next: AnnotationItem[], options?: { history?: boolean }) => void
}

type DraftShape =
  | { type: 'rect'; start: Point; current: Point }
  | { type: 'circle'; start: Point; current: Point }
  | { type: 'line'; start: Point; current: Point }

function moveAnnotation(item: AnnotationItem, delta: Point): AnnotationItem {
  switch (item.type) {
    case 'rect':
      return { ...item, x: item.x + delta.x, y: item.y + delta.y }
    case 'circle':
      return { ...item, cx: item.cx + delta.x, cy: item.cy + delta.y }
    case 'line':
      return { ...item, x1: item.x1 + delta.x, y1: item.y1 + delta.y, x2: item.x2 + delta.x, y2: item.y2 + delta.y }
    case 'point':
      return { ...item, x: item.x + delta.x, y: item.y + delta.y }
    case 'polygon':
      return { ...item, points: item.points.map((pt) => ({ x: pt.x + delta.x, y: pt.y + delta.y })) }
    default:
      return item
  }
}

function resizeAnnotation(item: AnnotationItem, handle: ResizeHandle, point: Point): AnnotationItem {
  if (item.type === 'rect') {
    const x2 = item.x + item.width
    const y2 = item.y + item.height
    const left = handle.includes('w') ? point.x : item.x
    const right = handle.includes('e') ? point.x : x2
    const top = handle.includes('n') ? point.y : item.y
    const bottom = handle.includes('s') ? point.y : y2
    const rect = normalizeRect({ x: left, y: top }, { x: right, y: bottom })
    return { ...item, ...rect }
  }

  if (item.type === 'line') {
    if (handle === 'start') {
      return { ...item, x1: point.x, y1: point.y }
    }
    if (handle === 'end') {
      return { ...item, x2: point.x, y2: point.y }
    }
  }

  if (item.type === 'circle' && handle === 'radius') {
    return { ...item, radius: Math.max(1, distance({ x: item.cx, y: item.cy }, point)) }
  }

  return item
}

export default function AnnotationCanvas({
  imageSrc,
  imageSize,
  tool,
  style,
  activeLabelId,
  annotations,
  selectedId,
  disabled = false,
  onSelect,
  onChange
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [viewport, setViewport] = useState<ViewportState>({ scale: 1, offsetX: 0, offsetY: 0, rotation: 0 })
  const [draft, setDraft] = useState<DraftShape | null>(null)
  const [polygonDraft, setPolygonDraft] = useState<Point[]>([])
  const [cursorPoint, setCursorPoint] = useState<Point | null>(null)
  const [moveState, setMoveState] = useState<{ id: string; start: Point; origin: AnnotationItem } | null>(null)
  const [resizeState, setResizeState] = useState<{ id: string; handle: ResizeHandle; origin: AnnotationItem } | null>(null)
  const [panState, setPanState] = useState<{ startX: number; startY: number; offsetX: number; offsetY: number } | null>(null)
  const autoFittedImageRef = useRef<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (!rect) return
      setCanvasSize({ width: rect.width, height: rect.height })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!imageSrc) return
    if (!imageSize.width || !imageSize.height) return
    if (!canvasSize.width || !canvasSize.height) return
    const key = `${imageSrc}-${imageSize.width}x${imageSize.height}-${canvasSize.width}x${canvasSize.height}`
    if (autoFittedImageRef.current === key) return
    const scale = Math.max(canvasSize.width / imageSize.width, canvasSize.height / imageSize.height)
    const nextScale = clamp(scale, 0.2, 8)
    const renderedWidth = imageSize.width * nextScale
    const renderedHeight = imageSize.height * nextScale
    const cx = imageSize.width / 2
    const cy = imageSize.height / 2
    const left = (canvasSize.width - renderedWidth) / 2
    const top = (canvasSize.height - renderedHeight) / 2
    setViewport({
      scale: nextScale,
      offsetX: left - cx * (1 - nextScale),
      offsetY: top - cy * (1 - nextScale),
      rotation: 0
    })
    autoFittedImageRef.current = key
  }, [imageSrc, imageSize.width, imageSize.height, canvasSize.width, canvasSize.height])

  const orderedAnnotations = useMemo(
    () => [...annotations].sort((a, b) => a.zIndex - b.zIndex),
    [annotations]
  )

  const getImagePointFromEvent = (event: ReactPointerEvent<SVGSVGElement | SVGElement>) => {
    const target = event.currentTarget.closest('svg')
    if (!target) return { x: 0, y: 0 }
    const rect = target.getBoundingClientRect()
    const screen = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    return screenToImage(screen, viewport, imageSize)
  }

  const getScreenPointFromEvent = (event: ReactPointerEvent<SVGSVGElement | SVGElement>) => {
    const target = event.currentTarget.closest('svg')
    if (!target) return { x: 0, y: 0 }
    const rect = target.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const appendAnnotation = (item: AnnotationItem) => {
    const next = [...annotations, item]
    onChange(next, { history: true })
    onSelect(item.id)
  }

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    if (disabled) return
    event.preventDefault()
    const screenPoint = getScreenPointFromEvent(event as unknown as ReactPointerEvent<SVGSVGElement>)
    const imagePoint = screenToImage(screenPoint, viewport, imageSize)
    const nextScale = clamp(viewport.scale + (event.deltaY > 0 ? -0.1 : 0.1), 0.2, 8)
    const nextViewport = { ...viewport, scale: nextScale }
    const projected = imageToScreen(imagePoint, nextViewport, imageSize)
    nextViewport.offsetX = nextViewport.offsetX - (projected.x - screenPoint.x)
    nextViewport.offsetY = nextViewport.offsetY - (projected.y - screenPoint.y)
    setViewport(nextViewport)
  }

  const finishPolygon = () => {
    if (polygonDraft.length < 3) return
    const polygon: PolygonAnnotation = {
      id: createId('polygon'),
      type: 'polygon',
      points: polygonDraft,
      style,
      labelId: activeLabelId,
      zIndex: annotations.length + 1
    }
    appendAnnotation(polygon)
    setPolygonDraft([])
  }

  const handleCanvasPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (disabled) return
    const imagePoint = getImagePointFromEvent(event)
    if (tool === 'pan') {
      const screenPoint = getScreenPointFromEvent(event)
      setPanState({
        startX: screenPoint.x,
        startY: screenPoint.y,
        offsetX: viewport.offsetX,
        offsetY: viewport.offsetY
      })
      return
    }

    if (tool === 'polygon') {
      setPolygonDraft((prev) => [...prev, imagePoint])
      return
    }

    if (tool === 'point') {
      appendAnnotation({
        id: createId('point'),
        type: 'point',
        x: imagePoint.x,
        y: imagePoint.y,
        style,
        labelId: activeLabelId,
        zIndex: annotations.length + 1
      })
      return
    }

    if (tool === 'rect' || tool === 'line' || tool === 'circle') {
      setDraft({ type: tool, start: imagePoint, current: imagePoint })
      onSelect(undefined)
      return
    }

    if (tool === 'select') {
      onSelect(undefined)
    }
  }

  const handleCanvasPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (disabled) return
    const imagePoint = getImagePointFromEvent(event)
    setCursorPoint(imagePoint)

    if (panState) {
      const screen = getScreenPointFromEvent(event)
      setViewport((prev) => ({
        ...prev,
        offsetX: panState.offsetX + (screen.x - panState.startX),
        offsetY: panState.offsetY + (screen.y - panState.startY)
      }))
      return
    }

    if (draft) {
      setDraft({ ...draft, current: imagePoint })
      return
    }

    if (moveState) {
      const delta = { x: imagePoint.x - moveState.start.x, y: imagePoint.y - moveState.start.y }
      const next = annotations.map((item) => (item.id === moveState.id ? moveAnnotation(moveState.origin, delta) : item))
      onChange(next, { history: false })
      return
    }

    if (resizeState) {
      const next = annotations.map((item) => (item.id === resizeState.id ? resizeAnnotation(resizeState.origin, resizeState.handle, imagePoint) : item))
      onChange(next, { history: false })
    }
  }

  const handleCanvasPointerUp = () => {
    if (disabled) return
    if (draft) {
      if (draft.type === 'rect') {
        const rect = normalizeRect(draft.start, draft.current)
        if (rect.width > 1 && rect.height > 1) {
          appendAnnotation({
            id: createId('rect'),
            type: 'rect',
            ...rect,
            style,
            labelId: activeLabelId,
            zIndex: annotations.length + 1
          })
        }
      }

      if (draft.type === 'line') {
        appendAnnotation({
          id: createId('line'),
          type: 'line',
          x1: draft.start.x,
          y1: draft.start.y,
          x2: draft.current.x,
          y2: draft.current.y,
          style,
          labelId: activeLabelId,
          zIndex: annotations.length + 1
        })
      }

      if (draft.type === 'circle') {
        const radius = distance(draft.start, draft.current)
        if (radius > 1) {
          appendAnnotation({
            id: createId('circle'),
            type: 'circle',
            cx: draft.start.x,
            cy: draft.start.y,
            radius,
            style,
            labelId: activeLabelId,
            zIndex: annotations.length + 1
          })
        }
      }
    }

    if (moveState || resizeState) {
      onChange([...annotations], { history: true })
    }

    setDraft(null)
    setMoveState(null)
    setResizeState(null)
    setPanState(null)
  }

  const handleShapePointerDown = (event: ReactPointerEvent<SVGElement>, item: AnnotationItem) => {
    if (disabled) return
    event.stopPropagation()
    if (tool !== 'select') return
    const imagePoint = getImagePointFromEvent(event)
    setMoveState({ id: item.id, start: imagePoint, origin: item })
    onSelect(item.id)
  }

  const handleResizePointerDown = (
    event: ReactPointerEvent<SVGCircleElement>,
    item: AnnotationItem,
    handle: ResizeHandle
  ) => {
    if (disabled) return
    event.stopPropagation()
    if (tool !== 'select') return
    setResizeState({ id: item.id, handle, origin: item })
    onSelect(item.id)
  }

  const removeSelected = () => {
    if (!selectedId) return
    onChange(annotations.filter((item) => item.id !== selectedId), { history: true })
    onSelect(undefined)
  }

  const renderHandles = (item: AnnotationItem) => {
    if (selectedId !== item.id || tool !== 'select') return null

    if (item.type === 'rect') {
      const handles: Array<{ key: ResizeHandle; x: number; y: number }> = [
        { key: 'nw', x: item.x, y: item.y },
        { key: 'ne', x: item.x + item.width, y: item.y },
        { key: 'sw', x: item.x, y: item.y + item.height },
        { key: 'se', x: item.x + item.width, y: item.y + item.height }
      ]
      return handles.map((handle) => {
        const pos = imageToScreen({ x: handle.x, y: handle.y }, viewport, imageSize)
        return (
          <circle
            key={`${item.id}-${handle.key}`}
            cx={pos.x}
            cy={pos.y}
            r={5}
            fill="#ffffff"
            stroke="#1677ff"
            strokeWidth={2}
            onPointerDown={(event) => handleResizePointerDown(event, item, handle.key)}
          />
        )
      })
    }

    if (item.type === 'line') {
      const starts = [
        { key: 'start' as ResizeHandle, x: item.x1, y: item.y1 },
        { key: 'end' as ResizeHandle, x: item.x2, y: item.y2 }
      ]
      return starts.map((handle) => {
        const pos = imageToScreen({ x: handle.x, y: handle.y }, viewport, imageSize)
        return (
          <circle
            key={`${item.id}-${handle.key}`}
            cx={pos.x}
            cy={pos.y}
            r={5}
            fill="#ffffff"
            stroke="#1677ff"
            strokeWidth={2}
            onPointerDown={(event) => handleResizePointerDown(event, item, handle.key)}
          />
        )
      })
    }

    if (item.type === 'circle') {
      const p = imageToScreen({ x: item.cx + item.radius, y: item.cy }, viewport, imageSize)
      return (
        <circle
          cx={p.x}
          cy={p.y}
          r={5}
          fill="#ffffff"
          stroke="#1677ff"
          strokeWidth={2}
          onPointerDown={(event) => handleResizePointerDown(event, item, 'radius')}
        />
      )
    }

    return null
  }

  const renderShape = (item: AnnotationItem) => {
    const common = {
      stroke: item.style.stroke,
      strokeWidth: item.style.strokeWidth,
      fill: item.style.fill,
      fillOpacity: item.style.opacity,
      onPointerDown: (event: ReactPointerEvent<SVGElement>) => handleShapePointerDown(event, item)
    }

    if (item.type === 'rect') {
      const p1 = imageToScreen({ x: item.x, y: item.y }, viewport, imageSize)
      const p2 = imageToScreen({ x: item.x + item.width, y: item.y + item.height }, viewport, imageSize)
      const rect = normalizeRect(p1, p2)
      return <rect {...common} x={rect.x} y={rect.y} width={rect.width} height={rect.height} />
    }

    if (item.type === 'circle') {
      const center = imageToScreen({ x: item.cx, y: item.cy }, viewport, imageSize)
      const edge = imageToScreen({ x: item.cx + item.radius, y: item.cy }, viewport, imageSize)
      return <circle {...common} cx={center.x} cy={center.y} r={distance(center, edge)} />
    }

    if (item.type === 'line') {
      const s = imageToScreen({ x: item.x1, y: item.y1 }, viewport, imageSize)
      const e = imageToScreen({ x: item.x2, y: item.y2 }, viewport, imageSize)
      return <line {...common} x1={s.x} y1={s.y} x2={e.x} y2={e.y} />
    }

    if (item.type === 'point') {
      const p = imageToScreen({ x: item.x, y: item.y }, viewport, imageSize)
      return <circle {...common} cx={p.x} cy={p.y} r={5} fill={item.style.stroke} />
    }

    if (item.type === 'polygon') {
      const points = item.points
        .map((pt) => imageToScreen(pt, viewport, imageSize))
        .map((pt) => `${pt.x},${pt.y}`)
        .join(' ')
      return <polygon {...common} points={points} />
    }

    return null
  }

  const draftElement = useMemo(() => {
    if (!draft) return null
    if (draft.type === 'rect') {
      const p1 = imageToScreen(draft.start, viewport, imageSize)
      const p2 = imageToScreen(draft.current, viewport, imageSize)
      const rect = normalizeRect(p1, p2)
      return <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} stroke="#1677ff" fill="#1677ff22" strokeWidth={2} />
    }
    if (draft.type === 'line') {
      const s = imageToScreen(draft.start, viewport, imageSize)
      const e = imageToScreen(draft.current, viewport, imageSize)
      return <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#1677ff" strokeWidth={2} />
    }
    if (draft.type === 'circle') {
      const c = imageToScreen(draft.start, viewport, imageSize)
      const e = imageToScreen(draft.current, viewport, imageSize)
      return <circle cx={c.x} cy={c.y} r={distance(c, e)} stroke="#1677ff" fill="#1677ff22" strokeWidth={2} />
    }
    return null
  }, [draft, viewport, imageSize])

  const polygonDraftElement = useMemo(() => {
    if (polygonDraft.length === 0) return null
    const points = [...polygonDraft]
    if (cursorPoint) {
      points.push(cursorPoint)
    }
    const screenPoints = points
      .map((pt) => imageToScreen(pt, viewport, imageSize))
      .map((pt) => `${pt.x},${pt.y}`)
      .join(' ')
    return <polyline points={screenPoints} fill="none" stroke="#1677ff" strokeWidth={2} strokeDasharray="4 4" />
  }, [polygonDraft, cursorPoint, viewport, imageSize])

  const imageRectTopLeft = imageToScreen({ x: 0, y: 0 }, viewport, imageSize)
  const imageRectBottomRight = imageToScreen({ x: imageSize.width, y: imageSize.height }, viewport, imageSize)
  const imageRect = normalizeRect(imageRectTopLeft, imageRectBottomRight)

  return (
    <Card
      size="small"
      title="图像画布"
      extra={
        <Space>
          <Button disabled={disabled} icon={<ZoomOutOutlined />} onClick={() => setViewport((prev) => ({ ...prev, scale: clamp(prev.scale - 0.1, 0.2, 8) }))} />
          <Button disabled={disabled} icon={<ZoomInOutlined />} onClick={() => setViewport((prev) => ({ ...prev, scale: clamp(prev.scale + 0.1, 0.2, 8) }))} />
          <Button disabled={disabled} icon={<RotateLeftOutlined />} onClick={() => setViewport((prev) => ({ ...prev, rotation: prev.rotation - 5 }))} />
          <Button disabled={disabled} icon={<RotateRightOutlined />} onClick={() => setViewport((prev) => ({ ...prev, rotation: prev.rotation + 5 }))} />
          <Button danger icon={<DeleteOutlined />} disabled={!selectedId || disabled} onClick={removeSelected}>
            删除对象
          </Button>
        </Space>
      }
      styles={{ body: { padding: 8 } }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Typography.Text type="secondary">
            缩放：{Math.round(viewport.scale * 100)}% | 旋转：{viewport.rotation}°
          </Typography.Text>
          <div style={{ width: 200 }}>
            <Slider disabled={disabled} min={0.2} max={4} step={0.1} value={viewport.scale} onChange={(value) => setViewport((prev) => ({ ...prev, scale: Number(value) }))} />
          </div>
        </Space>
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: 'calc(100vh - 250px)',
            minHeight: 620,
            maxHeight: 980,
            background: '#111827',
            borderRadius: 8,
            overflow: 'hidden',
            touchAction: 'none',
            position: 'relative'
          }}
        >
          {imageSrc ? (
            <svg
              width={canvasSize.width}
              height={canvasSize.height}
              onWheel={handleWheel}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onDoubleClick={() => {
                if (tool === 'polygon') finishPolygon()
              }}
              style={{ userSelect: 'none', cursor: disabled ? 'not-allowed' : undefined }}
            >
              <image href={imageSrc} x={imageRect.x} y={imageRect.y} width={imageRect.width} height={imageRect.height} preserveAspectRatio="xMidYMid meet" />
              {orderedAnnotations.map((item) => (
                <g key={item.id}>
                  {renderShape(item)}
                  {renderHandles(item)}
                </g>
              ))}
              {draftElement}
              {polygonDraftElement}
            </svg>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Empty description="请先上传图像或从图库选择图像" />
            </div>
          )}
        </div>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Typography.Text type="secondary">
            光标：{cursorPoint ? `${cursorPoint.x.toFixed(1)}, ${cursorPoint.y.toFixed(1)}` : '-'}
          </Typography.Text>
          {tool === 'polygon' && polygonDraft.length > 0 ? (
            <Button type="primary" size="small" disabled={disabled} onClick={finishPolygon}>
              完成多边形
            </Button>
          ) : null}
        </Space>
      </Space>
    </Card>
  )
}
