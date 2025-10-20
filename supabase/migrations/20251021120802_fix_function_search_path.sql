-- ============================================================================
-- FIX FUNCTION SEARCH PATH SECURITY ISSUES
-- Set search_path to empty string for all functions to prevent injection attacks
-- ============================================================================

-- Fix all existing functions by adding SET search_path = ''

-- 1. Update update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$
BEGIN 
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. Update find_or_create_category function
CREATE OR REPLACE FUNCTION find_or_create_category(category_name TEXT)
RETURNS UUID AS $$
DECLARE
    category_id UUID;
    clean_name TEXT;
BEGIN
    -- Input validation
    IF category_name IS NULL OR trim(category_name) = '' THEN
        RAISE EXCEPTION 'Category name cannot be null or empty';
    END IF;
    
    IF length(trim(category_name)) > 100 THEN
        RAISE EXCEPTION 'Category name too long (max 100 characters)';
    END IF;
    
    -- Sanitize input
    clean_name := lower(trim(regexp_replace(category_name, '[^a-zA-Z0-9\s\-]', '', 'g')));
    
    -- Try to find existing category
    SELECT id INTO category_id 
    FROM public.clothing_categories 
    WHERE lower(name) = clean_name AND is_active = TRUE;
    
    -- If not found, create as AI suggested (pending approval)
    IF category_id IS NULL THEN
        INSERT INTO public.clothing_categories (name, is_active, source)
        VALUES (clean_name, FALSE, 'ai_suggested')
        RETURNING id INTO category_id;
    END IF;
    
    RETURN category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 3. Update find_or_create_subcategory function
CREATE OR REPLACE FUNCTION find_or_create_subcategory(subcategory_name TEXT, parent_category_id UUID)
RETURNS UUID AS $$
DECLARE
    subcategory_id UUID;
BEGIN
    -- Try to find existing subcategory
    SELECT id INTO subcategory_id 
    FROM public.clothing_subcategories 
    WHERE name = subcategory_name 
    AND category_id = parent_category_id 
    AND is_active = TRUE;
    
    -- If not found, create as AI suggested
    IF subcategory_id IS NULL THEN
        INSERT INTO public.clothing_subcategories (name, category_id, is_active, source)
        VALUES (subcategory_name, parent_category_id, FALSE, 'ai_suggested')
        RETURNING id INTO subcategory_id;
    END IF;
    
    RETURN subcategory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 4. Update get_clothing_item_with_categories function
CREATE OR REPLACE FUNCTION get_clothing_item_with_categories(item_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', ci.id,
        'name', ci.name,
        'category', CASE 
            WHEN cc.id IS NOT NULL THEN json_build_object('id', cc.id, 'name', cc.name)
            ELSE NULL 
        END,
        'subcategory', CASE 
            WHEN cs.id IS NOT NULL THEN json_build_object('id', cs.id, 'name', cs.name)
            ELSE NULL 
        END,
        'style_tags', COALESCE((
            SELECT json_agg(json_build_object('id', st.id, 'name', st.name))
            FROM public.clothing_item_style_tags cist
            JOIN public.style_tags st ON cist.style_tag_id = st.id
            WHERE cist.clothing_item_id = ci.id
        ), '[]'::json),
        'primary_color', ci.primary_color,
        'secondary_colors', ci.secondary_colors,
        'material', ci.material,
        'pattern', ci.pattern,
        'image_url', ci.image_url,
        'thumbnail_url', ci.thumbnail_url,
        'times_worn', ci.times_worn,
        'is_favorite', ci.is_favorite,
        'created_at', ci.created_at
    ) INTO result
    FROM public.clothing_items ci
    LEFT JOIN public.clothing_categories cc ON ci.category_id = cc.id
    LEFT JOIN public.clothing_subcategories cs ON ci.subcategory_id = cs.id
    WHERE ci.id = item_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 5. Update add_style_tags_to_item function
CREATE OR REPLACE FUNCTION add_style_tags_to_item(item_id UUID, tag_names TEXT[])
RETURNS VOID AS $$
DECLARE
    tag_name TEXT;
    tag_id UUID;
