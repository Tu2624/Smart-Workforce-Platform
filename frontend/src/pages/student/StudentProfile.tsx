import { useAuthStore } from '@/store/authStore'

export default function StudentProfile() {
  const { user } = useAuthStore()
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Hồ sơ cá nhân</h1>
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <p className="font-semibold">{user?.full_name}</p>
        <p className="text-gray-500 text-sm">{user?.email}</p>
        <p className="text-gray-400 text-sm mt-4">// TODO: Edit profile form + reputation score display</p>
      </div>
    </div>
  )
}
