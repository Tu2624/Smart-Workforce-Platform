export default function StudentAttendance() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Chấm công</h1>
      <div className="bg-white rounded-xl p-8 shadow-sm border text-center mb-6">
        <p className="text-gray-500 mb-4">Ca hiện tại</p>
        <button className="bg-blue-600 text-white text-xl font-bold px-12 py-6 rounded-2xl hover:bg-blue-700 transition-colors">
          CHECK IN
        </button>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h2 className="font-semibold mb-4">Lịch sử chấm công</h2>
        <p className="text-gray-400 text-sm">// TODO: Attendance history table</p>
      </div>
    </div>
  )
}
