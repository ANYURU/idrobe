-- ============================================================================
-- GET DAILY OUTFIT RPC FUNCTION
-- Optimized single-query function for daily outfit recommendations
-- ============================================================================

BEGIN;

-- Drop existing function if it exists (for idempotency)
DROP FUNCTION IF EXISTS public.get_daily_outfit(UUID, TEXT, INTEGER);

-- ============================================================================
-- MAIN RPC FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_daily_outfit(
    p_user_id UUID,
    p_weather_condition TEXT,  -- e.g., 'sunny', 'cloudy', 'rainy'
    p_temperature INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
    v_outfit RECORD;
    v_items JSONB;
    v_outfit_id UUID;
    v_item_ids UUID[];
    v_category_counts JSONB;
BEGIN
    -- ========================================================================
    -- STEP 1: Try to find cached outfit (AI or rule-based, not expired)
    -- ========================================================================
    SELECT 
        r.id,
        r.clothing_item_ids,
        r.recommendation_reason,
        r.ai_score,
        r.weather_condition_name,
        r.temperature_celsius,
        r.generated_at
    INTO v_outfit
    FROM outfit_recommendations r
    WHERE r.user_id = p_user_id
        AND r.weather_condition_name = p_weather_condition
        AND r.temperature_celsius BETWEEN p_temperature - 5 AND p_temperature + 5
        AND (r.expires_at IS NULL OR r.expires_at > NOW())
    ORDER BY r.ai_score DESC NULLS LAST, r.generated_at DESC
    LIMIT 1;

    IF v_outfit.id IS NOT NULL THEN
        -- Fetch clothing items for the cached outfit
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', ci.id,
                'name', ci.name,
                'image_url', ci.image_url,
                'primary_color', ci.primary_color,
                'category_id', ci.category_id
            )
        )
        INTO v_items
        FROM clothing_items ci
        WHERE ci.id = ANY(v_outfit.clothing_item_ids)
            AND ci.user_id = p_user_id
            AND ci.is_archived = FALSE
            AND ci.deleted_at IS NULL;

        RETURN jsonb_build_object(
            'source', 'cached',
            'outfit', jsonb_build_object(
                'id', v_outfit.id,
                'recommendation_reason', v_outfit.recommendation_reason,
                'ai_score', v_outfit.ai_score,
                'weather_condition', v_outfit.weather_condition_name,
                'temperature', v_outfit.temperature_celsius,
                'generated_at', v_outfit.generated_at,
                'clothing_item_ids', v_outfit.clothing_item_ids
            ),
            'items', COALESCE(v_items, '[]'::jsonb)
        );
    END IF;

    -- ========================================================================
    -- STEP 2: Build rule-based outfit using weather_suitable_names
    -- ========================================================================
    
    -- Get weather-appropriate items, scored by wear frequency
    -- Prioritize: 1) least worn items, 2) items not worn recently
    WITH scored_items AS (
        SELECT 
            ci.id,
            ci.name,
            ci.image_url,
            ci.primary_color,
            ci.category_id,
            cc.name as category_name,
            ci.times_worn,
            ci.last_worn_date,
            -- Score: lower is better (prioritize less worn, older last worn)
            ROW_NUMBER() OVER (
                PARTITION BY cc.name 
                ORDER BY 
                    ci.times_worn ASC NULLS FIRST,
                    ci.last_worn_date ASC NULLS FIRST,
                    ci.created_at DESC
            ) as rank_in_category
        FROM clothing_items ci
        LEFT JOIN clothing_categories cc ON ci.category_id = cc.id
        WHERE ci.user_id = p_user_id
            AND ci.is_archived = FALSE
            AND ci.deleted_at IS NULL
            AND (
                p_weather_condition = ANY(ci.weather_suitable_names)
                OR cardinality(ci.weather_suitable_names) = 0  -- Include items with no weather restrictions
            )
    ),
    -- Select one item per key category (tops, bottoms, shoes, outerwear)
    selected_items AS (
        SELECT * FROM (
            -- Get best top
            SELECT id, name, image_url, primary_color, category_id, category_name, 1 as priority
            FROM scored_items 
            WHERE category_name = 'tops' AND rank_in_category = 1
            LIMIT 1
        ) tops
        UNION ALL
        SELECT * FROM (
            -- Get best bottom
            SELECT id, name, image_url, primary_color, category_id, category_name, 2 as priority
            FROM scored_items 
            WHERE category_name = 'bottoms' AND rank_in_category = 1
            LIMIT 1
        ) bottoms
        UNION ALL
        SELECT * FROM (
            -- Get best shoes
            SELECT id, name, image_url, primary_color, category_id, category_name, 3 as priority
            FROM scored_items 
            WHERE category_name = 'shoes' AND rank_in_category = 1
            LIMIT 1
        ) shoes
        UNION ALL
        SELECT * FROM (
            -- Get outerwear if cold/rainy
            SELECT id, name, image_url, primary_color, category_id, category_name, 4 as priority
            FROM scored_items 
            WHERE category_name = 'outerwear' AND rank_in_category = 1
            AND p_weather_condition IN ('cold', 'rainy', 'snowy', 'windy', 'stormy')
            LIMIT 1
        ) outerwear
    )
    SELECT array_agg(id ORDER BY priority)
    INTO v_item_ids
    FROM selected_items;

    -- Check if we have at least 2 items (minimum for an outfit)
    IF v_item_ids IS NULL OR array_length(v_item_ids, 1) < 2 THEN
        -- Return empty result if not enough items
        RETURN jsonb_build_object(
            'source', 'insufficient_items',
            'outfit', NULL,
            'items', '[]'::jsonb,
            'message', 'Not enough weather-appropriate items to create an outfit'
        );
    END IF;

    -- ========================================================================
    -- STEP 3: Save rule-based outfit to outfit_recommendations for caching
    -- ========================================================================
    INSERT INTO outfit_recommendations (
        user_id,
        occasion_name,
        weather_condition_name,
        temperature_celsius,
        clothing_item_ids,
        ai_score,
        recommendation_reason,
        expires_at,
        generated_at
    )
    VALUES (
        p_user_id,
        'everyday',
        p_weather_condition,
        p_temperature,
        v_item_ids,
        0.6,  -- Rule-based score
        'Rule-based outfit for ' || p_weather_condition || ' weather at ' || p_temperature || '°C',
        NOW() + INTERVAL '1 day',  -- TTL: 1 day for rule-based
        NOW()
    )
    RETURNING id INTO v_outfit_id;

    -- Fetch items for the new outfit
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', ci.id,
            'name', ci.name,
            'image_url', ci.image_url,
            'primary_color', ci.primary_color,
            'category_id', ci.category_id
        )
    )
    INTO v_items
    FROM clothing_items ci
    WHERE ci.id = ANY(v_item_ids)
        AND ci.user_id = p_user_id;

    RETURN jsonb_build_object(
        'source', 'rule_based',
        'outfit', jsonb_build_object(
            'id', v_outfit_id,
            'recommendation_reason', 'Rule-based outfit for ' || p_weather_condition || ' weather at ' || p_temperature || '°C',
            'ai_score', 0.6,
            'weather_condition', p_weather_condition,
            'temperature', p_temperature,
            'generated_at', NOW(),
            'clothing_item_ids', v_item_ids
        ),
        'items', COALESCE(v_items, '[]'::jsonb)
    );
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.get_daily_outfit(UUID, TEXT, INTEGER) TO authenticated;

-- ============================================================================
-- ADD INDEX FOR PERFORMANCE (weather + temperature lookup)
-- ============================================================================
-- Note: No WHERE clause to avoid IMMUTABLE function requirement
CREATE INDEX IF NOT EXISTS idx_outfit_recommendations_weather_lookup 
ON public.outfit_recommendations(user_id, weather_condition_name, temperature_celsius, expires_at);

COMMIT;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION public.get_daily_outfit IS 
'Optimized RPC function to get daily outfit recommendation.
Returns cached AI/rule-based outfit if available, otherwise builds rule-based outfit
from wardrobe using weather_suitable_names matching.
Rule-based outfits are saved with 1-day TTL for caching.
Returns: { source, outfit, items }';
