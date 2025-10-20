-- Add RLS policy for waitlist_archive table
BEGIN;

-- Waitlist archive should be admin-only access
CREATE POLICY "Admin only access to waitlist archive" ON public.waitlist_archive 
FOR ALL USING (false);

COMMIT;