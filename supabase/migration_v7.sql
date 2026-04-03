-- ===========================================
-- De Schat van Schier — Migration v7
-- Adds: poster_url field to plans
-- ===========================================

ALTER TABLE plans ADD COLUMN IF NOT EXISTS poster_url TEXT DEFAULT '';

-- IMPORTANT: After running this SQL, go to Supabase Storage and:
-- 1. Create a new bucket called "posters"
-- 2. Set it to PUBLIC
-- 3. Upload your poster images (e.g. blotevoetenpad.jpg)
-- 4. Update each plan with the poster URL:
--    UPDATE plans SET poster_url = 'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/posters/blotevoetenpad.jpg' WHERE id = 8;
