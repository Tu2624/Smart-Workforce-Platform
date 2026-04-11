import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/useAuthStore'
import { LoginIllustration } from '../../components/ui/Illustrations'
import { containerVariants, itemVariants } from '../../utils/animations'
import AuthLayout from '../../components/layout/AuthLayout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      await login(email, password)
      const user = useAuthStore.getState().user
      if (user?.role === 'admin') navigate('/admin')
      else if (user?.role === 'employer') navigate('/employer')
      else navigate('/student')
    } catch (err: any) {
      setError('Thông tin tài khoản không đúng')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout className="items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        <Card className="shadow-2xl">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {/* Optimized Illustration Container */}
            <motion.div variants={itemVariants} className="flex justify-center mb-8">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-indigo-50/50 rounded-3xl p-6 backdrop-blur-sm border border-indigo-100/20 shadow-inner">
                <LoginIllustration />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center mb-10">
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight uppercase mb-2">Smart Workforce</h1>
              <p className="text-slate-500 font-medium">Đăng nhập để bắt đầu quản lý công việc của bạn</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold flex items-center border border-red-100 shadow-sm"
                  >
                    <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-5">
                <motion.div variants={itemVariants}>
                  <Input id="email" label="Email" type="email" placeholder="abc@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Input id="password" label="Mật khẩu" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="font-medium hover:text-slate-900 transition-colors">Ghi nhớ đăng nhập</span>
                </label>
                <Link to="/forgot-password" className="font-bold text-indigo-600 hover:text-indigo-500">Quên mật khẩu?</Link>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2">
                <Button type="submit" className="w-full" size="lg" isLoading={loading}>Đăng Nhập Ngay</Button>
              </motion.div>

              <motion.div variants={itemVariants} className="text-center text-sm text-slate-500 pt-6 border-t border-slate-100">
                Chưa có tài khoản tuyển dụng? <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-500">Đăng ký miễn phí</Link>
              </motion.div>
            </form>
          </motion.div>
        </Card>
      </motion.div>
    </AuthLayout>
  )
}

export default LoginPage
