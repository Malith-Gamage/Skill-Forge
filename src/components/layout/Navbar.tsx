interface NavbarProps {
  name: string
  coinBalance: number
  unreadCount: number
  avatarUrl?: string | null
}

export default function Navbar({ name, coinBalance, unreadCount, avatarUrl }: NavbarProps) {
  const initial = name.charAt(0).toUpperCase()

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-end px-6 gap-3 shrink-0">
      <div
        className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 text-sm font-semibold text-blue-700"
        aria-label={`${coinBalance.toLocaleString()} SkillCoins`}
        role="status"
      >
        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
        </svg>
        <span aria-hidden="true">{coinBalance.toLocaleString()} SCS</span>
      </div>

      <a
        href="/dashboard/notifications"
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </a>

      <a href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold select-none"
            aria-label={`User profile: ${name}`}
          >
            <span aria-hidden="true">{initial}</span>
          </div>
        )}
        <span className="text-sm font-medium text-gray-700 hidden sm:block">{name}</span>
      </a>
    </header>
  )
}
