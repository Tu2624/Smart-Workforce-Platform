import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/useAuthStore'
import AuthLayout from '../../components/layout/AuthLayout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

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
      const status = err?.response?.status
      if (status === 401) setError('Email hoặc mật khẩu không đúng')
      else if (status >= 400 && status < 500) setError('Thông tin đăng nhập không hợp lệ')
      else setError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout className="items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0, 0, 1] }}
        className="w-full max-w-sm"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-black text-xl shadow-glow-cyan mx-auto mb-4">S</div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Smart Workforce</h1>
          <p className="text-slate-500 text-sm mt-1">Đăng nhập để tiếp tục</p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-7 shadow-glass">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="abc@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Mật khẩu"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 text-slate-500 cursor-pointer select-none">
                <input type="checkbox" className="rounded border-white/[0.15] bg-slate-900 text-cyan-500 focus:ring-cyan-500/30 focus:ring-offset-0" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <span className="text-slate-600 cursor-not-allowed text-xs">Quên mật khẩu?</span>
            </div>

            <Button type="submit" className="w-full mt-2" size="lg" isLoading={loading}>
              Đăng nhập
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6 pt-5 border-t border-white/[0.08]">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">Đăng ký miễn phí</Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  )
}

export default LoginPage
