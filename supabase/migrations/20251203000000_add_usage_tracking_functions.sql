-- Function to increment usage tracking
CREATE OR REPLACE FUNCTION increment_usage_tracking(
  p_user_id UUID,
  p_usage_type TEXT,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS VOID AS $$
BEGIN
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
