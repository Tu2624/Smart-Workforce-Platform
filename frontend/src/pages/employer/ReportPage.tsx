export default function ReportPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Báo cáo & Thống kê</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {['Tổng ca', 'Hiệu suất nhân viên', 'Chi phí nhân sự'].map((label) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold mt-2">—</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <p className="text-gray-400 text-sm">// TODO: Charts (shift stats, payroll summary, performance)</p>
      </div>
    </div>
  )
}
