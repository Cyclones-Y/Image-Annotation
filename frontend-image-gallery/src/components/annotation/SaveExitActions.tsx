import { Button, Modal, Space, Typography } from 'antd'
import { useEffect, useState } from 'react'

type Props = {
  saving: boolean
  disabled?: boolean
  hasUnsavedChanges: boolean
  onSave: () => Promise<void> | void
  onExitConfirm: () => void
}

export default function SaveExitActions({ saving, disabled = false, hasUnsavedChanges, onSave, onExitConfirm }: Props) {
  const [open, setOpen] = useState(false)

  const handleExitClick = () => {
    if (hasUnsavedChanges) {
      setOpen(true)
      return
    }
    onExitConfirm()
  }
  const handleCancel = () => setOpen(false)
  const handleConfirmExit = () => {
    setOpen(false)
    onExitConfirm()
  }

  useEffect(() => {
    const onKeyDown = async (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        if (!disabled && !saving) {
          await onSave()
        }
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!disabled && !saving) {
          if (hasUnsavedChanges) {
            setOpen(true)
          } else {
            onExitConfirm()
          }
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [disabled, hasUnsavedChanges, onExitConfirm, onSave, saving])

  return (
    <>
      <Space>
        <Button
          type="primary"
          loading={saving}
          disabled={disabled && !saving}
          onClick={() => onSave()}
          data-testid="annotation-save-btn"
        >
          保存
        </Button>
        <Button
          type="default"
          disabled={disabled || saving}
          onClick={handleExitClick}
          data-testid="annotation-exit-btn"
        >
          退出
        </Button>
      </Space>
      <Modal
        open={open}
        onCancel={handleCancel}
        title="确认退出"
        okText="继续退出"
        cancelText="取消"
        onOk={handleConfirmExit}
        confirmLoading={saving}
        okButtonProps={{ danger: true, 'data-testid': 'annotation-exit-confirm-btn' } as any}
        cancelButtonProps={{ 'data-testid': 'annotation-exit-cancel-btn' } as any}
      >
        <Typography.Text>未保存的更改将丢失</Typography.Text>
      </Modal>
    </>
  )
}
