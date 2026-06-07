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
