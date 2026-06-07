import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Admin — SkillForge' }

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: string
}

function StatCard({ label, value, sub, color = 'text-gray-900' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default async function AdminDashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'ADMIN') redirect('/dashboard')

  const [[dau], [totalUsers], [suspendedUsers], [totalRoadmaps], [activeRoadmaps], [completedRoadmaps],
    [coinCirculation], [coinsIssuedToday], [postsToday], [totalPosts], [pendingSessions]] = await Promise.all([
    query<{ n: number }>(`SELECT COUNT(DISTINCT user_id) AS n FROM coin_transactions WHERE DATE(created_at) = CURDATE()`),
    query<{ n: number }>(`SELECT COUNT(*) AS n FROM users`),
    query<{ n: number }>(`SELECT COUNT(*) AS n FROM users WHERE status = 'SUSPENDED'`),
    query<{ n: number }>(`SELECT COUNT(*) AS n FROM roadmaps`),
    query<{ n: number }>(`SELECT COUNT(*) AS n FROM roadmaps WHERE status = 'IN_PROGRESS'`),
    query<{ n: number }>(`SELECT COUNT(*) AS n FROM roadmaps WHERE status = 'COMPLETED'`),
    query<{ n: number }>(`SELECT COALESCE(SUM(coin_balance), 0) AS n FROM profiles`),
    query<{ n: number }>(`SELECT COALESCE(SUM(amount), 0) AS n FROM coin_transactions WHERE direction = 'CREDIT' AND DATE(created_at) = CURDATE()`),
    query<{ n: number }>(`SELECT COUNT(*) AS n FROM community_posts WHERE DATE(created_at) = CURDATE()`),
    query<{ n: number }>(`SELECT COUNT(*) AS n FROM community_posts`),
    query<{ n: number }>(`SELECT COUNT(*) AS n FROM expert_sessions WHERE status = 'PENDING'`),
  ])

  const pending = Number(pendingSessions?.n ?? 0)

  const navItems = [
    { href: '/admin/experts', label: 'Manage Experts', icon: '👤', desc: 'Add, edit, remove industry experts' },
    { href: '/admin/users', label: 'User Management', icon: '👥', desc: 'View and suspend users' },
    { href: '/admin/roadmaps', label: 'Roadmap Moderation', icon: '🗺️', desc: 'Review and remove roadmaps' },
    { href: '/admin/sessions', label: 'Session Approvals', icon: '📅', desc: `${pending} pending session${pending !== 1 ? 's' : ''}` },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Platform overview — {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Daily Active Users" value={Number(dau?.n ?? 0)} sub="coin actions today" color="text-indigo-600" />
        <StatCard label="Total Users" value={Number(totalUsers?.n ?? 0)} sub={`${Number(suspendedUsers?.n ?? 0)} suspended`} />
        <StatCard label="Total Roadmaps" value={Number(totalRoadmaps?.n ?? 0)} sub={`${Number(activeRoadmaps?.n ?? 0)} active · ${Number(completedRoadmaps?.n ?? 0)} done`} />
        <StatCard label="Coin Circulation" value={Number(coinCirculation?.n ?? 0).toLocaleString()} sub={`+${Number(coinsIssuedToday?.n ?? 0)} today`} color="text-amber-600" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Community Posts" value={Number(totalPosts?.n ?? 0)} sub={`${Number(postsToday?.n ?? 0)} today`} />
        <StatCard label="Pending Sessions" value={pending} sub="awaiting confirmation" color={pending > 0 ? 'text-orange-600' : 'text-gray-900'} />
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Quick access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white border border-gray-100 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all flex items-center gap-4"
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
