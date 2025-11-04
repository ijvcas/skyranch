-- Add location column to animals table
ALTER TABLE animals ADD COLUMN IF NOT EXISTS location JSONB;

-- Add location column to health_records table
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS location JSONB;

-- Add location column to calendar_events table
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS location JSONB;

-- Create local_reminders table
CREATE TABLE IF NOT EXISTS local_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  reminder_type TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  notification_id INTEGER NOT NULL,
  related_record_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_cancelled BOOLEAN DEFAULT FALSE
);

-- Enable RLS for local_reminders
ALTER TABLE local_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for local_reminders
CREATE POLICY "Users can manage their own reminders"
ON local_reminders FOR ALL
USING (auth.uid() = user_id);