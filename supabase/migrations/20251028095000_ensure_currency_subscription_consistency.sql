-- ============================================================================
-- ENSURE CURRENCY AND SUBSCRIPTION CONSISTENCY ACROSS DATABASE
-- Fix all compatibility issues between existing schema and new features
-- ============================================================================

-- 1. Add missing currency fields to user_profiles (if not already added by later migrations)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS billing_currency TEXT DEFAULT 'USD';

-- 2. Ensure clothing_items has currency support
ALTER TABLE clothing_items 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- 3. Add currency support to wardrobe_gaps (for estimated_cost)
ALTER TABLE wardrobe_gaps 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- 4. Add currency support to outfit_collections (for cost tracking)
ALTER TABLE outfit_collections 
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- 5. Add subscription tracking to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS current_plan_id UUID REFERENCES subscription_plans(id),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'trialing', 'active', 'past_due', 'canceled')),
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE;

-- 6. Add usage tracking fields to user_profiles for quick access
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS monthly_uploads_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_recs_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_tryons_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_reset_date TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('month', NOW());

-- 7. Currency validation using triggers (since CHECK constraints can't use subqueries)
CREATE OR REPLACE FUNCTION validate_currency_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if currency exists in supported_currencies
    IF NEW.preferred_currency IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.supported_currencies 
        WHERE code = NEW.preferred_currency AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Invalid preferred currency code: %', NEW.preferred_currency;
    END IF;
    
    IF NEW.billing_currency IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.supported_currencies 
        WHERE code = NEW.billing_currency AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Invalid billing currency code: %', NEW.billing_currency;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE OR REPLACE FUNCTION validate_item_currency()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if currency exists in supported_currencies
    IF NEW.currency IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.supported_currencies 
        WHERE code = NEW.currency AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Invalid currency code: %', NEW.currency;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Apply triggers
CREATE TRIGGER validate_user_currencies
    BEFORE INSERT OR UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION validate_currency_code();

CREATE TRIGGER validate_clothing_currency
    BEFORE INSERT OR UPDATE ON clothing_items
    FOR EACH ROW EXECUTE FUNCTION validate_item_currency();

CREATE TRIGGER validate_gap_currency
    BEFORE INSERT OR UPDATE ON wardrobe_gaps
    FOR EACH ROW EXECUTE FUNCTION validate_item_currency();

CREATE TRIGGER validate_collection_currency
    BEFORE INSERT OR UPDATE ON outfit_collections
    FOR EACH ROW EXECUTE FUNCTION validate_item_currency();

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_currency ON user_profiles(preferred_currency);
CREATE INDEX IF NOT EXISTS idx_user_profiles_billing ON user_profiles(billing_currency);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON user_profiles(current_plan_id);
CREATE INDEX IF NOT EXISTS idx_clothing_items_currency ON clothing_items(currency);
CREATE INDEX IF NOT EXISTS idx_user_profiles_usage_reset ON user_profiles(usage_reset_date);

-- 9. Add RLS policies for subscription tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_currencies ENABLE ROW LEVEL SECURITY;

-- Subscription plans (public read)
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans 
FOR SELECT USING (is_active = TRUE);

-- Plan limits (public read)
CREATE POLICY "Anyone can view plan limits" ON plan_limits 
FOR SELECT USING (TRUE);

-- User subscriptions (own data only)
CREATE POLICY "Users can view own subscriptions" ON subscriptions 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions" ON subscriptions 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON subscriptions 
FOR UPDATE USING (user_id = auth.uid());

-- Payments (own data only)
CREATE POLICY "Users can view own payments" ON payments 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments" ON payments 
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Referrals (referrer and referee can view)
CREATE POLICY "Users can view referrals they made or received" ON referrals 
FOR SELECT USING (referrer_id = auth.uid() OR referee_id = auth.uid());

CREATE POLICY "Users can insert referrals they make" ON referrals 
FOR INSERT WITH CHECK (referrer_id = auth.uid());

CREATE POLICY "Users can update referrals they made" ON referrals 
FOR UPDATE USING (referrer_id = auth.uid());

-- User credits (own data only)
CREATE POLICY "Users can view own credits" ON user_credits 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own credits" ON user_credits 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own credits" ON user_credits 
FOR UPDATE USING (user_id = auth.uid());

-- Discount codes (public read for active codes)
CREATE POLICY "Anyone can view active discount codes" ON discount_codes 
FOR SELECT USING (is_active = TRUE AND (valid_until IS NULL OR valid_until > NOW()));

-- Usage tracking (own data only)
CREATE POLICY "Users can view own usage" ON usage_tracking 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own usage" ON usage_tracking 
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Exchange rates (public read)
CREATE POLICY "Anyone can view exchange rates" ON exchange_rates 
FOR SELECT USING (is_active = TRUE);

-- Supported currencies (public read)
CREATE POLICY "Anyone can view supported currencies" ON public.supported_currencies 
FOR SELECT USING (is_active = TRUE);

-- 10. Create helper functions for subscription management
CREATE OR REPLACE FUNCTION get_user_plan_limits(target_user_id UUID, limit_type_param TEXT)
RETURNS INTEGER AS $$
DECLARE
    limit_value INTEGER;
BEGIN
    SELECT pl.limit_value INTO limit_value
    FROM subscriptions s
    JOIN plan_limits pl ON s.plan_id = pl.plan_id
    WHERE s.user_id = target_user_id 
    AND s.status IN ('active', 'trialing')
    AND pl.limit_type = limit_type_param
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    -- Default to free plan limits if no active subscription
    IF limit_value IS NULL THEN
        SELECT pl.limit_value INTO limit_value
        FROM subscription_plans sp
        JOIN plan_limits pl ON sp.id = pl.plan_id
        WHERE sp.name = 'Free' 
        AND pl.limit_type = limit_type_param;
    END IF;
    
    RETURN COALESCE(limit_value, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION check_usage_limit(target_user_id UUID, usage_type_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_usage INTEGER;
    usage_limit INTEGER;
    period_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get usage limit for user's current plan
    usage_limit := get_user_plan_limits(target_user_id, usage_type_param);
    
    -- Unlimited usage (-1)
    IF usage_limit = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Determine period start based on usage type
    IF usage_type_param LIKE '%_week' THEN
        period_start := date_trunc('week', NOW());
    ELSIF usage_type_param LIKE '%_month' THEN
        period_start := date_trunc('month', NOW());
    ELSE
        period_start := '1970-01-01'::TIMESTAMP WITH TIME ZONE; -- Total usage
    END IF;
    
    -- Get current usage count
    SELECT COALESCE(SUM(usage_count), 0) INTO current_usage
    FROM usage_tracking
    WHERE user_id = target_user_id 
    AND usage_type = usage_type_param
    AND period_start >= period_start;
    
    RETURN current_usage < usage_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- 11. Update triggers to sync user_profiles with subscription data
CREATE OR REPLACE FUNCTION sync_user_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user_profiles when subscription changes
    UPDATE user_profiles 
    SET 
        current_plan_id = NEW.plan_id,
        subscription_status = NEW.status,
        plan_expires_at = NEW.current_period_end
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER sync_subscription_status 
AFTER INSERT OR UPDATE ON subscriptions 
FOR EACH ROW EXECUTE FUNCTION sync_user_subscription_status();

-- 12. Add currency conversion helper for display
CREATE OR REPLACE FUNCTION get_converted_amount(
    amount DECIMAL(10,2),
    from_currency TEXT,
    to_currency TEXT,
    target_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    user_currency TEXT;
    converted_amount DECIMAL(10,2);
    display_currency TEXT;
BEGIN
    -- Get user's preferred currency if user_id provided
    IF target_user_id IS NOT NULL THEN
        SELECT preferred_currency INTO user_currency
        FROM user_profiles 
        WHERE user_id = target_user_id;
        display_currency := COALESCE(user_currency, to_currency);
    ELSE
        display_currency := to_currency;
    END IF;
    
    -- Convert amount
    converted_amount := convert_currency(amount, from_currency, display_currency);
    
    -- Return both original and converted
    RETURN jsonb_build_object(
        'original_amount', amount,
        'original_currency', from_currency,
        'converted_amount', converted_amount,
        'display_currency', display_currency,
        'is_converted', (from_currency != display_currency)
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION get_user_plan_limits IS 'Get usage limits for a user based on their current subscription plan';
COMMENT ON FUNCTION check_usage_limit IS 'Check if user has exceeded their usage limit for a specific feature';
COMMENT ON FUNCTION get_converted_amount IS 'Convert currency amounts for display with user preferences';