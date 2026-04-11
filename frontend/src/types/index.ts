// Section 2.1 — Core Data Models
export interface User {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: 'student' | 'employer' | 'admin'   // Contract A enum
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

export interface EmployerProfile {
  id: string
  user_id: string
  company_name: string
  address: string | null
  description: string | null
}

export interface StudentProfile {
  id: string
  user_id: string
  employer_id: string
  student_id: string | null
  university: string | null
  skills: string[]
  reputation_score: number
  total_shifts_done: number
}

export interface Job {
  id: string
  employer_id: string
  title: string
  description: string | null
  hourly_rate: number
  required_skills: string[]
  max_workers: number
  status: 'active' | 'paused' | 'closed'
  created_at: string
}

export interface Shift {
  id: string
  job_id: string
  employer_id: string
  title: string | null
  start_time: string
  end_time: string
  max_workers: number
  current_workers: number
  status: 'open' | 'full' | 'ongoing' | 'completed' | 'cancelled'
  auto_assign: boolean
  created_at: string
  job?: Job
}

export interface ShiftRegistration {
  id: string
  shift_id: string
  student_id: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  registered_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  student?: User
}

export interface Attendance {
  id: string
  shift_id: string
  student_id: string
  check_in_time: string | null
  check_out_time: string | null
  status: 'on_time' | 'late' | 'absent' | 'incomplete' | 'pending'
  late_minutes: number
  early_minutes: number
  hours_worked: number | null
  force_checkout: boolean
  note: string | null
  shift?: Shift
}

export interface Payroll {
  id: string
  student_id: string
  employer_id: string
  period_start: string
  period_end: string
  total_hours: number
  total_amount: number
  status: 'draft' | 'confirmed' | 'paid'
  paid_at: string | null
  items?: PayrollItem[]
}

export interface PayrollItem {
  id: string
  payroll_id: string
  shift_id: string
  attendance_id: string
  scheduled_hours: number
  hours_worked: number
  hourly_rate: number
  deduction_minutes: number
  deduction_amount: number
  subtotal: number
  shift?: Shift
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  metadata: Record<string, string> | null
  created_at: string
}

export interface Rating {
  id: string
  shift_id: string
  student_id: string
  employer_id: string
  score: 1 | 2 | 3 | 4 | 5
  comment: string | null
  created_at: string
}

// Section 2.2 — API Response Shapes
export interface AuthResponse {
  token: string
  user: User
}

export interface CreateEmployeeResponse {
  message: string
  user: User
  temp_password: string
}

export interface RegisterShiftResponse {
  registration: ShiftRegistration
}

export interface CheckinResponse {
  attendance: Pick<Attendance, 'id' | 'status' | 'late_minutes' | 'check_in_time'>
}

export interface ApiError {
  error: string
  message: string
  details?: unknown
}
