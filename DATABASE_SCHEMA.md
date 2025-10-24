# iDrobe Database Schema Documentation

## Overview

The iDrobe database uses Supabase (PostgreSQL) with a sophisticated schema supporting AI-powered clothing recommendations, subscription management, and international currency support. The schema evolved from enum-based categories to dynamic foreign key references for maximum flexibility and scalability.

## Migration History

### Phase 1: Initial Schema (20251020142338)
- Enum-based categories and subcategories
- Array-based style tags
- Partitioned tables for scalability
- Vector embeddings for AI similarity

### Phase 2: Dynamic Categories (20251021093944-20251021094305)
- Created `clothing_categories` table
- Created `clothing_subcategories` table
- Created `style_tags` table
- Created `clothing_item_style_tags` junction table
- Added helper functions for data retrieval

### Phase 3: Data Migration (20251021103105)
- Migrated enum data to reference tables
- Populated junction tables
- Updated foreign key columns

### Phase 4: Cleanup (20251021103229)
- Dropped old enum columns
- Recreated materialized views
- Updated helper functions

### Phase 5: Security & Performance (20251021114044)
- Added input validation
- Added rate limiting
- Added error logging
- Added duplicate prevention

### Phase 6: Vector Extension (20251021122526-20251021123027)
- Properly configured pgvector extension
- Set up vector similarity indexes

## Core Tables

### user_profiles
Stores user account information, preferences, and subscription status.

```sql
CREATE TABLE public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  body_type_name TEXT DEFAULT 'prefer_not_to_say',
  height_cm INTEGER,
  weight_kg DECIMAL(5, 2),
  preferred_fit_name TEXT DEFAULT 'regular',
  style_preferences TEXT[],
  color_preferences TEXT[],
  sustainability_score INTEGER DEFAULT 50,
  location_city TEXT,
  location_country TEXT,
  timezone TEXT DEFAULT 'UTC',
  cultural_preferences JSONB DEFAULT '{}',
  default_activity_level_name TEXT DEFAULT 'moderate',
  profile_image_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  preferred_currency TEXT DEFAULT 'USD',
  billing_currency TEXT DEFAULT 'USD',
  current_plan_id UUID REFERENCES subscription_plans(id),
  subscription_status TEXT DEFAULT 'free',
  plan_expires_at TIMESTAMPTZ,
  monthly_uploads_used INTEGER DEFAULT 0,
  monthly_recs_used INTEGER DEFAULT 0,
  monthly_tryons_used INTEGER DEFAULT 0,
  usage_reset_date TIMESTAMPTZ DEFAULT date_trunc('month', NOW()),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_user_profiles_location` - For location-based queries
- `idx_user_profiles_body_type` - For body type filtering

### clothing_categories
Dynamic categories for clothing items.

```sql
CREATE TABLE public.clothing_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'user', -- 'user', 'ai_suggested', 'migration'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Common Categories:**
- tops, bottoms, dresses, outerwear, shoes
- accessories, bags, jewelry, hats, scarves
- belts, eyewear, watches, activewear, swimwear
- underwear, sleepwear, formalwear, casualwear

### clothing_subcategories
Subcategories within each category.

```sql
CREATE TABLE public.clothing_subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.clothing_categories(id),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, name)
);
```

**Example Mappings:**
- tops → t-shirt, blouse, shirt, tank-top, sweater, hoodie, cardigan, polo
- bottoms → jeans, trousers, shorts, skirt, leggings, joggers, chinos
- shoes → sneakers, boots, sandals, heels, flats, loafers, oxfords, slippers

### style_tags
Reusable style tags for clothing items.

```sql
CREATE TABLE public.style_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  popularity_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'user', -- 'user', 'ai_suggested'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Common Tags:**
- casual, formal, vintage, minimalist, bohemian
- sporty, elegant, edgy, romantic, playful
- professional, trendy, classic, creative, adventurous

### clothing_items
Main wardrobe inventory with AI analysis and international currency support.

