-- Fix function return type conflicts before other migrations
BEGIN;

-- Drop conflicting functions that have return type issues
DROP FUNCTION IF EXISTS add_style_tags_to_item(UUID, TEXT[]);
DROP FUNCTION IF EXISTS get_clothing_item_with_categories(UUID);
DROP FUNCTION IF EXISTS get_active_categories_for_prompt();

COMMIT;