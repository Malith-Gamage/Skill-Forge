import { Trophy, Star } from 'lucide-react';

interface Badge {
  id: string;
  badge_type: string;
  is_golden: boolean;
  checkpoint_title: string | null;
  awarded_at: string;
}

interface BadgeGalleryProps {
  badges: Badge[];
}

const typeColor: Record<string, string> = {
  CHECKPOINT:        'bg-blue-100 text-blue-700',
  GOLDEN:            'bg-amber-100 text-amber-700',
  COMMUNITY_HELPER:  'bg-green-100 text-green-700',
  COMMUNITY_MENTOR:  'bg-green-100 text-green-700',
  COMMUNITY_CHAMPION:'bg-green-100 text-green-700',
};

export default function BadgeGallery({ badges }: BadgeGalleryProps) {
  if (badges.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">No badges yet</p>
        <p className="text-gray-400 text-sm mt-1">Complete your first checkpoint to earn a badge!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {badges.map((b) => (
        <div
          key={b.id}
          className={`group relative bg-white rounded-2xl border p-5 text-center transition-all hover:-translate-y-1 hover:shadow-md cursor-default ${
            b.is_golden
              ? 'ring-2 ring-amber-300 shadow-amber-100 shadow-lg border-amber-200'
              : 'border-gray-100'
          }`}
        >
          {b.is_golden && (
            <Star className="absolute top-3 right-3 w-4 h-4 text-amber-400 fill-amber-400" />
          )}
          <div
            className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-transform group-hover:scale-110 ${
              b.is_golden
                ? 'bg-linear-to-br from-amber-300 to-amber-500'
                : 'bg-blue-100'
            }`}
          >
            <Trophy className={`w-7 h-7 ${b.is_golden ? 'text-white' : 'text-blue-600'}`} />
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              typeColor[b.badge_type] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {b.badge_type.replace(/_/g, ' ')}
          </span>
          {b.checkpoint_title && (
            <p className="text-sm font-medium text-gray-700 mt-3 mb-1">{b.checkpoint_title}</p>
          )}
          <p className="text-xs text-gray-400">
            {new Date(b.awarded_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
          </p>
        </div>
      ))}
    </div>
  );
}
