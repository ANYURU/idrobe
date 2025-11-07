-- Fix SECURITY DEFINER issue by dropping the problematic view
-- The dependent view user_wardrobe_analytics_secure has SECURITY DEFINER

-- Drop the dependent view first
DROP VIEW IF EXISTS user_wardrobe_analytics_secure CASCADE;

-- Recreate materialized view without SECURITY DEFINER dependencies
DROP MATERIALIZED VIEW IF EXISTS user_wardrobe_analytics CASCADE;

CREATE MATERIALIZED VIEW user_wardrobe_analytics AS
SELECT 
    ci.user_id,
    COUNT(ci.id) as total_items,
    COALESCE(SUM(ci.times_worn), 0) as total_wears,
    ROUND(AVG(ci.sustainability_score), 2) as avg_sustainability,
    COUNT(DISTINCT ci.category_id) as category_diversity,
    MAX(ci.created_at) as last_item_added
FROM clothing_items ci
WHERE ci.deleted_at IS NULL
GROUP BY ci.user_id;

-- Create index for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_wardrobe_analytics_user_id 
ON user_wardrobe_analytics(user_id);