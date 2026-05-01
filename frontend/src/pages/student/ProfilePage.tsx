import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { containerVariants, itemVariants } from '../../utils/animations'
import { useAuthStore } from '../../store/useAuthStore'
import { updateProfile, changePassword } from '../../api/auth'

const INDUSTRIES = [
  'Nhà hàng / Ẩm thực',
  'Bán lẻ / Cửa hàng',
  'Sự kiện / Hội nghị',
  'Logistics / Vận chuyển',
  'Khách sạn / Du lịch',
  'Giáo dục',
  'Công nghệ thông tin',
  'Khác',
]

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
    industry: user?.profile?.industry ?? '',
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
        industry: user.profile?.industry ?? '',
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
        data.industry = profileForm.industry || undefined
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
    `rounded-2xl px-5 py-4 text-sm font-bold mt-4 shadow-xl border backdrop-blur-md ${
      type === 'success'
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    }`

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 max-w-5xl mx-auto pb-10">
        {/* Profile Header Hero */}
        <motion.div variants={itemVariants} className="relative rounded-3xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-violet-600/20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <Card className="relative p-8 md:p-12 border-none bg-white/[0.02] backdrop-blur-md">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-white/10 flex items-center justify-center text-blue-500 shadow-2xl overflow-hidden group-hover:border-blue-500/30 transition-colors">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-16 h-16 opacity-40" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  )}
                </div>
                <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg flex items-center justify-center transition-transform hover:scale-110">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
              </div>
              <div className="text-center md:text-left space-y-2">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <h1 className="text-4xl font-display font-black text-white tracking-tight">{user?.full_name}</h1>
                  <span className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest w-fit mx-auto md:mx-0">
                    {user?.role === 'employer' ? 'Nhà tuyển dụng' : 'Sinh viên'}
                  </span>
                </div>
                <p className="text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2 italic">
                  <svg className="w-4 h-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  {user?.email}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {pageLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-slate-400 font-bold animate-pulse">Đang đồng bộ dữ liệu...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar Stats */}
            <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6 order-2 lg:order-1">
              {user?.role === 'student' && (
                <Card className="p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Chỉ số cá nhân</p>
                  
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-end justify-between mb-2">
                        <span className="text-sm font-bold text-slate-300">Điểm uy tín</span>
                        <span className="text-2xl font-display font-black text-blue-400">{Math.round(user.profile?.reputation_score || 0)}<span className="text-xs text-slate-600 font-bold">/200</span></span>
                      </div>
                      <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(user.profile?.reputation_score / 200) * 100}%` }}
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.05]">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ca đã làm</p>
                        <p className="text-xl font-display font-black text-slate-200">{user.profile?.total_shifts_done || 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Xếp hạng</p>
                        <p className="text-xl font-display font-black text-emerald-400">Vàng</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="p-6 space-y-6">
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full" />
                  Trạng thái tài khoản
                </h3>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Email</span>
                    <span className="text-sm text-slate-300 font-medium truncate ml-4 max-w-[150px]">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Gia nhập</span>
                    <span className="text-sm text-slate-300 font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Xác minh</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Đã xác minh</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Main Forms */}
            <motion.div variants={itemVariants} className="lg:col-span-8 space-y-8 order-1 lg:order-2">
              <Card className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-black text-white tracking-tight">Thông tin cá nhân</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Cập nhật hồ sơ để nhà tuyển dụng dễ tiếp cận</p>
                  </div>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Họ và tên đầy đủ *"
                      value={profileForm.full_name}
                      onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                      required
                      placeholder="VD: Nguyễn Văn A"
                    />
                    <Input
                      label="Số điện thoại di động"
                      type="tel"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="09xx xxx xxx"
                    />
                  </div>

                  {user?.role === 'employer' && (
                    <div className="space-y-6 pt-6 border-t border-white/[0.05]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Tên doanh nghiệp *"
                          value={profileForm.company_name}
                          onChange={e => setProfileForm(f => ({ ...f, company_name: e.target.value }))}
                          required
                          placeholder="VD: Công ty TNHH SmartWork"
                        />
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Ngành nghề</label>
                          <select
                            value={profileForm.industry}
                            onChange={e => setProfileForm(f => ({ ...f, industry: e.target.value }))}
                            className="w-full bg-slate-900/80 border border-white/[0.10] text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                          >
                            <option value="">-- Chọn ngành nghề --</option>
                            {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                          </select>
                        </div>
                      </div>
                      <Input
                        label="Địa chỉ trụ sở"
                        value={profileForm.address}
                        onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))}
                        placeholder="Số nhà, đường, quận/huyện..."
                      />
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Giới thiệu doanh nghiệp</label>
                        <textarea
                          value={profileForm.description}
                          onChange={e => setProfileForm(f => ({ ...f, description: e.target.value }))}
                          className="w-full bg-slate-900/80 border border-white/[0.10] text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all min-h-[120px] resize-none"
                          placeholder="Giới thiệu ngắn gọn về quy mô và lĩnh vực hoạt động của doanh nghiệp..."
                        />
                      </div>
                    </div>
                  )}

                  {user?.role === 'student' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/[0.05]">
                      <Input
                        label="Mã số sinh viên"
                        value={profileForm.student_id}
                        onChange={e => setProfileForm(f => ({ ...f, student_id: e.target.value }))}
                        placeholder="VD: B21DCCN001"
                      />
                      <Input
                        label="Trường đang theo học"
                        value={profileForm.university}
                        onChange={e => setProfileForm(f => ({ ...f, university: e.target.value }))}
                        placeholder="VD: Học viện Công nghệ Bưu chính Viễn thông"
                      />
                    </div>
                  )}

                  <AnimatePresence>
                    {profileMsg && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} key="profile-msg">
                        <p className={msgClass(profileMsg.type)}>{profileMsg.text}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="flex justify-end pt-4">
                    <Button type="submit" variant="primary" isLoading={profileLoading} className="px-10 shadow-lg shadow-blue-500/20">
                      Cập nhật hồ sơ
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Password Section */}
              <Card className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-black text-white tracking-tight">Bảo mật tài khoản</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Thay đổi mật khẩu định kỳ để bảo vệ tài khoản</p>
                  </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <Input
                    label="Mật khẩu hiện tại"
                    type="password"
                    value={pwForm.current_password}
                    onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                    error={pwErrors.current_password}
                    placeholder="••••••••"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Mật khẩu mới"
                      type="password"
                      value={pwForm.new_password}
                      onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                      error={pwErrors.new_password}
                      placeholder="Tối thiểu 8 ký tự"
                    />
                    <Input
                      label="Xác nhận mật khẩu"
                      type="password"
                      value={pwForm.confirm_password}
                      onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                      error={pwErrors.confirm_password}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                  
                  <AnimatePresence>
                    {pwMsg && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} key="pw-msg">
                        <p className={msgClass(pwMsg.type)}>{pwMsg.text}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" variant="primary" isLoading={pwLoading} className="px-10 shadow-lg shadow-rose-500/10">
                      Đổi mật khẩu
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  )
}

export default ProfilePage
