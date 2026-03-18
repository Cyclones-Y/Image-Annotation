import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SaveExitActions from '../components/annotation/SaveExitActions'
import { persistAnnotationDraft } from '../utils/annotationPersistence'

describe('标注保存与退出交互', () => {
  it('保存成功场景：持久化成功写入存储', () => {
    const storage = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    } as unknown as Storage
    persistAnnotationDraft(
      'annotation-draft-v1',
      { imageSrc: 'https://example.com/a.jpg', labels: [], annotations: [] },
      storage
    )
    expect(storage.setItem).toHaveBeenCalledTimes(1)
  })

  it('保存失败场景：持久化异常抛出', () => {
    const storage = {
      setItem: vi.fn(() => {
        throw new Error('save failed')
      }),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    } as unknown as Storage
    expect(() =>
      persistAnnotationDraft(
        'annotation-draft-v1',
        { imageSrc: 'https://example.com/a.jpg', labels: [], annotations: [] },
        storage
      )
    ).toThrowError('save failed')
  })

  it('退出取消场景：点击取消不执行退出', async () => {
    const onExitConfirm = vi.fn()
    const onSave = vi.fn()
    render(<SaveExitActions saving={false} hasUnsavedChanges={true} onSave={onSave} onExitConfirm={onExitConfirm} />)
    fireEvent.click(screen.getByTestId('annotation-exit-btn'))
    expect(await screen.findByText('未保存的更改将丢失')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('annotation-exit-cancel-btn'))
    await waitFor(() => {
      expect(onExitConfirm).not.toHaveBeenCalled()
    })
  })

  it('退出确认场景：点击继续退出执行退出', async () => {
    const onExitConfirm = vi.fn()
    const onSave = vi.fn()
    render(<SaveExitActions saving={false} hasUnsavedChanges={true} onSave={onSave} onExitConfirm={onExitConfirm} />)
    fireEvent.click(screen.getByTestId('annotation-exit-btn'))
    expect(await screen.findByText('未保存的更改将丢失')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('annotation-exit-confirm-btn'))
    await waitFor(() => {
      expect(onExitConfirm).toHaveBeenCalledTimes(1)
    })
  })
})
