'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

interface Roadmap {
  id: string
  title: string
  skill: string
  status: string
  created_at: string
  user_name: string
  user_email: string
  checkpoint_count: number
}

const statusBadge: Record<string, string> = {
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED:   'bg-green-100 text-green-700',
  REMOVED:     'bg-red-100 text-red-600',
}

function RoadmapTable() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/roadmaps?page=${page}`)
    const data = await res.json()
    setRoadmaps(data.roadmaps ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  async function handleRemove(id: string) {
    setRemoving(id)
    const res = await fetch(`/api/admin/roadmaps/${id}`, { method: 'PATCH' })
    if (res.ok) { setConfirmId(null); load() }
    setRemoving(null)
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>
      ) : roadmaps.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">No roadmaps found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Roadmap</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Checkpoints</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {roadmaps.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900">{r.title}</p>
                    <p className="text-xs text-indigo-600">{r.skill}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-gray-700">{r.user_name}</p>
                    <p className="text-xs text-gray-400">{r.user_email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{r.checkpoint_count}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${statusBadge[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {r.status !== 'REMOVED' && (
                      <button onClick={() => setConfirmId(r.id)} className="text-xs font-medium text-red-500 hover:underline">
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">{total} roadmaps total</p>
          <div className="flex gap-2">
            {page > 1 && (
              <button onClick={() => router.push(`/admin/roadmaps?page=${page - 1}`)}
                className="border border-gray-200 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50">← Prev</button>
            )}
            <span className="px-3 py-1.5 text-xs text-gray-500">Page {page} of {totalPages}</span>
            {page < totalPages && (
              <button onClick={() => router.push(`/admin/roadmaps?page=${page + 1}`)}
                className="border border-gray-200 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50">Next →</button>
            )}
          </div>
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Remove Roadmap?</h2>
            <p className="text-sm text-gray-600">This sets the roadmap status to REMOVED. It will no longer appear for the user.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleRemove(confirmId)} disabled={removing === confirmId}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {removing === confirmId ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminRoadmapsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Roadmap Moderation</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and remove inappropriate roadmaps</p>
      </div>
      <Suspense fallback={<div className="text-sm text-gray-400 py-8 text-center">Loading…</div>}>
        <RoadmapTable />
      </Suspense>
    </div>
  )
}
