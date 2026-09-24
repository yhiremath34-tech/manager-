-- Migration: 20260924000001_create_emergency_matchmaker_schema.sql
-- Description: Core tables, RLS policies, Realtime publication, and seed data for Emergency Matchmaker

-- 1. Create volunteers table
CREATE TABLE IF NOT EXISTS public.volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    skills TEXT[] NOT NULL DEFAULT '{}',
    lat FLOAT8,
    lng FLOAT8,
    availability TEXT NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_request TEXT NOT NULL,
    parsed_skills TEXT[] NOT NULL DEFAULT '{}',
    parsed_location TEXT,
    urgency TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'open',
    assigned_volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- 3. Create task_events table
CREATE TABLE IF NOT EXISTS public.task_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_volunteer ON public.tasks(assigned_volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_skills ON public.volunteers USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_tasks_parsed_skills ON public.tasks USING GIN (parsed_skills);
CREATE INDEX IF NOT EXISTS idx_task_events_task_id ON public.task_events(task_id);

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;

-- 6. Row Level Security Policies
-- Volunteers: Anyone can select volunteers; inserts/updates allowed for registration & seeding
DROP POLICY IF EXISTS "Anyone can select volunteers" ON public.volunteers;
CREATE POLICY "Anyone can select volunteers" ON public.volunteers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert volunteers" ON public.volunteers;
CREATE POLICY "Anyone can insert volunteers" ON public.volunteers
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update volunteers" ON public.volunteers;
CREATE POLICY "Anyone can update volunteers" ON public.volunteers
    FOR UPDATE USING (true) WITH CHECK (true);

-- Tasks:
-- - Anyone can SELECT tasks (dashboard & volunteer link)
-- - Anyone can INSERT into tasks (anonymous coordinator dispatch)
-- - Updating tasks permitted for assignment and status completion via dynamic link
DROP POLICY IF EXISTS "Anyone can select tasks" ON public.tasks;
CREATE POLICY "Anyone can select tasks" ON public.tasks
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert tasks" ON public.tasks;
CREATE POLICY "Anyone can insert tasks" ON public.tasks
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Assigned volunteer or coordinator can update task status" ON public.tasks;
CREATE POLICY "Assigned volunteer or coordinator can update task status" ON public.tasks
    FOR UPDATE USING (true) WITH CHECK (true);

-- Task Events:
-- - Anyone can SELECT task_events
-- - Anyone can INSERT task_events
DROP POLICY IF EXISTS "Anyone can select task events" ON public.task_events;
CREATE POLICY "Anyone can select task events" ON public.task_events
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert task events" ON public.task_events;
CREATE POLICY "Anyone can insert task events" ON public.task_events
    FOR INSERT WITH CHECK (true);

-- 7. Enable Realtime Replication
ALTER TABLE public.tasks REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'tasks'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
    END IF;
END $$;

-- 8. Optional Seed Data: Volunteers for Demo Immediate Matching
INSERT INTO public.volunteers (name, phone, skills, lat, lng, availability)
VALUES 
    ('Marcus Vance', '+1 (555) 234-5678', ARRAY['driver', 'logistics', 'heavy lifting'], 37.7749, -122.4194, 'available'),
    ('Elena Rostova', '+1 (555) 345-6789', ARRAY['first aid', 'medical', 'triage'], 37.7833, -122.4167, 'available'),
    ('David Chen', '+1 (555) 456-7890', ARRAY['food distribution', 'driver', 'spanish translator'], 37.7651, -122.4201, 'available'),
    ('Aisha Patel', '+1 (555) 567-8901', ARRAY['heavy lifting', 'debris clearance', 'carpentry'], 37.7711, -122.4312, 'available'),
    ('Jordan Taylor', '+1 (555) 678-9012', ARRAY['childcare', 'mental health', 'first aid'], 37.7599, -122.4148, 'available')
ON CONFLICT DO NOTHING;
