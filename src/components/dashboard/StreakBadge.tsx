import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  className?: string;
}

export default function StreakBadge({ streak, className = '' }: StreakBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full px-3 py-1.5 ${className}`}>
      <Flame className="w-4 h-4 text-orange-500" />
      <span className="text-sm font-semibold text-orange-700">{streak} day{streak !== 1 ? 's' : ''}</span>
    </div>
  );
}
