-- The materialized view should already exist from migration 20251202000003_fix_remaining_enums.sql
-- Just refresh it to ensure it has current data
DO $$
BEGIN
    -- Check if the materialized view exists
    IF EXISTS (
        SELECT 1 FROM pg_matviews 
        WHERE schemaname = 'public' AND matviewname = 'user_wardrobe_analytics'
    ) THEN
        -- Refresh the existing view
        REFRESH MATERIALIZED VIEW user_wardrobe_analytics;
    END IF;
END $$;

-- Add a function to automatically refresh the view when needed
CREATE OR REPLACE FUNCTION refresh_user_analytics()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW user_wardrobe_analytics;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh analytics when relevant data changes
DROP TRIGGER IF EXISTS refresh_analytics_on_clothing_items ON clothing_items;
CREATE TRIGGER refresh_analytics_on_clothing_items
  AFTER INSERT OR UPDATE OR DELETE ON clothing_items
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_user_analytics();

DROP TRIGGER IF EXISTS refresh_analytics_on_recommendations ON outfit_recommendations;
CREATE TRIGGER refresh_analytics_on_recommendations
  AFTER INSERT OR UPDATE OR DELETE ON outfit_recommendations
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_user_analytics();

DROP TRIGGER IF EXISTS refresh_analytics_on_interactions ON user_interactions;
CREATE TRIGGER refresh_analytics_on_interactions
  AFTER INSERT OR UPDATE OR DELETE ON user_interactions
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_user_analytics();