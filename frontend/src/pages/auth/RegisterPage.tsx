import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/useAuthStore'
import AuthLayout from '../../components/layout/AuthLayout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const glassInput = 'w-full bg-slate-900/80 border border-white/[0.10] text-slate-100 placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/15 focus:border-cyan-500/60 transition-all resize-none'

const features = [
  { icon: '⚡', text: 'Quản lý ca làm tự động' },
  { icon: '💰', text: 'Tính lương chính xác, minh bạch' },
  { icon: '📊', text: 'Báo cáo hiệu suất theo thời gian thực' },
]

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '', password: '', full_name: '', phone: '', company_name: '', address: '', description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const registerEmployer = useAuthStore((state) => state.registerEmployer)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await registerEmployer(formData)
      navigate('/employer')
    } catch (err: any) {
      const data = err.response?.data
      if (data?.details && Array.isArray(data.details)) {
        setError(data.details.map((d: any) => d.message).join(' | '))
      } else {
        setError(data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout className="flex-col lg:flex-row">
      {/* Left panel: branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-cyan-600/[0.18] via-blue-600/[0.12] to-purple-600/[0.08] border-r border-white/[0.08] z-10">
        <motion.div
          initial={{ x: -16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-lg shadow-glow-cyan">S</div>
          <span className="text-lg font-bold text-white tracking-tight">Smart Workforce</span>
        </motion.div>

        <div className="space-y-8 my-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-5xl xl:text-6xl font-display font-bold text-white leading-tight tracking-tight">
              Nâng tầm<br />
              <span className="text-cyan-400">Nhân sự.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
              Hệ thống quản trị nhân sự thông minh cho doanh nghiệp hiện đại. Tự động hóa ca làm, tính lương và tuyển dụng sinh viên.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-3"
          >
            {features.map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3 text-slate-300 text-sm"
              >
                <span className="w-7 h-7 rounded-lg bg-white/[0.08] border border-white/[0.10] flex items-center justify-center text-sm shrink-0">{item.icon}</span>
                {item.text}
              </motion.div>
            ))}
          </motion.div>
        </div>

        <p className="text-slate-600 text-xs">© 2026 Smart Workforce Platform</p>
      </div>

      {/* Right panel: form */}
      <div className="w-full lg:w-1/2 flex items-start justify-center p-5 md:p-10 overflow-y-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0, 0, 1] }}
          className="w-full max-w-xl my-auto py-6"
        >
          <div className="mb-7">
            <h2 className="text-2xl font-display font-bold text-white">Tạo tài khoản doanh nghiệp</h2>
            <p className="text-slate-500 text-sm mt-1">Tham gia cùng 500+ doanh nghiệp đang sử dụng nền tảng</p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-glass">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 pb-2 border-b border-white/[0.08]">Thông tin tài khoản</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input id="email" label="Email công ty" type="email" placeholder="hr@domain.com" required value={formData.email} onChange={handleChange} />
                  <Input id="password" label="Mật khẩu" type="password" placeholder="••••••••" required value={formData.password} onChange={handleChange} />
                  <Input id="full_name" label="Người đại diện" type="text" placeholder="Nguyễn Văn A" required value={formData.full_name} onChange={handleChange} />
                  <Input id="phone" label="Số điện thoại" type="text" placeholder="0901234567" value={formData.phone} onChange={handleChange} />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 pb-2 border-b border-white/[0.08]">Thông tin tổ chức</p>
                <div className="space-y-4">
                  <Input id="company_name" label="Tên doanh nghiệp" type="text" placeholder="Công ty TNHH..." required value={formData.company_name} onChange={handleChange} />
                  <Input id="address" label="Địa chỉ trụ sở" type="text" placeholder="Số 123, Quận..." value={formData.address} onChange={handleChange} />
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Mô tả</label>
                    <textarea
                      id="description"
                      rows={3}
                      className={glassInput}
                      placeholder="Chia sẻ ngắn gọn về văn hóa doanh nghiệp..."
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-white/[0.04] rounded-xl border border-white/[0.08]">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-white/[0.15] bg-slate-900 text-cyan-500 focus:ring-cyan-500/30 focus:ring-offset-0 shrink-0"
                />
                <span className="text-xs text-slate-400 leading-relaxed">
                  Tôi đồng ý với{' '}
                  <a href="#" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">Điều khoản sử dụng</a>
                  {' '}và{' '}
                  <a href="#" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">Chính sách bảo mật</a>.
                </span>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                Xác nhận &amp; Hoàn tất
              </Button>

              <p className="text-center text-sm text-slate-500 pt-3 border-t border-white/[0.08]">
                Đã là thành viên?{' '}
                <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">Đăng nhập ngay</Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage
