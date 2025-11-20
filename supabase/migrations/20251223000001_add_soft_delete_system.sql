-- ============================================================================
-- SOFT DELETE SYSTEM FOR ACCOUNT DELETION
-- Adds soft delete columns and ML-preserving deletion functions
-- ============================================================================
BEGIN;

-- ============================================================================
-- 1. ADD SOFT DELETE COLUMNS TO KEY TABLES
-- ============================================================================

-- Add deleted_at to user_profiles (clothing_items already has it)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ;

-- Add deleted_at to subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at to other key tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'outfit_recommendations') THEN
        ALTER TABLE public.outfit_recommendations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_interactions') THEN
        ALTER TABLE public.user_interactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'outfit_collections') THEN
        ALTER TABLE public.outfit_collections ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- ============================================================================
-- 2. CREATE ACCOUNT DELETION LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.account_deletion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email TEXT NOT NULL,
    deletion_type TEXT NOT NULL CHECK (deletion_type IN ('soft', 'hard', 'anonymized')),
    deletion_reason TEXT,
    ml_data_extracted BOOLEAN DEFAULT FALSE,
    storage_cleaned BOOLEAN DEFAULT FALSE,
    external_services_cleaned BOOLEAN DEFAULT FALSE,
    scheduled_hard_delete_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE ANONYMIZED ML DATA TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ml_training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_user_id UUID NOT NULL,
    data_type TEXT NOT NULL, -- 'wardrobe_patterns', 'interaction_patterns', 'churn_signals'
    anonymized_data JSONB NOT NULL,
    extraction_date TIMESTAMPTZ DEFAULT NOW(),
    retention_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 years')
);

-- ============================================================================
-- 4. CREATE SOFT DELETE FUNCTIONS
-- ============================================================================

