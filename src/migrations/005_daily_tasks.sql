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
