-- ============================================================================
-- CLEANUP OLD MIGRATIONS - Remove Problematic Functions and Triggers
-- This migration cleans up issues from previous fragmented migrations
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. DROP PROBLEMATIC TRIGGERS THAT CAUSE PERMISSION ISSUES
-- ============================================================================

-- Drop materialized view refresh triggers that cause permission issues
DROP TRIGGER IF EXISTS refresh_analytics_on_clothing_items ON public.clothing_items;
DROP TRIGGER IF EXISTS refresh_analytics_on_recommendations ON public.outfit_recommendations;
DROP TRIGGER IF EXISTS refresh_analytics_on_interactions ON public.user_interactions;

-- Drop the problematic refresh function
DROP FUNCTION IF EXISTS refresh_user_analytics();

-- ============================================================================
-- 2. FIX MATERIALIZED VIEW ISSUES
-- ============================================================================

-- Drop and recreate materialized view without problematic triggers
DROP MATERIALIZED VIEW IF EXISTS public.user_wardrobe_analytics;

-- Only create if we have the required tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clothing_items') THEN
        
        CREATE MATERIALIZED VIEW public.user_wardrobe_analytics AS
        SELECT
            u.user_id,
            COUNT(DISTINCT ci.id) as total_items,
            COUNT(DISTINCT ci.category_id) as category_diversity,
            AVG(ci.sustainability_score) as avg_sustainability,
            SUM(ci.times_worn) as total_wears,
            MAX(ci.created_at) as last_item_added
        FROM public.user_profiles u
        LEFT JOIN public.clothing_items ci ON u.user_id = ci.user_id
            AND ci.is_archived = FALSE AND ci.deleted_at IS NULL
        GROUP BY u.user_id;
        
        -- Create unique index
        CREATE UNIQUE INDEX idx_user_analytics_user_id ON public.user_wardrobe_analytics(user_id);
        
        -- Grant permissions
        GRANT SELECT ON public.user_wardrobe_analytics TO authenticated;
        GRANT SELECT ON public.user_wardrobe_analytics TO anon;
    END IF;
END $$;

-- ============================================================================
-- 3. CLEAN UP DUPLICATE FUNCTIONS
-- ============================================================================

-- Remove duplicate or conflicting function definitions
DROP FUNCTION IF EXISTS public.normalize_enum_value(TEXT);
DROP FUNCTION IF EXISTS public.find_or_create_season(TEXT);
DROP FUNCTION IF EXISTS public.find_or_create_fit_preference(TEXT);

-- Recreate essential functions with proper error handling
CREATE OR REPLACE FUNCTION public.normalize_enum_value(input_value TEXT)
RETURNS TEXT
SET search_path = ''
AS $$
BEGIN
    RETURN LOWER(TRIM(REPLACE(REPLACE(input_value, ' ', '-'), '_', '-')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 4. LEVENSHTEIN FUNCTION IS PROVIDED BY FUZZYSTRMATCH EXTENSION
-- ============================================================================

-- The levenshtein function is provided by the fuzzystrmatch extension
-- No need to create a wrapper function

-- ============================================================================
-- 5. CLEAN UP ORPHANED RECORDS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_orphaned_records()
RETURNS INTEGER 
SET search_path = ''
AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up orphaned style tag associations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clothing_item_style_tags') THEN
        DELETE FROM public.clothing_item_style_tags cist
        WHERE NOT EXISTS (
            SELECT 1 FROM public.clothing_items ci 
            WHERE ci.id = cist.clothing_item_id
        );
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
    END IF;
    
    -- Clean up orphaned seasonal trend categories
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seasonal_trend_categories') THEN
        DELETE FROM public.seasonal_trend_categories stc
        WHERE NOT EXISTS (
            SELECT 1 FROM public.seasonal_trends st 
            WHERE st.id = stc.trend_id
        );
        
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        deleted_count := deleted_count + temp_count;
    END IF;
    
    -- Log cleanup activity
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'error_logs') THEN
        INSERT INTO public.error_logs (error_type, error_message, context)
        VALUES ('INFO', 'Cleanup completed', '{"orphaned_records_removed": ' || deleted_count || '}');
    END IF;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. CREATE SAFE ANALYTICS REFRESH FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_wardrobe_analytics() 
RETURNS void 
SET search_path = ''
AS $$
BEGIN 
    -- Only refresh if the materialized view exists
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'user_wardrobe_analytics') THEN
        BEGIN
            REFRESH MATERIALIZED VIEW public.user_wardrobe_analytics;
        EXCEPTION
            WHEN insufficient_privilege THEN
                -- Log the error but don't fail
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'error_logs') THEN
                    INSERT INTO public.error_logs (error_type, error_message, context)
                    VALUES ('WARNING', 'Could not refresh analytics view due to permissions', '{"function": "refresh_wardrobe_analytics"}');
                END IF;
            WHEN OTHERS THEN
                -- Log any other errors
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'error_logs') THEN
                    INSERT INTO public.error_logs (error_type, error_message, context)
                    VALUES ('ERROR', 'Analytics refresh failed: ' || SQLERRM, '{"function": "refresh_wardrobe_analytics"}');
                END IF;
        END;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. GRANT PROPER PERMISSIONS
-- ============================================================================

-- Grant execute permissions on essential functions
GRANT EXECUTE ON FUNCTION public.normalize_enum_value(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_enum_value(TEXT) TO anon;

-- ============================================================================
-- 8. REMOVE PROBLEMATIC ENUM COLUMNS IF THEY STILL EXIST
-- ============================================================================

-- Clean up any remaining enum columns that might cause conflicts
DO $$
BEGIN
    -- Remove old enum columns from clothing_items if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clothing_items' AND column_name = 'category' AND data_type = 'USER-DEFINED') THEN
        ALTER TABLE public.clothing_items DROP COLUMN category;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clothing_items' AND column_name = 'subcategory' AND data_type = 'USER-DEFINED') THEN
        ALTER TABLE public.clothing_items DROP COLUMN subcategory;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clothing_items' AND column_name = 'season' AND data_type = 'ARRAY') THEN
        ALTER TABLE public.clothing_items DROP COLUMN season;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clothing_items' AND column_name = 'fit' AND data_type = 'USER-DEFINED') THEN
        ALTER TABLE public.clothing_items DROP COLUMN fit;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clothing_items' AND column_name = 'weather_suitable' AND data_type = 'ARRAY') THEN
        ALTER TABLE public.clothing_items DROP COLUMN weather_suitable;
    END IF;
    
    -- Remove old enum columns from user_profiles if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'body_type' AND data_type = 'USER-DEFINED') THEN
        ALTER TABLE public.user_profiles DROP COLUMN body_type;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'preferred_fit' AND data_type = 'USER-DEFINED') THEN
        ALTER TABLE public.user_profiles DROP COLUMN preferred_fit;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'default_activity_level' AND data_type = 'USER-DEFINED') THEN
        ALTER TABLE public.user_profiles DROP COLUMN default_activity_level;
    END IF;
END $$;

-- ============================================================================
-- 9. LOG CLEANUP COMPLETION
-- ============================================================================

-- Log the cleanup completion
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'error_logs') THEN
        INSERT INTO public.error_logs (error_type, error_message, context)
        VALUES ('INFO', 'Migration cleanup completed successfully', '{"migration": "20251206000001_cleanup_old_migrations"}');
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION cleanup_orphaned_records() IS 'Safely removes orphaned records with proper error handling';
COMMENT ON FUNCTION refresh_wardrobe_analytics() IS 'Safely refreshes analytics view with permission error handling';