BEGIN
    FOREACH tag_name IN ARRAY tag_names
    LOOP
        -- Find or create style tag
        SELECT id INTO tag_id FROM public.style_tags WHERE name = tag_name;
        
        IF tag_id IS NULL THEN
            INSERT INTO public.style_tags (name, source) 
            VALUES (tag_name, 'ai_suggested') 
            RETURNING id INTO tag_id;
        END IF;
        
        -- Link to clothing item (ignore if already exists)
        INSERT INTO public.clothing_item_style_tags (clothing_item_id, style_tag_id)
        VALUES (item_id, tag_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 6. Update get_active_categories_for_prompt function
CREATE OR REPLACE FUNCTION get_active_categories_for_prompt()
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'categories', (
            SELECT json_agg(name ORDER BY display_order)
            FROM public.clothing_categories 
            WHERE is_active = TRUE
        ),
        'subcategories', (
            SELECT json_object_agg(
                cc.name,
                json_agg(cs.name ORDER BY cs.name)
            )
            FROM public.clothing_categories cc
            JOIN public.clothing_subcategories cs ON cc.id = cs.category_id
            WHERE cc.is_active = TRUE AND cs.is_active = TRUE
            GROUP BY cc.name
        ),
        'style_tags', (
            SELECT json_agg(name ORDER BY popularity_score DESC)
            FROM public.style_tags 
            WHERE is_active = TRUE
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 7. Update refresh_wardrobe_analytics function
CREATE OR REPLACE FUNCTION refresh_wardrobe_analytics() 
RETURNS void AS $$
BEGIN 
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_wardrobe_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 8. Update find_similar_items function
CREATE OR REPLACE FUNCTION find_similar_items(
    target_embedding VECTOR(512),
    target_user_id UUID,
    similarity_threshold DECIMAL DEFAULT 0.7,
    limit_count INTEGER DEFAULT 10
) RETURNS TABLE(
    item_id UUID,
    name TEXT,
    category_name TEXT,
    similarity_score DECIMAL
) AS $$
BEGIN 
    RETURN QUERY
SELECT
    ci.id,
    ci.name,
    cc.name,
    (1 - (ci.embedding <=> target_embedding)) :: DECIMAL(3, 2) as similarity
FROM
    public.clothing_items ci
    LEFT JOIN public.clothing_categories cc ON ci.category_id = cc.id
WHERE
    ci.user_id = target_user_id
    AND ci.is_archived = FALSE
    AND ci.deleted_at IS NULL
    AND (1 - (ci.embedding <=> target_embedding)) >= similarity_threshold
ORDER BY
    ci.embedding <=> target_embedding
LIMIT
    limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 9. Update calculate_wardrobe_diversity function
CREATE OR REPLACE FUNCTION calculate_wardrobe_diversity(target_user_id UUID) 
RETURNS DECIMAL AS $$
DECLARE 
    diversity_score DECIMAL;
BEGIN
SELECT
    (
        COUNT(DISTINCT ci.category_id) * 10 + 
        COUNT(DISTINCT ci.primary_color) * 5 + 
        COUNT(DISTINCT ci.subcategory_id) * 3 + 
        CASE
            WHEN COUNT(DISTINCT season_elem) > 1 THEN 20
            ELSE 0
        END
    ) :: DECIMAL / 100.0 INTO diversity_score
FROM
    public.clothing_items ci
    CROSS JOIN LATERAL unnest(ci.season) AS season_elem
WHERE
    ci.user_id = target_user_id
    AND ci.is_archived = FALSE
    AND ci.deleted_at IS NULL;

    RETURN LEAST(diversity_score, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 10. Update get_trending_categories_for_season function
CREATE OR REPLACE FUNCTION get_trending_categories_for_season(target_season season, target_year INTEGER)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'id', cc.id,
                'name', cc.name,
                'trend_description', st.trend_description
            )
        )
        FROM public.seasonal_trends st
        JOIN public.seasonal_trend_categories stc ON st.id = stc.trend_id
        JOIN public.clothing_categories cc ON stc.category_id = cc.id
        WHERE st.season = target_season 
        AND st.year = target_year
        AND CURRENT_DATE BETWEEN st.valid_from AND st.valid_until
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 11. Update add_trending_categories_to_trend function
CREATE OR REPLACE FUNCTION add_trending_categories_to_trend(
    trend_id UUID, 
    category_names TEXT[]
)
RETURNS VOID AS $$
DECLARE
    category_name TEXT;
    category_id UUID;
BEGIN
    FOREACH category_name IN ARRAY category_names
    LOOP
        -- Find or create category
        SELECT id INTO category_id 
        FROM public.clothing_categories 
        WHERE name = category_name;
        
        IF category_id IS NULL THEN
            INSERT INTO public.clothing_categories (name, source) 
            VALUES (category_name, 'trend_analysis') 
            RETURNING id INTO category_id;
        END IF;
        
        -- Link to trend (ignore if already exists)
        INSERT INTO public.seasonal_trend_categories (trend_id, category_id)
        VALUES (trend_id, category_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Update the array column for backward compatibility
    UPDATE public.seasonal_trends 
    SET trending_category_ids = (
        SELECT array_agg(stc.category_id)
        FROM public.seasonal_trend_categories stc
        WHERE stc.trend_id = add_trending_categories_to_trend.trend_id
    )
    WHERE id = add_trending_categories_to_trend.trend_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 12. Update all security-related functions
CREATE OR REPLACE FUNCTION check_category_creation_rate_limit(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    recent_count INTEGER;
BEGIN
    -- Check if user has created more than 10 categories in the last hour
    SELECT COUNT(*) INTO recent_count
    FROM public.category_creation_log
    WHERE user_id = target_user_id
    AND created_at > NOW() - INTERVAL '1 hour';
    
    RETURN recent_count < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

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
    
    -- Log cleanup activity
    INSERT INTO public.category_creation_log (user_id, category_name)
    VALUES ('00000000-0000-0000-0000-000000000000', 'CLEANUP: ' || deleted_count || ' orphaned records removed');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION validate_ai_clothing_analysis(analysis_json JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check required fields exist
    IF NOT (analysis_json ? 'name' AND 
            analysis_json ? 'primary_color' AND 
            analysis_json ? 'ai_confidence_score') THEN
        RETURN FALSE;
    END IF;
    
    -- Validate confidence score range
    IF (analysis_json->>'ai_confidence_score')::DECIMAL NOT BETWEEN 0 AND 1 THEN
        RETURN FALSE;
    END IF;
    
    -- Validate name length
    IF length(analysis_json->>'name') > 200 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = '';

CREATE OR REPLACE FUNCTION log_error(
    target_user_id UUID,
    error_type TEXT,
    error_message TEXT,
    error_context JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.error_logs (user_id, error_type, error_message, context)
    VALUES (target_user_id, error_type, error_message, error_context);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION schedule_analytics_refresh()
RETURNS VOID AS $$
BEGIN
    -- This would typically be called by a cron job or scheduled task
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_wardrobe_analytics;
    
    -- Log the refresh
    INSERT INTO public.error_logs (error_type, error_message, context)
    VALUES ('INFO', 'Analytics materialized view refreshed', '{"timestamp": "' || NOW() || '"}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION prevent_duplicate_categories()
RETURNS TRIGGER AS $$
DECLARE
    similar_count INTEGER;
BEGIN
    -- Check for similar category names (basic similarity)
    SELECT COUNT(*) INTO similar_count
    FROM public.clothing_categories
    WHERE is_active = TRUE
    AND (
        lower(name) = lower(NEW.name) OR
        levenshtein(lower(name), lower(NEW.name)) <= 2
    );
    
    IF similar_count > 0 THEN
        RAISE EXCEPTION 'Similar category already exists: %', NEW.name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Migration completed: Fixed search_path security vulnerability in all functions