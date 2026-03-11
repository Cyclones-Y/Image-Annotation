import request from './request'

export type ImageListItem = {
  imageId: number
  imageUrl: string
  uploadTime?: string
  width?: number
  height?: number
}

export type ImagePage = {
  rows: ImageListItem[]
  pageNum: number
  pageSize: number
  total: number
  hasNext: boolean
}

export async function fetchImagesPage(page: number, size: number): Promise<ImagePage> {
  const res = await request.get('/api/images', { params: { page, size } })
  const body = res.data as any
  const src = body && typeof body === 'object' ? body : {}
  const rows = Array.isArray(src.rows) ? src.rows : Array.isArray(src?.data?.rows) ? src.data.rows : []
  const pageNum = Number(src.pageNum ?? src?.data?.pageNum ?? page) || page
  const pageSize = Number(src.pageSize ?? src?.data?.pageSize ?? size) || size
  const total = Number(src.total ?? src?.data?.total ?? 0) || 0
  const hasNext = Boolean(src.hasNext ?? src?.data?.hasNext ?? false)
  return { rows, pageNum, pageSize, total, hasNext }
}

export async function fetchImageBlob(imageId: number): Promise<Blob> {
  const res = await request.get(`/api/images/${imageId}`, { responseType: 'blob' })
  return res.data as Blob
}
