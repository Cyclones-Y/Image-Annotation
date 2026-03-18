import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { message } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SaveExitActions from '../components/annotation/SaveExitActions'

function SaveExitFlowHarness() {
  const [isDirty, setIsDirty] = useState(true)
  const navigate = useNavigate()
  return (
    <div>
      <div data-testid="dirty-flag">{String(isDirty)}</div>
      <SaveExitActions
        saving={false}
        disabled={false}
        hasUnsavedChanges={isDirty}
        onSave={() => {
          setIsDirty(false)
        }}
        onExitConfirm={() => navigate('/projects', { replace: true })}
      />
    </div>
  )
}

describe('保存-退出全链路', () => {
  beforeEach(() => {
    vi.spyOn(message, 'success').mockImplementation(() => (() => {}) as any)
    vi.spyOn(message, 'error').mockImplementation(() => (() => {}) as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    message.destroy()
  })

  it('点击保存后 isDirty 立即清除，退出不再弹警告且路由界面同步', async () => {
    render(
      <MemoryRouter initialEntries={['/annotator']}>
        <Routes>
          <Route path="/annotator" element={<SaveExitFlowHarness />} />
          <Route path="/projects" element={<div data-testid="projects-page">项目页</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('dirty-flag')).toHaveTextContent('true')
    fireEvent.click(screen.getByTestId('annotation-exit-btn'))
    expect(await screen.findByText('未保存的更改将丢失')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('annotation-exit-cancel-btn'))

    fireEvent.click(screen.getByTestId('annotation-save-btn'))
    await waitFor(() => {
      expect(screen.getByTestId('dirty-flag')).toHaveTextContent('false')
    })

    fireEvent.click(screen.getByTestId('annotation-exit-btn'))
    await waitFor(() => {
      expect(screen.getByTestId('projects-page')).toBeInTheDocument()
    })
    expect(screen.queryByText('未保存的更改将丢失')).not.toBeInTheDocument()
  })
})
