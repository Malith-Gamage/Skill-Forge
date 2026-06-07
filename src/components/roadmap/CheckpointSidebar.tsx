import { Lock, Play, CheckCircle } from 'lucide-react';

interface Checkpoint {
  id: string;
  title: string;
  status: 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED';
  order_index: number;
  coin_reward: number;
}

interface CheckpointSidebarProps {
  checkpoints: Checkpoint[];
  activeId?: string;
  onSelect?: (id: string) => void;
}

export default function CheckpointSidebar({ checkpoints, activeId, onSelect }: CheckpointSidebarProps) {
  return (
    <div className="flex flex-col gap-1">
      {checkpoints.map((cp, idx) => {
        const active = cp.id === activeId;
        return (
          <button
            key={cp.id}
            onClick={() => cp.status !== 'LOCKED' && onSelect?.(cp.id)}
            disabled={cp.status === 'LOCKED'}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all ${
              active
                ? 'bg-primary text-white'
                : cp.status === 'LOCKED'
                  ? 'text-gray-400 cursor-not-allowed opacity-60'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                active
                  ? 'bg-white/20 text-white'
                  : cp.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-700'
                    : cp.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
              }`}
            >
              {idx + 1}
            </span>
            <span className="flex-1 truncate font-medium">{cp.title}</span>
            {cp.status === 'COMPLETED' && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
            {cp.status === 'IN_PROGRESS' && !active && <Play className="w-3 h-3 text-primary shrink-0" />}
            {cp.status === 'LOCKED' && <Lock className="w-3 h-3 text-gray-400 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
