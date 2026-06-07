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
  LEARNER:   'bg-blue-100 text-blue-700',
  ADMIN:     'bg-purple-100 text-purple-700',
  EXPERT:    'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

export default function UserTable({ users, onToggleSuspend, updatingId }: UserTableProps) {
  return (
    <div className="flex flex-col gap-3">
      {users.map((user) => (
        <div key={user.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 truncate">{user.name}</p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {user.role}
              </span>
            </div>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {user.coin_balance ?? 0} coins · streak {user.learning_streak ?? 0}
            </p>
          </div>
          <button
            onClick={() => onToggleSuspend(user)}
            disabled={updatingId === user.id}
            title={user.role === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}
            className={`flex-shrink-0 p-2 rounded-xl transition-colors ${
              user.role === 'SUSPENDED'
                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                : 'bg-red-50 text-red-500 hover:bg-red-100'
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
