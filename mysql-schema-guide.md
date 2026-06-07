# SkillForge MySQL Workbench Schema Setup Guide

All 14 tables for the SkillForge database — MySQL 8.x compatible.

---

## Connection Details

| Field | Value |
|-------|-------|
| Host | `127.0.0.1` |
| Port | `3306` |
| Username | `root` |
| Password | `Rumeshi@0377` |
| Database | `skillforge` |

You are using **native MySQL 8.0** (Windows service `MySQL80`) — no Docker required.

---

## Steps in MySQL Workbench

### Step 1 — Connect
1. Open **MySQL Workbench**
2. Double-click your **SkillForge Local** connection

### Step 2 — Open a New Query Tab
- **File → New Query Tab** (or `Ctrl + T`)

### Step 3 — Paste and Execute
- Copy the full SQL from **Full Schema SQL** below
- Paste into the query tab
- Click ⚡ or press `Ctrl + Shift + Enter`

### Step 4 — Verify
```sql
USE skillforge;
SHOW TABLES;
```
Expected: **14 tables** listed.

---

## Full Schema SQL

```sql
-- ============================================================
-- SkillForge Database — MySQL 8.x
-- ============================================================

CREATE DATABASE IF NOT EXISTS skillforge
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE skillforge;

-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id             CHAR(36)     NOT NULL,
  name           TEXT         NOT NULL,
  email          VARCHAR(255) NOT NULL,
  password_hash  TEXT,
  role           ENUM('LEARNER','ADMIN','EXPERT','SUSPENDED') NOT NULL DEFAULT 'LEARNER',
  auth_provider  VARCHAR(50)  NOT NULL DEFAULT 'credentials',
  email_verified TINYINT(1)   NOT NULL DEFAULT 0,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                              ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role  ON users (role);

-- ============================================================
-- 2. profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                 CHAR(36)    NOT NULL,
  user_id            CHAR(36)    NOT NULL,
  bio                TEXT,
  coin_balance       INT         NOT NULL DEFAULT 0,
  learning_streak    INT         NOT NULL DEFAULT 0,
  total_coins_earned INT         NOT NULL DEFAULT 0,
  preferences        JSON,
  avatar_url         TEXT,
  updated_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                 ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_profiles_user_id (user_id),
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. roadmaps
-- ============================================================
CREATE TABLE IF NOT EXISTS roadmaps (
  id                CHAR(36)     NOT NULL,
  user_id           CHAR(36)     NOT NULL,
  title             TEXT         NOT NULL,
  skill_domain      VARCHAR(255),
  status            ENUM('ACTIVE','COMPLETED','REMOVED') NOT NULL DEFAULT 'ACTIVE',
  total_checkpoints INT          NOT NULL DEFAULT 0,
  ai_prompt_hash    VARCHAR(64),
  created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                 ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_roadmaps_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_roadmaps_user_id      ON roadmaps (user_id);
CREATE INDEX idx_roadmaps_status       ON roadmaps (status);
CREATE INDEX idx_roadmaps_skill_domain ON roadmaps (skill_domain);

-- ============================================================
-- 4. checkpoints
-- ============================================================
CREATE TABLE IF NOT EXISTS checkpoints (
  id            CHAR(36)    NOT NULL,
  roadmap_id    CHAR(36)    NOT NULL,
  title         TEXT        NOT NULL,
  order_index   INT         NOT NULL,
  status        ENUM('LOCKED','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'LOCKED',
  coins_awarded INT         NOT NULL DEFAULT 0,
  badge_id      CHAR(36),
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                            ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_checkpoints_roadmap_order (roadmap_id, order_index),
  CONSTRAINT fk_checkpoints_roadmap FOREIGN KEY (roadmap_id)
    REFERENCES roadmaps (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_checkpoints_roadmap_id ON checkpoints (roadmap_id);
CREATE INDEX idx_checkpoints_status     ON checkpoints (status);

-- ============================================================
-- 5. daily_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_tasks (
  id               CHAR(36)    NOT NULL,
  checkpoint_id    CHAR(36)    NOT NULL,
  user_id          CHAR(36)    NOT NULL,
  title            TEXT        NOT NULL,
  status           ENUM('PENDING','COMPLETED','RESCHEDULED') NOT NULL DEFAULT 'PENDING',
  coin_reward      INT         NOT NULL DEFAULT 10,
  scheduled_date   DATE,
  rescheduled_date DATE,
  completed_at     DATETIME(3),
  created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_daily_tasks_checkpoint FOREIGN KEY (checkpoint_id)
    REFERENCES checkpoints (id) ON DELETE CASCADE,
  CONSTRAINT fk_daily_tasks_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_daily_tasks_user_id       ON daily_tasks (user_id);
CREATE INDEX idx_daily_tasks_checkpoint_id ON daily_tasks (checkpoint_id);
CREATE INDEX idx_daily_tasks_scheduled     ON daily_tasks (scheduled_date);
CREATE INDEX idx_daily_tasks_status        ON daily_tasks (status);

-- ============================================================
-- 6. coin_transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS coin_transactions (
  id           CHAR(36)    NOT NULL,
  user_id      CHAR(36)    NOT NULL,
  type         ENUM('TASK_REWARD','COMMUNITY_EARN','COMMUNITY_SPEND',
                    'SESSION_REDEEM','REFUND','ADMIN_GRANT') NOT NULL,
  amount       INT         NOT NULL,
  direction    ENUM('CREDIT','DEBIT') NOT NULL,
  reference_id CHAR(36),
  description  TEXT,
  created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_coin_tx_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_coin_tx_user_id ON coin_transactions (user_id);
CREATE INDEX idx_coin_tx_created ON coin_transactions (created_at DESC);
CREATE INDEX idx_coin_tx_type    ON coin_transactions (type);

-- ============================================================
-- 7. badges
-- ============================================================
CREATE TABLE IF NOT EXISTS badges (
  id             CHAR(36)     NOT NULL,
  user_id        CHAR(36)     NOT NULL,
  checkpoint_id  CHAR(36),
  badge_type     ENUM('CHECKPOINT','GOLDEN','COMMUNITY_HELPER',
                      'COMMUNITY_MENTOR','COMMUNITY_CHAMPION') NOT NULL,
  is_golden      TINYINT(1)   NOT NULL DEFAULT 0,
  shareable_slug VARCHAR(100) UNIQUE,
  awarded_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_badges_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_badges_checkpoint FOREIGN KEY (checkpoint_id)
    REFERENCES checkpoints (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_badges_user_id ON badges (user_id);
CREATE INDEX idx_badges_type    ON badges (badge_type);
CREATE INDEX idx_badges_slug    ON badges (shareable_slug);

-- ============================================================
-- 8. community_posts + community_answers
-- ============================================================
CREATE TABLE IF NOT EXISTS community_posts (
  id           CHAR(36)    NOT NULL,
  user_id      CHAR(36)    NOT NULL,
  title        TEXT        NOT NULL,
  content      LONGTEXT    NOT NULL,
  skill_domain VARCHAR(255),
  coin_cost    INT         NOT NULL DEFAULT 10,
  status       ENUM('OPEN','ANSWERED','CLOSED') NOT NULL DEFAULT 'OPEN',
  created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                           ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_posts_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_posts_user_id      ON community_posts (user_id);
CREATE INDEX idx_posts_status       ON community_posts (status);
CREATE INDEX idx_posts_skill_domain ON community_posts (skill_domain);
CREATE INDEX idx_posts_created      ON community_posts (created_at DESC);

CREATE TABLE IF NOT EXISTS community_answers (
  id          CHAR(36)    NOT NULL,
  post_id     CHAR(36)    NOT NULL,
  user_id     CHAR(36)    NOT NULL,
  content     LONGTEXT    NOT NULL,
  is_accepted TINYINT(1)  NOT NULL DEFAULT 0,
  coin_reward INT         NOT NULL DEFAULT 5,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                          ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_answers_post FOREIGN KEY (post_id)
    REFERENCES community_posts (id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_answers_post_id ON community_answers (post_id);
CREATE INDEX idx_answers_user_id ON community_answers (user_id);

-- ============================================================
-- 9. leaderboard  (note: `rank` is backtick-quoted — reserved keyword)
-- ============================================================
CREATE TABLE IF NOT EXISTS leaderboard (
  id            CHAR(36)    NOT NULL,
  user_id       CHAR(36)    NOT NULL,
  total_answers INT         NOT NULL DEFAULT 0,
  coins_earned  INT         NOT NULL DEFAULT 0,
  badges_count  INT         NOT NULL DEFAULT 0,
  `rank`        INT,
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                            ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_leaderboard_user_id (user_id),
  CONSTRAINT fk_leaderboard_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_leaderboard_rank         ON leaderboard (`rank`);
CREATE INDEX idx_leaderboard_coins_earned ON leaderboard (coins_earned DESC);

-- ============================================================
-- 10. industry_experts + expert_sessions
-- ============================================================
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
  updated_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                   ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_experts_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_experts_availability ON industry_experts (availability_status);
CREATE INDEX idx_experts_field        ON industry_experts (field_of_expertise);

CREATE TABLE IF NOT EXISTS expert_sessions (
  id               CHAR(36)     NOT NULL,
  user_id          CHAR(36)     NOT NULL,
  expert_id        CHAR(36)     NOT NULL,
  skill_domain     VARCHAR(255),
  scheduled_date   DATETIME(3),
  duration_minutes INT          NOT NULL DEFAULT 30,
  status           ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  coin_cost        INT          NOT NULL DEFAULT 100,
  meeting_link     TEXT,
  notes            TEXT,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_sessions_user   FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_expert FOREIGN KEY (expert_id)
    REFERENCES industry_experts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_sessions_user_id        ON expert_sessions (user_id);
CREATE INDEX idx_sessions_expert_id      ON expert_sessions (expert_id);
CREATE INDEX idx_sessions_status         ON expert_sessions (status);
CREATE INDEX idx_sessions_scheduled_date ON expert_sessions (scheduled_date);

-- ============================================================
-- 11. notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id           CHAR(36)    NOT NULL,
  user_id      CHAR(36)    NOT NULL,
  message      TEXT        NOT NULL,
  type         ENUM('TASK_REMINDER','ACHIEVEMENT','COMMUNITY',
                    'SESSION_REMINDER','SYSTEM') NOT NULL,
  is_read      TINYINT(1)  NOT NULL DEFAULT 0,
  reference_id CHAR(36),
  sent_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_notifications_user_id      ON notifications (user_id);
CREATE INDEX idx_notifications_user_is_read ON notifications (user_id, is_read);
CREATE INDEX idx_notifications_sent_at      ON notifications (sent_at DESC);

-- ============================================================
-- 12. resources
-- ============================================================
CREATE TABLE IF NOT EXISTS resources (
  id            CHAR(36)    NOT NULL,
  checkpoint_id CHAR(36)    NOT NULL,
  title         TEXT        NOT NULL,
  type          ENUM('VIDEO','ARTICLE','PODCAST','COURSE') NOT NULL,
  url           TEXT,
  skill_domain  VARCHAR(255),
  access_level  VARCHAR(50) NOT NULL DEFAULT 'FREE',
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_resources_checkpoint FOREIGN KEY (checkpoint_id)
    REFERENCES checkpoints (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_resources_checkpoint_id ON resources (checkpoint_id);
CREATE INDEX idx_resources_type          ON resources (type);
CREATE INDEX idx_resources_skill_domain  ON resources (skill_domain);

-- ============================================================
-- 13. audit_log
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id         CHAR(36)     NOT NULL,
  admin_id   CHAR(36)     NOT NULL,
  action     VARCHAR(100) NOT NULL,
  target_id  CHAR(36),
  metadata   JSON,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_audit_admin FOREIGN KEY (admin_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_audit_admin_id ON audit_log (admin_id);
CREATE INDEX idx_audit_action   ON audit_log (action);
CREATE INDEX idx_audit_created  ON audit_log (created_at DESC);

-- ============================================================
-- 14. password_reset_tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         CHAR(36)    NOT NULL,
  user_id    CHAR(36)    NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  used       TINYINT(1)  NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_prt_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_prt_user_id    ON password_reset_tokens (user_id);
CREATE INDEX idx_prt_token_hash ON password_reset_tokens (token_hash);
```

---

## Verification Queries

### Check all tables
```sql
USE skillforge;
SHOW TABLES;
```
Expected: 14 tables.

### Check foreign keys
```sql
SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'skillforge' AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;
```

### Check a table structure
```sql
DESCRIBE users;
DESCRIBE leaderboard;
```

---

## Backend Connection

The backend connects via `src/lib/db.ts` using the `mysql2` pool.
Environment variable in `.env.local`:
```
MYSQL_DATABASE_URL=mysql://root:Rumeshi%400377@localhost:3306/skillforge
```
(`@` in the password is URL-encoded as `%40`)

---

## Table Dependency Order

```
1.  users                  (no dependencies)
2.  profiles               → users
3.  roadmaps               → users
4.  checkpoints            → roadmaps
5.  daily_tasks            → checkpoints, users
6.  coin_transactions      → users
7.  badges                 → users, checkpoints
8.  community_posts        → users
9.  community_answers      → community_posts, users
10. leaderboard            → users
11. industry_experts       (no dependencies)
12. expert_sessions        → users, industry_experts
13. notifications          → users
14. resources              → checkpoints
15. audit_log              → users
16. password_reset_tokens  → users
```
