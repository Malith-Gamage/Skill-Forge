import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function fix() {
  const conn = await mysql.createConnection({
    uri: process.env.MYSQL_DATABASE_URL,
    timezone: 'Z',
    multipleStatements: true,
  });

  const run = async (label: string, sql: string) => {
    try {
      await conn.query(sql);
      console.log(`  ✓ ${label}`);
    } catch (e: any) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column name')) {
        console.log(`  ~ ${label} (already exists, skip)`);
      } else {
        console.error(`  ✗ ${label}: ${e.message}`);
      }
    }
  };

  console.log('\n--- checkpoints ---');
  await run('ADD status', `ALTER TABLE checkpoints ADD COLUMN status ENUM('LOCKED','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'LOCKED' AFTER order_index`);
  await run('ADD badge_id', `ALTER TABLE checkpoints ADD COLUMN badge_id CHAR(36) AFTER status`);
  await run('ADD created_at', `ALTER TABLE checkpoints ADD COLUMN created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)`);
  await run('ADD updated_at', `ALTER TABLE checkpoints ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`);
  await run('Set COMPLETED status', `UPDATE checkpoints SET status='COMPLETED' WHERE completed=1`);
  await run('Set IN_PROGRESS first checkpoint', `UPDATE checkpoints c JOIN (SELECT roadmap_id, MIN(order_index) AS min_idx FROM checkpoints WHERE completed=0 GROUP BY roadmap_id) t ON c.roadmap_id=t.roadmap_id AND c.order_index=t.min_idx SET c.status='IN_PROGRESS'`);

  console.log('\n--- daily_tasks ---');
  await run('ADD checkpoint_id', `ALTER TABLE daily_tasks ADD COLUMN checkpoint_id CHAR(36) AFTER id`);
  await run('ADD scheduled_date', `ALTER TABLE daily_tasks ADD COLUMN scheduled_date DATE AFTER coin_reward`);

  console.log('\n--- badges ---');
  await run("ADD badge_type", `ALTER TABLE badges ADD COLUMN badge_type ENUM('CHECKPOINT','GOLDEN','COMMUNITY_HELPER','COMMUNITY_MENTOR','COMMUNITY_CHAMPION') NOT NULL DEFAULT 'CHECKPOINT' AFTER checkpoint_id`);
  await run('ADD is_golden', `ALTER TABLE badges ADD COLUMN is_golden TINYINT(1) NOT NULL DEFAULT 0 AFTER badge_type`);
  await run('ADD shareable_slug', `ALTER TABLE badges ADD COLUMN shareable_slug VARCHAR(100) AFTER is_golden`);

  console.log('\n--- leaderboard ---');
  await run('ADD total_answers', `ALTER TABLE leaderboard ADD COLUMN total_answers INT NOT NULL DEFAULT 0`);
  await run('ADD coins_earned', `ALTER TABLE leaderboard ADD COLUMN coins_earned INT NOT NULL DEFAULT 0`);
  await run('ADD badges_count', `ALTER TABLE leaderboard ADD COLUMN badges_count INT NOT NULL DEFAULT 0`);
  await run('ADD rank', `ALTER TABLE leaderboard ADD COLUMN rank INT`);

  console.log('\n--- industry_experts ---');
  await run('CREATE industry_experts', `
    CREATE TABLE IF NOT EXISTS industry_experts (
      id                  CHAR(36)     NOT NULL,
      name                TEXT         NOT NULL,
      email               VARCHAR(255) NOT NULL,
      field_of_expertise  VARCHAR(255),
      bio                 TEXT,
      rate_per_hour       DECIMAL(10,2),
      availability_status ENUM('AVAILABLE','UNAVAILABLE','ON_LEAVE') NOT NULL DEFAULT 'AVAILABLE',
      meeting_link        TEXT,
      created_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_experts_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('\n--- expert_sessions ---');
  await run('ADD user_id', `ALTER TABLE expert_sessions ADD COLUMN user_id CHAR(36) AFTER id`);
  await run('Copy learner_id -> user_id', `UPDATE expert_sessions SET user_id = learner_id WHERE user_id IS NULL`);
  await run('ADD scheduled_date', `ALTER TABLE expert_sessions ADD COLUMN scheduled_date DATETIME(3)`);
  await run('Copy scheduled_at -> scheduled_date', `UPDATE expert_sessions SET scheduled_date = scheduled_at WHERE scheduled_date IS NULL`);
  await run('ADD duration_minutes', `ALTER TABLE expert_sessions ADD COLUMN duration_minutes INT NOT NULL DEFAULT 30`);
  await run('ADD meeting_link', `ALTER TABLE expert_sessions ADD COLUMN meeting_link TEXT`);
  await run('ADD notes', `ALTER TABLE expert_sessions ADD COLUMN notes TEXT`);
  await run('ADD status', `ALTER TABLE expert_sessions ADD COLUMN status ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING'`);
  await run('ADD coin_cost_alt', `ALTER TABLE expert_sessions ADD COLUMN skill_domain VARCHAR(255)`);

  console.log('\n--- password_reset_tokens ---');
  await run('ADD used', `ALTER TABLE password_reset_tokens ADD COLUMN used TINYINT(1) NOT NULL DEFAULT 0`);
  await run('Set used=1 for used_at rows', `UPDATE password_reset_tokens SET used=1 WHERE used_at IS NOT NULL`);

  console.log('\n--- audit_log ---');
  await run('ADD admin_id', `ALTER TABLE audit_log ADD COLUMN admin_id CHAR(36)`);
  await run('Copy user_id -> admin_id', `UPDATE audit_log SET admin_id=user_id WHERE admin_id IS NULL`);
  await run('ADD metadata', `ALTER TABLE audit_log ADD COLUMN metadata JSON`);

  await conn.end();
  console.log('\n✓ Schema fix complete!\n');
}

fix().catch(err => {
  console.error('Fix failed:', err.message);
  process.exit(1);
});
