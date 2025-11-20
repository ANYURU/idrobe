-- Fix RLS policy to allow soft-deleted users to view their profile for recovery
-- This allows users to access /recover-account page and see their deletion status

DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;

CREATE POLICY "user_profiles_select" ON public.user_profiles 
FOR SELECT USING (user_id = (SELECT auth.uid()));

COMMENT ON POLICY "user_profiles_select" ON public.user_profiles IS 
'Allows users to view their own profile, including soft-deleted profiles for recovery purposes';
