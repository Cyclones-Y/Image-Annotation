export type Point = {
  x: number
  y: number
}

export type AnnotationTool = 'select' | 'pan' | 'rect' | 'polygon' | 'circle' | 'line' | 'point'

export type AnnotationStyle = {
  stroke: string
  fill: string
  strokeWidth: number
  opacity: number
}

export type AnnotationBase = {
  id: string
  type: Exclude<AnnotationTool, 'select' | 'pan'>
  labelId?: string
  confidence?: number
  remark?: string
  style: AnnotationStyle
  zIndex: number
}

export type RectAnnotation = AnnotationBase & {
  type: 'rect'
  x: number
  y: number
  width: number
  height: number
}

export type PolygonAnnotation = AnnotationBase & {
  type: 'polygon'
  points: Point[]
}

export type CircleAnnotation = AnnotationBase & {
  type: 'circle'
  cx: number
  cy: number
  radius: number
}

export type LineAnnotation = AnnotationBase & {
  type: 'line'
  x1: number
  y1: number
  x2: number
  y2: number
}

export type PointAnnotation = AnnotationBase & {
  type: 'point'
  x: number
  y: number
}

export type AnnotationItem =
  | RectAnnotation
  | PolygonAnnotation
  | CircleAnnotation
  | LineAnnotation
  | PointAnnotation

export type LabelDefinition = {
  id: string
  name: string
  color: string
  parentId?: string
}

export type LabelTemplate = {
  id: string
  name: string
  labels: LabelDefinition[]
}

export type ViewportState = {
  scale: number
  offsetX: number
  offsetY: number
  rotation: number
}

export type ImageSize = {
  width: number
  height: number
}
