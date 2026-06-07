import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Coin History — SkillForge' }

const PAGE_SIZE = 20

const typeLabel: Record<string, string> = {
  TASK_REWARD: 'Task reward',
  COMMUNITY_EARN: 'Community earn',
  COMMUNITY_SPEND: 'Community spend',
  SESSION_REDEEM: 'Session booking',
  REFUND: 'Refund',
  ADMIN_GRANT: 'Admin grant',
}

const typeBadgeColor: Record<string, string> = {
  TASK_REWARD: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  COMMUNITY_EARN: 'bg-teal-50 text-teal-700 border-teal-100',
  COMMUNITY_SPEND: 'bg-purple-50 text-purple-700 border-purple-100',
  SESSION_REDEEM: 'bg-orange-50 text-orange-600 border-orange-100',
  REFUND: 'bg-sky-50 text-sky-600 border-sky-100',
  ADMIN_GRANT: 'bg-amber-50 text-amber-700 border-amber-100',
}

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

  return (
    <div className="flex flex-col h-full gap-5">

      {/* Page title */}
      <div className="dash-fade-up shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Coin History</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track every SCS coin you earn and spend</p>
      </div>

      {/* Hero balance card */}
      <div
        className="coin-card-shimmer dash-fade-up dash-d-1 relative rounded-2xl overflow-hidden p-4 shadow-lg shrink-0"
        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 55%, #1d4ed8 100%)', boxShadow: '0 16px 48px rgba(37, 99, 235, 0.35)' }}
      >
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '26px 26px' }}
        />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-1">Current Balance</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-black text-white leading-none tracking-tight coin-bal-pulse">
                {(profile?.coin_balance ?? 0).toLocaleString()}
              </p>
              <p className="text-blue-200 text-base font-bold mb-0.5">SCS</p>
            </div>
          </div>

          {/* Animated coin icon */}
          <div className="coin-ring-pulse w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shrink-0 coin-icon-anim">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
            </svg>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 mt-3 pt-3 border-t border-white/20 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
              </svg>
            </div>
            <div>
              <p className="text-blue-100/80 text-[10px] uppercase tracking-widest font-semibold">Total Earned</p>
              <p className="text-white font-bold text-sm leading-tight">
                {(profile?.total_coins_earned ?? 0).toLocaleString()} <span className="text-blue-200 font-medium text-xs">SCS</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
              </svg>
            </div>
            <div>
              <p className="text-blue-100/80 text-[10px] uppercase tracking-widest font-semibold">Transactions</p>
              <p className="text-white font-bold text-sm leading-tight">{total.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction history card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm dash-fade-up dash-d-2 flex-1 flex flex-col min-h-0">

        {/* Card header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Transaction History</p>
            <p className="text-xs text-gray-400">{total} total transaction{total !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Empty state */}
        {transactions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4 coin-icon-anim">
              <svg className="w-9 h-9 text-blue-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No transactions yet</p>
            <p className="text-xs text-gray-400">Complete tasks and activities to earn SCS coins</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 flex-1 overflow-y-auto">
            {transactions.map((tx, i) => {
              const isCredit = tx.direction === 'CREDIT'
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-amber-50/25 transition-colors tx-row-in"
                  style={{ animationDelay: `${Math.min(i * 0.045, 0.4)}s` }}
                >
                  {/* Direction icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isCredit
                      ? 'bg-emerald-50 border border-emerald-100'
                      : 'bg-red-50 border border-red-100'
                  }`}>
                    {isCredit ? (
                      <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z" />
                      </svg>
                    )}
                  </div>

                  {/* Description + type badge + date */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        typeBadgeColor[tx.type] ?? 'bg-gray-50 text-gray-500 border-gray-100'
                      }`}>
                        {typeLabel[tx.type] ?? tx.type}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="shrink-0 text-right">
                    <p className={`text-base font-black ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isCredit ? '+' : '−'}{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400">SCS</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40">
            <Link
              href={pageNum > 1 ? `?page=${pageNum - 1}` : '#'}
              className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
                pageNum <= 1
                  ? 'text-gray-300 pointer-events-none'
                  : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Link>

            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs font-medium text-gray-500">Page {pageNum} of {totalPages}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>

            <Link
              href={pageNum < totalPages ? `?page=${pageNum + 1}` : '#'}
              className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
                pageNum >= totalPages
                  ? 'text-gray-300 pointer-events-none'
                  : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
              }`}
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
