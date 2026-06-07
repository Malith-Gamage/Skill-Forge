export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-56 bg-gray-200 rounded-lg mb-2" />
        <div className="h-4 w-40 bg-gray-100 rounded" />
      </div>

      <div>
        <div className="h-4 w-24 bg-gray-100 rounded mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="h-3 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-2 w-full bg-gray-100 rounded-full mt-4" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="h-4 w-28 bg-gray-100 rounded mb-3" />
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
              </div>
              <div className="h-3 w-12 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
