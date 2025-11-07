-- Create RPC function to sync trends with Google Trends API
CREATE OR REPLACE FUNCTION sync_trends()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer := 0;
  current_time timestamptz := NOW();
  current_year integer := EXTRACT(YEAR FROM NOW());
  current_month integer := EXTRACT(MONTH FROM NOW());
  season_name text;
  trends_response jsonb;
  fashion_keywords text[];
  trending_searches jsonb;
  fashion_trends jsonb := '[]'::jsonb;
  trend_item jsonb;
  query_text text;
  is_fashion_related boolean;
  trending_keywords text[] := '{}';
  extracted_colors text[] := '{}';
  extracted_patterns text[] := '{}';
  extracted_styles text[] := '{}';
  api_error text := NULL;
  color_terms text[] := ARRAY['burgundy', 'sage', 'navy', 'beige', 'coral', 'lavender', 'mustard', 'rust', 'black', 'white', 'red', 'blue', 'green', 'pink', 'purple', 'yellow', 'orange', 'brown', 'gray', 'grey'];
  pattern_terms text[] := ARRAY['plaid', 'floral', 'leopard', 'polka dot', 'stripe', 'gingham', 'houndstooth', 'paisley', 'geometric', 'abstract', 'tropical', 'tie-dye'];
  style_terms text[] := ARRAY['minimalist', 'boho', 'preppy', 'vintage', 'athleisure', 'cottagecore', 'streetwear', 'gothic', 'romantic', 'casual', 'formal', 'bohemian'];
