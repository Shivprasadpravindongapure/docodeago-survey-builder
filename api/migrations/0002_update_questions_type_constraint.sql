-- Migration number: 0002 	 2026-06-15T18:55:41.414Z

-- Create new table without the CHECK constraint on type
CREATE TABLE IF NOT EXISTS questions_new (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  options TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  required INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Copy data from old table to new table
INSERT INTO questions_new (id, survey_id, type, label, options, position, required, created_at)
SELECT id, survey_id, type, label, options, position, required, created_at FROM questions;

-- Drop old table
DROP TABLE questions;

-- Rename new table to old table
ALTER TABLE questions_new RENAME TO questions;

-- Recreate index
CREATE INDEX IF NOT EXISTS idx_questions_survey_id ON questions(survey_id);
