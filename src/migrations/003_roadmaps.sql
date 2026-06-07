CREATE TABLE IF NOT EXISTS roadmaps (
  id                CHAR(36)    NOT NULL,
  user_id           CHAR(36)    NOT NULL,
  title             TEXT        NOT NULL,
  skill_domain      VARCHAR(255),
  status            ENUM('ACTIVE','COMPLETED','REMOVED') NOT NULL DEFAULT 'ACTIVE',
  total_checkpoints INT         NOT NULL DEFAULT 0,
  ai_prompt_hash    VARCHAR(64),
  created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_roadmaps_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_roadmaps_user_id      ON roadmaps (user_id);
CREATE INDEX idx_roadmaps_status       ON roadmaps (status);
CREATE INDEX idx_roadmaps_skill_domain ON roadmaps (skill_domain);
