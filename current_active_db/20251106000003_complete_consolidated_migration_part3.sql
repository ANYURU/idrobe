-- ============================================================================
-- COMPLETE CONSOLIDATED MIGRATION PART 3 - RLS, Triggers, Data Seeding
-- ============================================================================

BEGIN;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp triggers
CREATE TRIGGER update_user_profiles_updated_at 
BEFORE UPDATE ON public.user_profiles 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clothing_items_updated_at 
BEFORE UPDATE ON public.clothing_items 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wardrobe_gaps_updated_at 
BEFORE UPDATE ON public.wardrobe_gaps 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outfit_collections_updated_at 
BEFORE UPDATE ON public.outfit_collections 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
BEFORE UPDATE ON public.clothing_categories 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at 
BEFORE UPDATE ON public.subscription_plans 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
BEFORE UPDATE ON public.subscriptions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Currency validation triggers
CREATE TRIGGER validate_user_currencies
BEFORE INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION validate_currency_code();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all user-specific tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardrobe_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothing_duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothing_item_style_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_outfit_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sustainability_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on reference tables
ALTER TABLE public.clothing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothing_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_trend_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_currencies ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles 
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own profile" ON public.user_profiles 
FOR DELETE USING ((select auth.uid()) = user_id);

-- Clothing Items Policies
CREATE POLICY "Users can view own clothing items" ON public.clothing_items 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own clothing items" ON public.clothing_items 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own clothing items" ON public.clothing_items 
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own clothing items" ON public.clothing_items 
FOR DELETE USING ((select auth.uid()) = user_id);

-- Outfit Recommendations Policies
CREATE POLICY "Users can view own recommendations" ON public.outfit_recommendations 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own recommendations" ON public.outfit_recommendations 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own recommendations" ON public.outfit_recommendations 
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own recommendations" ON public.outfit_recommendations 
FOR DELETE USING ((select auth.uid()) = user_id);

-- User Interactions Policies
CREATE POLICY "Users can view own interactions" ON public.user_interactions 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own interactions" ON public.user_interactions 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own interactions" ON public.user_interactions 
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own interactions" ON public.user_interactions 
FOR DELETE USING ((select auth.uid()) = user_id);

-- Wardrobe Gaps Policies
CREATE POLICY "Users can view own wardrobe gaps" ON public.wardrobe_gaps 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own wardrobe gaps" ON public.wardrobe_gaps 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own wardrobe gaps" ON public.wardrobe_gaps 
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own wardrobe gaps" ON public.wardrobe_gaps 
FOR DELETE USING ((select auth.uid()) = user_id);

-- Outfit Collections Policies
CREATE POLICY "Users can view own collections" ON public.outfit_collections 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own collections" ON public.outfit_collections 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own collections" ON public.outfit_collections 
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own collections" ON public.outfit_collections 
FOR DELETE USING ((select auth.uid()) = user_id);

-- Clothing Duplicates Policies
CREATE POLICY "Users can view own duplicates" ON public.clothing_duplicates 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own duplicates" ON public.clothing_duplicates 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own duplicates" ON public.clothing_duplicates 
FOR UPDATE USING ((select auth.uid()) = user_id);

-- Recommendation Logs Policies
CREATE POLICY "Users can view own logs" ON public.recommendation_logs 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own logs" ON public.recommendation_logs 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Style Tags Junction Policies
CREATE POLICY "Users can manage own item style tags" ON public.clothing_item_style_tags 
FOR ALL USING (
    (select auth.uid()) IN (
        SELECT ci.user_id FROM public.clothing_items ci WHERE ci.id = clothing_item_id
    )
);

-- Error Logs Policies
CREATE POLICY "Users can view own errors" ON public.error_logs 
FOR SELECT USING ((select auth.uid()) = user_id);

-- User Credits Policies
CREATE POLICY "Users can view own credits" ON public.user_credits 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own credits" ON public.user_credits 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own credits" ON public.user_credits 
FOR UPDATE USING ((select auth.uid()) = user_id);

