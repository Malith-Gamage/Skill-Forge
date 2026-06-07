import Link from 'next/link';
import { MessageSquare, Coins } from 'lucide-react';
import Badge from '@/components/ui/Badge';

interface Post {
  id: string;
  title: string;
  status: string;
  answer_count: number;
  coin_cost: number;
  skill_domain: string | null;
  user_name: string;
  created_at: string;
}

interface PostCardProps {
  post: Post;
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/community/post/${post.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm p-4 transition-all flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-gray-800 text-sm leading-snug">{post.title}</h3>
          <Badge
            label={post.status}
            color={post.status === 'ANSWERED' ? 'green' : post.status === 'CLOSED' ? 'gray' : 'blue'}
            size="sm"
          />
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>by {post.user_name}</span>
          <span>{timeAgo(post.created_at)}</span>
          {post.skill_domain && <Badge label={post.skill_domain} color="purple" size="sm" />}
          <div className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> {post.answer_count}
            </span>
            <span className="flex items-center gap-1 text-amber-600">
              <Coins className="w-3.5 h-3.5" /> {post.coin_cost}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
