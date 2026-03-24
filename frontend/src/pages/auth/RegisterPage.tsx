import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [role, setRole] = useState<'student' | 'employer'>('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true); setError('')
    const fd = new FormData(e.currentTarget)
    const data: Record<string, string> = {}
    fd.forEach((v, k) => { data[k] = v as string })
    try {
      const res = await authApi.register({ ...data, role })
      localStorage.setItem('token', res.data.token)
      setUser(res.data.user)
      navigate(role === 'student' ? '/student' : '/employer')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Đăng ký thất bại')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Đăng ký tài khoản</h1>
        <div className="flex gap-2 mb-6">
          {(['student', 'employer'] as const).map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${role === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {r === 'student' ? 'Sinh viên' : 'Doanh nghiệp'}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="full_name" name="full_name" label="Họ tên" required />
          <Input id="email" name="email" label="Email" type="email" required />
          <Input id="password" name="password" label="Mật khẩu" type="password" required />
          <Input id="phone" name="phone" label="Số điện thoại" />
          {role === 'student' && <>
            <Input id="student_id" name="student_id" label="Mã sinh viên" />
            <Input id="university" name="university" label="Trường đại học" />
          </>}
          {role === 'employer' && <Input id="company_name" name="company_name" label="Tên công ty" required />}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">Đăng ký</Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Đã có tài khoản? <Link to="/login" className="text-blue-600 hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}
