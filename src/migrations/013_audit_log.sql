CREATE TABLE IF NOT EXISTS audit_log (
  id         CHAR(36)     NOT NULL,
  admin_id   CHAR(36)     NOT NULL,
  action     VARCHAR(100) NOT NULL,
  target_id  CHAR(36),
  metadata   JSON,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_audit_admin FOREIGN KEY (admin_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_audit_admin_id ON audit_log (admin_id);
CREATE INDEX idx_audit_action   ON audit_log (action);
CREATE INDEX idx_audit_created  ON audit_log (created_at DESC);
