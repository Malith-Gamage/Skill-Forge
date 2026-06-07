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
