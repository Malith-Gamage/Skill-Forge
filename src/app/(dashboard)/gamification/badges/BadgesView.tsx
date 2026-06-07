import type { ReactNode } from 'react'
import Link from 'next/link'

type Badge = {
  id: string
  badge_type: string
  is_golden: boolean
  shareable_slug: string
  awarded_at: string
  checkpoint_title: string | null
  roadmap_title: string | null
}

type CheckpointWithBadge = {
  id: string
  roadmap_id: string
  title: string
  order_index: number
  cp_status: string
  badge_id: string | null
  awarded_at: string | null
}

type RoadmapWithCheckpoints = {
  id: string
  title: string
  skill_domain: string
  status: string
  total_checkpoints: number
  created_at: string
  last_badge_date: string | null
  checkpoints: CheckpointWithBadge[]
}

const communityConfig: Record<string, {
  label: string; desc: string
  bgFrom: string; bgTo: string; border: string
  text: string; iconBg: string; emoji: string
}> = {
  COMMUNITY_HELPER: {
    label: 'Helper', desc: 'Helping others in the community',
    bgFrom: 'from-green-50', bgTo: 'to-emerald-50', border: 'border-green-200',
    text: 'text-green-700', iconBg: 'bg-green-100', emoji: '🤝',
  },
  COMMUNITY_MENTOR: {
    label: 'Mentor', desc: 'Mentoring fellow learners',
    bgFrom: 'from-purple-50', bgTo: 'to-violet-50', border: 'border-purple-200',
    text: 'text-purple-700', iconBg: 'bg-purple-100', emoji: '🌟',
  },
  COMMUNITY_CHAMPION: {
    label: 'Champion', desc: 'Community champion',
    bgFrom: 'from-rose-50', bgTo: 'to-pink-50', border: 'border-rose-200',
    text: 'text-rose-700', iconBg: 'bg-rose-100', emoji: '👑',
  },
}

