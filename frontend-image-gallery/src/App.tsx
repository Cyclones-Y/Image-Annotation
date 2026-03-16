import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import HomePage from './pages/Home'
import GalleryPage from './pages/Gallery'
import ProjectManagementPage from './pages/ProjectManagement'
import AnnotationPage from './pages/Annotation'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
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
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
