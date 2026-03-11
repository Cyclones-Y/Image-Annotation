import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Cookies from 'js-cookie'

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = Cookies.get('Admin-Token')
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
