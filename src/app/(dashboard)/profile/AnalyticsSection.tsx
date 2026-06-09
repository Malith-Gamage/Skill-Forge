'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stats {
  totalCoins: number
  totalRoadmaps: number
  completedRoadmaps: number
  totalAnswers: number
  correctAnswers: number
  questionsPosted: number
}

interface AnalyticsData {
  roadmapProgress: Array<{ month: string; completed: number }>
  answerActivity:  Array<{ week: string; correct: number; wrong: number }>
  overallProgress: Array<{ name: string; value: number }>
  dailyActivity:   Array<{ date: string; score: number }>
  stats: Stats
}

// ── Animation helpers ─────────────────────────────────────────────────────────

function cardStyle(entered: boolean, delayMs: number): React.CSSProperties {
  return {
    opacity:    entered ? 1 : 0,
    transform:  entered ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.97)',
    transition: `opacity 0.4s ease ${delayMs}ms, transform 0.4s ease ${delayMs}ms`,
  }
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <svg className="animate-spin h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <p className="text-sm text-gray-400">Loading your analytics…</p>
    </div>
  )
}

function EmptyChart({ hint }: { hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-52 gap-3 select-none">
      <svg className="h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm text-gray-400 text-center max-w-48">No data yet — {hint}</p>
    </div>
  )
}

function ChartCard({ icon, title, children }: {
  icon: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg leading-none">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function StatCard({ icon, label, primary, sub, from, to }: {
  icon: string
  label: string
  primary: string
  sub?: string
  from: string
  to: string
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white cursor-default hover:brightness-110 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {/* Decorative bubbles */}
      <span className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 block" />
      <span className="absolute right-4 -bottom-6 w-16 h-16 rounded-full bg-white/10 block" />

      <span className="text-2xl leading-none relative z-10">{icon}</span>
      <div className="mt-3 relative z-10">
        <div className="text-2xl font-extrabold leading-none tabular-nums">{primary}</div>
        {sub && <div className="text-xs font-medium opacity-70 mt-1">{sub}</div>}
      </div>
      <div className="text-xs font-semibold opacity-80 mt-3 relative z-10 uppercase tracking-wide">{label}</div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-lg text-sm min-w-28">
      {label != null && <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 leading-snug">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: p.color ?? p.fill ?? '#6366f1' }}
          />
          <span className="text-gray-600 text-xs">{p.name}:</span>
          <span className="font-bold text-gray-900 ml-auto pl-2 tabular-nums">
            {Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-sm">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.payload?.fill ?? '#6366f1' }} />
        <span className="text-gray-700 font-medium">{entry.name}</span>
        <span className="font-bold text-gray-900 ml-1">{entry.value}%</span>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalyticsSection() {
  const [data,    setData]    = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [entered, setEntered] = useState(false)

  const load = useCallback(() => {
    setError(null)
    setLoading(true)
    setEntered(false)
    fetch('/api/user/analytics')
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}))
          throw new Error(`${r.status} — ${body.error ?? 'server error'}`)
        }
        return r.json()
      })
      .then((raw: AnalyticsData) => {
        setData(raw)
        setLoading(false)
        setTimeout(() => setEntered(true), 60)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <Spinner />

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-4xl">⚠️</div>
        <p className="text-gray-600 font-medium">Analytics unavailable</p>
        <p className="text-gray-400 text-sm">{error ?? 'Unknown error'}</p>
        <button
          onClick={load}
          className="mt-1 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 active:scale-95 transition-all"
        >
          Retry
        </button>
      </div>
    )
  }

  const { answerActivity, overallProgress, stats } = data

  const roadmapPct   = stats.totalRoadmaps > 0
    ? Math.round((stats.completedRoadmaps / stats.totalRoadmaps) * 100) : 0
  const answerPct    = stats.totalAnswers > 0
    ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100) : 0
  const completedPct = overallProgress.find((d) => d.name === 'Completed')?.value ?? 0

  const PIE_COLORS = ['#6366f1', '#e2e8f0']

  const STAT_CARDS = [
    {
      icon: '🪙',  label: 'Total Coins',       from: '#f59e0b', to: '#ef4444',
      primary: stats.totalCoins.toLocaleString(),
    },
    {
      icon: '📚',  label: 'Roadmaps Done',      from: '#6366f1', to: '#8b5cf6',
      primary: `${stats.completedRoadmaps}/${stats.totalRoadmaps}`,
      sub: `${roadmapPct}% complete`,
    },
    {
      icon: '✅',  label: 'Correct Answers',    from: '#22c55e', to: '#16a34a',
      primary: `${stats.correctAnswers}/${stats.totalAnswers}`,
      sub: `${answerPct}% accepted`,
    },
    {
      icon: '📝',  label: 'Questions Posted',   from: '#0ea5e9', to: '#6366f1',
      primary: String(stats.questionsPosted),
    },
  ]

  return (
    <div className="space-y-6">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, i) => (
          <div key={card.label} style={cardStyle(entered, i * 80)}>
            <StatCard {...card} />
          </div>
        ))}
      </div>

      {/* ── Charts grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Bar chart — answer activity */}
        <div style={cardStyle(entered, 380)}>
          <ChartCard icon="📊" title="Answer Activity">
            {answerActivity.length === 0 ? (
              <EmptyChart hint="answer community questions to see weekly stats" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={answerActivity}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                  barGap={4}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="correct" name="Accepted"     fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="wrong"   name="Not Accepted" fill="#f87171" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Pie/donut chart — overall progress */}
        <div style={cardStyle(entered, 480)}>
          <ChartCard icon="🎯" title="Overall Learning Progress">
            <div className="flex items-center gap-6">

              {/* Donut */}
              <div className="relative shrink-0" style={{ width: '52%' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={overallProgress}
                      cx="50%"
                      cy="50%"
                      innerRadius="56%"
                      outerRadius="80%"
                      paddingAngle={3}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      isAnimationActive
                      animationBegin={entered ? 0 : 99999}
                      animationDuration={900}
                    >
                      {overallProgress.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Centre label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-3xl font-extrabold text-indigo-600 leading-none">{completedPct}%</div>
                    <div className="text-xs text-gray-400 mt-1 font-medium">Complete</div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-col gap-5 flex-1 min-w-0">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                    <span className="text-xs text-gray-500">Roadmaps done</span>
                  </div>
                  <div className="text-xl font-extrabold text-indigo-600 leading-none">
                    {stats.completedRoadmaps}
                    <span className="text-sm text-gray-400 font-normal ml-1">/ {stats.totalRoadmaps}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs text-gray-500">Answers accepted</span>
                  </div>
                  <div className="text-xl font-extrabold text-emerald-600 leading-none">
                    {stats.correctAnswers}
                    <span className="text-sm text-gray-400 font-normal ml-1">/ {stats.totalAnswers}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-xs text-gray-500">Coins earned</span>
                  </div>
                  <div className="text-xl font-extrabold text-amber-500 leading-none">
                    {stats.totalCoins.toLocaleString()}
                  </div>
                </div>
              </div>

            </div>
          </ChartCard>
        </div>

      </div>
    </div>
  )
}
