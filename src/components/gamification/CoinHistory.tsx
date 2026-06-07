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
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <Coins className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No transactions yet. Complete tasks to earn coins!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {history.map((tx) => (
        <div key={tx.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              tx.direction === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            {tx.direction === 'CREDIT'
              ? <TrendingUp className="w-4 h-4 text-green-600" />
              : <TrendingDown className="w-4 h-4 text-red-500" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{tx.description}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(tx.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
            </p>
          </div>
          <span
            className={`text-sm font-bold shrink-0 ${
              tx.direction === 'CREDIT' ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {tx.direction === 'CREDIT' ? '+' : '-'}{tx.amount}
          </span>
        </div>
      ))}
    </div>
  );
}
