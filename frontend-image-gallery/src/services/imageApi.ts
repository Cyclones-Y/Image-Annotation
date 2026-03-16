import request from './request'

export type ImageListItem = {
  imageId: number | string
  imageUrl: string
  uploadTime?: string
  width?: number
  height?: number
  fileName?: string
  treeCode?: string
  captureTime?: string
  locationGps?: string
  healthStatus?: string | number
  userId?: string
  userName?: string
  remarks?: string
}

export type ImagePage = {
  rows: ImageListItem[]
  pageNum: number
  pageSize: number
  total: number
  hasNext: boolean
}

const IMAGE_PAGE_CACHE_KEY = 'image-page-cache-v1'
const IMAGE_PAGE_CACHE_TTL = 30 * 1000

type CachedImagePage = {
  timestamp: number
  data: ImagePage
}

const memoryCache = new Map<string, CachedImagePage>()

function getCacheKey(page: number, size: number, projectId?: string) {
  return `${page}:${size}:${projectId || 'default'}`
}

function readStorageCache() {
  try {
    const raw = sessionStorage.getItem(IMAGE_PAGE_CACHE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, CachedImagePage>) : {}
  } catch {
    return {}
  }
}

function writeStorageCache(store: Record<string, CachedImagePage>) {
  try {
    sessionStorage.setItem(IMAGE_PAGE_CACHE_KEY, JSON.stringify(store))
  } catch {
    return
  }
}

function readCachedPage(key: string): ImagePage | null {
  const inMemory = memoryCache.get(key)
  if (inMemory && Date.now() - inMemory.timestamp <= IMAGE_PAGE_CACHE_TTL) {
    return inMemory.data
  }

  const storage = readStorageCache()
  const entry = storage[key]
  if (entry && Date.now() - entry.timestamp <= IMAGE_PAGE_CACHE_TTL) {
    memoryCache.set(key, entry)
    return entry.data
  }

  return null
}

function writeCachedPage(key: string, data: ImagePage) {
  const entry: CachedImagePage = { timestamp: Date.now(), data }
  memoryCache.set(key, entry)
  const storage = readStorageCache()
  storage[key] = entry
  writeStorageCache(storage)
}

export async function fetchImagesPage(page: number, size: number): Promise<ImagePage> {
  const cacheKey = getCacheKey(page, size)
  const cached = readCachedPage(cacheKey)
  if (cached) {
    return cached
  }

  const res = await request.get('/api/images', { params: { page, size } })
  const body = res.data as any
  const src = body && typeof body === 'object' ? body : {}
  const rows = Array.isArray(src.rows) ? src.rows : Array.isArray(src?.data?.rows) ? src.data.rows : []
  const pageNum = Number(src.pageNum ?? src?.data?.pageNum ?? page) || page
  const pageSize = Number(src.pageSize ?? src?.data?.pageSize ?? size) || size
  const total = Number(src.total ?? src?.data?.total ?? 0) || 0
  const hasNext = Boolean(src.hasNext ?? src?.data?.hasNext ?? false)
  const normalized = { rows, pageNum, pageSize, total, hasNext }
  writeCachedPage(cacheKey, normalized)
  return normalized
}

export async function warmImageCache(urls: string[]) {
  const unique = Array.from(new Set(urls.filter(Boolean)))
  if (unique.length === 0 || typeof window === 'undefined') {
    return
  }
  for (const url of unique) {
    const image = new Image()
    image.decoding = 'async'
    image.loading = 'eager'
    image.src = url
  }
}

export async function fetchImageBlob(imageId: number): Promise<Blob> {
  const res = await request.get(`/api/images/${imageId}`, { responseType: 'blob' })
  return res.data as Blob
}
