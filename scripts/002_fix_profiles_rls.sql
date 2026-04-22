-- ============================================================
-- AtlasFarm – Migration 002: Fix profiles RLS
-- Allows a logged-in user to INSERT their own profile row
-- (needed when the admin account is created directly in Supabase
--  and the trigger has not yet run, or did not run at all).
-- Also adds a permissive policy for service-role upserts.
-- Run this in Supabase SQL Editor → New Query → Run
-- ============================================================

-- 1. Allow any authenticated user to insert their OWN profile row
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Allow any authenticated user to select their OWN profile row
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 3. Allow any authenticated user to update their OWN profile row
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 4. Allow admins to select ALL profiles
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
CREATE POLICY "profiles_admin_select_all"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
    -- Also allow if the user's auth metadata says admin
    -- (handles the case where no profile row exists yet)
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 5. Allow admins to update ALL profiles
DROP POLICY IF EXISTS "profiles_admin_update_all" ON public.profiles;
CREATE POLICY "profiles_admin_update_all"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 6. Allow admins to delete profiles (except their own)
DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
CREATE POLICY "profiles_admin_delete"
  ON public.profiles
  FOR DELETE
  USING (
    id <> auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
      )
      OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    )
  );

-- 7. Ensure the handle_new_user trigger is robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, language, status)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'name',
      NEW.raw_user_meta_data ->> 'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'farmer'),
    COALESCE(NEW.raw_user_meta_data ->> 'language', 'fr'),
    COALESCE(NEW.raw_user_meta_data ->> 'status', 'active')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR each ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Back-fill profiles for any existing auth users that have no profile row
-- This fixes admin accounts created directly in the Supabase dashboard
INSERT INTO public.profiles (id, name, email, role, language, status)
SELECT
  au.id,
  COALESCE(
    au.raw_user_meta_data ->> 'name',
    au.raw_user_meta_data ->> 'full_name',
    split_part(au.email, '@', 1)
  ),
  au.email,
  COALESCE(au.raw_user_meta_data ->> 'role', 'admin'),
  COALESCE(au.raw_user_meta_data ->> 'language', 'fr'),
  'active'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);
