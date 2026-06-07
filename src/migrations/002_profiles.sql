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
