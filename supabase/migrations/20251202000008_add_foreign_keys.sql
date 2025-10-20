-- Add indexes for better query performance (no foreign keys to preserve flexibility)

-- Partial indexes for better performance on non-null values
CREATE INDEX IF NOT EXISTS idx_user_interactions_recommendation_id 
ON public.user_interactions(recommendation_id) WHERE recommendation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_interactions_clothing_item_id 
ON public.user_interactions(clothing_item_id) WHERE clothing_item_id IS NOT NULL;

-- Composite index for user queries
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_type 
ON public.user_interactions(user_id, interaction_type_name);

-- Keep original constraint (preserve existing behavior)
-- No changes to check_interaction_target constraint