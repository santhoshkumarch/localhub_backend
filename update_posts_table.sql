-- Add media_urls column to posts table for multimedia support
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]';

-- Update existing posts to have empty media_urls array
UPDATE posts SET media_urls = '[]' WHERE media_urls IS NULL;