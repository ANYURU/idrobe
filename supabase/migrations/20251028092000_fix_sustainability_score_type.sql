-- Fix sustainability_score to use decimal instead of integer
-- The materialized view will be recreated by migration 20251202000003_fix_remaining_enums.sql
DROP MATERIALIZED VIEW IF EXISTS user_wardrobe_analytics;

-- Alter the column type
ALTER TABLE clothing_items ALTER COLUMN sustainability_score TYPE DECIMAL(3,2);