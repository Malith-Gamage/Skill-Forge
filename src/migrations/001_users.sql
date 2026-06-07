CREATE TABLE IF NOT EXISTS users (
  id             CHAR(36)     NOT NULL,
  name           TEXT         NOT NULL,
  email          VARCHAR(255) NOT NULL,
  password_hash  TEXT,
  role           ENUM('LEARNER','ADMIN','EXPERT','SUSPENDED') NOT NULL DEFAULT 'LEARNER',
  auth_provider  VARCHAR(50)  NOT NULL DEFAULT 'credentials',
  email_verified TINYINT(1)   NOT NULL DEFAULT 0,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                              ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role  ON users (role);
