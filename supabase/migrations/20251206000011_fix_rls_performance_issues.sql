-- ============================================================================
-- FIX RLS PERFORMANCE ISSUES
-- Addresses auth.uid() re-evaluation and multiple permissive policies
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. DROP ALL EXISTING RLS POLICIES TO START CLEAN
-- ============================================================================

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can view own clothing items" ON public.clothing_items;
DROP POLICY IF EXISTS "Users can insert own clothing items" ON public.clothing_items;
DROP POLICY IF EXISTS "Users can update own clothing items" ON public.clothing_items;
DROP POLICY IF EXISTS "Users can delete own clothing items" ON public.clothing_items;

DROP POLICY IF EXISTS "Users can view own recommendations" ON public.outfit_recommendations;
DROP POLICY IF EXISTS "Users can insert own recommendations" ON public.outfit_recommendations;
DROP POLICY IF EXISTS "Users can update own recommendations" ON public.outfit_recommendations;
DROP POLICY IF EXISTS "Users can delete own recommendations" ON public.outfit_recommendations;

DROP POLICY IF EXISTS "Users can view own interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Users can insert own interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Users can update own interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Users can delete own interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Users can manage own interactions" ON public.user_interactions;

DROP POLICY IF EXISTS "Users can view own wardrobe gaps" ON public.wardrobe_gaps;
DROP POLICY IF EXISTS "Users can insert own wardrobe gaps" ON public.wardrobe_gaps;
DROP POLICY IF EXISTS "Users can update own wardrobe gaps" ON public.wardrobe_gaps;
DROP POLICY IF EXISTS "Users can delete own wardrobe gaps" ON public.wardrobe_gaps;
DROP POLICY IF EXISTS "Users can manage own wardrobe gaps" ON public.wardrobe_gaps;

DROP POLICY IF EXISTS "Users can view own collections" ON public.outfit_collections;
DROP POLICY IF EXISTS "Users can insert own collections" ON public.outfit_collections;
DROP POLICY IF EXISTS "Users can update own collections" ON public.outfit_collections;
DROP POLICY IF EXISTS "Users can delete own collections" ON public.outfit_collections;
DROP POLICY IF EXISTS "Users can manage own collections" ON public.outfit_collections;

DROP POLICY IF EXISTS "Users can view own duplicates" ON public.clothing_duplicates;
DROP POLICY IF EXISTS "Users can insert own duplicates" ON public.clothing_duplicates;
DROP POLICY IF EXISTS "Users can update own duplicates" ON public.clothing_duplicates;

DROP POLICY IF EXISTS "Users can view own logs" ON public.recommendation_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.recommendation_logs;
DROP POLICY IF EXISTS "logs_select" ON public.recommendation_logs;
DROP POLICY IF EXISTS "logs_insert" ON public.recommendation_logs;

DROP POLICY IF EXISTS "Users can manage own item style tags" ON public.clothing_item_style_tags;

DROP POLICY IF EXISTS "Users can view own errors" ON public.error_logs;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;

DROP POLICY IF EXISTS "Users can view referrals they made or received" ON public.referrals;
DROP POLICY IF EXISTS "Users can insert referrals they make" ON public.referrals;
DROP POLICY IF EXISTS "Users can update referrals they made" ON public.referrals;

DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;

DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_tracking;

DROP POLICY IF EXISTS "Users can manage own event templates" ON public.event_templates;
DROP POLICY IF EXISTS "Users can manage own events" ON public.events;
DROP POLICY IF EXISTS "Users can manage own event choices" ON public.event_outfit_choices;
DROP POLICY IF EXISTS "Users can manage own sustainability data" ON public.sustainability_tracking;

-- ============================================================================
-- 2. CREATE OPTIMIZED RLS POLICIES WITH (SELECT auth.uid())
-- ============================================================================

