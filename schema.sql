CREATE DATABASE IF NOT EXISTS skillforge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skillforge;

CREATE TABLE users (
  id            VARCHAR(36)  NOT NULL,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified TINYINT(1)  NOT NULL DEFAULT 0,
  role          VARCHAR(20)  NOT NULL DEFAULT 'LEARNER',
  created_at    DATETIME(3)  NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
);

CREATE TABLE profiles (
  id                 VARCHAR(36) NOT NULL,
  user_id            VARCHAR(36) NOT NULL,
  coin_balance       INT         NOT NULL DEFAULT 0,
  total_coins_earned INT         NOT NULL DEFAULT 0,
  avatar_url         VARCHAR(500)         DEFAULT NULL,
  bio                TEXT                 DEFAULT NULL,
  created_at         DATETIME(3) NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_profiles_user (user_id),
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE password_reset_tokens (
  id         VARCHAR(36)  NOT NULL,
  user_id    VARCHAR(36)  NOT NULL,
  token_hash VARCHAR(64)  NOT NULL,
  expires_at DATETIME     NOT NULL,
  used_at    DATETIME              DEFAULT NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (id),
  KEY idx_prt_user (user_id),
  CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE roadmaps (
  id                    VARCHAR(36)  NOT NULL,
  user_id               VARCHAR(36)  NOT NULL,
  title                 VARCHAR(500) NOT NULL,
  skill_domain          VARCHAR(255) NOT NULL,
  status                VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  total_checkpoints     INT          NOT NULL DEFAULT 0,
  completed_checkpoints INT          NOT NULL DEFAULT 0,
  created_at            DATETIME(3)  NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (id),
  KEY idx_roadmaps_user (user_id),
  CONSTRAINT fk_roadmaps_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE checkpoints (
  id           VARCHAR(36)  NOT NULL,
  roadmap_id   VARCHAR(36)  NOT NULL,
  title        VARCHAR(500) NOT NULL,
  order_index  INT          NOT NULL,
  coins_awarded INT         NOT NULL DEFAULT 50,
  completed    TINYINT(1)   NOT NULL DEFAULT 0,
  completed_at DATETIME(3)           DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_checkpoints_roadmap (roadmap_id),
  CONSTRAINT fk_checkpoints_roadmap FOREIGN KEY (roadmap_id) REFERENCES roadmaps (id) ON DELETE CASCADE
);

CREATE TABLE resources (
  id            VARCHAR(36)   NOT NULL,
  checkpoint_id VARCHAR(36)   NOT NULL,
  title         VARCHAR(500)  NOT NULL,
  type          VARCHAR(50)   NOT NULL,
  url           VARCHAR(2000) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_resources_checkpoint (checkpoint_id),
  CONSTRAINT fk_resources_checkpoint FOREIGN KEY (checkpoint_id) REFERENCES checkpoints (id) ON DELETE CASCADE
);

CREATE TABLE daily_tasks (
  id               VARCHAR(36)  NOT NULL,
  user_id          VARCHAR(36)  NOT NULL,
  title            VARCHAR(500) NOT NULL,
  status           VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  coin_reward      INT          NOT NULL DEFAULT 10,
  completed_at     DATETIME(3)           DEFAULT NULL,
  rescheduled_date DATE                  DEFAULT NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (id),
  KEY idx_daily_tasks_user (user_id),
  CONSTRAINT fk_daily_tasks_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE badges (
  id            VARCHAR(36)  NOT NULL,
  user_id       VARCHAR(36)  NOT NULL,
  checkpoint_id VARCHAR(36)           DEFAULT NULL,
  title         VARCHAR(255) NOT NULL,
  awarded_at    DATETIME(3)  NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (id),
  KEY idx_badges_user (user_id),
  CONSTRAINT fk_badges_user      FOREIGN KEY (user_id)       REFERENCES users       (id) ON DELETE CASCADE,
  CONSTRAINT fk_badges_checkpoint FOREIGN KEY (checkpoint_id) REFERENCES checkpoints (id) ON DELETE SET NULL
);

CREATE TABLE coin_transactions (
  id           VARCHAR(36)  NOT NULL,
  user_id      VARCHAR(36)  NOT NULL,
  type         VARCHAR(50)  NOT NULL,
  amount       INT          NOT NULL,
  direction    VARCHAR(10)  NOT NULL,
  reference_id VARCHAR(36)           DEFAULT NULL,
  description  VARCHAR(500) NOT NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (id),
  KEY idx_coin_tx_user (user_id),
  CONSTRAINT fk_coin_tx_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE community_posts (
  id           VARCHAR(36)  NOT NULL,
  user_id      VARCHAR(36)  NOT NULL,
  title        VARCHAR(500) NOT NULL,
  content      TEXT         NOT NULL,
  skill_domain VARCHAR(255)          DEFAULT NULL,
  status       VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
  coin_cost    INT          NOT NULL DEFAULT 10,
  created_at   DATETIME(3)  NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (id),
  KEY idx_community_posts_user   (user_id),
  KEY idx_community_posts_status (status),
  CONSTRAINT fk_community_posts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE community_answers (
  id          VARCHAR(36) NOT NULL,
  post_id     VARCHAR(36) NOT NULL,
  user_id     VARCHAR(36) NOT NULL,
  content     TEXT        NOT NULL,
  coin_reward INT         NOT NULL DEFAULT 5,
  is_accepted TINYINT(1)  NOT NULL DEFAULT 0,
  created_at  DATETIME(3) NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (id),
  KEY idx_community_answers_post (post_id),
  KEY idx_community_answers_user (user_id),
  CONSTRAINT fk_community_answers_post FOREIGN KEY (post_id)  REFERENCES community_posts (id) ON DELETE CASCADE,
  CONSTRAINT fk_community_answers_user FOREIGN KEY (user_id)  REFERENCES users           (id) ON DELETE CASCADE
);