```sql
CREATE TABLE public.clothing_items (
  id UUID DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.clothing_categories(id),
  subcategory_id UUID REFERENCES public.clothing_subcategories(id),
  brand TEXT,
  size TEXT,
  primary_color TEXT NOT NULL,
  secondary_colors TEXT[],
  material TEXT[],
  pattern TEXT,
  fit_name TEXT DEFAULT 'regular',
  season_names TEXT[] DEFAULT '{}',
  weather_suitable_names TEXT[] DEFAULT '{}',
  care_instructions TEXT,
  purchase_date DATE,
  cost DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  times_worn INTEGER DEFAULT 0,
  last_worn_date DATE,
  sustainability_score DECIMAL(3,2),
  is_eco_friendly BOOLEAN DEFAULT FALSE,
  ai_confidence_score DECIMAL(3, 2),
  embedding VECTOR(768),
  ai_metadata JSONB DEFAULT '{}',
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
) PARTITION BY HASH (user_id);
```

**Partitions:**
- `clothing_items_p0` - Users with even hash
- `clothing_items_p1` - Users with odd hash

**Indexes:**
- `idx_clothing_items_user_category` - For user + category queries
- `idx_clothing_items_user_active` - For active items
- `idx_clothing_embedding` - Vector similarity search

### clothing_item_style_tags
Junction table for many-to-many relationship between items and tags.

```sql
CREATE TABLE public.clothing_item_style_tags (
  clothing_item_id UUID,
  style_tag_id UUID REFERENCES public.style_tags(id),
  PRIMARY KEY (clothing_item_id, style_tag_id)
);
```

### outfit_recommendations
AI-generated outfit suggestions.

```sql
CREATE TABLE public.outfit_recommendations (
  id UUID DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occasion TEXT NOT NULL,
  mood TEXT,
  weather_condition TEXT,
  temperature_celsius INTEGER,
  activity_level TEXT,
  destination TEXT,
  time_of_day TEXT,
  event_duration_hours INTEGER,
  season TEXT,
  clothing_item_ids UUID[] NOT NULL,
  ai_score DECIMAL(3, 2),
  style_coherence_score DECIMAL(3, 2),
  weather_appropriateness_score DECIMAL(3, 2),
  occasion_match_score DECIMAL(3, 2),
  missing_items TEXT[],
  suggested_purchases JSONB DEFAULT '[]',
  is_shared BOOLEAN DEFAULT FALSE,
  share_url TEXT,
  virtual_tryon_url TEXT,
  based_on_past_preferences BOOLEAN DEFAULT FALSE,
  similarity_to_past_liked DECIMAL(3, 2),
  recommendation_reason TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
) PARTITION BY HASH (user_id);
```

### outfit_collections
User-curated outfit combinations.

```sql
CREATE TABLE public.outfit_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  clothing_item_ids UUID[] NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  times_worn INTEGER DEFAULT 0,
  last_worn_date DATE,
  is_public BOOLEAN DEFAULT FALSE,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_interactions
Feedback loop for ML training.

```sql
CREATE TABLE public.user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_id UUID,
  clothing_item_id UUID,
  interaction_type TEXT NOT NULL, -- 'liked', 'disliked', 'worn', 'skipped', 'saved', 'shared'
  feedback_text TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  interacted_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_interaction_target CHECK (
    (recommendation_id IS NOT NULL AND clothing_item_id IS NULL) OR
    (recommendation_id IS NULL AND clothing_item_id IS NOT NULL)
  )
);
```

### wardrobe_gaps
Identified missing items in wardrobe.

```sql
CREATE TABLE public.wardrobe_gaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gap_type TEXT NOT NULL, -- 'missing-category', 'color-variety', 'seasonal'
  category_id UUID REFERENCES public.clothing_categories(id),
  subcategory_id UUID REFERENCES public.clothing_subcategories(id),
  description TEXT NOT NULL,
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  suggested_items JSONB DEFAULT '[]',
  estimated_cost DECIMAL(10, 2),
  is_addressed BOOLEAN DEFAULT FALSE,
  addressed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### seasonal_trends
Global fashion trends.

```sql
CREATE TABLE public.seasonal_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season TEXT NOT NULL, -- 'spring', 'summer', 'fall', 'winter', 'all-season'
  year INTEGER NOT NULL,
  trending_colors TEXT[],
  trending_patterns TEXT[],
  trending_styles TEXT[],
  trending_categories TEXT[],
  trend_description TEXT,
  source TEXT, -- 'fashion-week', 'ai-analysis'
  confidence_score DECIMAL(3, 2),
  region TEXT DEFAULT 'global',
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(season, year, region)
);
```

### clothing_duplicates
Duplicate detection for uploaded items.

```sql
CREATE TABLE public.clothing_duplicates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_item_id UUID NOT NULL,
  duplicate_item_id UUID NOT NULL,
  similarity_score DECIMAL(3, 2) NOT NULL,
  detection_method TEXT DEFAULT 'embedding-similarity',
  user_confirmed BOOLEAN,
  resolved_at TIMESTAMPTZ,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(original_item_id, duplicate_item_id)
);
```

### recommendation_logs
Logs for ML training and debugging.

```sql
CREATE TABLE public.recommendation_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_id UUID,
  input_context JSONB NOT NULL,
  output_items UUID[],
  ai_confidence DECIMAL(3, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Subscription and Payment System

### subscription_plans
Available subscription tiers with pricing.

```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    billing_interval TEXT NOT NULL CHECK (billing_interval IN ('month', 'year')),
    trial_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### plan_limits
Feature limits for each subscription plan.

```sql
CREATE TABLE plan_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    limit_type TEXT NOT NULL, -- 'uploads', 'recs_per_week', 'tryons_per_month', etc.
    limit_value INTEGER NOT NULL, -- -1 for unlimited
    period TEXT NOT NULL DEFAULT 'total', -- 'total', 'week', 'month', 'year'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### subscriptions
User subscription records.

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active',
    stripe_subscription_id TEXT UNIQUE,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_end_date TIMESTAMPTZ,
    billing_currency TEXT NOT NULL DEFAULT 'USD',
    grandfathered BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### payments
Payment transaction records with mobile money support.

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id),
    user_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    payment_type TEXT NOT NULL DEFAULT 'subscription',
    stripe_payment_intent_id TEXT,
    stripe_invoice_id TEXT,
    mobile_provider TEXT, -- M-Pesa, Airtel Money, etc.
    phone_number TEXT,
    external_transaction_id TEXT,
    paid_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### referrals
Referral system for user acquisition.

```sql
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL,
    referee_id UUID NOT NULL,
    referral_code TEXT NOT NULL UNIQUE,
    reward_type TEXT NOT NULL DEFAULT 'credit',
    reward_value DECIMAL(10,2) NOT NULL,
    reward_currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending',
    referral_source TEXT DEFAULT 'direct',
    conversion_data JSONB DEFAULT '{}',
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_credits
User credit balances and transactions.

```sql
CREATE TABLE user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    credit_type TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    source_id UUID,
    description TEXT,
    expires_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    used_for_payment_id UUID REFERENCES payments(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Currency and Internationalization

### supported_currencies
List of supported currencies with display information.

```sql
CREATE TABLE public.supported_currencies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT,
    decimal_places INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 999
);
```

### exchange_rates
Cached currency exchange rates.

```sql
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency TEXT NOT NULL DEFAULT 'USD',
    target_currency TEXT NOT NULL,
    rate DECIMAL(12,6) NOT NULL,
    provider TEXT DEFAULT 'exchangerate-api',
    rate_date DATE DEFAULT CURRENT_DATE,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Production Features

### event_templates
Reusable event patterns for outfit planning.

```sql
CREATE TABLE event_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    default_occasion TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### events
Specific event occurrences with outfit planning context.

```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    template_id UUID REFERENCES event_templates(id),
    event_datetime TIMESTAMPTZ NOT NULL,
    location TEXT,
    notes TEXT,
    weather_at_creation JSONB,
    status TEXT DEFAULT 'planned',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### sustainability_tracking
Tracks user sustainability metrics over time.

```sql
CREATE TABLE sustainability_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    related_item_id UUID,
    period_start DATE NOT NULL,
    period_end DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### error_logs
System error logging.

```sql
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Materialized Views

### user_wardrobe_analytics
Aggregated analytics for user wardrobe metrics.

