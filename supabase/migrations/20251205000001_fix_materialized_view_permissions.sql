-- ============================================================================
-- FIX MATERIALIZED VIEW PERMISSIONS ISSUE
-- Remove problematic triggers and fix ownership issues
-- ============================================================================

-- Drop the problematic trigger that refreshes the materialized view on every insert
DROP TRIGGER IF EXISTS refresh_analytics_on_clothing_items ON public.clothing_items;
DROP TRIGGER IF EXISTS refresh_analytics_on_recommendations ON public.outfit_recommendations;
DROP TRIGGER IF EXISTS refresh_analytics_on_interactions ON public.user_interactions;

-- Drop the function that causes permission issues
DROP FUNCTION IF EXISTS refresh_user_analytics();

-- Recreate the materialized view with proper ownership
DROP MATERIALIZED VIEW IF EXISTS public.user_wardrobe_analytics;

CREATE MATERIALIZED VIEW public.user_wardrobe_analytics AS
SELECT
    u.user_id,
    COUNT(DISTINCT ci.id) as total_items,
    COUNT(DISTINCT ci.category_id) as category_diversity,
    AVG(ci.sustainability_score) as avg_sustainability,
    SUM(ci.times_worn) as total_wears,
    COUNT(DISTINCT or_rec.id) as total_recommendations,
    COUNT(
        DISTINCT CASE
            WHEN ui.interaction_type_name = 'liked' THEN ui.id
        END
    ) as liked_recommendations,
    COUNT(
        DISTINCT CASE
            WHEN ui.interaction_type_name = 'worn' THEN ui.id
        END
    ) as worn_recommendations,
    ROUND(
        COUNT(
            DISTINCT CASE
                WHEN ui.interaction_type_name = 'liked' THEN ui.id
            END
        )::DECIMAL / NULLIF(COUNT(DISTINCT or_rec.id), 0) * 100,
        2
    ) as recommendation_acceptance_rate,
    MAX(ci.created_at) as last_item_added,
    MAX(or_rec.generated_at) as last_recommendation_generated
FROM public.user_profiles u
LEFT JOIN public.clothing_items ci ON u.user_id = ci.user_id
    AND ci.is_archived = FALSE AND ci.deleted_at IS NULL
LEFT JOIN public.outfit_recommendations or_rec ON u.user_id = or_rec.user_id
LEFT JOIN public.user_interactions ui ON or_rec.id = ui.recommendation_id
GROUP BY u.user_id;

-- Create unique index for the materialized view
CREATE UNIQUE INDEX idx_user_analytics_user_id ON public.user_wardrobe_analytics(user_id);

-- Update the refresh function to handle permissions properly
CREATE OR REPLACE FUNCTION refresh_wardrobe_analytics() 
RETURNS void AS $$
BEGIN 
    -- Use a simple refresh without CONCURRENTLY to avoid ownership issues
    -- This will be called manually or by scheduled jobs, not on every insert
    REFRESH MATERIALIZED VIEW public.user_wardrobe_analytics;
EXCEPTION
    WHEN insufficient_privilege THEN
        -- Log the error but don't fail the operation
        INSERT INTO public.error_logs (error_type, error_message, context)
        VALUES ('WARNING', 'Could not refresh analytics view due to permissions', '{"function": "refresh_wardrobe_analytics"}');
    WHEN OTHERS THEN
        -- Log any other errors
        INSERT INTO public.error_logs (error_type, error_message, context)
        VALUES ('ERROR', 'Analytics refresh failed: ' || SQLERRM, '{"function": "refresh_wardrobe_analytics"}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update schedule_analytics_refresh to handle permissions gracefully
CREATE OR REPLACE FUNCTION schedule_analytics_refresh()
RETURNS VOID AS $$
BEGIN
    -- Try to refresh the materialized view
    BEGIN
        REFRESH MATERIALIZED VIEW public.user_wardrobe_analytics;
        
        -- Log successful refresh
        INSERT INTO public.error_logs (error_type, error_message, context)
        VALUES ('INFO', 'Analytics materialized view refreshed successfully', '{"timestamp": "' || NOW() || '"}');
    EXCEPTION
        WHEN insufficient_privilege THEN
            -- Log the permission issue but don't fail
            INSERT INTO public.error_logs (error_type, error_message, context)
            VALUES ('WARNING', 'Analytics refresh skipped due to permissions', '{"timestamp": "' || NOW() || '"}');
        WHEN OTHERS THEN
            -- Log other errors but don't fail
            INSERT INTO public.error_logs (error_type, error_message, context)
            VALUES ('ERROR', 'Analytics refresh failed: ' || SQLERRM, '{"timestamp": "' || NOW() || '"}');
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Remove any references to the materialized view refresh from other functions
-- that might be called during normal operations

-- Update any functions that might try to refresh the view
CREATE OR REPLACE FUNCTION cleanup_orphaned_records()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up orphaned style tag associations
    DELETE FROM public.clothing_item_style_tags cist
    WHERE NOT EXISTS (
        SELECT 1 FROM public.clothing_items ci 
        WHERE ci.id = cist.clothing_item_id
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up orphaned seasonal trend categories
    DELETE FROM public.seasonal_trend_categories stc
    WHERE NOT EXISTS (
        SELECT 1 FROM public.seasonal_trends st 
        WHERE st.id = stc.trend_id
    );
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Log cleanup activity (removed materialized view refresh)
    INSERT INTO public.error_logs (error_type, error_message, context)
    VALUES ('INFO', 'Cleanup completed', '{"orphaned_records_removed": ' || deleted_count || '}');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Grant necessary permissions to the authenticated role
GRANT SELECT ON public.user_wardrobe_analytics TO authenticated;
GRANT SELECT ON public.user_wardrobe_analytics TO anon;

-- Add a comment explaining the change
COMMENT ON MATERIALIZED VIEW public.user_wardrobe_analytics IS 'User wardrobe analytics - refreshed manually to avoid permission issues during normal operations';

-- Log the fix
INSERT INTO public.error_logs (error_type, error_message, context)
VALUES ('INFO', 'Fixed materialized view permissions issue', '{"migration": "20251205000001_fix_materialized_view_permissions"}');