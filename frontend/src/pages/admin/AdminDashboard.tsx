export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Thống kê hệ thống</h1>
      <div className="grid grid-cols-4 gap-4">
        {['Tổng user', 'Tổng job', 'Tổng ca', 'Doanh thu'].map((label) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold mt-2">—</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-gray-400 text-sm">// TODO: GET /api/admin/stats</p>
    </div>
  )
}
