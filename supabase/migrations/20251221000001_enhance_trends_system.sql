-- ============================================================================
-- ENHANCE TRENDS SYSTEM - Add external data support and sync tracking
-- ============================================================================
BEGIN;

-- Enhance seasonal_trends table with external data support (table already exists from main schema)
ALTER TABLE public.seasonal_trends ADD COLUMN IF NOT EXISTS
  external_source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS
  trend_score DECIMAL(3,2) DEFAULT 0.5 CHECK (trend_score >= 0 AND trend_score <= 1),
ADD COLUMN IF NOT EXISTS
  last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS
  sync_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS
  keywords TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS
  popularity_score INTEGER DEFAULT 50 CHECK (popularity_score >= 0 AND popularity_score <= 100);

-- Create trend sync jobs table for tracking automated updates
CREATE TABLE IF NOT EXISTS public.trend_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- 'google_trends', 'social_media', 'fashion_blogs'
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  error_message TEXT,
  trends_updated INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trend keywords table for tracking fashion search terms
CREATE TABLE IF NOT EXISTS public.trend_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  category TEXT, -- maps to clothing categories
  search_volume INTEGER DEFAULT 0,
  trend_direction TEXT DEFAULT 'stable' CHECK (trend_direction IN ('rising', 'falling', 'stable')),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_seasonal_trends_external_source ON public.seasonal_trends(external_source);
CREATE INDEX IF NOT EXISTS idx_seasonal_trends_last_synced ON public.seasonal_trends(last_synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_seasonal_trends_trend_score ON public.seasonal_trends(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_trend_sync_jobs_status ON public.trend_sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_trend_sync_jobs_next_run ON public.trend_sync_jobs(next_run_at);
CREATE INDEX IF NOT EXISTS idx_trend_keywords_category ON public.trend_keywords(category);

-- Enable RLS on tables
ALTER TABLE public.seasonal_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_keywords ENABLE ROW LEVEL SECURITY;

-- RLS policies for seasonal_trends (public read)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'seasonal_trends' AND policyname = 'Anyone can view seasonal trends') THEN
    CREATE POLICY "Anyone can view seasonal trends" ON public.seasonal_trends FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'seasonal_trends' AND policyname = 'Service role can manage trends') THEN
    CREATE POLICY "Service role can manage trends" ON public.seasonal_trends FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- RLS policies for trend_sync_jobs (admin only for now)
CREATE POLICY "Service role can manage sync jobs" ON public.trend_sync_jobs
  FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for trend_keywords (public read)
CREATE POLICY "Anyone can view trend keywords" ON public.trend_keywords
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage keywords" ON public.trend_keywords
  FOR ALL USING (auth.role() = 'service_role');

-- Function to update trend scores based on engagement
CREATE OR REPLACE FUNCTION update_trend_scores()
RETURNS void AS $$
BEGIN
  -- Update trend scores based on recency and popularity
  UPDATE public.seasonal_trends 
  SET trend_score = LEAST(1.0, 
    COALESCE(popularity_score, 50) / 100.0 * 0.7 + 
    CASE 
      WHEN last_synced_at > NOW() - INTERVAL '24 hours' THEN 0.3
      WHEN last_synced_at > NOW() - INTERVAL '7 days' THEN 0.2
      ELSE 0.1
    END
  )
  WHERE external_source != 'manual';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial trend keywords for fashion
INSERT INTO public.trend_keywords (keyword, category) VALUES
  ('fashion trends', 'general'),
  ('street style', 'general'),
  ('outfit ideas', 'general'),
  ('winter fashion', 'outerwear'),
  ('summer style', 'tops'),
  ('dress trends', 'dresses'),
  ('shoe trends', 'shoes'),
  ('accessory trends', 'accessories'),
  ('sustainable fashion', 'general'),
  ('vintage style', 'general')
ON CONFLICT (keyword) DO NOTHING;

-- Insert initial sync job
INSERT INTO public.trend_sync_jobs (source, next_run_at) VALUES
  ('google_trends', NOW() + INTERVAL '1 hour'),
  ('social_media', NOW() + INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- Enable realtime for trends
ALTER PUBLICATION supabase_realtime ADD TABLE public.seasonal_trends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trend_keywords;

COMMIT;