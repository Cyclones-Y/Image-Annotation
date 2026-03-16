import { ImageSize, Point, ViewportState } from '../types/annotation'

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function normalizeRect(start: Point, end: Point) {
  const x = Math.min(start.x, end.x)
  const y = Math.min(start.y, end.y)
  const width = Math.abs(end.x - start.x)
  const height = Math.abs(end.y - start.y)
  return { x, y, width, height }
}

export function screenToImage(point: Point, viewport: ViewportState, imageSize: ImageSize): Point {
  const rad = (viewport.rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const cx = imageSize.width / 2
  const cy = imageSize.height / 2

  const rx = (point.x - cx - viewport.offsetX) / viewport.scale
  const ry = (point.y - cy - viewport.offsetY) / viewport.scale

  const dx = rx * cos + ry * sin
  const dy = -rx * sin + ry * cos

  return { x: dx + cx, y: dy + cy }
}

export function imageToScreen(point: Point, viewport: ViewportState, imageSize: ImageSize): Point {
  const rad = (viewport.rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const cx = imageSize.width / 2
  const cy = imageSize.height / 2
  const dx = point.x - cx
  const dy = point.y - cy
  const rx = dx * cos - dy * sin
  const ry = dx * sin + dy * cos
  return {
    x: rx * viewport.scale + cx + viewport.offsetX,
    y: ry * viewport.scale + cy + viewport.offsetY
  }
}

export function createId(prefix = 'anno') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`
}
