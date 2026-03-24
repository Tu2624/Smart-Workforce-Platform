export type UserRole = 'student' | 'employer' | 'admin'

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  avatar_url?: string
  is_active: boolean
  created_at: string
}

export interface StudentProfile {
  user_id: string
  student_id?: string
  university?: string
  skills: string[]
  reputation_score: number
  total_shifts_done: number
}

export interface EmployerProfile {
  user_id: string
  company_name: string
  address?: string
  description?: string
}

export type JobStatus = 'active' | 'paused' | 'closed'

export interface Job {
  id: string
  employer_id: string
  title: string
  description?: string
  hourly_rate: number
  required_skills: string[]
  max_workers: number
  status: JobStatus
  created_at: string
  updated_at: string
}

export type ShiftStatus = 'open' | 'full' | 'ongoing' | 'completed' | 'cancelled'
export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface Shift {
  id: string
  job_id: string
  employer_id: string
  title?: string
  start_time: string
  end_time: string
  max_workers: number
  current_workers: number
  status: ShiftStatus
  auto_assign: boolean
  created_at: string
  job_title?: string
  hourly_rate?: number
}

export interface ShiftRegistration {
  id: string
  shift_id: string
  student_id: string
  status: RegistrationStatus
  registered_at: string
  reviewed_at?: string
  full_name?: string
  email?: string
  reputation_score?: number
}

export type AttendanceStatus = 'on_time' | 'late' | 'absent' | 'pending'

export interface Attendance {
  id: string
  shift_id: string
  student_id: string
  check_in_time?: string
  check_out_time?: string
  status: AttendanceStatus
  late_minutes: number
  hours_worked?: number
  note?: string
  shift_title?: string
  start_time?: string
  end_time?: string
  hourly_rate?: number
}

export type PayrollStatus = 'draft' | 'confirmed' | 'paid'

export interface Payroll {
  id: string
  student_id: string
  employer_id: string
  period_start: string
  period_end: string
  total_hours: number
  base_amount: number
  bonus_amount: number
  penalty_amount: number
  total_amount: number
  status: PayrollStatus
  paid_at?: string
  shift_count?: number
}

export interface PayrollItem {
  id: string
  payroll_id: string
  shift_id: string
  attendance_id: string
  hours_worked: number
  hourly_rate: number
  subtotal: number
  bonus: number
  penalty: number
  shift_title?: string
  start_time?: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body?: string
  is_read: boolean
  metadata?: Record<string, unknown>
  created_at: string
}
