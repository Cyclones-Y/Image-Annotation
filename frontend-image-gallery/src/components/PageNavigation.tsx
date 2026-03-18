import { ArrowLeftOutlined } from '@ant-design/icons'
import { Breadcrumb, Button, Space, Typography } from 'antd'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './PageNavigation.css'

interface Props {
  currentLabel: string
  menuLabel: string
  subMenuLabel: string
  fallbackPath?: string
  showBackButton?: boolean
}

export default function PageNavigation({
  currentLabel,
  menuLabel,
  subMenuLabel,
  fallbackPath = '/home',
  showBackButton = true
}: Props) {
  const navigate = useNavigate()
  const location = useLocation()

  const crumbs = useMemo(
    () => [
      { label: '首页', path: '/home', clickable: location.pathname !== '/home' },
      { label: menuLabel, path: '/home', clickable: true },
      { label: subMenuLabel, path: location.pathname, clickable: true },
      { label: currentLabel, path: '', clickable: false }
    ],
    [currentLabel, location.pathname, menuLabel, subMenuLabel]
  )

  const handleBack = () => {
    const from = typeof (location.state as any)?.from === 'string' ? (location.state as any).from : ''
    const currentPath = `${location.pathname}${location.search}`
    if (from && from !== currentPath) {
      navigate(from)
      return
    }
    if (window.history.length > 1) {
      const before = window.location.pathname + window.location.search
      navigate(-1)
      window.setTimeout(() => {
        const after = window.location.pathname + window.location.search
        if (after === before) {
          navigate(fallbackPath, { replace: true })
        }
      }, 50)
      return
    }
    navigate(fallbackPath, { replace: true })
  }

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {showBackButton ? (
        <div className="page-back-button-wrap">
          <Button className="page-back-button" icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回上一页
          </Button>
        </div>
      ) : null}
      <div className="page-breadcrumb-wrap">
        <Breadcrumb
          items={crumbs.map((item) => ({
            title: item.clickable ? (
              <a
                onClick={(e) => {
                  e.preventDefault()
                  navigate(item.path)
                }}
              >
                {item.label}
              </a>
            ) : (
              <Typography.Text strong>{item.label}</Typography.Text>
            )
          }))}
        />
      </div>
    </Space>
  )
}
