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
