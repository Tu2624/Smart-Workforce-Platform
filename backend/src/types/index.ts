export type UserRole = 'student' | 'employer' | 'admin';

export interface IUser {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
}

export interface IJob {
  id: string;
  employer_id: string;
  title: string;
  description?: string;
  hourly_rate: number;
  required_skills: string[];
  max_workers: number;
  status: 'active' | 'closed';
  created_at: Date;
}

export interface IShift {
  id: string;
  job_id: string;
  employer_id: string;
  title?: string;
  start_time: Date;
  end_time: Date;
  max_workers: number;
  current_workers: number;
  auto_assign: boolean;
  status: 'open' | 'full' | 'cancelled' | 'completed';
  created_at: Date;
  
  // Virtual/Joined fields
  job_title?: string;
  hourly_rate?: number;
  job_status?: string;
  registrations_count?: number;
}

export interface IShiftRegistration {
  id: string;
  shift_id: string;
  student_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  registered_at: Date;
  reviewed_by?: string;
  reviewed_at?: Date;
}
