import React, { useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { containerVariants, itemVariants } from '../../utils/animations'
import { useAuthStore } from '../../store/useAuthStore'
import { updateProfile, changePassword } from '../../api/auth'

const ProfilePage: React.FC = () => {
  const user = useAuthStore(state => state.user) as any
  const fetchMe = useAuthStore(state => state.fetchMe)
  const [pageLoading, setPageLoading] = useState(true)

  React.useEffect(() => {
    fetchMe().finally(() => setPageLoading(false))
  }, [])

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name ?? '',
    phone: user?.phone ?? '',
    // Employer
    company_name: user?.profile?.company_name ?? '',
    address: user?.profile?.address ?? '',
    description: user?.profile?.description ?? '',
    // Student
    student_id: user?.profile?.student_id ?? '',
    university: user?.profile?.university ?? '',
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})

  // Re-sync form if user data changes (e.g. after fetchMe)
  React.useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name ?? '',
        phone: user.phone ?? '',
        company_name: user.profile?.company_name ?? '',
        address: user.profile?.address ?? '',
        description: user.profile?.description ?? '',
        student_id: user.profile?.student_id ?? '',
        university: user.profile?.university ?? '',
      })
    }
  }, [user?.id, user?.profile?.company_name, user?.profile?.university])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileMsg(null)
    try {
      const data: any = { 
        full_name: profileForm.full_name, 
        phone: profileForm.phone || undefined 
      }
      
      if (user?.role === 'employer') {
        data.company_name = profileForm.company_name
        data.address = profileForm.address
        data.description = profileForm.description
      } else if (user?.role === 'student') {
        data.student_id = profileForm.student_id
        data.university = profileForm.university
      }

      await updateProfile(data)
      await fetchMe()
      setProfileMsg({ type: 'success', text: 'Cập nhật hồ sơ thành công.' })
    } catch {
      setProfileMsg({ type: 'error', text: 'Cập nhật thất bại. Vui lòng thử lại.' })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwErrors({})
    setPwMsg(null)

    const errors: Record<string, string> = {}
    if (!pwForm.current_password) errors.current_password = 'Vui lòng nhập mật khẩu hiện tại.'
    if (pwForm.new_password.length < 8) errors.new_password = 'Mật khẩu mới phải có ít nhất 8 ký tự.'
    if (pwForm.new_password !== pwForm.confirm_password) errors.confirm_password = 'Mật khẩu xác nhận không khớp.'
    if (Object.keys(errors).length > 0) { setPwErrors(errors); return }

    setPwLoading(true)
    try {
      await changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password })
      setPwMsg({ type: 'success', text: 'Đổi mật khẩu thành công.' })
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err: any) {
      const code = err.response?.data?.error
      if (code === 'INVALID_CURRENT_PASSWORD') {
        setPwErrors({ current_password: 'Mật khẩu hiện tại không đúng.' })
      } else {
        setPwMsg({ type: 'error', text: 'Đổi mật khẩu thất bại. Vui lòng thử lại.' })
      }
    } finally {
      setPwLoading(false)
    }
  }

  const msgClass = (type: 'success' | 'error') =>
    `rounded-2xl px-4 py-3 text-sm font-bold mt-4 shadow-sm border ${
      type === 'success'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : 'bg-rose-50 text-rose-700 border-rose-100'
    }`

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 max-w-3xl mx-auto">
        <motion.div variants={itemVariants} className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-indigo-600 text-3xl shadow-xl">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
             </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Hồ sơ cá nhân</h1>
            <p className="text-slate-300 mt-1 font-medium">{user?.email} · <span className="uppercase text-xs tracking-widest text-indigo-400 font-black">{user?.role}</span></p>
          </div>
        </motion.div>

        {pageLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-slate-100 font-bold animate-pulse">Đang tải dữ liệu hồ sơ...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <Card glass>
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                Thông tin chung
              </h2>
              <form onSubmit={handleProfileSave} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="Họ và tên *"
                    value={profileForm.full_name}
                    onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                    required
                  />
                  <Input
                    label="Số điện thoại"
                    type="tel"
                    value={profileForm.phone}
                    onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="09xx xxx xxx"
                  />
                </div>

                {user?.role === 'employer' && (
                  <div className="space-y-5 pt-2 border-t border-slate-700/30">
                    <Input
                      label="Tên công ty / Doanh nghiệp *"
                      value={profileForm.company_name}
                      onChange={e => setProfileForm(f => ({ ...f, company_name: e.target.value }))}
                      required
                    />
                    <Input
                      label="Địa chỉ"
                      value={profileForm.address}
                      onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="Số nhà, đường, quận/huyện..."
                    />
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả doanh nghiệp</label>
                      <textarea
                        value={profileForm.description}
                        onChange={e => setProfileForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 min-h-[120px]"
                        placeholder="Giới thiệu ngắn gọn về doanh nghiệp của bạn..."
                      />
                    </div>
                  </div>
                )}

                {user?.role === 'student' && (
                  <div className="space-y-5 pt-2 border-t border-slate-700/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Mã sinh viên"
                        value={profileForm.student_id}
                        onChange={e => setProfileForm(f => ({ ...f, student_id: e.target.value }))}
                        placeholder="VD: B21DCCN001"
                      />
                      <Input
                        label="Trường đại học"
                        value={profileForm.university}
                        onChange={e => setProfileForm(f => ({ ...f, university: e.target.value }))}
                        placeholder="VD: PTIT, HUST..."
                      />
                    </div>
                  </div>
                )}

                {profileMsg && <p className={msgClass(profileMsg.type)}>{profileMsg.text}</p>}
                
                <div className="flex justify-end pt-4">
                  <Button type="submit" variant="primary" isLoading={profileLoading} className="px-8">
                    Lưu thay đổi
                  </Button>
                </div>
              </form>
            </Card>

            <Card glass>
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                Đổi mật khẩu
              </h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <Input
                  label="Mật khẩu hiện tại"
                  type="password"
                  value={pwForm.current_password}
                  onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                  error={pwErrors.current_password}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Mật khẩu mới"
                    type="password"
                    value={pwForm.new_password}
                    onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                    error={pwErrors.new_password}
                  />
                  <Input
                    label="Xác nhận mật khẩu"
                    type="password"
                    value={pwForm.confirm_password}
                    onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                    error={pwErrors.confirm_password}
                  />
                </div>
                {pwMsg && <p className={msgClass(pwMsg.type)}>{pwMsg.text}</p>}
                <div className="flex justify-end pt-4">
                  <Button type="submit" variant="primary" isLoading={pwLoading} className="px-8">
                    Cập nhật mật khẩu
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>

          {/* Sidebar Stats */}
          <motion.div variants={itemVariants} className="space-y-6">
            {user?.role === 'student' && (
              <Card glass className="bg-indigo-600/5 border-indigo-500/10 text-center py-8">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Điểm uy tín</p>
                <p className="text-6xl font-black text-slate-900 leading-none">{Math.round(user.profile?.reputation_score || 0)}</p>
                <p className="text-slate-600 text-sm mt-3 font-medium">Dựa trên thái độ làm việc</p>
                
                <div className="mt-8 pt-6 border-t border-slate-900/10">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Ca làm đã hoàn thành</p>
                    <p className="text-2xl font-black text-slate-900">{user.profile?.total_shifts_done || 0}</p>
                </div>
              </Card>
            )}

            <Card glass className="bg-white/80 border-white/40">
               <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                 <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                 Thông tin tài khoản
               </h3>
               <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-0.5">Email đăng nhập</p>
                    <p className="text-sm text-slate-800 font-bold truncate">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-0.5">Ngày gia nhập</p>
                    <p className="text-sm text-slate-800 font-bold">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '—'}
                    </p>
                  </div>
               </div>
            </Card>
          </motion.div>
        </div>
        )}
      </motion.div>
    </DashboardLayout>
  )
}

export default ProfilePage