-- Function to initiate account deletion (soft delete with grace period)
CREATE OR REPLACE FUNCTION public.initiate_account_deletion(
    target_user_id UUID,
    reason TEXT DEFAULT 'user_requested'
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deletion_log_id UUID;
    user_email TEXT;
    scheduled_deletion TIMESTAMPTZ;
BEGIN
    -- Get user email
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = target_user_id;
    
    IF user_email IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Schedule hard deletion for 30 days from now
    scheduled_deletion := NOW() + INTERVAL '30 days';
    
    -- Soft delete user profile
    UPDATE public.user_profiles 
    SET 
        deleted_at = NOW(),
        deletion_reason = reason,
        deletion_scheduled_at = scheduled_deletion
    WHERE user_id = target_user_id;
    
    -- Soft delete related data
    UPDATE public.clothing_items 
    SET deleted_at = NOW() 
    WHERE user_id = target_user_id AND deleted_at IS NULL;
    
    -- Cancel active subscriptions
    UPDATE public.subscriptions 
    SET 
        status = 'canceled',
        canceled_at = NOW(),
        deleted_at = NOW()
    WHERE user_id = target_user_id AND status = 'active';
    
    -- Create deletion log
    INSERT INTO public.account_deletion_logs (
        user_id,
        email,
        deletion_type,
        deletion_reason,
        scheduled_hard_delete_at
    ) VALUES (
        target_user_id,
        user_email,
        'soft',
        reason,
        scheduled_deletion
    ) RETURNING id INTO deletion_log_id;
    
    RETURN deletion_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to extract ML data before hard deletion
CREATE OR REPLACE FUNCTION public.extract_ml_data(target_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    wardrobe_data JSONB;
    interaction_data JSONB;
    churn_signals JSONB;
BEGIN
    -- Extract wardrobe patterns
    SELECT json_build_object(
        'total_items', COUNT(*),
        'categories', json_agg(DISTINCT category_id),
        'avg_cost', AVG(cost),
        'sustainability_score', AVG(sustainability_score),
        'times_worn_avg', AVG(times_worn),
        'account_age_days', EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) / 86400
    ) INTO wardrobe_data
    FROM public.clothing_items 
    WHERE user_id = target_user_id;
    
    -- Extract interaction patterns
    SELECT json_build_object(
        'total_interactions', COUNT(*),
        'interaction_types', json_agg(DISTINCT interaction_type_name),
        'avg_rating', AVG(rating),
        'last_interaction_days_ago', EXTRACT(EPOCH FROM (NOW() - MAX(interacted_at))) / 86400
    ) INTO interaction_data
    FROM public.user_interactions 
    WHERE user_id = target_user_id;
    
    -- Extract churn signals
    SELECT json_build_object(
        'subscription_status', subscription_status,
        'monthly_uploads_used', monthly_uploads_used,
        'monthly_recs_used', monthly_recs_used,
        'preferred_currency', preferred_currency,
        'onboarding_completed', onboarding_completed
    ) INTO churn_signals
    FROM public.user_profiles 
    WHERE user_id = target_user_id;
    
    -- Store anonymized data
    INSERT INTO public.ml_training_data (original_user_id, data_type, anonymized_data) VALUES
        (target_user_id, 'wardrobe_patterns', wardrobe_data),
        (target_user_id, 'interaction_patterns', interaction_data),
        (target_user_id, 'churn_signals', churn_signals);
    
    -- Mark as extracted
    UPDATE public.account_deletion_logs 
    SET ml_data_extracted = TRUE 
    WHERE user_id = target_user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error extracting ML data for user %: %', target_user_id, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to recover deleted account (within grace period)
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
    
    -- Update deletion log
    UPDATE public.account_deletion_logs 
    SET 
        deletion_type = 'recovered',
        completed_at = NOW()
    WHERE user_id = target_user_id AND completed_at IS NULL;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function for final hard deletion (called by background job)
CREATE OR REPLACE FUNCTION public.execute_hard_deletion(target_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Extract ML data first if not done
    IF NOT EXISTS (
        SELECT 1 FROM public.account_deletion_logs 
        WHERE user_id = target_user_id AND ml_data_extracted = TRUE
    ) THEN
        PERFORM public.extract_ml_data(target_user_id);
    END IF;
    
    -- Hard delete from auth.users (cascades to all related tables)
    DELETE FROM auth.users WHERE id = target_user_id;
    
    -- Update deletion log
    UPDATE public.account_deletion_logs 
    SET 
        deletion_type = 'hard',
        completed_at = NOW()
    WHERE user_id = target_user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in hard deletion for user %: %', target_user_id, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. UPDATE RLS POLICIES TO HANDLE SOFT DELETES
-- ============================================================================

-- Update user_profiles policy to exclude soft deleted
DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;
CREATE POLICY "user_profiles_select" ON public.user_profiles 
FOR SELECT USING (user_id = (SELECT auth.uid()) AND deleted_at IS NULL);

-- Update clothing_items policy (already has deleted_at filter)
-- No change needed - existing policy already filters deleted_at IS NULL

-- ============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted_at ON public.user_profiles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_deletion_scheduled ON public.user_profiles(deletion_scheduled_at) WHERE deletion_scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_account_deletion_logs_scheduled ON public.account_deletion_logs(scheduled_hard_delete_at) WHERE scheduled_hard_delete_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ml_training_data_retention ON public.ml_training_data(retention_until);

-- ============================================================================
-- 7. ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE public.account_deletion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_training_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for deletion logs (users can view their own)
CREATE POLICY "users_can_view_own_deletion_logs" ON public.account_deletion_logs
FOR SELECT USING (user_id = (SELECT auth.uid()));

-- RLS policies for ML data (service role only)
CREATE POLICY "service_role_can_manage_ml_data" ON public.ml_training_data
FOR ALL USING (auth.role() = 'service_role');

COMMIT;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION public.initiate_account_deletion IS 'Soft deletes user account with 30-day grace period';
COMMENT ON FUNCTION public.extract_ml_data IS 'Extracts anonymized ML training data before hard deletion';
COMMENT ON FUNCTION public.recover_deleted_account IS 'Recovers soft deleted account within grace period';
COMMENT ON FUNCTION public.execute_hard_deletion IS 'Performs final hard deletion after grace period';
COMMENT ON TABLE public.account_deletion_logs IS 'Tracks account deletion process and status';
COMMENT ON TABLE public.ml_training_data IS 'Stores anonymized data for ML model training';