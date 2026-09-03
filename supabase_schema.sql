-- Run this in your Supabase SQL Editor

-- 1. Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    away_start BIGINT,
    away_end BIGINT,
    points INTEGER DEFAULT 0
);

-- 2. Create chores table
CREATE TABLE public.chores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    schedule_type TEXT NOT NULL,
    time_of_day TEXT NOT NULL,
    frequency_days INTEGER,
    day_of_week INTEGER,
    target_date BIGINT,
    current_user_id UUID REFERENCES public.users(id),
    due_date BIGINT NOT NULL
);

-- 3. Create history table
CREATE TABLE public.history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chore_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    completed_at BIGINT NOT NULL,
    points_awarded INTEGER NOT NULL
);

-- 4. Enable Realtime (so everyone's phone updates instantly)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.history;
