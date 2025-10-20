-- ============================================================================
-- ADD PRODUCTION FEATURES FROM PREVIOUS SCHEMA
-- Mobile money, calendar events, enhanced referrals, sustainability, ratings
-- ============================================================================

-- 1. ENHANCE PAYMENTS TABLE FOR MOBILE MONEY SUPPORT
ALTER TABLE payments 
ADD COLUMN mobile_provider TEXT,
ADD COLUMN phone_number TEXT,
ADD COLUMN external_transaction_id TEXT;

-- Add index for mobile money lookups
CREATE INDEX idx_payments_external_transaction ON payments(external_transaction_id) WHERE external_transaction_id IS NOT NULL;
CREATE INDEX idx_payments_phone ON payments(phone_number) WHERE phone_number IS NOT NULL;

-- 2. ENHANCE USER INTERACTIONS WITH RATING SYSTEM
ALTER TABLE user_interactions 
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- Add index for rating analytics
CREATE INDEX idx_user_interactions_rating ON user_interactions(rating) WHERE rating IS NOT NULL;

-- 3. ENHANCE REFERRALS TABLE
ALTER TABLE referrals 
ADD COLUMN referral_source TEXT DEFAULT 'direct',
ADD COLUMN conversion_data JSONB DEFAULT '{}';

-- Add index for referral analytics
CREATE INDEX idx_referrals_source ON referrals(referral_source);

-- 4. CREATE EVENT TEMPLATES TABLE
CREATE TABLE event_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    default_occasion TEXT, -- maps to existing occasion system
    is_favorite BOOLEAN DEFAULT FALSE,
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE EVENTS TABLE
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    template_id UUID REFERENCES event_templates(id),
    event_datetime TIMESTAMPTZ NOT NULL,
    location TEXT,
    notes TEXT,
    weather_at_creation JSONB,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE EVENT OUTFIT CHOICES TABLE
CREATE TABLE event_outfit_choices (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    outfit_recommendation_id UUID, -- No FK due to partitioned table
    choice_type TEXT CHECK (choice_type IN ('considered', 'selected', 'worn', 'rejected')),
    feedback_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (event_id, outfit_recommendation_id, choice_type)
);

-- 7. CREATE SUSTAINABILITY TRACKING TABLE
CREATE TABLE sustainability_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('rewear', 'cost_per_wear', 'eco_score', 'carbon_footprint')),
    value DECIMAL(10,2) NOT NULL,
    related_item_id UUID, -- references clothing_items(id) but no FK for flexibility
    period_start DATE NOT NULL,
    period_end DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_event_templates_user ON event_templates(user_id);
CREATE INDEX idx_event_templates_favorite ON event_templates(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_event_templates_usage ON event_templates(user_id, use_count DESC);

CREATE INDEX idx_events_user_datetime ON events(user_id, event_datetime);
CREATE INDEX idx_events_template ON events(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX idx_events_status ON events(user_id, status);

CREATE INDEX idx_event_choices_event ON event_outfit_choices(event_id);
CREATE INDEX idx_event_choices_outfit ON event_outfit_choices(outfit_recommendation_id);
CREATE INDEX idx_event_choices_type ON event_outfit_choices(choice_type);

CREATE INDEX idx_sustainability_user_type ON sustainability_tracking(user_id, metric_type);
CREATE INDEX idx_sustainability_period ON sustainability_tracking(period_start, period_end);
CREATE INDEX idx_sustainability_item ON sustainability_tracking(related_item_id) WHERE related_item_id IS NOT NULL;

-- ROW LEVEL SECURITY
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_outfit_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_tracking ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Users can manage own event templates" ON event_templates 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own events" ON events 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own event choices" ON event_outfit_choices 
FOR ALL USING (
    event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage own sustainability data" ON sustainability_tracking 
FOR ALL USING (auth.uid() = user_id);

-- TRIGGERS FOR UPDATED_AT
CREATE TRIGGER update_event_templates_updated_at 
BEFORE UPDATE ON event_templates 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
BEFORE UPDATE ON events 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION increment_template_usage(template_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE event_templates 
    SET use_count = use_count + 1 
    WHERE id = template_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION get_user_sustainability_score(target_user_id UUID, metric_type_param TEXT)
RETURNS DECIMAL AS $$
DECLARE
    avg_score DECIMAL;
BEGIN
    SELECT AVG(value) INTO avg_score
    FROM sustainability_tracking
    WHERE user_id = target_user_id 
    AND metric_type = metric_type_param
    AND period_start >= CURRENT_DATE - INTERVAL '30 days';
    
    RETURN COALESCE(avg_score, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- COMMENTS
COMMENT ON TABLE event_templates IS 'Reusable event patterns that users create (Work meeting, Date night, etc.)';
COMMENT ON TABLE events IS 'Specific event occurrences with outfit planning context';
COMMENT ON TABLE event_outfit_choices IS 'Tracks user outfit selections for ML learning';
COMMENT ON TABLE sustainability_tracking IS 'Tracks user sustainability metrics over time';
COMMENT ON COLUMN user_interactions.rating IS 'Optional 1-5 rating for granular feedback';
COMMENT ON COLUMN payments.mobile_provider IS 'Mobile money provider (M-Pesa, Airtel Money, etc.)';
COMMENT ON COLUMN referrals.referral_source IS 'Source of referral (social_media, word_of_mouth, etc.)';