import { Coins, TrendingUp, TrendingDown } from 'lucide-react';

interface CoinTx {
  id: string;
  type: string;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  created_at: string;
}

interface CoinHistoryProps {
  history: CoinTx[];
}

export default function CoinHistory({ history }: CoinHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
        <Coins className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">No transactions yet. Complete tasks to earn coins!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {history.map((tx) => (
        <div key={tx.id} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              tx.direction === 'CREDIT'
                ? 'bg-green-100 dark:bg-green-900/40'
                : 'bg-red-100 dark:bg-red-900/40'
            }`}
          >
            {tx.direction === 'CREDIT'
              ? <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              : <TrendingDown className="w-4 h-4 text-red-500 dark:text-red-400" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{tx.description}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {new Date(tx.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
            </p>
          </div>
          <span
            className={`text-sm font-bold shrink-0 ${
              tx.direction === 'CREDIT' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
            }`}
          >
            {tx.direction === 'CREDIT' ? '+' : '-'}{tx.amount}
          </span>
        </div>
      ))}
    </div>
  );
}
