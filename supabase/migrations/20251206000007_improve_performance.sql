-- Add missing indexes and optimize performance
BEGIN;

-- Critical performance indexes
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_category ON public.clothing_items(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_active ON public.clothing_items(user_id, is_archived, deleted_at);
CREATE INDEX IF NOT EXISTS idx_clothing_items_last_worn ON public.clothing_items(last_worn_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON public.user_profiles(current_plan_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_usage_reset ON public.user_profiles(usage_reset_date);

-- Improve materialized view refresh function
CREATE OR REPLACE FUNCTION refresh_wardrobe_analytics() 
RETURNS void AS $$
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'user_wardrobe_analytics') THEN
        BEGIN
            REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_wardrobe_analytics;
        EXCEPTION
            WHEN OTHERS THEN
                REFRESH MATERIALIZED VIEW public.user_wardrobe_analytics;
        END;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Add cleanup function for orphaned records
CREATE OR REPLACE FUNCTION cleanup_orphaned_records()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    DELETE FROM public.clothing_item_style_tags cist
    WHERE NOT EXISTS (
        SELECT 1 FROM public.clothing_items ci 
        WHERE ci.id = cist.clothing_item_id
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMIT;