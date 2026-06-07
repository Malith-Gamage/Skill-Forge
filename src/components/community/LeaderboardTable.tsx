import { Trophy, Coins, Medal } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  answers_given: number;
  coins_earned: number;
  badges_count: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

const medals = ['🥇', '🥈', '🥉'];
const rowBg: Record<number, string> = {
  1: 'bg-amber-50 border-amber-200',
  2: 'bg-gray-50 border-gray-200',
  3: 'bg-orange-50 border-orange-200',
};

export default function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
        <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No entries yet. Start contributing to the community!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry, i) => {
        const rank = entry.rank ?? i + 1;
        const top3 = rank <= 3;
        return (
          <div
            key={entry.user_id}
            className={`flex items-center gap-4 p-4 rounded-2xl border ${
              top3 ? rowBg[rank] : 'bg-white border-gray-100'
            }`}
          >
            <div className="w-10 text-center shrink-0">
              {top3 ? (
                <span className="text-xl">{medals[rank - 1]}</span>
              ) : (
                <span className="text-sm font-bold text-gray-500">#{rank}</span>
              )}
            </div>
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-primary-end flex items-center justify-center text-white text-sm font-bold shrink-0">
              {entry.user_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{entry.user_name}</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
              <span className="flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 text-blue-500" /> {entry.answers_given}
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <Coins className="w-3.5 h-3.5" /> {entry.coins_earned}
              </span>
              <span className="flex items-center gap-1 text-purple-600">
                <Trophy className="w-3.5 h-3.5" /> {entry.badges_count}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
