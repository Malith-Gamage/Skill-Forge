import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/roadmap/ProgressBar';

interface RoadmapCardProps {
  id: string;
  title: string;
  skill_domain: string;
  status: string;
  progress?: number;
}

export default function RoadmapCard({ id, title, skill_domain, status, progress }: RoadmapCardProps) {
  return (
    <Link
      href={`/roadmap/${id}`}
      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-[#3B48E8] dark:hover:border-indigo-500 hover:shadow-sm transition-all"
    >
      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center shrink-0">
        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{title}</p>
          <Badge
            label={status.toLowerCase()}
            color={status === 'COMPLETED' ? 'green' : 'blue'}
            size="sm"
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{skill_domain}</p>
        {typeof progress === 'number' && (
          <ProgressBar value={progress} />
        )}
      </div>
    </Link>
  );
}
