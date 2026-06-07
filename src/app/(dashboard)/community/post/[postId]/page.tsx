import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { AnswerForm, AcceptButton } from '@/components/community/AnswerForm'

export const metadata = { title: 'Question — SkillForge' }

const avatarPalette = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-teal-400 to-cyan-500',
  'from-rose-500 to-orange-400',
  'from-purple-500 to-pink-500',
  'from-emerald-400 to-teal-500',
]

function avatarGradient(name: string): string {
  return avatarPalette[name.charCodeAt(0) % avatarPalette.length]
}

const aiPanelStyle: Record<string, { bg: string; border: string; badge: string }> = {
  Excellent: {
    bg: 'bg-emerald-50',  border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  Good: {
    bg: 'bg-indigo-50',   border: 'border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  },
  Fair: {
    bg: 'bg-amber-50',    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  Poor: {
    bg: 'bg-red-50',      border: 'border-red-200',
    badge: 'bg-red-100 text-red-700 border-red-200',
  },
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { postId } = await params

  const [post] = await query<{
    id: string; title: string; content: string; skill_domain: string;
    status: string; created_at: string; user_id: string; author_name: string
  }>(
    `SELECT cp.id, cp.title, cp.content, cp.skill_domain, cp.status, cp.created_at, cp.user_id,
            u.name AS author_name
     FROM community_posts cp
     JOIN users u ON u.id = cp.user_id
     WHERE cp.id = ?`,
    [postId]
  )

  if (!post) notFound()

  const answers = await query<{
    id: string; content: string; is_accepted: boolean; coin_reward: number;
    ai_analysis: string | null; created_at: string; user_id: string; author_name: string
  }>(
    `SELECT ca.id, ca.content, ca.is_accepted, ca.coin_reward, ca.ai_analysis, ca.created_at, ca.user_id,
            u.name AS author_name
     FROM community_answers ca
     JOIN users u ON u.id = ca.user_id
     WHERE ca.post_id = ?
     ORDER BY ca.is_accepted DESC, ca.created_at ASC`,
    [postId]
  )

  const isPostOwner = post.user_id === session.userId
  const hasAccepted = answers.some((a) => a.is_accepted)

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Back link */}
      <Link
        href="/community/feed"
        className="dash-fade-up inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to Feed
      </Link>

      {/* ── Question Card ── */}
      <div className="dash-fade-up dash-d-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 pt-6 pb-5">
          {/* Tags row */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {post.skill_domain && (
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                {post.skill_domain}
              </span>
            )}
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                post.status === 'ANSWERED'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  : post.status === 'CLOSED'
                  ? 'bg-gray-100 text-gray-500 border-gray-200'
                  : 'bg-blue-50 text-blue-600 border-blue-100'
              }`}
            >
              {post.status}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl font-extrabold text-gray-900 leading-snug mb-4">
            {post.title}
          </h1>

          {/* Content */}
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Author footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-full bg-linear-to-br ${avatarGradient(post.author_name)} flex items-center justify-center text-white font-bold text-xs shrink-0`}
            >
              {post.author_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700">{post.author_name}</p>
              <p className="text-[10px] text-gray-400">
                Asked {new Date(post.created_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.671 1.09-.085 2.17-.207 3.238-.364 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
            {answers.length} answer{answers.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* ── Answers Section ── */}
      <div className="dash-fade-up dash-d-2">

        {/* Section header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.671 1.09-.085 2.17-.207 3.238-.364 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
            </h2>
            <p className="text-xs text-gray-400">Community responses</p>
          </div>
        </div>

        {/* Empty state */}
        {answers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.671 1.09-.085 2.17-.207 3.238-.364 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            </div>
            <p className="text-gray-700 font-semibold mb-1">No answers yet</p>
            <p className="text-gray-400 text-sm">Be the first to help and earn coins!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {answers.map((answer, i) => {
              const analysis = answer.ai_analysis
                ? (() => { try { return JSON.parse(answer.ai_analysis!); } catch { return null; } })()
                : null
              const aiStyle = aiPanelStyle[analysis?.quality] ?? {
                bg: 'bg-gray-50', border: 'border-gray-200',
                badge: 'bg-gray-100 text-gray-600 border-gray-200',
              }

              return (
                <div
                  key={answer.id}
                  className={`badge-enter relative bg-white rounded-2xl border shadow-sm overflow-hidden ${
                    answer.is_accepted ? 'border-emerald-200' : 'border-gray-100'
                  }`}
                  style={{ animationDelay: `${0.1 + i * 0.07}s` }}
                >
                  {/* Left accent strip */}
                  {answer.is_accepted && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.75 bg-emerald-400" />
                  )}

                  <div className="p-5">
                    {/* Accepted label */}
                    {answer.is_accepted && (
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </div>
                          <span className="text-xs font-bold uppercase tracking-wide">Accepted Answer</span>
                        </div>
                        {answer.coin_reward > 0 && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                            +{answer.coin_reward} coins awarded
                          </span>
                        )}
                      </div>
                    )}

                    {/* Answer text */}
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {answer.content}
                    </p>

                    {/* AI Analysis */}
                    {analysis && (
                      <div className={`mt-4 rounded-xl border p-4 ${aiStyle.bg} ${aiStyle.border}`}>
                        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            AI Quality Analysis
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${aiStyle.badge}`}>
                            {analysis.quality} · {analysis.score}/10
                          </span>
                        </div>
                        {analysis.feedback && (
                          <p className="text-xs text-gray-600 leading-relaxed mb-2">
                            {analysis.feedback}
                          </p>
                        )}
                        {analysis.suggestions?.length > 0 && (
                          <ul className="space-y-1 mt-2">
                            {analysis.suggestions.map((s: string, si: number) => (
                              <li key={si} className="flex items-start gap-1.5 text-xs text-gray-500">
                                <span className="text-indigo-400 font-bold shrink-0 mt-0.5">→</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Answer footer: author + accept button */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full bg-linear-to-br ${avatarGradient(answer.author_name)} flex items-center justify-center text-white font-bold text-[10px] shrink-0`}
                        >
                          {answer.author_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700">{answer.author_name}</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(answer.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      {!hasAccepted && post.status === 'OPEN' && (
                        <AcceptButton postId={postId} answerId={answer.id} isOwner={isPostOwner} />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Answer Form ── */}
      {post.status !== 'CLOSED' ? (
        <div className="dash-fade-up dash-d-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Your Answer</h2>
              <p className="text-xs text-gray-400 mt-0.5">Quality answers are scored by AI and earn more coins</p>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full shrink-0">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
              </svg>
              Earn coins
            </span>
          </div>
          <AnswerForm postId={postId} />
        </div>
      ) : (
        <div className="dash-fade-up dash-d-3 bg-gray-50 rounded-2xl border border-gray-200 p-5 text-center">
          <p className="text-sm text-gray-500 font-medium">
            This question is closed and no longer accepting answers.
          </p>
        </div>
      )}
    </div>
  )
}