function fmt(date: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString('en-US', opts ?? { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BadgesView({
  badges,
  roadmaps,
}: {
  badges: Badge[]
  roadmaps: RoadmapWithCheckpoints[]
}) {
  const golden     = badges.filter((b) => b.is_golden)
  const checkpoint = badges.filter((b) => b.badge_type === 'CHECKPOINT')
  const community  = badges.filter((b) => b.badge_type.startsWith('COMMUNITY_'))
  const hasContent = badges.length > 0 || roadmaps.length > 0

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* ── Hero Banner ── */}
      <div className="dash-fade-up relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-800 via-indigo-700 to-violet-800 p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 w-72 h-72 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="pointer-events-none absolute top-6  right-52 w-2.5 h-2.5 rounded-full bg-white/25 sparkle-dot" />
        <div className="pointer-events-none absolute bottom-8 right-28 w-1.5 h-1.5 rounded-full bg-white/20 sparkle-dot-2" />
        <div className="pointer-events-none absolute top-1/2 right-1/3 w-2   h-2   rounded-full bg-white/15 sparkle-dot-3" />
        <div className="pointer-events-none absolute top-1/3 right-16  w-1.5 h-1.5 rounded-full bg-amber-300/30 sparkle-dot-4" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest text-indigo-300 uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Achievement Gallery
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Your Badges{' '}
              <span role="img" aria-label="medal">🏅</span>
            </h1>
            <p className="mt-2 text-indigo-200/80 text-sm leading-relaxed">
              {!hasContent
                ? 'Complete checkpoints and roadmaps to earn your first badge'
                : `${badges.length} badge${badges.length !== 1 ? 's' : ''} earned — keep pushing!`}
            </p>
          </div>

          <div className="flex items-stretch gap-3 shrink-0">
            <HeroPill value={golden.length}     label="Golden"      delay="0.20s" />
            <HeroPill value={checkpoint.length} label="Checkpoints" delay="0.32s" />
            <HeroPill value={community.length}  label="Community"   delay="0.44s" />
          </div>
        </div>
      </div>

      {/* ── Empty State ── */}
      {!hasContent && (
        <div className="dash-fade-up dash-d-2 bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center">
          <div className="badge-trophy-float inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-50 mb-5">
            <TrophyIcon className="w-11 h-11 text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">No badges earned yet</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            Complete checkpoints on your learning roadmaps to earn your first badge.
            Finish a full roadmap to unlock a Golden badge.
          </p>
          <Link
            href="/roadmap/search"
            className="inline-flex items-center gap-2 bg-linear-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            Start a Roadmap
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      )}

      {/* ── Golden Badges ── */}
      {golden.length > 0 && (
        <section>
          <SectionHeader
            label="Golden Badges"
            count={`${golden.length} awarded`}
            delay="dash-d-2"
            icon={<StarIcon className="w-4 h-4 text-amber-500" />}
            iconBg="bg-amber-100"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {golden.map((b, i) => (
              <div
                key={b.shareable_slug}
                className="badge-card badge-card-gold badge-shine-card badge-enter bg-linear-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl border border-amber-200 p-6"
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="badge-glow-gold w-14 h-14 rounded-2xl bg-linear-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
                    <TrophyIcon className="w-8 h-8 text-white drop-shadow" />
                  </div>
                  <span className="flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-100 px-2.5 py-1 rounded-lg">
                    <ClockIcon className="w-3 h-3" />
                    {fmt(b.awarded_at)}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">
                  <StarIcon className="w-3 h-3" />
                  Golden Achievement
                </span>
                <p className="font-bold text-gray-900 text-base mb-1 leading-snug">{b.roadmap_title ?? 'Roadmap Complete!'}</p>
                <p className="text-xs text-amber-700/60 mb-4">Full roadmap mastered</p>

                <Link
                  href={`/achievements/${b.shareable_slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Share Achievement
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Checkpoint Badges by Roadmap ── */}
      {roadmaps.length > 0 && (
        <section>
          <SectionHeader
            label="Checkpoint Badges"
            count={`${checkpoint.length} checkpoint${checkpoint.length !== 1 ? 's' : ''} completed`}
            delay="dash-d-3"
            icon={<BadgeCheckIcon className="w-4 h-4 text-indigo-500" />}
            iconBg="bg-indigo-100"
          />
          <div className="space-y-4">
            {roadmaps.map((roadmap, ri) => {
              const completed = roadmap.checkpoints.filter((cp) => !!cp.badge_id).length
              const total = roadmap.checkpoints.length
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0
              const isFullyDone = total > 0 && completed === total

              return (
                <div
                  key={roadmap.id}
                  className="badge-card badge-enter bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
                  style={{ animationDelay: `${0.05 + ri * 0.08}s` }}
                >
                  {/* Roadmap header */}
                  <div className="px-5 pt-5 pb-4 border-b border-gray-50">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1">
                          {roadmap.title}
                        </h3>
                        <p className="text-[11px] font-semibold text-indigo-500 mt-0.5">
                          {roadmap.skill_domain}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 mt-1.5 text-[10px] text-gray-400">
                          <span>Started {fmt(roadmap.created_at)}</span>
                          {roadmap.last_badge_date && (
                            <>
                              <span className="text-gray-200">·</span>
                              <span>
                                {isFullyDone ? 'Ended' : 'Last active'}{' '}
                                {fmt(roadmap.last_badge_date)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-lg font-extrabold ${isFullyDone ? 'text-emerald-500' : 'text-indigo-600'}`}>
                          {pct}%
                        </p>
                        <p className="text-[10px] text-gray-400">{completed}/{total} done</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isFullyDone
                            ? 'bg-emerald-400'
                            : 'bg-linear-to-r from-indigo-500 to-violet-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Horizontally scrollable checkpoint badge squares */}
                  <div className="flex gap-3 px-4 py-4 overflow-x-auto scrollbar-hide">
                    {roadmap.checkpoints.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">No checkpoints yet</p>
                    ) : (
                      roadmap.checkpoints.map((cp, ci) => {
                        const done = !!cp.badge_id
                        const inProg = cp.cp_status === 'IN_PROGRESS'
                        return (
                          <div
                            key={cp.id}
                            className={`shrink-0 w-22 rounded-xl border p-2.5 flex flex-col items-center gap-1.5 badge-enter ${
                              done
                                ? 'bg-indigo-50 border-indigo-200'
                                : inProg
                                ? 'bg-violet-50 border-violet-200'
                                : 'bg-gray-50 border-gray-100'
                            }`}
                            style={{ animationDelay: `${0.15 + ri * 0.06 + ci * 0.03}s` }}
                          >
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                done
                                  ? 'bg-indigo-500'
                                  : inProg
                                  ? 'bg-violet-100'
                                  : 'bg-gray-200'
                              }`}
                            >
                              {done ? (
                                <BadgeCheckIcon className="w-5 h-5 text-white" />
                              ) : inProg ? (
                                <BadgeCheckIcon className="w-5 h-5 text-violet-400" />
                              ) : (
                                <LockIcon className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <p
                              className={`text-[10px] font-semibold leading-tight text-center line-clamp-2 ${
                                done ? 'text-indigo-700' : inProg ? 'text-violet-600' : 'text-gray-400'
                              }`}
                            >
                              {cp.title}
                            </p>
                            <span
                              className={`text-[9px] font-medium ${
                                done ? 'text-indigo-400' : inProg ? 'text-violet-400' : 'text-gray-300'
                              }`}
                            >
                              {done && cp.awarded_at
                                ? fmt(cp.awarded_at, { month: 'short', day: 'numeric' })
                                : inProg
                                ? 'In progress'
                                : 'Locked'}
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Community Badges ── */}
      {community.length > 0 && (
        <section>
          <SectionHeader
            label="Community Badges"
            count={`${community.length} earned`}
            delay="dash-d-4"
            icon={<PeopleIcon className="w-4 h-4 text-rose-500" />}
            iconBg="bg-rose-100"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {community.map((b, i) => {
              const c = communityConfig[b.badge_type] ?? {
                label: b.badge_type, desc: '', bgFrom: 'from-gray-50', bgTo: 'to-slate-50',
                border: 'border-gray-200', text: 'text-gray-700', iconBg: 'bg-gray-100', emoji: '🏅',
              }
              return (
                <div
                  key={i}
                  className={`badge-card badge-card-community badge-enter bg-linear-to-br ${c.bgFrom} ${c.bgTo} rounded-2xl border ${c.border} p-5`}
                  style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${c.iconBg} flex items-center justify-center text-2xl shrink-0`}>
                      {c.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${c.text} mb-0.5`}>Community</p>
                      <p className="text-base font-bold text-gray-900">{c.label}</p>
                      <p className={`text-xs ${c.text} opacity-70 truncate`}>{c.desc}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-black/5">
                    <p className="text-[10px] text-gray-400">{fmt(b.awarded_at, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────── */

function HeroPill({ value, label, delay }: { value: number; label: string; delay?: string }) {
  return (
    <div
      className="dash-scale-up text-center bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/15 min-w-16"
      style={delay ? { animationDelay: delay } : undefined}
    >
      <p className="text-2xl font-extrabold leading-none text-white">{value}</p>
      <p className="text-indigo-200/80 text-[10px] font-medium mt-1">{label}</p>
    </div>
  )
}

function SectionHeader({
  label, count, delay, icon, iconBg,
}: { label: string; count: string; delay: string; icon: ReactNode; iconBg: string }) {
  return (
    <div className={`dash-fade-up ${delay} flex items-center gap-3 mb-4`}>
      <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center`}>{icon}</div>
      <div>
        <h2 className="text-sm font-bold text-gray-900">{label}</h2>
        <p className="text-xs text-gray-400">{count}</p>
      </div>
    </div>
  )
}

/* ── Icon helpers ────────────────────────────────────────────────── */

function TrophyIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.798 49.798 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
    </svg>
  )
}

function StarIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
    </svg>
  )
}

function BadgeCheckIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
    </svg>
  )
}

function ClockIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
    </svg>
  )
}

function PeopleIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
    </svg>
  )
}

function LockIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
    </svg>
  )
}
