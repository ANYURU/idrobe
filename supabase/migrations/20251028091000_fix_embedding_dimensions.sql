-- Fix embedding column to match Gemini's 768 dimensions
ALTER TABLE clothing_items ALTER COLUMN embedding TYPE vector(768);