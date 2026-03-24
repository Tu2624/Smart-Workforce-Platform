export default function StudentPayroll() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Bảng lương</h1>
      <div className="flex gap-2 mb-4">
        {['Theo ca', 'Theo tuần', 'Theo tháng'].map((label) => (
          <button key={label} className="px-4 py-2 rounded-lg bg-gray-100 text-sm hover:bg-blue-50 hover:text-blue-600">{label}</button>
        ))}
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <p className="text-gray-400 text-sm">// TODO: Payroll list with period filter</p>
      </div>
    </div>
  )
}