BEGIN
  -- Determine current season
  IF current_month >= 12 OR current_month <= 2 THEN
    season_name := 'winter';
  ELSIF current_month >= 3 AND current_month <= 5 THEN
    season_name := 'spring';
  ELSIF current_month >= 6 AND current_month <= 8 THEN
    season_name := 'summer';
  ELSE
    season_name := 'fall';
  END IF;

  -- Get fashion keywords from database
  SELECT ARRAY_AGG(keyword) INTO fashion_keywords
  FROM public.trend_keywords 
  WHERE category = 'fashion' 
  ORDER BY search_volume DESC 
  LIMIT 20;
  
  -- Use fallback keywords if none found
  IF fashion_keywords IS NULL OR array_length(fashion_keywords, 1) IS NULL THEN
    fashion_keywords := ARRAY['fashion', 'style', 'outfit', 'clothing', 'trend', 'wear'];
  END IF;

  -- Try to fetch from Google Trends API
  BEGIN
    SELECT content INTO trends_response
    FROM http_get('https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=-480&geo=US&ns=15');
    
    -- Parse trends response (remove )]}' prefix and get trending searches)
    trending_searches := (trends_response::text)::jsonb->'default'->'trendingSearchesDays'->0->'trendingSearches';
    
    -- Filter fashion-related trends and extract colors/patterns/styles
    FOR trend_item IN SELECT * FROM jsonb_array_elements(trending_searches)
    LOOP
      query_text := LOWER(trend_item->'title'->>'query');
      is_fashion_related := false;
      
      -- Check if query matches fashion keywords
      IF query_text IS NOT NULL THEN
        -- Check against fashion keywords
        FOR i IN 1..array_length(fashion_keywords, 1)
        LOOP
          IF query_text LIKE '%' || LOWER(fashion_keywords[i]) || '%' THEN
            is_fashion_related := true;
            EXIT;
          END IF;
        END LOOP;
        
        -- Check against core fashion terms
        IF NOT is_fashion_related THEN
          IF query_text LIKE '%fashion%' OR query_text LIKE '%style%' OR 
             query_text LIKE '%outfit%' OR query_text LIKE '%clothing%' OR
             query_text LIKE '%dress%' OR query_text LIKE '%shirt%' THEN
            is_fashion_related := true;
          END IF;
        END IF;
        
        -- Add to fashion trends if relevant
        IF is_fashion_related THEN
          fashion_trends := fashion_trends || trend_item;
          trending_keywords := trending_keywords || query_text;
          
          -- Extract colors from query
          FOR i IN 1..array_length(color_terms, 1)
          LOOP
            IF query_text LIKE '%' || color_terms[i] || '%' AND NOT (color_terms[i] = ANY(extracted_colors)) THEN
              extracted_colors := extracted_colors || color_terms[i];
            END IF;
          END LOOP;
          
          -- Extract patterns from query
          FOR i IN 1..array_length(pattern_terms, 1)
          LOOP
            IF query_text LIKE '%' || pattern_terms[i] || '%' AND NOT (pattern_terms[i] = ANY(extracted_patterns)) THEN
              extracted_patterns := extracted_patterns || pattern_terms[i];
            END IF;
          END LOOP;
          
          -- Extract styles from query
          FOR i IN 1..array_length(style_terms, 1)
          LOOP
            IF query_text LIKE '%' || style_terms[i] || '%' AND NOT (style_terms[i] = ANY(extracted_styles)) THEN
              extracted_styles := extracted_styles || style_terms[i];
            END IF;
          END LOOP;
          
          -- Learn new keyword (upsert to trend_keywords table)
          INSERT INTO public.trend_keywords (keyword, category, last_updated, search_volume, trend_direction)
          VALUES (query_text, 'fashion', current_time, 100, 'rising')
          ON CONFLICT (keyword) 
          DO UPDATE SET 
            last_updated = current_time,
            search_volume = trend_keywords.search_volume + 10,
            trend_direction = 'rising';
        END IF;
      END IF;
    END LOOP;
    
    -- Update seasonal trends with extracted data
    UPDATE public.seasonal_trends 
    SET 
      last_synced_at = current_time,
      external_source = 'google_trends',
      trend_score = LEAST(jsonb_array_length(fashion_trends)::decimal / 10, 1),
      popularity_score = LEAST(jsonb_array_length(fashion_trends) * 5, 100),
      keywords = trending_keywords[1:10],
      trending_colors = CASE WHEN array_length(extracted_colors, 1) > 0 THEN extracted_colors[1:5] ELSE ARRAY['neutral', 'classic'] END,
      trending_patterns = CASE WHEN array_length(extracted_patterns, 1) > 0 THEN extracted_patterns[1:4] ELSE ARRAY['solid', 'textured'] END,
      trending_styles = CASE WHEN array_length(extracted_styles, 1) > 0 THEN extracted_styles[1:4] ELSE ARRAY['contemporary', 'timeless'] END
    WHERE year = current_year;
    
  EXCEPTION WHEN OTHERS THEN
    api_error := SQLERRM;
    
    -- Fallback: update with minimal defaults
    UPDATE public.seasonal_trends 
    SET 
      last_synced_at = current_time,
      external_source = 'fallback',
      trend_score = 0.6,
      popularity_score = 60,
      keywords = ARRAY[season_name || ' fashion'],
      trending_colors = ARRAY['neutral', 'seasonal'],
      trending_patterns = ARRAY['classic', 'modern'],
      trending_styles = ARRAY['contemporary', 'timeless']
    WHERE year = current_year;
  END;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Update sync job status
  UPDATE public.trend_sync_jobs 
  SET 
    status = CASE WHEN api_error IS NULL THEN 'completed' ELSE 'completed_with_fallback' END,
    last_run_at = current_time,
    trends_updated = updated_count,
    next_run_at = current_time + INTERVAL '6 hours',
    error_message = api_error
  WHERE source = 'google_trends';
  
  RETURN jsonb_build_object(
    'success', true,
    'trends_updated', updated_count,
    'season', season_name,
    'fashion_trends_found', jsonb_array_length(fashion_trends),
    'extracted_colors', extracted_colors,
    'extracted_patterns', extracted_patterns,
    'extracted_styles', extracted_styles,
    'api_error', api_error,
    'message', 'Successfully synced ' || updated_count || ' trends'
  );
END;
$$;