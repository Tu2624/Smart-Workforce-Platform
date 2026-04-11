import React from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ProtectedRoute, RoleRoute } from './components/AuthGuard'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Simple placeholder components for roles
const StudentDashboard = () => <div className="p-8"><h1>Student Dashboard</h1></div>
const EmployerDashboard = () => <div className="p-8"><h1>Employer Dashboard</h1></div>
const AdminDashboard = () => <div className="p-8"><h1>Admin Dashboard</h1></div>
const Unauthorized = () => <div className="p-8 text-red-500"><h1>Unauthorized Access</h1></div>

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute allowedRoles={['student']} />,
        children: [
          { path: '/student', element: <StudentDashboard /> },
        ],
      },
      {
        element: <RoleRoute allowedRoles={['employer']} />,
        children: [
          { path: '/employer', element: <EmployerDashboard /> },
        ],
      },
      {
        element: <RoleRoute allowedRoles={['admin']} />,
        children: [
          { path: '/admin', element: <AdminDashboard /> },
        ],
      },
    ],
  },
  {
    path: '/unauthorized',
    element: <Unauthorized />,
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
], {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
})

function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />
}

export default App
