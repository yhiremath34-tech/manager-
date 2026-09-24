-- Migration: 20260924000002_grant_public_access.sql
-- Description: Explicitly grant schema usage and table privileges to anon, authenticated, and service_role

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.volunteers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.tasks TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.task_events TO anon, authenticated, service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Ensure RLS allows full public interaction
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select volunteers" ON public.volunteers;
CREATE POLICY "Public select volunteers" ON public.volunteers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public insert volunteers" ON public.volunteers;
CREATE POLICY "Public insert volunteers" ON public.volunteers FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public update volunteers" ON public.volunteers;
CREATE POLICY "Public update volunteers" ON public.volunteers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public select tasks" ON public.tasks;
CREATE POLICY "Public select tasks" ON public.tasks FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public insert tasks" ON public.tasks;
CREATE POLICY "Public insert tasks" ON public.tasks FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public update tasks" ON public.tasks;
CREATE POLICY "Public update tasks" ON public.tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public select events" ON public.task_events;
CREATE POLICY "Public select events" ON public.task_events FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public insert events" ON public.task_events;
CREATE POLICY "Public insert events" ON public.task_events FOR INSERT TO anon, authenticated WITH CHECK (true);