-- User Profiles - Single comprehensive policy per operation
CREATE POLICY "user_profiles_select" ON public.user_profiles 
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "user_profiles_insert" ON public.user_profiles 
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "user_profiles_update" ON public.user_profiles 
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "user_profiles_delete" ON public.user_profiles 
FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Clothing Items - Single comprehensive policy per operation
CREATE POLICY "clothing_items_select" ON public.clothing_items 
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "clothing_items_insert" ON public.clothing_items 
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "clothing_items_update" ON public.clothing_items 
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "clothing_items_delete" ON public.clothing_items 
FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Outfit Recommendations - Single comprehensive policy per operation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'outfit_recommendations') THEN
        EXECUTE 'CREATE POLICY "outfit_recommendations_select" ON public.outfit_recommendations 
        FOR SELECT USING (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "outfit_recommendations_insert" ON public.outfit_recommendations 
        FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "outfit_recommendations_update" ON public.outfit_recommendations 
        FOR UPDATE USING (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "outfit_recommendations_delete" ON public.outfit_recommendations 
        FOR DELETE USING (user_id = (SELECT auth.uid()))';
    END IF;
END $$;

-- User Interactions - Single comprehensive policy per operation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_interactions') THEN
        EXECUTE 'CREATE POLICY "user_interactions_select" ON public.user_interactions 
        FOR SELECT USING (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "user_interactions_insert" ON public.user_interactions 
        FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "user_interactions_update" ON public.user_interactions 
        FOR UPDATE USING (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "user_interactions_delete" ON public.user_interactions 
        FOR DELETE USING (user_id = (SELECT auth.uid()))';
    END IF;
END $$;

-- Wardrobe Gaps - Single comprehensive policy per operation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wardrobe_gaps') THEN
        EXECUTE 'CREATE POLICY "wardrobe_gaps_select" ON public.wardrobe_gaps 
        FOR SELECT USING (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "wardrobe_gaps_insert" ON public.wardrobe_gaps 
        FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "wardrobe_gaps_update" ON public.wardrobe_gaps 
        FOR UPDATE USING (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "wardrobe_gaps_delete" ON public.wardrobe_gaps 
        FOR DELETE USING (user_id = (SELECT auth.uid()))';
    END IF;
END $$;

-- Outfit Collections - Single comprehensive policy per operation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'outfit_collections') THEN
        EXECUTE 'CREATE POLICY "outfit_collections_select" ON public.outfit_collections 
        FOR SELECT USING (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "outfit_collections_insert" ON public.outfit_collections 
        FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "outfit_collections_update" ON public.outfit_collections 
        FOR UPDATE USING (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "outfit_collections_delete" ON public.outfit_collections 
        FOR DELETE USING (user_id = (SELECT auth.uid()))';
    END IF;
END $$;

-- Clothing Duplicates - Single comprehensive policy per operation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clothing_duplicates') THEN
        EXECUTE 'CREATE POLICY "clothing_duplicates_select" ON public.clothing_duplicates 
        FOR SELECT USING (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "clothing_duplicates_insert" ON public.clothing_duplicates 
        FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "clothing_duplicates_update" ON public.clothing_duplicates 
        FOR UPDATE USING (user_id = (SELECT auth.uid()))';
    END IF;
END $$;

-- Recommendation Logs - Single comprehensive policy per operation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recommendation_logs') THEN
        EXECUTE 'CREATE POLICY "recommendation_logs_select" ON public.recommendation_logs 
        FOR SELECT USING (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "recommendation_logs_insert" ON public.recommendation_logs 
        FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()))';
    END IF;
END $$;

-- Clothing Item Style Tags - Junction table policy
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clothing_item_style_tags') THEN
        EXECUTE 'CREATE POLICY "clothing_item_style_tags_all" ON public.clothing_item_style_tags 
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.clothing_items ci 
                WHERE ci.id = clothing_item_id 
                AND ci.user_id = (SELECT auth.uid())
            )
        )';
    END IF;
END $$;

-- Error Logs - Read-only for users
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'error_logs') THEN
        EXECUTE 'CREATE POLICY "error_logs_select" ON public.error_logs 
        FOR SELECT USING (user_id = (SELECT auth.uid()))';
    END IF;
END $$;

-- Subscriptions - Single comprehensive policy per operation
CREATE POLICY "subscriptions_select" ON public.subscriptions 
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "subscriptions_insert" ON public.subscriptions 
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "subscriptions_update" ON public.subscriptions 
FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- Payments - Single comprehensive policy per operation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        EXECUTE 'CREATE POLICY "payments_select" ON public.payments 
        FOR SELECT USING (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "payments_insert" ON public.payments 
        FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()))';
    END IF;
END $$;

-- Referrals - Single comprehensive policy per operation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals') THEN
        EXECUTE 'CREATE POLICY "referrals_select" ON public.referrals 
        FOR SELECT USING (
            referrer_id = (SELECT auth.uid()) OR 
            referee_id = (SELECT auth.uid())
        )';
        
        EXECUTE 'CREATE POLICY "referrals_insert" ON public.referrals 
        FOR INSERT WITH CHECK (referrer_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "referrals_update" ON public.referrals 
        FOR UPDATE USING (referrer_id = (SELECT auth.uid()))';
    END IF;
END $$;

-- User Credits - Single comprehensive policy per operation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_credits') THEN
        EXECUTE 'CREATE POLICY "user_credits_select" ON public.user_credits 
        FOR SELECT USING (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "user_credits_insert" ON public.user_credits 
        FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "user_credits_update" ON public.user_credits 
        FOR UPDATE USING (user_id = (SELECT auth.uid()))';
    END IF;
END $$;

-- Usage Tracking - Single comprehensive policy per operation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking') THEN
        EXECUTE 'CREATE POLICY "usage_tracking_select" ON public.usage_tracking 
        FOR SELECT USING (user_id = (SELECT auth.uid()))';
        
        EXECUTE 'CREATE POLICY "usage_tracking_insert" ON public.usage_tracking 
        FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()))';
    END IF;
END $$;

-- Event Templates - Single comprehensive policy per operation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_templates') THEN
        EXECUTE 'CREATE POLICY "event_templates_all" ON public.event_templates 
        FOR ALL USING (user_id = (SELECT auth.uid()))';
    END IF;
END $$;

-- Events - Single comprehensive policy per operation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
        EXECUTE 'CREATE POLICY "events_all" ON public.events 
        FOR ALL USING (user_id = (SELECT auth.uid()))';
    END IF;
END $$;

-- Event Outfit Choices - Single comprehensive policy per operation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_outfit_choices') THEN
        EXECUTE 'CREATE POLICY "event_outfit_choices_all" ON public.event_outfit_choices 
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.events e 
                WHERE e.id = event_id 
                AND e.user_id = (SELECT auth.uid())
            )
        )';
    END IF;
END $$;

-- Sustainability Tracking - Single comprehensive policy per operation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sustainability_tracking') THEN
        EXECUTE 'CREATE POLICY "sustainability_tracking_all" ON public.sustainability_tracking 
        FOR ALL USING (user_id = (SELECT auth.uid()))';
    END IF;
END $$;

-- ============================================================================
-- 3. DROP DUPLICATE INDEXES (SAFELY)
-- ============================================================================

-- Drop duplicate indexes identified by the linter (only if they exist and are not dependencies)
DO $$
BEGIN
    -- Drop partitioned table duplicate indexes carefully
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'clothing_items_p0_category_id_idx1') THEN
        DROP INDEX IF EXISTS public.clothing_items_p0_category_id_idx1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'clothing_items_p0_last_worn_date_idx1') THEN
        DROP INDEX IF EXISTS public.clothing_items_p0_last_worn_date_idx1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'clothing_items_p0_subcategory_id_idx1') THEN
        DROP INDEX IF EXISTS public.clothing_items_p0_subcategory_id_idx1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'clothing_items_p1_category_id_idx1') THEN
        DROP INDEX IF EXISTS public.clothing_items_p1_category_id_idx1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'clothing_items_p1_last_worn_date_idx1') THEN
        DROP INDEX IF EXISTS public.clothing_items_p1_last_worn_date_idx1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'clothing_items_p1_subcategory_id_idx1') THEN
        DROP INDEX IF EXISTS public.clothing_items_p1_subcategory_id_idx1;
    END IF;
    
    -- Drop other duplicate indexes
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_event_templates_user_id') THEN
        DROP INDEX IF EXISTS public.idx_event_templates_user_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'outfit_recommendations_p0_occasion_name_idx1') THEN
        DROP INDEX IF EXISTS public.outfit_recommendations_p0_occasion_name_idx1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'outfit_recommendations_p1_occasion_name_idx1') THEN
        DROP INDEX IF EXISTS public.outfit_recommendations_p1_occasion_name_idx1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_interactions_type') THEN
        DROP INDEX IF EXISTS public.idx_user_interactions_type;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error dropping duplicate indexes: %', SQLERRM;
