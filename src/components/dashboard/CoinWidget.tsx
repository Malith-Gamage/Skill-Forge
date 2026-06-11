import { Coins } from 'lucide-react';

interface CoinWidgetProps {
  balance: number;
  className?: string;
}

export default function CoinWidget({ balance, className = '' }: CoinWidgetProps) {
  return (
    <div className={`inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-full px-3 py-1.5 ${className}`}>
      <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{balance.toLocaleString()}</span>
    </div>
  );
}
