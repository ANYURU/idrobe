-- ============================================================================
-- EXCLUDE ONBOARDING USAGE FROM SUBSCRIPTION LIMITS
-- This migration updates the usage tracking function to exclude onboarding
-- recommendations from counting toward subscription limits
-- ============================================================================

-- Update function to accept onboarding parameter
CREATE OR REPLACE FUNCTION increment_usage_tracking(
  p_user_id UUID,
  p_usage_type TEXT,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_is_onboarding BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
  -- Don't track onboarding usage (it's free)
  IF p_is_onboarding THEN
    RETURN;
  END IF;
  
  -- Track only billable usage
  INSERT INTO usage_tracking (
    user_id,
    usage_type,
    usage_count,
    period_start,
    period_end
  )
  VALUES (
    p_user_id,
    p_usage_type,
    1,
    p_period_start,
    p_period_end
  )
  ON CONFLICT (user_id, usage_type, period_start)
  DO UPDATE SET
    usage_count = usage_tracking.usage_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION increment_usage_tracking IS 
'Tracks user usage for subscription limits. Excludes onboarding usage when p_is_onboarding is TRUE.';