END $$;

-- ============================================================================
-- 4. CREATE OPTIMIZED INDEXES FOR RLS PERFORMANCE
-- ============================================================================

-- Create indexes to support the optimized RLS policies
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_id ON public.clothing_items(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- Conditional indexes for tables that may exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'outfit_recommendations') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_outfit_recommendations_user_id ON public.outfit_recommendations(user_id)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_interactions') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_interactions(user_id)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wardrobe_gaps') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_wardrobe_gaps_user_id ON public.wardrobe_gaps(user_id)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'outfit_collections') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_outfit_collections_user_id ON public.outfit_collections(user_id)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clothing_duplicates') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_clothing_duplicates_user_id ON public.clothing_duplicates(user_id)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recommendation_logs') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_recommendation_logs_user_id ON public.recommendation_logs(user_id)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'error_logs') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON public.referrals(referee_id)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_credits') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking(user_id)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_templates') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_event_templates_user_id ON public.event_templates(user_id)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_outfit_choices') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_event_outfit_choices_event_id ON public.event_outfit_choices(event_id)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sustainability_tracking') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sustainability_tracking_user_id ON public.sustainability_tracking(user_id)';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- COMMENTS
-- ============================================================================

-- ============================================================================
-- COMMENTS
-- ============================================================================

-- This migration fixes RLS performance issues by:
-- 1. Replacing auth.uid() with (SELECT auth.uid()) to prevent re-evaluation per row
-- 2. Consolidating multiple permissive policies into single policies per operation  
-- 3. Safely removing duplicate indexes to reduce maintenance overhead
-- 4. Adding optimized indexes to support RLS policy performance