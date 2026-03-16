import { Card, Modal, Spin, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Masonry } from 'masonic'
import { fetchImagesPage, ImageListItem, warmImageCache } from '../services/imageApi'

type GalleryItem = ImageListItem

export default function ImageGallery() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(true)
  const [loadingPage, setLoadingPage] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const loadingRef = useRef(false)

  const loadNext = useCallback(async () => {
    if (loadingRef.current || !hasNext) return
    loadingRef.current = true
    setLoadingPage(true)
    try {
      const res = await fetchImagesPage(page, 40)
      const nextRows = Array.isArray(res.rows) ? res.rows : []
      setItems((prev) => [...prev, ...nextRows])
      warmImageCache(nextRows.map((item) => item.imageUrl)).catch(() => {})
      setHasNext(res.hasNext)
      setPage((p) => p + 1)
    } finally {
      setLoadingPage(false)
      loadingRef.current = false
    }
  }, [hasNext, page])

  useEffect(() => {
    loadNext().catch(() => {})
  }, [])

  const openPreview = useCallback((index: number) => {
    setPreviewIndex(index)
  }, [])

  const closePreview = useCallback(() => {
    setPreviewIndex(null)
  }, [])

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (previewIndex === null) return
      if (e.key === 'ArrowLeft') {
        setPreviewIndex((idx) => (idx === null ? idx : Math.max(0, idx - 1)))
      }
      if (e.key === 'ArrowRight') {
        setPreviewIndex((idx) => {
          if (idx === null) return idx
          return Math.min(items.length - 1, idx + 1)
        })
      }
      if (e.key === 'Escape') closePreview()
    },
    [closePreview, items.length, previewIndex]
  )

  useEffect(() => {
    if (previewIndex === null) return
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown, previewIndex])

  const previewItem = previewIndex === null ? null : items[previewIndex]

  const render = useMemo(() => {
    return function RenderCard({ data, index }: { data: GalleryItem; index: number }) {
      const ratio = data.width && data.height ? data.height / data.width : 0.75
      // 直接使用后端返回的 imageUrl（无论是原始 OSS 地址还是代理地址）
      // 浏览器会自动处理加载，无需手动 fetch blob
      return (
        <Card
          hoverable
          style={{ cursor: 'pointer' }}
          styles={{ body: { padding: 8 } }}
          onClick={() => openPreview(index)}
          cover={
            <div style={{ width: '100%', aspectRatio: `${1} / ${ratio || 0.75}`, background: '#f5f5f5', overflow: 'hidden' }}>
              <img
                src={data.imageUrl}
                alt={data.fileName || `Image ${data.imageId}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                loading="lazy"
              />
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Typography.Text ellipsis style={{ fontSize: 12, fontWeight: 500 }}>
              {data.treeCode || `#${data.imageId}`}
            </Typography.Text>
            {data.uploadTime && (
              <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                {data.uploadTime}
              </Typography.Text>
            )}
          </div>
        </Card>
      )
    }
  }, [openPreview])

  const onRender = useCallback(
    (startIndex: number, stopIndex: number) => {
      if (stopIndex >= items.length - 10) {
        loadNext().catch(() => {})
      }
    },
    [items.length, loadNext]
  )

  return (
    <>
      <Masonry
        items={items}
        columnGutter={12}
        columnWidth={240}
        overscanBy={3}
        onRender={onRender}
        render={render}
      />
      {loadingPage ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
          <Spin />
        </div>
      ) : null}

      <Modal open={previewIndex !== null} footer={null} onCancel={closePreview} width="80vw" centered>
        {previewItem ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography.Text strong>
                {previewItem.treeCode || previewItem.fileName || `#${previewItem.imageId}`}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                （←/→ 切换，Esc 关闭）
              </Typography.Text>
            </div>
            {previewItem.remarks && (
               <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
                 备注: {previewItem.remarks}
               </Typography.Paragraph>
            )}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', background: '#f0f2f5', borderRadius: 8, overflow: 'hidden' }}>
              <img 
                src={previewItem.imageUrl} 
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} 
                alt="Preview"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, fontSize: 12, color: '#666' }}>
               <div>拍摄时间: {previewItem.captureTime || previewItem.uploadTime || '-'}</div>
               <div>GPS: {previewItem.locationGps || '-'}</div>
               <div>健康状态: {previewItem.healthStatus ?? '-'}</div>
               <div>用户: {previewItem.userName || previewItem.userId || '-'}</div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
