import { ShieldCheck, ShieldOff } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  email_verified: boolean;
  coin_balance: number;
  learning_streak: number;
  created_at: string;
}

interface UserTableProps {
  users: User[];
  onToggleSuspend: (user: User) => void;
  updatingId?: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  LEARNER:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  ADMIN:     'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  EXPERT:    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  SUSPENDED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export default function UserTable({ users, onToggleSuspend, updatingId }: UserTableProps) {
  return (
    <div className="flex flex-col gap-3">
      {users.map((user) => (
        <div key={user.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {user.role}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {user.coin_balance ?? 0} coins · streak {user.learning_streak ?? 0}
            </p>
          </div>
          <button
            onClick={() => onToggleSuspend(user)}
            disabled={updatingId === user.id}
            title={user.role === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}
            className={`shrink-0 p-2 rounded-xl transition-colors ${
              user.role === 'SUSPENDED'
                ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
                : 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
            }`}
          >
            {updatingId === user.id ? (
              <Spinner size="sm" />
            ) : user.role === 'SUSPENDED' ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldOff className="w-5 h-5" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
