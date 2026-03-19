import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import HomePage from './pages/Home'
import GalleryPage from './pages/Gallery'
import ProjectManagementPage from './pages/ProjectManagement'
import AnnotationPage from './pages/Annotation/index'
import LabelManagementPage from './pages/LabelManagement/index'
import PrivateRoute from './components/PrivateRoute'
import RouteStateGuard from './components/RouteStateGuard'
import { NavigationGuardProvider } from './state/navigationGuard'

function AppRoutes() {
  const location = useLocation()
  return (
    <Routes key={`${location.pathname}${location.search}`}>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/home" 
        element={
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
        } 
      />
      <Route
        path="/gallery"
        element={
          <PrivateRoute>
            <GalleryPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <PrivateRoute>
            <ProjectManagementPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/annotator"
        element={
          <PrivateRoute>
            <AnnotationPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/label-management"
        element={
          <PrivateRoute>
            <LabelManagementPage />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <NavigationGuardProvider>
      <BrowserRouter>
        <RouteStateGuard />
        <AppRoutes />
      </BrowserRouter>
    </NavigationGuardProvider>
  )
}
