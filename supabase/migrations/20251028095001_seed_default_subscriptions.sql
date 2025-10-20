-- ============================================================================
-- SEED DEFAULT SUBSCRIPTIONS FOR EXISTING USERS
-- Ensure all existing users have proper subscription and currency setup
-- ============================================================================

-- 1. Set default currencies based on user location (if available)
UPDATE user_profiles 
SET 
    preferred_currency = CASE 
        WHEN location_country = 'South Africa' THEN 'ZAR'
        WHEN location_country = 'Nigeria' THEN 'NGN'
        WHEN location_country = 'Kenya' THEN 'KES'
        WHEN location_country = 'Ghana' THEN 'GHS'
        WHEN location_country = 'Egypt' THEN 'EGP'
        WHEN location_country = 'Morocco' THEN 'MAD'
        WHEN location_country = 'Tunisia' THEN 'TND'
        WHEN location_country = 'Ethiopia' THEN 'ETB'
        WHEN location_country = 'Uganda' THEN 'UGX'
        WHEN location_country = 'Tanzania' THEN 'TZS'
        WHEN location_country = 'Rwanda' THEN 'RWF'
        WHEN location_country = 'Zambia' THEN 'ZMW'
        WHEN location_country = 'Botswana' THEN 'BWP'
        WHEN location_country = 'Mauritius' THEN 'MUR'
        WHEN location_country = 'United Kingdom' THEN 'GBP'
        WHEN location_country IN ('Germany', 'France', 'Italy', 'Spain', 'Netherlands') THEN 'EUR'
        WHEN location_country = 'Canada' THEN 'CAD'
        WHEN location_country = 'Australia' THEN 'AUD'
        WHEN location_country = 'Japan' THEN 'JPY'
        WHEN location_country = 'India' THEN 'INR'
        WHEN location_country = 'Brazil' THEN 'BRL'
        ELSE 'USD'
    END,
    billing_currency = CASE 
        WHEN location_country = 'South Africa' THEN 'ZAR'
        WHEN location_country = 'Nigeria' THEN 'NGN'
        WHEN location_country = 'Kenya' THEN 'KES'
        WHEN location_country = 'Ghana' THEN 'GHS'
        WHEN location_country = 'Egypt' THEN 'EGP'
        WHEN location_country = 'Morocco' THEN 'MAD'
        WHEN location_country = 'Tunisia' THEN 'TND'
        WHEN location_country = 'Ethiopia' THEN 'ETB'
        WHEN location_country = 'Uganda' THEN 'UGX'
        WHEN location_country = 'Tanzania' THEN 'TZS'
        WHEN location_country = 'Rwanda' THEN 'RWF'
        WHEN location_country = 'Zambia' THEN 'ZMW'
        WHEN location_country = 'Botswana' THEN 'BWP'
        WHEN location_country = 'Mauritius' THEN 'MUR'
        WHEN location_country = 'United Kingdom' THEN 'GBP'
        WHEN location_country IN ('Germany', 'France', 'Italy', 'Spain', 'Netherlands') THEN 'EUR'
        WHEN location_country = 'Canada' THEN 'CAD'
        WHEN location_country = 'Australia' THEN 'AUD'
        WHEN location_country = 'Japan' THEN 'JPY'
        WHEN location_country = 'India' THEN 'INR'
        WHEN location_country = 'Brazil' THEN 'BRL'
        ELSE 'USD'
    END
WHERE preferred_currency IS NULL OR billing_currency IS NULL;

-- 2. Create free subscriptions for all existing users without subscriptions
DO $$
DECLARE
    free_plan_id UUID;
    user_record RECORD;
BEGIN
    -- Get the Free plan ID
    SELECT id INTO free_plan_id FROM subscription_plans WHERE name = 'Free';
    
    -- Create free subscriptions for users who don't have any
    FOR user_record IN 
        SELECT up.user_id 
        FROM user_profiles up
        LEFT JOIN subscriptions s ON up.user_id = s.user_id
        WHERE s.user_id IS NULL
    LOOP
        INSERT INTO subscriptions (
            user_id, 
            plan_id, 
            status, 
            current_period_start, 
            current_period_end,
            billing_currency
        ) VALUES (
            user_record.user_id,
            free_plan_id,
            'active',
            NOW(),
            NOW() + INTERVAL '1 year', -- Free plan doesn't expire
            (SELECT billing_currency FROM user_profiles WHERE user_id = user_record.user_id)
        );
    END LOOP;
END $$;

-- 3. Update user_profiles with current subscription info
UPDATE user_profiles 
SET 
    current_plan_id = s.plan_id,
    subscription_status = s.status,
    plan_expires_at = s.current_period_end
FROM subscriptions s
WHERE user_profiles.user_id = s.user_id
AND user_profiles.current_plan_id IS NULL;

-- 4. Set default currency for existing clothing items
UPDATE clothing_items 
SET currency = up.preferred_currency
FROM user_profiles up
WHERE clothing_items.user_id = up.user_id
AND clothing_items.currency IS NULL;

-- 5. Reset usage counters for all users (start fresh)
UPDATE user_profiles 
SET 
    monthly_uploads_used = 0,
    monthly_recs_used = 0,
    monthly_tryons_used = 0,
    usage_reset_date = date_trunc('month', NOW());

-- 6. Create initial exchange rates (placeholder - will be updated by API)
INSERT INTO exchange_rates (base_currency, target_currency, rate, provider, update_frequency) VALUES
('USD', 'ZAR', 18.50, 'placeholder', 'daily'),
('USD', 'NGN', 1650.00, 'placeholder', 'daily'),
('USD', 'KES', 129.00, 'placeholder', 'daily'),
('USD', 'GHS', 15.80, 'placeholder', 'daily'),
('USD', 'EGP', 49.00, 'placeholder', 'daily'),
('USD', 'EUR', 0.85, 'placeholder', 'daily'),
('USD', 'GBP', 0.73, 'placeholder', 'daily'),
('USD', 'CAD', 1.35, 'placeholder', 'daily'),
('USD', 'AUD', 1.55, 'placeholder', 'daily'),
('USD', 'JPY', 150.00, 'placeholder', 'daily'),
('USD', 'INR', 83.00, 'placeholder', 'daily'),
('USD', 'BRL', 5.20, 'placeholder', 'daily')
ON CONFLICT (base_currency, target_currency, rate_date) DO NOTHING;

-- Migration complete: Seeds default subscriptions and currency settings for existing users based on their location