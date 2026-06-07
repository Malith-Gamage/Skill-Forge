import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const [profile] = await query<{ name: string; coin_balance: number; avatar_url: string | null }>(
    `SELECT u.name, p.coin_balance, p.avatar_url
     FROM users u
     JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ?`,
    [session.userId]
  )

  const [notifRow] = await query<{ unread: number }>(
    `SELECT COUNT(*) AS unread
     FROM notifications
     WHERE user_id = ? AND is_read = 0`,
    [session.userId]
  )

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      <Sidebar role={session.role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          name={profile?.name ?? 'User'}
          coinBalance={profile?.coin_balance ?? 0}
          unreadCount={Number(notifRow?.unread ?? 0)}
          avatarUrl={profile?.avatar_url ?? null}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
