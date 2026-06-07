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
