DROP TABLE IF EXISTS ai_requests;

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';

-- існуючі запитання стають approved, щоб не зникли зі списку
ALTER TABLE questions ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'approved';
-- усі нові запитання починаються з pending
ALTER TABLE questions ALTER COLUMN moderation_status SET DEFAULT 'pending';

CREATE TABLE ai_requests (
  id             SERIAL PRIMARY KEY,
  user_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type    VARCHAR(10) NOT NULL CHECK (target_type IN ('question','answer')),
  target_id      INT NOT NULL,
  verdict        VARCHAR(20) NOT NULL,
  reason         TEXT,
  confidence     REAL,
  manual_verdict VARCHAR(20),
  reviewed_by    INT REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON ai_requests (user_id, created_at);
CREATE INDEX ON ai_requests (target_type, target_id);
