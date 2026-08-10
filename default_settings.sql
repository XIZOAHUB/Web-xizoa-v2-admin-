-- ============================================
-- Default settings seed
-- Run: wrangler d1 execute xizoa-db --file=./database/seeds/default_settings.sql
-- ============================================

INSERT OR IGNORE INTO settings (key, value) VALUES
    ('site_title', 'Xizoa Blog'),
    ('site_description', 'A blog built with Xizoa CMS'),
    ('site_url', 'https://web-xizoa-v2-admin.pages.dev'),
    ('posts_per_page', '10'),
    ('default_category', 'Uncategorized'),
    ('auto_excerpt_length', '160'),
    ('enable_comments', 'false'),
    ('theme', 'default'),
    ('timezone', 'UTC'),
    ('date_format', 'YYYY-MM-DD'),
    ('author_name', 'Priyanshu Maurya'),
    ('author_bio', 'Building in public. Solopreneur journey.'),
    ('social_twitter', ''),
    ('social_github', 'https://github.com/Priyanshu-maurya'),
    ('social_linkedin', '');
