-- ============================================================================
-- DROP OLD ENUM COLUMNS AND TYPES
-- Clean up the old enum-based columns after data migration
-- ============================================================================

-- Drop materialized view first (it depends on old columns)
DROP MATERIALIZED VIEW IF EXISTS public.user_wardrobe_analytics;

-- Update indexes that referenced old enum columns
DROP INDEX IF EXISTS idx_clothing_category;
DROP INDEX IF EXISTS idx_clothing_subcategory;
DROP INDEX IF EXISTS idx_clothing_style_tags;

-- Drop old enum columns from clothing_items
ALTER TABLE public.clothing_items 
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS subcategory,
DROP COLUMN IF EXISTS style_tags;

-- Drop old enum columns from wardrobe_gaps
ALTER TABLE public.wardrobe_gaps 
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS subcategory;

-- Create new indexes for foreign key columns
CREATE INDEX idx_clothing_category_id ON public.clothing_items(category_id);
CREATE INDEX idx_clothing_subcategory_id ON public.clothing_items(subcategory_id);

-- Recreate materialized view with new foreign key columns

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
            WHEN ui.interaction_type = 'liked' THEN ui.id
        END
    ) as liked_recommendations,
    COUNT(
        DISTINCT CASE
            WHEN ui.interaction_type = 'worn' THEN ui.id
        END
    ) as worn_recommendations,
    ROUND(
        COUNT(
            DISTINCT CASE
                WHEN ui.interaction_type = 'liked' THEN ui.id
            END
        ) :: DECIMAL / NULLIF(COUNT(DISTINCT or_rec.id), 0) * 100,
        2
    ) as recommendation_acceptance_rate,
    MAX(ci.created_at) as last_item_added,
    MAX(or_rec.generated_at) as last_recommendation_generated
FROM
    public.user_profiles u
    LEFT JOIN public.clothing_items ci ON u.user_id = ci.user_id
    AND ci.is_archived = FALSE
    AND ci.deleted_at IS NULL
    LEFT JOIN public.outfit_recommendations or_rec ON u.user_id = or_rec.user_id
    LEFT JOIN public.user_interactions ui ON or_rec.id = ui.recommendation_id
GROUP BY
    u.user_id;

-- Recreate unique index for materialized view
CREATE UNIQUE INDEX idx_user_analytics_user_id ON public.user_wardrobe_analytics(user_id);

-- Update helper functions to use new foreign key columns
DROP FUNCTION IF EXISTS find_similar_items(VECTOR(512), UUID, DECIMAL, INTEGER);

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update diversity calculation function
DROP FUNCTION IF EXISTS calculate_wardrobe_diversity(UUID);

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old enum types (only if no other tables use them)
-- Note: Keep these for now as seasonal_trends still uses them
-- DROP TYPE IF EXISTS clothing_category CASCADE;
-- DROP TYPE IF EXISTS clothing_subcategory CASCADE;

-- Migration completed: enum-based categories replaced with foreign key references