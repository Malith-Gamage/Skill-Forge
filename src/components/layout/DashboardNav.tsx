'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Coins } from 'lucide-react';
import NotificationPanel from '@/components/dashboard/NotificationPanel';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { apiFetch } from '@/lib/api';

interface Me {
  name: string;
  coin_balance: number;
}

export default function DashboardNav() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then((data) => setMe({ name: data.name, coin_balance: data.coin_balance }))
      .catch(() => {});
  }, []);

  const initials = me?.name
    ? me.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-50">
      <Link href="/dashboard" className="flex items-center gap-2 font-bold text-base text-gray-900 dark:text-white shrink-0">
        <span className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </span>
        SkillForge
      </Link>

      <div className="flex items-center gap-3">
        {me && (
          <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-full px-3 py-1.5">
            <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{me.coin_balance.toLocaleString()}</span>
          </div>
        )}
        <NotificationPanel />
        <ThemeToggle />
        <Link href="/profile" aria-label="Profile">
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-primary-end flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
        </Link>
      </div>
    </nav>
  );
}
