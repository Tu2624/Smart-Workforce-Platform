import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function ShiftList() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý ca làm</h1>
        <Link to="/employer/shifts/new"><Button>+ Tạo ca</Button></Link>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <p className="text-gray-400 text-sm">// TODO: Shift list with job/date filter</p>
      </div>
    </div>
  )
}
