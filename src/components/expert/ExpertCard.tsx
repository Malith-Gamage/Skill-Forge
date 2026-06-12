import Link from 'next/link';
import { Star, Clock } from 'lucide-react';
import Badge from '@/components/ui/Badge';

interface Expert {
  id: string;
  name: string;
  field: string;
  bio: string;
  rate_per_hour: number;
  is_available: boolean;
  expertise: string | null;
}

interface ExpertCardProps {
  expert: Expert;
}

export default function ExpertCard({ expert: e }: ExpertCardProps) {
  return (
    <Link href={`/expert/${e.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm p-5 flex flex-col gap-4 h-full transition-all">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-primary to-primary-end flex items-center justify-center text-white font-bold text-lg shrink-0">
            {e.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">{e.name}</h3>
              {e.is_available && <Badge label="Available" color="green" size="sm" />}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{e.field}</p>
          </div>
        </div>

        {e.bio && (
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{e.bio}</p>
        )}

        {e.expertise && (
          <div className="flex flex-wrap gap-1.5">
            {e.expertise.split(',').slice(0, 3).map((tag: string) => (
              <Badge key={tag} label={tag.trim()} color="blue" size="sm" />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-sm font-semibold">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{e.rate_per_hour} coins/hr</span>
          </div>
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Clock className="w-3.5 h-3.5" /> Book Session
          </span>
        </div>
      </div>
    </Link>
  );
}
