import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { redirect } from 'next/navigation'
import BadgesView from './BadgesView'

export const metadata = { title: 'Badges — SkillForge' }

type BadgeRow = {
  id: string; badge_type: string; is_golden: boolean; shareable_slug: string;
  awarded_at: string; checkpoint_title: string | null; roadmap_title: string | null
}

type RoadmapRow = {
  id: string; title: string; skill_domain: string; status: string;
  total_checkpoints: number; created_at: string; last_badge_date: string | null
}

type CheckpointRow = {
  id: string; roadmap_id: string; title: string; order_index: number;
  cp_status: string; badge_id: string | null; awarded_at: string | null
}

export default async function BadgesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [badges, roadmaps, checkpoints] = await Promise.all([
    query<BadgeRow>(
      `SELECT b.id, b.badge_type, b.is_golden, b.shareable_slug, b.awarded_at,
              c.title AS checkpoint_title, r.title AS roadmap_title
       FROM badges b
       LEFT JOIN checkpoints c ON c.id = b.checkpoint_id
       LEFT JOIN roadmaps r ON r.id = c.roadmap_id
       WHERE b.user_id = ?
       ORDER BY b.awarded_at DESC`,
      [session.userId]
    ),
    query<RoadmapRow>(
      `SELECT r.id, r.title, r.skill_domain, r.status, r.total_checkpoints, r.created_at,
              (SELECT MAX(b2.awarded_at)
               FROM checkpoints c2
               JOIN badges b2 ON b2.checkpoint_id = c2.id AND b2.badge_type = 'CHECKPOINT'
               WHERE c2.roadmap_id = r.id AND b2.user_id = ?) AS last_badge_date
       FROM roadmaps r
       WHERE r.user_id = ? AND r.status != 'REMOVED'
       ORDER BY r.created_at DESC`,
      [session.userId, session.userId]
    ),
    query<CheckpointRow>(
      `SELECT c.id, c.roadmap_id, c.title, c.order_index, c.status AS cp_status,
              b.id AS badge_id, b.awarded_at
       FROM checkpoints c
       LEFT JOIN badges b ON b.checkpoint_id = c.id AND b.user_id = ? AND b.badge_type = 'CHECKPOINT'
       WHERE c.roadmap_id IN (
         SELECT id FROM roadmaps WHERE user_id = ? AND status != 'REMOVED'
       )
       ORDER BY c.roadmap_id, c.order_index ASC`,
      [session.userId, session.userId]
    ),
  ])

  const cpByRoadmap = checkpoints.reduce<Record<string, CheckpointRow[]>>((acc, cp) => {
    if (!acc[cp.roadmap_id]) acc[cp.roadmap_id] = []
    acc[cp.roadmap_id].push(cp)
    return acc
  }, {})

  const roadmapsWithCheckpoints = roadmaps.map((r) => ({
    ...r,
    checkpoints: cpByRoadmap[r.id] ?? [],
  }))

  return <BadgesView badges={badges} roadmaps={roadmapsWithCheckpoints} />
}
