'use client';
import { Star, Share2 } from 'lucide-react';

interface GoldenBadgeProps {
  title?: string;
  description?: string;
  awardedAt?: string;
  shareUrl?: string;
}

export default function GoldenBadge({ title, description, awardedAt, shareUrl }: GoldenBadgeProps) {
  function handleShare() {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
  }

  return (
    <div className="relative bg-linear-to-br from-amber-400 to-amber-600 rounded-3xl p-8 text-center text-white shadow-xl">
      <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-5 flex items-center justify-center">
        <Star className="w-10 h-10 text-white fill-white" />
      </div>

      <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs font-semibold mb-4">
        ✨ Golden Badge
      </div>

      {title && <h2 className="text-2xl font-extrabold mb-2">{title}</h2>}
      {description && <p className="text-amber-100 text-sm mb-4">{description}</p>}
      {awardedAt && (
        <p className="text-amber-200 text-xs">
          Awarded {new Date(awardedAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
        </p>
      )}

      {shareUrl && (
        <button
          onClick={handleShare}
          className="mt-6 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
        >
          <Share2 className="w-4 h-4" /> Copy Share Link
        </button>
      )}
    </div>
  );
}
