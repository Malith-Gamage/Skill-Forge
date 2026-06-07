DROP PROCEDURE IF EXISTS add_ai_analysis_column;
CREATE PROCEDURE add_ai_analysis_column()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'community_answers'
      AND COLUMN_NAME  = 'ai_analysis'
  ) THEN
    ALTER TABLE community_answers
      ADD COLUMN ai_analysis JSON NULL AFTER coin_reward;
  END IF;
END;
CALL add_ai_analysis_column();
DROP PROCEDURE IF EXISTS add_ai_analysis_column;