```sql
CREATE MATERIALIZED VIEW public.user_wardrobe_analytics AS
SELECT
  u.user_id,
  COUNT(DISTINCT ci.id) as total_items,
  COUNT(DISTINCT ci.category_id) as category_diversity,
  AVG(ci.sustainability_score) as avg_sustainability,
  SUM(ci.times_worn) as total_wears,
  COUNT(DISTINCT or_rec.id) as total_recommendations,
  COUNT(DISTINCT CASE WHEN ui.interaction_type = 'liked' THEN ui.id END) as liked_recommendations,
  COUNT(DISTINCT CASE WHEN ui.interaction_type = 'worn' THEN ui.id END) as worn_recommendations,
  ROUND(
    COUNT(DISTINCT CASE WHEN ui.interaction_type = 'liked' THEN ui.id END)::DECIMAL / 
    NULLIF(COUNT(DISTINCT or_rec.id), 0) * 100, 2
  ) as recommendation_acceptance_rate,
  MAX(ci.created_at) as last_item_added,
  MAX(or_rec.generated_at) as last_recommendation_generated
FROM public.user_profiles u
LEFT JOIN public.clothing_items ci ON u.user_id = ci.user_id
  AND ci.is_archived = FALSE AND ci.deleted_at IS NULL
LEFT JOIN public.outfit_recommendations or_rec ON u.user_id = or_rec.user_id
LEFT JOIN public.user_interactions ui ON or_rec.id = ui.recommendation_id
GROUP BY u.user_id;
```

## Helper Functions

### get_clothing_item_with_categories
Returns clothing item with all related data as JSON.

```sql
SELECT * FROM get_clothing_item_with_categories(item_id)
```

### add_style_tags_to_item
Adds multiple style tags to a clothing item.

```sql
SELECT add_style_tags_to_item(item_id, ARRAY['casual', 'vintage'])
```

### get_active_categories_for_prompt
Returns all active categories/subcategories/tags for AI prompts.

```sql
SELECT * FROM get_active_categories_for_prompt()
```

### find_similar_items
Finds similar clothing items using vector embeddings (768 dimensions).

```sql
SELECT * FROM find_similar_items(
  embedding, 
  user_id, 
  similarity_threshold := 0.7,
  limit_count := 10
)
```

### calculate_wardrobe_diversity
Calculates wardrobe diversity score.

```sql
SELECT calculate_wardrobe_diversity(user_id)
```

### Currency and Subscription Functions

### convert_currency
Converts amounts between currencies using cached exchange rates.

```sql
SELECT convert_currency(100.00, 'USD', 'ZAR')
```

### get_user_plan_limits
Get usage limits for a user based on their current subscription plan.

```sql
SELECT get_user_plan_limits(user_id, 'uploads')
```

### check_usage_limit
Check if user has exceeded their usage limit for a specific feature.

```sql
SELECT check_usage_limit(user_id, 'recs_per_week')
```

### get_converted_amount
Convert currency amounts for display with user preferences.

```sql
SELECT get_converted_amount(50.00, 'USD', 'ZAR', user_id)
```

## Row Level Security (RLS)

All user-specific tables have RLS enabled:

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own items" ON public.clothing_items
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items" ON public.clothing_items
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items" ON public.clothing_items
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items" ON public.clothing_items
FOR DELETE USING (auth.uid() = user_id);
```

## Indexes

### Performance Indexes

```sql
-- User Profiles
CREATE INDEX idx_user_profiles_location ON public.user_profiles(location_country, location_city);
CREATE INDEX idx_user_profiles_body_type ON public.user_profiles(body_type);

-- Clothing Items
CREATE INDEX idx_clothing_items_user_category ON public.clothing_items(user_id, category_id);
CREATE INDEX idx_clothing_items_user_active ON public.clothing_items(user_id, is_archived, deleted_at);
CREATE INDEX idx_clothing_embedding ON public.clothing_items USING ivfflat(embedding vector_cosine_ops);

-- Outfit Recommendations
CREATE INDEX idx_recommendations_user_id ON public.outfit_recommendations(user_id);
CREATE INDEX idx_recommendations_occasion ON public.outfit_recommendations(occasion);
CREATE INDEX idx_recommendations_score ON public.outfit_recommendations(ai_score DESC);

