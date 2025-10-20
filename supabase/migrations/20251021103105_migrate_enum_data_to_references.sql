-- ============================================================================
-- MIGRATE ENUM DATA TO REFERENCE TABLES
-- Move existing enum data to the new foreign key columns
-- ============================================================================

-- First, ensure all enum values exist in reference tables
-- Add any missing categories from the enum
INSERT INTO public.clothing_categories (name, display_order, source)
SELECT DISTINCT 
    unnest(enum_range(NULL::clothing_category))::text,
    ROW_NUMBER() OVER (ORDER BY unnest(enum_range(NULL::clothing_category))::text),
    'migration'
ON CONFLICT (name) DO NOTHING;

-- Add any missing subcategories from the enum
INSERT INTO public.clothing_subcategories (name, category_id, source)
SELECT DISTINCT 
    subcategory_name,
    cc.id,
    'migration'
FROM (
    SELECT unnest(enum_range(NULL::clothing_subcategory))::text as subcategory_name
) sub
CROSS JOIN public.clothing_categories cc
WHERE cc.name = CASE 
    -- Map subcategories to their parent categories
    WHEN subcategory_name IN ('t-shirt', 'blouse', 'shirt', 'tank-top', 'sweater', 'hoodie', 'cardigan', 'polo') THEN 'tops'
    WHEN subcategory_name IN ('jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'joggers', 'chinos') THEN 'bottoms'
    WHEN subcategory_name IN ('maxi-dress', 'mini-dress', 'midi-dress', 'cocktail-dress', 'sundress') THEN 'dresses'
    WHEN subcategory_name IN ('jacket', 'coat', 'blazer', 'parka', 'vest', 'raincoat', 'windbreaker') THEN 'outerwear'
    WHEN subcategory_name IN ('sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers', 'oxfords', 'slippers') THEN 'shoes'
    WHEN subcategory_name IN ('necklace', 'bracelet', 'earrings', 'ring') THEN 'jewelry'
    WHEN subcategory_name IN ('handbag', 'backpack', 'clutch') THEN 'bags'
    WHEN subcategory_name IN ('baseball-cap', 'beanie', 'fedora') THEN 'hats'
    WHEN subcategory_name IN ('sunglasses') THEN 'eyewear'
    WHEN subcategory_name IN ('watch') THEN 'watches'
    WHEN subcategory_name IN ('belt') THEN 'belts'
    WHEN subcategory_name IN ('scarf') THEN 'scarves'
    WHEN subcategory_name IN ('tie', 'bow-tie') THEN 'accessories'
    WHEN subcategory_name IN ('gloves', 'socks', 'tights') THEN 'accessories'
    ELSE 'accessories' -- fallback
END
ON CONFLICT (name, category_id) DO NOTHING;

-- Update clothing_items to use foreign key references
UPDATE public.clothing_items 
SET category_id = cc.id
FROM public.clothing_categories cc
WHERE cc.name = clothing_items.category::text;

UPDATE public.clothing_items 
SET subcategory_id = cs.id
FROM public.clothing_subcategories cs
JOIN public.clothing_categories cc ON cs.category_id = cc.id
WHERE cs.name = clothing_items.subcategory::text
AND cc.name = clothing_items.category::text;

-- Migrate style_tags array to junction table
INSERT INTO public.clothing_item_style_tags (clothing_item_id, style_tag_id)
SELECT DISTINCT 
    ci.id,
    st.id
FROM public.clothing_items ci
CROSS JOIN LATERAL unnest(ci.style_tags) AS tag_name
JOIN public.style_tags st ON st.name = tag_name
ON CONFLICT DO NOTHING;

-- Add any missing style tags from existing data
INSERT INTO public.style_tags (name, source)
SELECT DISTINCT tag_name, 'migration'
FROM public.clothing_items ci
CROSS JOIN LATERAL unnest(ci.style_tags) AS tag_name
WHERE NOT EXISTS (
    SELECT 1 FROM public.style_tags st WHERE st.name = tag_name
)
ON CONFLICT (name) DO NOTHING;

-- Re-run the junction table insert for newly created tags
INSERT INTO public.clothing_item_style_tags (clothing_item_id, style_tag_id)
SELECT DISTINCT 
    ci.id,
    st.id
FROM public.clothing_items ci
CROSS JOIN LATERAL unnest(ci.style_tags) AS tag_name
JOIN public.style_tags st ON st.name = tag_name
ON CONFLICT DO NOTHING;

-- Update wardrobe_gaps table to use foreign key references
UPDATE public.wardrobe_gaps 
SET category = NULL; -- Will be handled in application layer with new structure

-- Comments
COMMENT ON COLUMN public.clothing_items.category_id IS 'Foreign key reference to clothing_categories table';
COMMENT ON COLUMN public.clothing_items.subcategory_id IS 'Foreign key reference to clothing_subcategories table';