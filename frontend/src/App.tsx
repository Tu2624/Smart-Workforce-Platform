import React from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ProtectedRoute, RoleRoute } from './components/AuthGuard'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import StudentDashboard from './pages/student/StudentDashboard'
import EmployerDashboard from './pages/employer/EmployerDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import JobsPage from './pages/employer/JobsPage'
import JobDetailPage from './pages/employer/JobDetailPage'
import AllShiftsPage from './pages/employer/AllShiftsPage'
import ShiftDetailPage from './pages/employer/ShiftDetailPage'
import BrowseShiftsPage from './pages/student/BrowseShiftsPage'
import ProfilePage from './pages/student/ProfilePage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminJobsPage from './pages/admin/AdminJobsPage'
import StudentAttendance from './pages/student/StudentAttendance'
import StudentPayroll from './pages/student/StudentPayroll'
import StudentPayrollDetail from './pages/student/PayrollDetailPage'
import AttendanceOverview from './pages/employer/AttendanceOverview'
import PayrollList from './pages/employer/PayrollList'
import EmployerPayrollDetail from './pages/employer/PayrollDetailPage'
import NotificationPage from './pages/shared/NotificationPage'

const Unauthorized = () => <div className="p-8 text-red-500"><h1>Unauthorized Access</h1></div>

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute allowedRoles={['student']} />,
        children: [
          { path: '/student',               element: <StudentDashboard /> },
          { path: '/student/shifts',        element: <BrowseShiftsPage /> },
          { path: '/student/profile',       element: <ProfilePage /> },
          { path: '/student/attendance',    element: <StudentAttendance /> },
          { path: '/student/payroll',       element: <StudentPayroll /> },
          { path: '/student/payroll/:id',   element: <StudentPayrollDetail /> },
          { path: '/student/notifications', element: <NotificationPage /> },
        ],
      },
      {
        element: <RoleRoute allowedRoles={['employer']} />,
        children: [
          { path: '/employer',                  element: <EmployerDashboard /> },
          { path: '/employer/jobs',             element: <JobsPage /> },
          { path: '/employer/jobs/:id',         element: <JobDetailPage /> },
          { path: '/employer/shifts',           element: <AllShiftsPage /> },
          { path: '/employer/shifts/:id',       element: <ShiftDetailPage /> },
          { path: '/employer/profile',          element: <ProfilePage /> },
          { path: '/employer/attendance',       element: <AttendanceOverview /> },
          { path: '/employer/payroll',          element: <PayrollList /> },
          { path: '/employer/payroll/:id',      element: <EmployerPayrollDetail /> },
          { path: '/employer/notifications',    element: <NotificationPage /> },
        ],
      },
      {
        element: <RoleRoute allowedRoles={['admin']} />,
        children: [
          { path: '/admin',       element: <AdminDashboard /> },
          { path: '/admin/users', element: <AdminUsersPage /> },
          { path: '/admin/jobs',  element: <AdminJobsPage /> },
        ],
      },
    ],
  },
  { path: '/unauthorized', element: <Unauthorized /> },
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/" replace /> },
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
