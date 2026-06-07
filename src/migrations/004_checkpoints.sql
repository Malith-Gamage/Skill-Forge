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