-- Payments Policies
CREATE POLICY "Users can view own payments" ON public.payments 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own payments" ON public.payments 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Referrals Policies
CREATE POLICY "Users can view referrals they made or received" ON public.referrals 
FOR SELECT USING ((select auth.uid()) = referrer_id OR (select auth.uid()) = referee_id);

CREATE POLICY "Users can insert referrals they make" ON public.referrals 
FOR INSERT WITH CHECK ((select auth.uid()) = referrer_id);

CREATE POLICY "Users can update referrals they made" ON public.referrals 
FOR UPDATE USING ((select auth.uid()) = referrer_id);

-- Usage Tracking Policies
CREATE POLICY "Users can view own usage" ON public.usage_tracking 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own usage" ON public.usage_tracking 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Event System Policies
CREATE POLICY "Users can manage own event templates" ON public.event_templates 
FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can manage own events" ON public.events 
FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can manage own event choices" ON public.event_outfit_choices 
FOR ALL USING (
    (select auth.uid()) IN (
        SELECT e.user_id FROM public.events e WHERE e.id = event_id
    )
);

-- Sustainability Tracking Policies
CREATE POLICY "Users can manage own sustainability data" ON public.sustainability_tracking 
FOR ALL USING ((select auth.uid()) = user_id);

-- Waitlist Archive Policies (restricted)
CREATE POLICY "Admins can view waitlist archive" ON public.waitlist_archive 
FOR SELECT USING (false);

-- Subscriptions Policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions 
FOR UPDATE USING ((select auth.uid()) = user_id);

-- Reference Tables Policies (Public Read Access)
CREATE POLICY "Anyone can view active categories" ON public.clothing_categories 
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view active subcategories" ON public.clothing_subcategories 
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view active style tags" ON public.style_tags 
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view seasonal trends" ON public.seasonal_trends 
FOR SELECT USING (true);

CREATE POLICY "Anyone can view trend categories" ON public.seasonal_trend_categories 
FOR SELECT USING (true);

CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans 
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view plan limits" ON public.plan_limits 
FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can view exchange rates" ON public.exchange_rates 
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view supported currencies" ON public.supported_currencies 
FOR SELECT USING (is_active = TRUE);

-- Authenticated users can suggest new categories
CREATE POLICY "Authenticated users can suggest categories" ON public.clothing_categories 
FOR INSERT TO authenticated WITH CHECK (source = 'ai_suggested');

CREATE POLICY "Authenticated users can suggest subcategories" ON public.clothing_subcategories 
FOR INSERT TO authenticated WITH CHECK (source = 'ai_suggested');

CREATE POLICY "Authenticated users can suggest style tags" ON public.style_tags 
FOR INSERT TO authenticated WITH CHECK (source = 'ai_suggested');

-- ============================================================================
-- MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW public.user_wardrobe_analytics AS
SELECT
    u.user_id,
    COUNT(DISTINCT ci.id) as total_items,
    COUNT(DISTINCT ci.category_id) as category_diversity,
    AVG(ci.sustainability_score) as avg_sustainability,
    SUM(ci.times_worn) as total_wears,
    COUNT(DISTINCT or_rec.id) as total_recommendations,
    COUNT(
        DISTINCT CASE
            WHEN ui.interaction_type_name = 'liked' THEN ui.id
        END
    ) as liked_recommendations,
    COUNT(
        DISTINCT CASE
            WHEN ui.interaction_type_name = 'worn' THEN ui.id
        END
    ) as worn_recommendations,
    ROUND(
        COUNT(
            DISTINCT CASE
                WHEN ui.interaction_type_name = 'liked' THEN ui.id
            END
        )::DECIMAL / NULLIF(COUNT(DISTINCT or_rec.id), 0) * 100,
        2
    ) as recommendation_acceptance_rate,
    MAX(ci.created_at) as last_item_added,
    MAX(or_rec.generated_at) as last_recommendation_generated
FROM public.user_profiles u
LEFT JOIN public.clothing_items ci ON u.user_id = ci.user_id
    AND ci.is_archived = FALSE AND ci.deleted_at IS NULL
