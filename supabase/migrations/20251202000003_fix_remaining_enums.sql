-- ============================================================================
-- FIX REMAINING CRITICAL ENUMS
-- Handle the most commonly used enums that could cause errors
-- ============================================================================

-- Update outfit_recommendations table (most critical)
ALTER TABLE public.outfit_recommendations 
ADD COLUMN occasion_name TEXT,
ADD COLUMN mood_name TEXT,
ADD COLUMN weather_condition_name TEXT,
ADD COLUMN activity_level_name TEXT;

-- Migrate existing data
UPDATE public.outfit_recommendations 
SET 
    occasion_name = occasion::text,
    mood_name = mood::text,
    weather_condition_name = weather_condition::text,
    activity_level_name = activity_level::text;

-- Drop old enum columns
ALTER TABLE public.outfit_recommendations 
DROP COLUMN occasion,
DROP COLUMN mood, 
DROP COLUMN weather_condition,
DROP COLUMN activity_level;

-- Update materialized view first to remove dependency
DROP MATERIALIZED VIEW IF EXISTS public.user_wardrobe_analytics;

-- Update user_interactions table
ALTER TABLE public.user_interactions 
ADD COLUMN interaction_type_name TEXT;

UPDATE public.user_interactions 
SET interaction_type_name = interaction_type::text;

ALTER TABLE public.user_interactions 
DROP COLUMN interaction_type;

-- Recreate materialized view with new column names
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

-- Recreate unique index
CREATE UNIQUE INDEX idx_user_analytics_user_id ON public.user_wardrobe_analytics(user_id);

-- Update user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN body_type_name TEXT DEFAULT 'prefer_not_to_say',
ADD COLUMN default_activity_level_name TEXT DEFAULT 'moderate';

UPDATE public.user_profiles 
SET 
    body_type_name = replace(body_type::text, '-', '_'),
    default_activity_level_name = replace(default_activity_level::text, '-', '_');

ALTER TABLE public.user_profiles 
DROP COLUMN body_type,
DROP COLUMN default_activity_level;

-- Update clothing_items weather_suitable array
ALTER TABLE public.clothing_items 
ADD COLUMN weather_suitable_names TEXT[] DEFAULT '{}';

UPDATE public.clothing_items 
SET weather_suitable_names = ARRAY(
    SELECT unnest(weather_suitable)::text
);

ALTER TABLE public.clothing_items 
DROP COLUMN weather_suitable;

-- Add indexes for new columns
CREATE INDEX idx_outfit_recommendations_occasion ON public.outfit_recommendations(occasion_name);
CREATE INDEX idx_outfit_recommendations_mood ON public.outfit_recommendations(mood_name);
CREATE INDEX idx_user_interactions_type ON public.user_interactions(interaction_type_name);
CREATE INDEX idx_clothing_weather_names ON public.clothing_items USING GIN(weather_suitable_names);

-- Normalize function to handle common input variations
CREATE OR REPLACE FUNCTION normalize_enum_value(input_value TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(trim(replace(replace(input_value, '-', '_'), ' ', '_')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;