-- User Interactions
CREATE INDEX idx_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX idx_interactions_type ON public.user_interactions(interaction_type);

-- Wardrobe Gaps
CREATE INDEX idx_gaps_user_id ON public.wardrobe_gaps(user_id);
CREATE INDEX idx_gaps_priority ON public.wardrobe_gaps(priority DESC);
```

## Data Types

### Text-Based Values (Replaced Enums for Flexibility)
- **Seasons**: 'spring', 'summer', 'fall', 'winter', 'all_season'
- **Occasions**: 'casual', 'work', 'formal', 'business_casual', 'party', 'wedding', 'date', 'sports', 'outdoor', 'beach', 'gym', 'travel', 'religious', 'interview', 'networking', 'brunch', 'dinner', 'concert', 'festival', 'graduation', 'everyday'
- **Moods**: 'confident', 'relaxed', 'professional', 'playful', 'romantic', 'edgy', 'elegant', 'sporty', 'bohemian', 'minimalist', 'bold', 'comfortable', 'trendy', 'classic', 'creative', 'adventurous'
- **Activity Levels**: 'sedentary', 'light', 'moderate', 'active', 'very_active'
- **Body Types**: 'hourglass', 'pear', 'apple', 'rectangle', 'inverted_triangle', 'petite', 'tall', 'athletic', 'plus_size', 'prefer_not_to_say'
- **Weather Conditions**: 'sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'hot', 'cold', 'mild', 'humid', 'dry', 'stormy', 'foggy'
- **Interaction Types**: 'liked', 'disliked', 'worn', 'skipped', 'saved', 'shared'
- **Fit Preferences**: 'tight', 'fitted', 'regular', 'loose', 'oversized'
- **Subscription Status**: 'free', 'trialing', 'active', 'past_due', 'canceled'
- **Payment Status**: 'pending', 'succeeded', 'failed', 'refunded'
- **Sustainability Metrics**: 'rewear', 'cost_per_wear', 'eco_score', 'carbon_footprint'

## Query Examples

### Get user's wardrobe with categories
```sql
SELECT 
  ci.*,
  cc.name as category_name,
  cs.name as subcategory_name
FROM clothing_items ci
LEFT JOIN clothing_categories cc ON ci.category_id = cc.id
LEFT JOIN clothing_subcategories cs ON ci.subcategory_id = cs.id
WHERE ci.user_id = $1
ORDER BY ci.created_at DESC;
```

### Get outfit recommendations with items
```sql
SELECT 
  or_rec.*,
  array_agg(ci.name) as item_names
FROM outfit_recommendations or_rec
LEFT JOIN clothing_items ci ON ci.id = ANY(or_rec.clothing_item_ids)
WHERE or_rec.user_id = $1
GROUP BY or_rec.id
ORDER BY or_rec.generated_at DESC;
```

### Find similar items
```sql
SELECT * FROM find_similar_items(
  (SELECT embedding FROM clothing_items WHERE id = $1),
  $2,
  0.7,
  10
);
```

## Storage

### Supabase Storage Bucket: `clothing`

Structure:
```
clothing/
├── {user_id}/
│   ├── {timestamp}-{filename}.jpg
│   ├── {timestamp}-{filename}.png
│   └── ...
```

**Policies:**
- Users can upload to their own folder
- Users can read their own images
- Users can update their own images
- Users can delete their own images

## Performance Considerations

1. **Partitioning**: `clothing_items` and `outfit_recommendations` are partitioned by user_id for horizontal scaling
2. **Vector Indexes**: IVFFlat indexes for fast similarity search
3. **Materialized Views**: Pre-computed analytics for dashboard
4. **Soft Deletes**: `deleted_at` column for data recovery
5. **Caching**: Seasonal trends cached globally

## Future Enhancements

1. **Temporal Tables**: Track item history over time
2. **Full-Text Search**: Search items by description
3. **Geospatial Queries**: Location-based recommendations
4. **Time-Series Data**: Track wardrobe changes over time
5. **Graph Queries**: Item compatibility networks
