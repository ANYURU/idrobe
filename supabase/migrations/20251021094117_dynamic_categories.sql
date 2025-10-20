-- ============================================================================
-- DYNAMIC CATEGORIES MIGRATION
-- Replace enum-based categories with scalable reference tables
-- ============================================================================

-- Core category reference table
CREATE TABLE public.clothing_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    parent_category_id UUID REFERENCES public.clothing_categories(id),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'manual', -- 'manual', 'ai_suggested', 'trend_analysis'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subcategory reference table
CREATE TABLE public.clothing_subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.clothing_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, category_id)
);

-- Style tags reference table (completely dynamic)
CREATE TABLE public.style_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    popularity_score INTEGER DEFAULT 0,
    is_trending BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert core categories (stable foundation)
INSERT INTO public.clothing_categories (name, display_order) VALUES
('tops', 1),
('bottoms', 2),
('dresses', 3),
('outerwear', 4),
('shoes', 5),
('accessories', 6),
('activewear', 7),
('formalwear', 8);

-- Insert common subcategories
INSERT INTO public.clothing_subcategories (name, category_id) 
SELECT 't-shirt', id FROM public.clothing_categories WHERE name = 'tops'
UNION ALL
SELECT 'blouse', id FROM public.clothing_categories WHERE name = 'tops'
UNION ALL
SELECT 'jeans', id FROM public.clothing_categories WHERE name = 'bottoms'
UNION ALL
SELECT 'sneakers', id FROM public.clothing_categories WHERE name = 'shoes';

-- Insert common style tags
INSERT INTO public.style_tags (name, popularity_score) VALUES
('casual', 100),
('formal', 90),
('vintage', 70),
('minimalist', 80),
('bohemian', 60);

-- Add indexes
CREATE INDEX idx_categories_active ON public.clothing_categories(is_active);
CREATE INDEX idx_categories_parent ON public.clothing_categories(parent_category_id);
CREATE INDEX idx_subcategories_category ON public.clothing_subcategories(category_id);
CREATE INDEX idx_subcategories_active ON public.clothing_subcategories(is_active);
CREATE INDEX idx_style_tags_trending ON public.style_tags(is_trending);
CREATE INDEX idx_style_tags_popularity ON public.style_tags(popularity_score DESC);

-- RLS policies
ALTER TABLE public.clothing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothing_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_tags ENABLE ROW LEVEL SECURITY;

-- Public read access for categories (everyone needs to see them)
CREATE POLICY "Anyone can view active categories" ON public.clothing_categories 
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view active subcategories" ON public.clothing_subcategories 
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view active style tags" ON public.style_tags 
FOR SELECT USING (is_active = TRUE);

-- Only authenticated users can suggest new categories
CREATE POLICY "Authenticated users can suggest categories" ON public.clothing_categories 
FOR INSERT TO authenticated WITH CHECK (source = 'ai_suggested');

CREATE POLICY "Authenticated users can suggest subcategories" ON public.clothing_subcategories 
FOR INSERT TO authenticated WITH CHECK (source = 'ai_suggested');

CREATE POLICY "Authenticated users can suggest style tags" ON public.style_tags 
FOR INSERT TO authenticated WITH CHECK (source = 'ai_suggested');

-- Helper function to find or create category
CREATE OR REPLACE FUNCTION find_or_create_category(category_name TEXT)
RETURNS UUID AS $$
DECLARE
    category_id UUID;
BEGIN
    -- Try to find existing category
    SELECT id INTO category_id 
    FROM public.clothing_categories 
    WHERE name = category_name AND is_active = TRUE;
    
    -- If not found, create as AI suggested (pending approval)
    IF category_id IS NULL THEN
        INSERT INTO public.clothing_categories (name, is_active, source)
        VALUES (category_name, FALSE, 'ai_suggested')
        RETURNING id INTO category_id;
    END IF;
    
    RETURN category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to find or create subcategory
CREATE OR REPLACE FUNCTION find_or_create_subcategory(subcategory_name TEXT, parent_category_id UUID)
RETURNS UUID AS $$
DECLARE
    subcategory_id UUID;
BEGIN
    -- Try to find existing subcategory
    SELECT id INTO subcategory_id 
    FROM public.clothing_subcategories 
    WHERE name = subcategory_name 
    AND category_id = parent_category_id 
    AND is_active = TRUE;
    
    -- If not found, create as AI suggested
    IF subcategory_id IS NULL THEN
        INSERT INTO public.clothing_subcategories (name, category_id, is_active, source)
        VALUES (subcategory_name, parent_category_id, FALSE, 'ai_suggested')
        RETURNING id INTO subcategory_id;
    END IF;
    
    RETURN subcategory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update triggers
CREATE TRIGGER update_categories_updated_at 
BEFORE UPDATE ON public.clothing_categories 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.clothing_categories IS 'Dynamic clothing categories that can grow with fashion trends';
COMMENT ON TABLE public.clothing_subcategories IS 'Subcategories linked to main categories';
COMMENT ON TABLE public.style_tags IS 'Dynamic style tags for trend tracking';