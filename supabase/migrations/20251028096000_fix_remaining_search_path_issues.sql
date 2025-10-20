-- ============================================================================
-- FIX REMAINING SEARCH PATH SECURITY ISSUES
-- Update all functions that still lack proper search_path settings
-- ============================================================================

-- Fix update_updated_at_column function from initial schema
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$
BEGIN 
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix normalize_enum_value function from 20251202000003
CREATE OR REPLACE FUNCTION normalize_enum_value(input_value TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(trim(replace(replace(input_value, '-', '_'), ' ', '_')));
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = '';

-- Fix create_user_profile function from 20251201000000
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix refresh_wardrobe_analytics function from initial schema
CREATE OR REPLACE FUNCTION refresh_wardrobe_analytics() 
RETURNS void AS $$
BEGIN 
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_wardrobe_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix find_similar_items function from initial schema
CREATE OR REPLACE FUNCTION find_similar_items(
    target_embedding VECTOR(768),
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

-- Fix calculate_wardrobe_diversity function from initial schema
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
    CROSS JOIN LATERAL unnest(ci.season_names) AS season_elem
WHERE
    ci.user_id = target_user_id
    AND ci.is_archived = FALSE
    AND ci.deleted_at IS NULL;

    RETURN LEAST(diversity_score, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Migration complete: Fixes remaining search_path security issues in existing functions