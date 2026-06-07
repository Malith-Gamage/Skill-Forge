import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { AnswerForm, AcceptButton } from '@/components/community/AnswerForm'

export const metadata = { title: 'Question — SkillForge' }

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
      <Link href="/community/feed" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to feed
      </Link>

      {/* Question */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-3">
          {post.skill_domain && (
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{post.skill_domain}</span>
          )}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${
            post.status === 'ANSWERED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {post.status}
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h1>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        <p className="text-xs text-gray-400 mt-4">Asked by {post.author_name} · {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      {/* Answers */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">{answers.length} Answer{answers.length !== 1 ? 's' : ''}</h2>

        {answers.length === 0 ? (
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-400">
            No answers yet. Be the first to help!
          </div>
        ) : (
          <div className="space-y-3">
            {answers.map((answer) => {
              const analysis = answer.ai_analysis
                ? (() => { try { return JSON.parse(answer.ai_analysis!); } catch { return null; } })()
                : null;
              const qualityColor: Record<string, string> = {
                Excellent: 'bg-green-100 text-green-700 border-green-200',
                Good:      'bg-blue-100 text-blue-700 border-blue-200',
                Fair:      'bg-amber-100 text-amber-700 border-amber-200',
                Poor:      'bg-red-100 text-red-700 border-red-200',
              };
              return (
                <div
                  key={answer.id}
                  className={`bg-white rounded-xl border p-5 ${answer.is_accepted ? 'border-green-300 bg-green-50' : 'border-gray-100'}`}
                >
                  {answer.is_accepted && (
                    <div className="flex items-center gap-1.5 text-green-700 text-xs font-semibold mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Accepted Answer
                    </div>
                  )}
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{answer.content}</p>

                  {/* AI Analysis panel */}
                  {analysis && (
                    <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">AI Analysis</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${qualityColor[analysis.quality] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {analysis.quality} · {analysis.score}/10
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{analysis.feedback}</p>
                      {analysis.suggestions?.length > 0 && (
                        <ul className="space-y-0.5">
                          {analysis.suggestions.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                              <span className="mt-0.5 shrink-0 text-amber-500">•</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-400">{answer.author_name} · {new Date(answer.created_at).toLocaleDateString()}</p>
                    {!hasAccepted && post.status === 'OPEN' && (
                      <AcceptButton postId={postId} answerId={answer.id} isOwner={isPostOwner} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Answer form */}
      {post.status !== 'CLOSED' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Your Answer</h2>
          <AnswerForm postId={postId} />
        </div>
      )}
    </div>
  )
}
