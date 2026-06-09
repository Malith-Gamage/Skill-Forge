import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

/** Run one query — return [] silently if it fails so one bad query never kills the whole response. */
async function sq(sql: string, params: any[]): Promise<any[]> {
  try {
    return await query(sql, params);
  } catch (e) {
    console.error('[analytics:sql]', (e as Error).message);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    // Prefer cookie-based session; fall back to the x-user-id header set by middleware
    let uid: string | null = null;
    try {
      const session = await getSession();
      uid = session?.userId ?? null;
    } catch {
      // getSession can throw in edge cases — fall through to header
    }
    if (!uid) uid = req.headers.get('x-user-id');
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [
      roadmapProgressRaw,
      answerActivityRaw,
      roadmapStatsRaw,
      answerStatsRaw,
      profileStatsRaw,
      dailyActivityRaw,
      questionStatsRaw,
    ] = await Promise.all([

      // Completed roadmaps per calendar month
      sq(
        `SELECT DATE_FORMAT(created_at, '%b %Y') AS month,
                COUNT(*) AS completed
         FROM roadmaps
         WHERE user_id = ? AND status = 'COMPLETED'
         GROUP BY DATE_FORMAT(created_at, '%Y-%m')
         ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC
         LIMIT 12`,
        [uid],
      ),

      // Community answer activity per week (last 8 weeks)
      sq(
        `SELECT DATE_FORMAT(MIN(created_at), '%b %d') AS week,
                COALESCE(SUM(CASE WHEN is_accepted = 1 THEN 1 ELSE 0 END), 0) AS correct,
                COALESCE(SUM(CASE WHEN is_accepted = 0 THEN 1 ELSE 0 END), 0) AS wrong
         FROM community_answers
         WHERE user_id = ?
           AND created_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
         GROUP BY YEARWEEK(created_at, 1)
         ORDER BY YEARWEEK(created_at, 1) ASC`,
        [uid],
      ),

      // Roadmap totals
      sq(
        `SELECT COUNT(*) AS total,
                COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END), 0) AS completed
         FROM roadmaps WHERE user_id = ?`,
        [uid],
      ),

      // Answer totals
      sq(
        `SELECT COUNT(*) AS total,
                COALESCE(SUM(CASE WHEN is_accepted = 1 THEN 1 ELSE 0 END), 0) AS correct
         FROM community_answers WHERE user_id = ?`,
        [uid],
      ),

      // Coins earned from profile
      sq(
        `SELECT COALESCE(total_coins_earned, 0) AS coins
         FROM profiles WHERE user_id = ?`,
        [uid],
      ),

      // Daily activity: coins credited per day (last 30 days)
      sq(
        `SELECT DATE_FORMAT(created_at, '%b %d') AS date,
                COALESCE(SUM(amount), 0) AS score
         FROM coin_transactions
         WHERE user_id = ?
           AND direction = 'CREDIT'
           AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [uid],
      ),

      // Questions posted
      sq(
        `SELECT COUNT(*) AS total FROM community_posts WHERE user_id = ?`,
        [uid],
      ),
    ]);

    const rm  = (roadmapStatsRaw[0]  as any) ?? {};
    const ans = (answerStatsRaw[0]   as any) ?? {};
    const prf = (profileStatsRaw[0]  as any) ?? {};
    const qst = (questionStatsRaw[0] as any) ?? {};

    const completedRoadmaps = Number(rm.completed  ?? 0);
    const totalRoadmaps     = Number(rm.total      ?? 0);
    const correctAnswers    = Number(ans.correct   ?? 0);
    const totalAnswers      = Number(ans.total     ?? 0);
    const totalCoins        = Number(prf.coins     ?? 0);
    const questionsPosted   = Number(qst.total     ?? 0);

    const completedPct = totalRoadmaps > 0
      ? Math.round((completedRoadmaps / totalRoadmaps) * 100)
      : 0;

    return NextResponse.json({
      roadmapProgress: (roadmapProgressRaw as any[]).map((r) => ({
        month:     String(r.month     ?? ''),
        completed: Number(r.completed ?? 0),
      })),

      answerActivity: (answerActivityRaw as any[]).map((r) => ({
        week:    String(r.week    ?? ''),
        correct: Number(r.correct ?? 0),
        wrong:   Number(r.wrong   ?? 0),
      })),

      overallProgress: [
        { name: 'Completed', value: completedPct },
        { name: 'Remaining', value: 100 - completedPct },
      ],

      dailyActivity: (dailyActivityRaw as any[]).map((r) => ({
        date:  String(r.date  ?? ''),
        score: Number(r.score ?? 0),
      })),

      stats: {
        totalCoins,
        totalRoadmaps,
        completedRoadmaps,
        totalAnswers,
        correctAnswers,
        questionsPosted,
      },
    });

  } catch (err) {
    console.error('[analytics]', err);
    return NextResponse.json({ error: (err as Error).message ?? 'Server error' }, { status: 500 });
  }
}
