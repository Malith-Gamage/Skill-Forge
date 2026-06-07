import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Coin History — SkillForge' }

const PAGE_SIZE = 20

export default async function CoinsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { page } = await searchParams
  const pageNum = Math.max(1, parseInt(page ?? '1', 10))
  const offset = (pageNum - 1) * PAGE_SIZE

  const [profile] = await query<{ coin_balance: number; total_coins_earned: number }>(
    `SELECT p.coin_balance, p.total_coins_earned FROM profiles p WHERE p.user_id = ?`,
    [session.userId]
  )

  const transactions = await query<{
    id: string; type: string; amount: number; direction: string; description: string; created_at: string
  }>(
    `SELECT id, type, amount, direction, description, created_at
     FROM coin_transactions
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
    [session.userId]
  )

  const [totalRow] = await query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM coin_transactions WHERE user_id = ?`,
    [session.userId]
  )
  const total = Number(totalRow?.total ?? 0)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const typeLabel: Record<string, string> = {
    TASK_REWARD: 'Task reward',
    COMMUNITY_EARN: 'Community earn',
    COMMUNITY_SPEND: 'Community spend',
    SESSION_REDEEM: 'Session booking',
    REFUND: 'Refund',
    ADMIN_GRANT: 'Admin grant',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Coin History</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track every SCS coin you earn and spend</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Current Balance</p>
          <p className="text-3xl font-bold text-amber-600">{(profile?.coin_balance ?? 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">SCS coins</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Earned</p>
          <p className="text-3xl font-bold text-green-600">{(profile?.total_coins_earned ?? 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">SCS coins</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Transactions</p>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No transactions yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  tx.direction === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {tx.direction === 'CREDIT' ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                  <p className="text-xs text-gray-400">{typeLabel[tx.type] ?? tx.type} · {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <span className={`text-sm font-bold shrink-0 ${tx.direction === 'CREDIT' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.direction === 'CREDIT' ? '+' : '-'}{tx.amount} SCS
                </span>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
            <Link
              href={pageNum > 1 ? `?page=${pageNum - 1}` : '#'}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                pageNum <= 1 ? 'text-gray-300 pointer-events-none' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ← Previous
            </Link>
            <span className="text-xs text-gray-400">Page {pageNum} of {totalPages}</span>
            <Link
              href={pageNum < totalPages ? `?page=${pageNum + 1}` : '#'}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                pageNum >= totalPages ? 'text-gray-300 pointer-events-none' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Next →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
