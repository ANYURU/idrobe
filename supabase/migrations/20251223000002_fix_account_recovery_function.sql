-- Add recovered_at column for production-grade audit trail
BEGIN;

-- Add recovered_at column to account_deletion_logs
ALTER TABLE public.account_deletion_logs 
ADD COLUMN IF NOT EXISTS recovered_at TIMESTAMPTZ;

-- Create index for recovery queries
CREATE INDEX IF NOT EXISTS idx_account_deletion_logs_recovered 
ON public.account_deletion_logs(recovered_at) 
WHERE recovered_at IS NOT NULL;

-- Update recover_deleted_account function
CREATE OR REPLACE FUNCTION public.recover_deleted_account(target_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if account is soft deleted and within grace period
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = target_user_id 
        AND deleted_at IS NOT NULL 
        AND deletion_scheduled_at > NOW()
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Restore user profile
    UPDATE public.user_profiles 
    SET 
        deleted_at = NULL,
        deletion_reason = NULL,
        deletion_scheduled_at = NULL
    WHERE user_id = target_user_id;
    
    -- Restore clothing items
    UPDATE public.clothing_items 
    SET deleted_at = NULL 
    WHERE user_id = target_user_id;
    
    -- Restore subscriptions
    UPDATE public.subscriptions 
    SET deleted_at = NULL 
    WHERE user_id = target_user_id;
    
    -- Log recovery (keep deletion_type as 'soft')
    UPDATE public.account_deletion_logs 
    SET 
        recovered_at = NOW(),
        completed_at = NOW()
    WHERE user_id = target_user_id AND completed_at IS NULL;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMIT;

COMMENT ON COLUMN public.account_deletion_logs.recovered_at IS 'Timestamp when account was recovered from soft deletion';
COMMENT ON FUNCTION public.recover_deleted_account IS 'Recovers soft deleted account within grace period';
