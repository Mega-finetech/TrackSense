-- Course syllabus checklists and graded assignment scores.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS topics JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS modules JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS earned_score NUMERIC(6,2);
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS total_score NUMERIC(6,2);
