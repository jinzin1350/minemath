-- Create robot_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS robot_progress (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id),
  robot_name VARCHAR NOT NULL,
  robot_color VARCHAR NOT NULL,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  memory JSONB DEFAULT '[]'::jsonb,
  completed_mission_ids JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_robot_progress_user_id ON robot_progress(user_id);