LEFT JOIN public.outfit_recommendations or_rec ON u.user_id = or_rec.user_id
LEFT JOIN public.user_interactions ui ON or_rec.id = ui.recommendation_id
GROUP BY u.user_id;

-- Create unique index for materialized view
CREATE UNIQUE INDEX idx_user_analytics_user_id ON public.user_wardrobe_analytics(user_id);

-- Grant permissions
GRANT SELECT ON public.user_wardrobe_analytics TO authenticated;
GRANT SELECT ON public.user_wardrobe_analytics TO anon;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon;
GRANT EXECUTE ON FUNCTION public.levenshtein(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.levenshtein(text, text) TO anon;

-- ============================================================================
-- DATA SEEDING
-- ============================================================================

-- Insert core categories
INSERT INTO public.clothing_categories (name, display_order) VALUES
('tops', 1),
('bottoms', 2),
('dresses', 3),
('outerwear', 4),
('shoes', 5),
('accessories', 6),
('activewear', 7),
('formalwear', 8),
('bags', 9),
('jewelry', 10),
('hats', 11),
('scarves', 12),
('belts', 13),
('eyewear', 14),
('watches', 15),
('swimwear', 16),
('underwear', 17),
('sleepwear', 18),
('casualwear', 19);

-- Insert common subcategories
INSERT INTO public.clothing_subcategories (name, category_id) 
SELECT 't-shirt', id FROM public.clothing_categories WHERE name = 'tops'
UNION ALL
SELECT 'blouse', id FROM public.clothing_categories WHERE name = 'tops'
UNION ALL
SELECT 'shirt', id FROM public.clothing_categories WHERE name = 'tops'
UNION ALL
SELECT 'tank-top', id FROM public.clothing_categories WHERE name = 'tops'
UNION ALL
SELECT 'sweater', id FROM public.clothing_categories WHERE name = 'tops'
UNION ALL
SELECT 'hoodie', id FROM public.clothing_categories WHERE name = 'tops'
UNION ALL
SELECT 'cardigan', id FROM public.clothing_categories WHERE name = 'tops'
UNION ALL
SELECT 'polo', id FROM public.clothing_categories WHERE name = 'tops'
UNION ALL
SELECT 'jeans', id FROM public.clothing_categories WHERE name = 'bottoms'
UNION ALL
SELECT 'trousers', id FROM public.clothing_categories WHERE name = 'bottoms'
UNION ALL
SELECT 'shorts', id FROM public.clothing_categories WHERE name = 'bottoms'
UNION ALL
SELECT 'skirt', id FROM public.clothing_categories WHERE name = 'bottoms'
UNION ALL
SELECT 'leggings', id FROM public.clothing_categories WHERE name = 'bottoms'
UNION ALL
SELECT 'joggers', id FROM public.clothing_categories WHERE name = 'bottoms'
UNION ALL
SELECT 'chinos', id FROM public.clothing_categories WHERE name = 'bottoms'
UNION ALL
SELECT 'maxi-dress', id FROM public.clothing_categories WHERE name = 'dresses'
UNION ALL
SELECT 'mini-dress', id FROM public.clothing_categories WHERE name = 'dresses'
UNION ALL
SELECT 'midi-dress', id FROM public.clothing_categories WHERE name = 'dresses'
UNION ALL
SELECT 'cocktail-dress', id FROM public.clothing_categories WHERE name = 'dresses'
UNION ALL
SELECT 'sundress', id FROM public.clothing_categories WHERE name = 'dresses'
UNION ALL
SELECT 'jacket', id FROM public.clothing_categories WHERE name = 'outerwear'
UNION ALL
SELECT 'coat', id FROM public.clothing_categories WHERE name = 'outerwear'
UNION ALL
SELECT 'blazer', id FROM public.clothing_categories WHERE name = 'outerwear'
UNION ALL
SELECT 'parka', id FROM public.clothing_categories WHERE name = 'outerwear'
UNION ALL
SELECT 'vest', id FROM public.clothing_categories WHERE name = 'outerwear'
UNION ALL
SELECT 'raincoat', id FROM public.clothing_categories WHERE name = 'outerwear'
UNION ALL
SELECT 'windbreaker', id FROM public.clothing_categories WHERE name = 'outerwear'
UNION ALL
SELECT 'sneakers', id FROM public.clothing_categories WHERE name = 'shoes'
UNION ALL
SELECT 'boots', id FROM public.clothing_categories WHERE name = 'shoes'
UNION ALL
SELECT 'sandals', id FROM public.clothing_categories WHERE name = 'shoes'
UNION ALL
SELECT 'heels', id FROM public.clothing_categories WHERE name = 'shoes'
UNION ALL
SELECT 'flats', id FROM public.clothing_categories WHERE name = 'shoes'
UNION ALL
SELECT 'loafers', id FROM public.clothing_categories WHERE name = 'shoes'
UNION ALL
SELECT 'oxfords', id FROM public.clothing_categories WHERE name = 'shoes'
UNION ALL
SELECT 'slippers', id FROM public.clothing_categories WHERE name = 'shoes';

-- Insert common style tags
INSERT INTO public.style_tags (name, popularity_score) VALUES
('casual', 100),
('formal', 90),
('vintage', 70),
('minimalist', 80),
('bohemian', 60),
('sporty', 85),
('elegant', 75),
('edgy', 65),
('romantic', 55),
('professional', 95),
('trendy', 88),
('classic', 92),
('comfortable', 98),
('bold', 50),
('playful', 45);

-- Insert seasons
INSERT INTO public.seasons (name, display_order) VALUES
('spring', 1),
('summer', 2),
('fall', 3),
('winter', 4),
('all-season', 5);

-- Insert fit preferences
INSERT INTO public.fit_preferences (name, display_order) VALUES
('tight', 1),
('fitted', 2),
('regular', 3),
('loose', 4),
('oversized', 5);

-- Insert subscription plans
INSERT INTO public.subscription_plans (name, description, price, currency, billing_interval, trial_days, display_order) VALUES
('Free', 'Perfect for casual users getting started', 0.00, 'USD', 'month', 0, 1),
('Premium', 'Unlimited AI recommendations and advanced features', 4.99, 'USD', 'month', 14, 2),
('Premium Annual', 'Premium plan with 20% annual discount', 49.99, 'USD', 'year', 14, 3),
('Pro', 'Everything in Premium plus social sharing and API access', 9.99, 'USD', 'month', 14, 4),
('Pro Annual', 'Pro plan with 20% annual discount', 99.99, 'USD', 'year', 14, 5);

-- Insert plan limits
DO $$
DECLARE
    free_plan_id UUID;
    premium_monthly_id UUID;
    premium_annual_id UUID;
    pro_monthly_id UUID;
    pro_annual_id UUID;
BEGIN
    SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'Free';
    SELECT id INTO premium_monthly_id FROM public.subscription_plans WHERE name = 'Premium';
    SELECT id INTO premium_annual_id FROM public.subscription_plans WHERE name = 'Premium Annual';
    SELECT id INTO pro_monthly_id FROM public.subscription_plans WHERE name = 'Pro';
    SELECT id INTO pro_annual_id FROM public.subscription_plans WHERE name = 'Pro Annual';
    
    -- Free plan limits
    INSERT INTO public.plan_limits (plan_id, limit_type, limit_value, period) VALUES
    (free_plan_id, 'uploads', 10, 'total'),
    (free_plan_id, 'recs', 3, 'week'),
    (free_plan_id, 'tryons', 1, 'month'),
    (free_plan_id, 'storage_gb', 1, 'total');
    
    -- Premium plans limits
    INSERT INTO public.plan_limits (plan_id, limit_type, limit_value, period) VALUES
    (premium_monthly_id, 'uploads', -1, 'total'),
    (premium_monthly_id, 'recs', -1, 'week'),
    (premium_monthly_id, 'tryons', -1, 'month'),
    (premium_monthly_id, 'storage_gb', 10, 'total'),
    (premium_monthly_id, 'api_calls', 1000, 'month'),
    (premium_annual_id, 'uploads', -1, 'total'),
    (premium_annual_id, 'recs', -1, 'week'),
    (premium_annual_id, 'tryons', -1, 'month'),
    (premium_annual_id, 'storage_gb', 10, 'total'),
    (premium_annual_id, 'api_calls', 1000, 'month');
    
    -- Pro plans limits
    INSERT INTO public.plan_limits (plan_id, limit_type, limit_value, period) VALUES
    (pro_monthly_id, 'uploads', -1, 'total'),
    (pro_monthly_id, 'recs', -1, 'week'),
    (pro_monthly_id, 'tryons', -1, 'month'),
    (pro_monthly_id, 'storage_gb', 50, 'total'),
    (pro_monthly_id, 'api_calls', 10000, 'month'),
    (pro_monthly_id, 'social_sharing', -1, 'total'),
    (pro_monthly_id, 'custom_prompts', -1, 'total'),
    (pro_annual_id, 'uploads', -1, 'total'),
    (pro_annual_id, 'recs', -1, 'week'),
    (pro_annual_id, 'tryons', -1, 'month'),
    (pro_annual_id, 'storage_gb', 50, 'total'),
    (pro_annual_id, 'api_calls', 10000, 'month'),
    (pro_annual_id, 'social_sharing', -1, 'total'),
    (pro_annual_id, 'custom_prompts', -1, 'total');
END $$;

-- Insert supported currencies (prioritizing African currencies)
INSERT INTO public.supported_currencies (code, name, symbol, display_order) VALUES
('USD', 'US Dollar', '$', 1),
('EUR', 'Euro', '€', 2),
('GBP', 'British Pound', '£', 3),
('ZAR', 'South African Rand', 'R', 4),
('NGN', 'Nigerian Naira', '₦', 5),
('KES', 'Kenyan Shilling', 'KSh', 6),
('GHS', 'Ghanaian Cedi', '₵', 7),
('EGP', 'Egyptian Pound', '£', 8),
('MAD', 'Moroccan Dirham', 'د.م.', 9),
('TND', 'Tunisian Dinar', 'د.ت', 10),
('ETB', 'Ethiopian Birr', 'Br', 11),
('UGX', 'Ugandan Shilling', 'USh', 12),
('TZS', 'Tanzanian Shilling', 'TSh', 13),
('RWF', 'Rwandan Franc', 'FRw', 14),
('ZMW', 'Zambian Kwacha', 'ZK', 15),
('BWP', 'Botswana Pula', 'P', 16),
('MUR', 'Mauritian Rupee', '₨', 17),
('JPY', 'Japanese Yen', '¥', 50),
('CAD', 'Canadian Dollar', 'C$', 51),
('AUD', 'Australian Dollar', 'A$', 52),
('CHF', 'Swiss Franc', 'CHF', 53),
('CNY', 'Chinese Yuan', '¥', 54),
('INR', 'Indian Rupee', '₹', 55),
('BRL', 'Brazilian Real', 'R$', 56);

-- Insert initial exchange rates (placeholder)
INSERT INTO public.exchange_rates (base_currency, target_currency, rate, provider, update_frequency) VALUES
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

-- Insert sample seasonal trends
INSERT INTO public.seasonal_trends (
    season, year, trending_colors, trending_patterns, trending_styles,
    trend_description, region, valid_from, valid_until
) VALUES
('spring', 2025, ARRAY['pastel-pink', 'mint-green', 'lavender'], 
 ARRAY['floral', 'gingham'], ARRAY['romantic', 'cottagecore'],
 'Spring 2025 emphasizes soft pastels and feminine silhouettes', 
 'global', '2025-03-01', '2025-05-31'),
('summer', 2025, ARRAY['coral', 'turquoise', 'yellow'], 
 ARRAY['tropical', 'tie-dye'], ARRAY['bohemian', 'resort'],
 'Summer trends focus on vibrant colors and relaxed fits', 
 'global', '2025-06-01', '2025-08-31'),
('fall', 2025, ARRAY['rust', 'olive-green', 'burgundy'], 
 ARRAY['plaid', 'houndstooth'], ARRAY['preppy', 'academia'],
 'Fall 2025 brings back classic patterns with earthy tones', 
 'global', '2025-09-01', '2025-11-30'),
('winter', 2025, ARRAY['charcoal', 'emerald', 'wine-red'], 
 ARRAY['herringbone', 'cable-knit'], ARRAY['minimalist', 'sophisticated'],
 'Winter trends lean into luxe textures and deep jewel tones', 
 'global', '2025-12-01', '2026-02-28');

-- Insert waitlist data
INSERT INTO public.waitlist_archive (id, email, created_at, status, referred_by) VALUES
('69d2a4c0-13d5-4ca2-acb0-bb9c13f75e7b', 'w.ruzindana@alustudent.com', '2025-05-26 13:30:54.673377+00', 'pending', NULL),
('2a4e9194-e5b4-4e2f-bb14-3e36fd35fe2c', 'w.ruzindana@alumni.alueducation.com', '2025-05-26 13:31:51.351278+00', 'pending', NULL),
('46c396a9-b139-474a-ac86-8cf13acb6b93', 'davidwampamba@gmail.com', '2025-05-26 16:31:02.651569+00', 'pending', NULL),
('69d35f19-934c-48f1-b298-9d9a7d23334a', 'tetagata@yahoo.fr', '2025-05-28 10:37:33.778656+00', 'pending', NULL),
('437416b7-abf9-4e09-a8db-ca4d0873841e', 'ruzindanawendy@gmail.com', '2025-05-28 11:09:02.676451+00', 'pending', NULL),
('7a97fb82-bf82-4020-ac7a-b4616aef1c56', 'gasangwabrian96@gmail.com', '2025-06-02 08:34:57.391474+00', 'pending', NULL),
('a1edcfad-2990-43ad-a3e0-5f52a5943701', 'joycepauline.ovacom@gmail.com', '2025-06-02 08:36:13.975309+00', 'pending', NULL),
('81c1b9fb-492f-4262-948b-ac32e72c93f9', 'mumor24@gmail.comm', '2025-06-02 11:50:21.583145+00', 'pending', NULL),
('f95549df-0a4b-4975-b52e-6c0259085c2c', 'okana.nonie@gmail.com', '2025-06-02 11:50:29.466472+00', 'pending', NULL),
('6afb75f6-eb43-495d-a142-50b694a35f4b', 'mu.commumor24@gmail.com', '2025-06-02 11:50:43.6423+00', 'pending', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_profiles IS 'Stores user profile information including body type, preferences, and location for personalized recommendations';
COMMENT ON TABLE public.clothing_items IS 'Main wardrobe inventory with AI-extracted attributes and embeddings for similarity matching';
COMMENT ON TABLE public.outfit_recommendations IS 'AI-generated outfit suggestions with contextual scoring and gap analysis';
COMMENT ON TABLE public.user_interactions IS 'Tracks user feedback on recommendations and clothing items for ML training';
COMMENT ON TABLE public.wardrobe_gaps IS 'Identifies missing items in user wardrobes with purchase suggestions';
COMMENT ON TABLE public.outfit_collections IS 'User-curated outfit combinations that can be saved and shared';
COMMENT ON TABLE public.seasonal_trends IS 'Global and regional fashion trends to influence recommendations';
COMMENT ON TABLE public.clothing_duplicates IS 'Detects and manages duplicate clothing uploads using AI similarity';
COMMENT ON MATERIALIZED VIEW public.user_wardrobe_analytics IS 'User wardrobe analytics - refreshed manually to avoid permission issues during normal operations';
COMMENT ON TABLE public.recommendation_logs IS 'Logs AI recommendation runs for training and debugging';
COMMENT ON TABLE public.clothing_categories IS 'Dynamic clothing categories that can grow with fashion trends';
COMMENT ON TABLE public.clothing_subcategories IS 'Subcategories linked to main categories';
COMMENT ON TABLE public.style_tags IS 'Dynamic style tags for trend tracking';
COMMENT ON TABLE public.waitlist_archive IS 'Historical waitlist data migrated to referral system - read-only archive';
COMMENT ON FUNCTION public.levenshtein(text, text) IS 'Wrapper function to access levenshtein from extensions schema';

COMMIT;