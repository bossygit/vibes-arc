-- Milestone achievements: persist unlocked milestones per user
CREATE TABLE IF NOT EXISTS milestone_achievements (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    milestone_id TEXT NOT NULL,
    achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, milestone_id)
);

CREATE INDEX IF NOT EXISTS idx_milestone_achievements_user_id
    ON milestone_achievements(user_id);

ALTER TABLE milestone_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own milestone achievements"
    ON milestone_achievements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestone achievements"
    ON milestone_achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestone achievements"
    ON milestone_achievements FOR UPDATE
    USING (auth.uid() = user_id);

-- Optional logical key on habits for stable milestone mapping
ALTER TABLE habits
    ADD COLUMN IF NOT EXISTS milestone_key TEXT;

CREATE INDEX IF NOT EXISTS idx_habits_milestone_key
    ON habits(milestone_key)
    WHERE milestone_key IS NOT NULL;
