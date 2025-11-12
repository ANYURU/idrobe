-- ============================================================================
-- WEAR TRACKING SYSTEM
-- Adds comprehensive wear history and event integration
-- ============================================================================
BEGIN;

-- ============================================================================
-- 1. CREATE WEAR HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wear_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What was worn (no FK constraint on partitioned table)
  item_id UUID,
  outfit_id UUID REFERENCES public.outfit_collections(id) ON DELETE SET NULL,
  event_id UUID,
  
  -- When & Where
  worn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  occasion_name TEXT,
  location TEXT,
  
  -- Context
  weather JSONB DEFAULT '{}',
  notes TEXT,
  
  -- Feedback (optional)
  comfort_rating INTEGER CHECK (comfort_rating BETWEEN 1 AND 5),
  confidence_rating INTEGER CHECK (confidence_rating BETWEEN 1 AND 5),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Must have either item_id or outfit_id
  CONSTRAINT check_wear_target CHECK (
    (item_id IS NOT NULL AND outfit_id IS NULL) OR
    (item_id IS NULL AND outfit_id IS NOT NULL)
  )
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_wear_history_user_date ON public.wear_history(user_id, worn_date DESC);
CREATE INDEX IF NOT EXISTS idx_wear_history_event ON public.wear_history(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wear_history_item ON public.wear_history(item_id) WHERE item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wear_history_outfit ON public.wear_history(outfit_id) WHERE outfit_id IS NOT NULL;


-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.wear_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wear_history
CREATE POLICY "Users can view own wear history" ON public.wear_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wear history" ON public.wear_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wear history" ON public.wear_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wear history" ON public.wear_history
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 5. CREATE TRIGGER FUNCTION TO AUTO-UPDATE WEAR COUNTS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_wear_counts()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update clothing item wear count
  IF NEW.item_id IS NOT NULL THEN
    UPDATE public.clothing_items
    SET 
      times_worn = times_worn + 1,
      last_worn_date = NEW.worn_date
    WHERE id = NEW.item_id;
  END IF;
  
  -- Update outfit collection wear count
  IF NEW.outfit_id IS NOT NULL THEN
    UPDATE public.outfit_collections
    SET 
      times_worn = times_worn + 1,
      last_worn_date = NEW.worn_date
    WHERE id = NEW.outfit_id;
    
    -- Also update individual items in the outfit
    UPDATE public.clothing_items
    SET 
      times_worn = times_worn + 1,
      last_worn_date = NEW.worn_date
    WHERE id = ANY(
      SELECT unnest(clothing_item_ids) 
      FROM public.outfit_collections 
      WHERE id = NEW.outfit_id
    );
  END IF;
  
  -- Log interaction
  INSERT INTO public.user_interactions (
    user_id,
    clothing_item_id,
    recommendation_id,
    interaction_type_name,
    feedback_text,
    interacted_at
  ) VALUES (
    NEW.user_id,
    NEW.item_id,
    NEW.outfit_id,
    'worn',
    NEW.notes,
    NEW.worn_date::timestamptz
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_wear_counts
  AFTER INSERT ON public.wear_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wear_counts();

-- ============================================================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to mark item as worn
CREATE OR REPLACE FUNCTION public.mark_item_worn(
  p_item_id UUID,
  p_worn_date DATE DEFAULT CURRENT_DATE,
  p_occasion TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_wear_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  INSERT INTO public.wear_history (
    user_id,
    item_id,
    worn_date,
    occasion_name,
    notes
  ) VALUES (
    v_user_id,
    p_item_id,
    p_worn_date,
    p_occasion,
    p_notes
  ) RETURNING id INTO v_wear_id;
  
  RETURN v_wear_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark outfit as worn
CREATE OR REPLACE FUNCTION public.mark_outfit_worn(
  p_outfit_id UUID,
  p_worn_date DATE DEFAULT CURRENT_DATE,
  p_occasion TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_event_id UUID DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_wear_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  INSERT INTO public.wear_history (
    user_id,
    outfit_id,
    event_id,
    worn_date,
    occasion_name,
    notes
  ) VALUES (
    v_user_id,
    p_outfit_id,
    p_event_id,
    p_worn_date,
    p_occasion,
    p_notes
  ) RETURNING id INTO v_wear_id;
  
  -- Event tracking removed (events table doesn't exist yet)
  
  RETURN v_wear_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get wear history for item
CREATE OR REPLACE FUNCTION public.get_item_wear_history(
  p_item_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  worn_date DATE,
  occasion_name TEXT,
  notes TEXT,
  weather JSONB
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wh.id,
    wh.worn_date,
    wh.occasion_name,
    wh.notes,
    wh.weather
  FROM public.wear_history wh
  WHERE wh.item_id = p_item_id
    AND wh.user_id = auth.uid()
  ORDER BY wh.worn_date DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. ENABLE REALTIME
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.wear_history;

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================
COMMENT ON TABLE public.wear_history IS 'Tracks when items and outfits are worn with context';
COMMENT ON FUNCTION public.mark_item_worn IS 'Marks a clothing item as worn and updates counters';
COMMENT ON FUNCTION public.mark_outfit_worn IS 'Marks an outfit as worn and updates counters';
COMMENT ON FUNCTION public.get_item_wear_history IS 'Retrieves wear history for a specific item';

COMMIT;
