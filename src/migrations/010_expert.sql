CREATE TABLE IF NOT EXISTS industry_experts (
  id                  CHAR(36)     NOT NULL,
  name                TEXT         NOT NULL,
  email               VARCHAR(255) NOT NULL,
  field_of_expertise  VARCHAR(255),
  bio                 TEXT,
  rate_per_hour       DECIMAL(10,2),
  availability_status ENUM('AVAILABLE','UNAVAILABLE','ON_LEAVE') NOT NULL DEFAULT 'AVAILABLE',
  meeting_link        TEXT,
  created_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                   ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_experts_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_experts_availability ON industry_experts (availability_status);
CREATE INDEX idx_experts_field        ON industry_experts (field_of_expertise);

CREATE TABLE IF NOT EXISTS expert_sessions (
  id               CHAR(36)    NOT NULL,
  user_id          CHAR(36)    NOT NULL,
  expert_id        CHAR(36)    NOT NULL,
  skill_domain     VARCHAR(255),
  scheduled_date   DATETIME(3),
  duration_minutes INT         NOT NULL DEFAULT 30,
  status           ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  coin_cost        INT         NOT NULL DEFAULT 100,
  meeting_link     TEXT,
  notes            TEXT,
  created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                               ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_sessions_user   FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_expert FOREIGN KEY (expert_id)
    REFERENCES industry_experts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_sessions_user_id        ON expert_sessions (user_id);
CREATE INDEX idx_sessions_expert_id      ON expert_sessions (expert_id);
CREATE INDEX idx_sessions_status         ON expert_sessions (status);
CREATE INDEX idx_sessions_scheduled_date ON expert_sessions (scheduled_date);
