export default function EmployerDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tổng quan</h1>
      <div className="grid grid-cols-4 gap-4">
        {['Ca hôm nay', 'Nhân viên đang làm', 'Chi phí tháng này', 'Tổng ca tháng'].map((label) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold mt-2">—</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-gray-400 text-sm">// TODO: Implement employer dashboard with charts</p>
    </div>
  )
}
