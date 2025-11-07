-- Fix missing tables and columns from enhance_trends_system migration
-- The previous migration didn't apply properly to remote database

-- Add missing columns to seasonal_trends table
ALTER TABLE public.seasonal_trends 
ADD COLUMN IF NOT EXISTS external_source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS trend_score DECIMAL(3,2) DEFAULT 0.5 CHECK (trend_score >= 0 AND trend_score <= 1),
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sync_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 50 CHECK (popularity_score >= 0 AND popularity_score <= 100);

-- Create trend sync jobs table
CREATE TABLE IF NOT EXISTS public.trend_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  error_message TEXT,
  trends_updated INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trend keywords table
CREATE TABLE IF NOT EXISTS public.trend_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  category TEXT,
  search_volume INTEGER DEFAULT 0,
  trend_direction TEXT DEFAULT 'stable' CHECK (trend_direction IN ('rising', 'falling', 'stable')),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_seasonal_trends_external_source ON public.seasonal_trends(external_source);
CREATE INDEX IF NOT EXISTS idx_seasonal_trends_last_synced ON public.seasonal_trends(last_synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_seasonal_trends_trend_score ON public.seasonal_trends(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_trend_sync_jobs_status ON public.trend_sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_trend_sync_jobs_next_run ON public.trend_sync_jobs(next_run_at);
CREATE INDEX IF NOT EXISTS idx_trend_keywords_category ON public.trend_keywords(category);

-- Enable RLS
ALTER TABLE public.trend_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_keywords ENABLE ROW LEVEL SECURITY;

-- RLS policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trend_sync_jobs' AND policyname = 'Service role can manage sync jobs') THEN
    CREATE POLICY "Service role can manage sync jobs" ON public.trend_sync_jobs
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trend_keywords' AND policyname = 'Anyone can view trend keywords') THEN
    CREATE POLICY "Anyone can view trend keywords" ON public.trend_keywords
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trend_keywords' AND policyname = 'Service role can manage keywords') THEN
    CREATE POLICY "Service role can manage keywords" ON public.trend_keywords
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Insert initial data
INSERT INTO public.trend_sync_jobs (source, next_run_at) VALUES
  ('google_trends', NOW() + INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

INSERT INTO public.trend_keywords (keyword, category) VALUES
  ('fashion', 'general'),
  ('style', 'general'),
  ('outfit', 'general'),
  ('clothing', 'general'),
  ('trend', 'general')
ON CONFLICT (keyword) DO NOTHING;