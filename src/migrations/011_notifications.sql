CREATE TABLE IF NOT EXISTS notifications (
  id           CHAR(36)    NOT NULL,
  user_id      CHAR(36)    NOT NULL,
  message      TEXT        NOT NULL,
  type         ENUM('TASK_REMINDER','ACHIEVEMENT','COMMUNITY',
                    'SESSION_REMINDER','SYSTEM') NOT NULL,
  is_read      TINYINT(1)  NOT NULL DEFAULT 0,
  reference_id CHAR(36),
  sent_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_notifications_user_id      ON notifications (user_id);
CREATE INDEX idx_notifications_user_is_read ON notifications (user_id, is_read);
CREATE INDEX idx_notifications_sent_at      ON notifications (sent_at DESC);
