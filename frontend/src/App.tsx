import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { RoleRoute } from '@/components/RoleRoute'
import { StudentLayout } from '@/components/layouts/StudentLayout'
import { EmployerLayout } from '@/components/layouts/EmployerLayout'
import { AdminLayout } from '@/components/layouts/AdminLayout'

import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'

import StudentDashboard from '@/pages/student/StudentDashboard'
import StudentSchedule from '@/pages/student/StudentSchedule'
import StudentShiftList from '@/pages/student/StudentShiftList'
import StudentAttendance from '@/pages/student/StudentAttendance'
import StudentPayroll from '@/pages/student/StudentPayroll'
import StudentNotifications from '@/pages/student/StudentNotifications'
import StudentProfile from '@/pages/student/StudentProfile'

import EmployerDashboard from '@/pages/employer/EmployerDashboard'
import JobList from '@/pages/employer/JobList'
import JobForm from '@/pages/employer/JobForm'
import ShiftList from '@/pages/employer/ShiftList'
import ShiftForm from '@/pages/employer/ShiftForm'
import AttendanceOverview from '@/pages/employer/AttendanceOverview'
import PayrollList from '@/pages/employer/PayrollList'
import ReportPage from '@/pages/employer/ReportPage'
import EmployerNotifications from '@/pages/employer/EmployerNotifications'

import AdminDashboard from '@/pages/admin/AdminDashboard'
import UserList from '@/pages/admin/UserList'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<div className="flex h-screen items-center justify-center"><p className="text-gray-500">403 — Không có quyền truy cập</p></div>} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        {/* Student */}
        <Route element={<RoleRoute role="student" />}>
          <Route element={<StudentLayout />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/schedule" element={<StudentSchedule />} />
            <Route path="/student/shifts" element={<StudentShiftList />} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/payroll" element={<StudentPayroll />} />
            <Route path="/student/notifications" element={<StudentNotifications />} />
            <Route path="/student/profile" element={<StudentProfile />} />
          </Route>
        </Route>

        {/* Employer */}
        <Route element={<RoleRoute role="employer" />}>
          <Route element={<EmployerLayout />}>
            <Route path="/employer" element={<EmployerDashboard />} />
            <Route path="/employer/jobs" element={<JobList />} />
            <Route path="/employer/jobs/new" element={<JobForm />} />
            <Route path="/employer/jobs/:id/edit" element={<JobForm />} />
            <Route path="/employer/shifts" element={<ShiftList />} />
            <Route path="/employer/shifts/new" element={<ShiftForm />} />
            <Route path="/employer/attendance" element={<AttendanceOverview />} />
            <Route path="/employer/payroll" element={<PayrollList />} />
            <Route path="/employer/reports" element={<ReportPage />} />
            <Route path="/employer/notifications" element={<EmployerNotifications />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<RoleRoute role="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserList />} />
          </Route>
        </Route>
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
