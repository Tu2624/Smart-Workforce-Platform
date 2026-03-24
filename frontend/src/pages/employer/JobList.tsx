import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function JobList() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Công việc</h1>
        <Link to="/employer/jobs/new"><Button>+ Tạo công việc</Button></Link>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <p className="text-gray-400 text-sm">// TODO: Job list with status filter</p>
      </div>
    </div>
  )
}
