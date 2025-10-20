-- ============================================================================
-- SEED SUBSCRIPTION PLANS AND LIMITS
-- Initial freemium pricing structure
-- ============================================================================

-- Insert subscription plans
INSERT INTO subscription_plans (name, description, price, currency, billing_interval, trial_days, display_order) VALUES
('Free', 'Perfect for casual users getting started', 0.00, 'USD', 'month', 0, 1),
('Premium', 'Unlimited AI recommendations and advanced features', 4.99, 'USD', 'month', 14, 2),
('Premium Annual', 'Premium plan with 20% annual discount', 49.99, 'USD', 'year', 14, 3),
('Pro', 'Everything in Premium plus social sharing and API access', 9.99, 'USD', 'month', 14, 4),
('Pro Annual', 'Pro plan with 20% annual discount', 99.99, 'USD', 'year', 14, 5);

-- Get plan IDs for limits
DO $$
DECLARE
    free_plan_id UUID;
    premium_monthly_id UUID;
    premium_annual_id UUID;
    pro_monthly_id UUID;
    pro_annual_id UUID;
BEGIN
    -- Get plan IDs
    SELECT id INTO free_plan_id FROM subscription_plans WHERE name = 'Free';
    SELECT id INTO premium_monthly_id FROM subscription_plans WHERE name = 'Premium';
    SELECT id INTO premium_annual_id FROM subscription_plans WHERE name = 'Premium Annual';
    SELECT id INTO pro_monthly_id FROM subscription_plans WHERE name = 'Pro';
    SELECT id INTO pro_annual_id FROM subscription_plans WHERE name = 'Pro Annual';
    
    -- Free plan limits
    INSERT INTO plan_limits (plan_id, limit_type, limit_value, period) VALUES
    (free_plan_id, 'uploads', 10, 'total'),
    (free_plan_id, 'recs', 3, 'week'),
    (free_plan_id, 'tryons', 1, 'month'),
    (free_plan_id, 'storage_gb', 1, 'total');
    
    -- Premium monthly limits (unlimited = -1)
    INSERT INTO plan_limits (plan_id, limit_type, limit_value, period) VALUES
    (premium_monthly_id, 'uploads', -1, 'total'),
    (premium_monthly_id, 'recs', -1, 'week'),
    (premium_monthly_id, 'tryons', -1, 'month'),
    (premium_monthly_id, 'storage_gb', 10, 'total'),
    (premium_monthly_id, 'api_calls', 1000, 'month');
    
    -- Premium annual limits (same as monthly)
    INSERT INTO plan_limits (plan_id, limit_type, limit_value, period) VALUES
    (premium_annual_id, 'uploads', -1, 'total'),
    (premium_annual_id, 'recs', -1, 'week'),
    (premium_annual_id, 'tryons', -1, 'month'),
    (premium_annual_id, 'storage_gb', 10, 'total'),
    (premium_annual_id, 'api_calls', 1000, 'month');
    
    -- Pro monthly limits
    INSERT INTO plan_limits (plan_id, limit_type, limit_value, period) VALUES
    (pro_monthly_id, 'uploads', -1, 'total'),
    (pro_monthly_id, 'recs', -1, 'week'),
    (pro_monthly_id, 'tryons', -1, 'month'),
    (pro_monthly_id, 'storage_gb', 50, 'total'),
    (pro_monthly_id, 'api_calls', 10000, 'month'),
    (pro_monthly_id, 'social_sharing', -1, 'total'),
    (pro_monthly_id, 'custom_prompts', -1, 'total');
    
    -- Pro annual limits (same as monthly)
    INSERT INTO plan_limits (plan_id, limit_type, limit_value, period) VALUES
    (pro_annual_id, 'uploads', -1, 'total'),
    (pro_annual_id, 'recs', -1, 'week'),
    (pro_annual_id, 'tryons', -1, 'month'),
    (pro_annual_id, 'storage_gb', 50, 'total'),
    (pro_annual_id, 'api_calls', 10000, 'month'),
    (pro_annual_id, 'social_sharing', -1, 'total'),
    (pro_annual_id, 'custom_prompts', -1, 'total');
END $$;