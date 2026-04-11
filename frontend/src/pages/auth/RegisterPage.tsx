import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/useAuthStore'
import { RegisterIllustration } from '../../components/ui/Illustrations'
import { containerVariants, itemVariants } from '../../utils/animations'
import AuthLayout from '../../components/layout/AuthLayout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'

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
        // Zod validation array
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
      {/* Left Side: Branding & Info (Hidden on mobile) */}
      <div className="hidden lg:flex w-full lg:w-1/2 flex-col justify-between p-12 xl:p-20 relative bg-slate-900/50 border-r border-slate-800/50 backdrop-blur-sm z-10">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex items-center space-x-4 text-white"
        >
          <div className="w-12 h-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center font-black text-2xl shadow-xl shadow-white/5">S</div>
          <span className="text-2xl font-black tracking-tight uppercase">Smart Workforce</span>
        </motion.div>

        <div className="space-y-12 my-auto">
          <div className="space-y-6">
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-6xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight"
            >
              Nâng tầm <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-indigo-400 animate-gradient">Nhân sự.</span>
            </motion.h2>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl text-slate-400 max-w-lg leading-relaxed font-medium"
            >
              Hệ thống quản trị nhân sự thông minh cho doanh nghiệp hiện đại. Tự động hóa ca làm, tính lương và tuyển dụng sinh viên.
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="w-full max-w-md p-8 bg-indigo-500/5 rounded-[40px] border border-white/5 shadow-2xl"
          >
            <RegisterIllustration />
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-slate-500 text-sm font-medium tracking-wide"
        >
          © 2026 SMART WORKFORCE PLATFORM.
        </motion.div>
      </div>

      {/* Right Side: Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 overflow-y-auto bg-slate-900/40 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl my-auto py-8"
        >
          <Card className="shadow-2xl">
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.div variants={itemVariants} className="mb-10">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Đăng ký ngay</h2>
                <p className="text-base md:text-lg text-slate-500 font-medium">Gia nhập cộng đồng hơn 500+ doanh nghiệp thành công</p>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-center shadow-sm"
                    >
                      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-8">
                  <motion.div variants={itemVariants} className="space-y-5">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-50 pb-3">Thông tin tài khoản</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input id="email" label="Email Công ty" type="email" placeholder="hr@domain.com" required value={formData.email} onChange={handleChange} />
                      <Input id="password" label="Mật khẩu" type="password" placeholder="••••••••" required value={formData.password} onChange={handleChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input id="full_name" label="Người đại diện" type="text" placeholder="Nguyễn Văn A" required value={formData.full_name} onChange={handleChange} />
                      <Input id="phone" label="Số điện thoại" type="text" placeholder="0901234567" value={formData.phone} onChange={handleChange} />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-5">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-50 pb-3">Thông tin tổ chức</h3>
                    <Input id="company_name" label="Tên doanh nghiệp" type="text" placeholder="TẬP ĐOÀN... / CÔNG TY TNHH..." required value={formData.company_name} onChange={handleChange} />
                    <Input id="address" label="Địa chỉ trụ sở" type="text" placeholder="Số 123, Quận..." value={formData.address} onChange={handleChange} />
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Mô tả định hướng</label>
                      <textarea id="description" rows={3} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none resize-none font-medium" placeholder="Chia sẻ ngắn gọn về văn hóa doanh nghiệp của bạn..." value={formData.description} onChange={handleChange}></textarea>
                    </div>
                  </motion.div>
                </div>

                <motion.div variants={itemVariants} className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <input type="checkbox" required className="mt-1 flex-shrink-0 h-5 w-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-4 focus:ring-indigo-100" />
                  <label className="text-xs text-slate-500 leading-relaxed font-medium">
                    Tôi xác nhận đã đọc và đồng ý với <a href="#" className="font-bold text-indigo-600 hover:underline">Điều khoản sử dụng</a> và <a href="#" className="font-bold text-indigo-600 hover:underline">Chính sách bảo mật</a> của nền tảng.
                  </label>
                </motion.div>

                <motion.div variants={itemVariants} className="pt-4">
                  <Button type="submit" className="w-full" size="lg" isLoading={loading}>Xác nhận & Hoàn tất</Button>
                </motion.div>

                <motion.div variants={itemVariants} className="text-center text-sm text-slate-500 font-medium pt-2">
                  Đã là thành viên? <Link to="/login" className="font-extrabold text-indigo-600 hover:text-indigo-500 hover:underline">Đăng nhập ngay</Link>
                </motion.div>
              </form>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage
