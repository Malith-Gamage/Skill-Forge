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
