-- Migration: add user_id to feeds and create RLS policies

BEGIN;

-- 1) Add user_id column (nullable initially to avoid breaking existing rows)
ALTER TABLE public.feeds
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- 2) Add FK to profiles (optional: ON DELETE SET NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'feeds' AND c.conname = 'fk_feeds_user'
  ) THEN
    ALTER TABLE public.feeds
      ADD CONSTRAINT fk_feeds_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END$$;

-- 3) Create index on user_id
CREATE INDEX IF NOT EXISTS idx_feeds_user_id ON public.feeds(user_id);

-- 4) Enable RLS if not already (schema showed it enabled, but safe to ensure)
ALTER TABLE public.feeds ENABLE ROW LEVEL SECURITY;

-- 5) Create/replace RLS policies to allow owners to insert/update/delete
DROP POLICY IF EXISTS "User insert feeds" ON public.feeds;
CREATE POLICY "User insert feeds"
  ON public.feeds FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "User update feeds" ON public.feeds;
CREATE POLICY "User update feeds"
  ON public.feeds FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "User delete feeds" ON public.feeds;
CREATE POLICY "User delete feeds"
  ON public.feeds FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 6) (Optional) allow reading public feeds when the related goal is public
DROP POLICY IF EXISTS "Anyone can read public feeds" ON public.feeds;
CREATE POLICY "Anyone can read public feeds"
  ON public.feeds FOR SELECT TO anon, authenticated
  USING ((SELECT g.is_public FROM public.goals g WHERE g.id = goal_id));

COMMIT;
