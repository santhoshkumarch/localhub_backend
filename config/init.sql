-- Create tables for LocalHub Admin

-- Drop existing tables if they exist
DROP TABLE IF EXISTS post_hashtags CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS shares CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS districts CASCADE;
DROP TABLE IF EXISTS hashtags CASCADE;
DROP TABLE IF EXISTS menus CASCADE;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    district VARCHAR(100),
    user_type VARCHAR(20) DEFAULT 'individual',
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_logged_in BOOLEAN DEFAULT false,
    last_active TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Businesses table
CREATE TABLE IF NOT EXISTS businesses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    social_media JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    is_verified BOOLEAN DEFAULT false,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    hashtags JSONB,
    image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',
    view_duration INTEGER,
    expires_at TIMESTAMP,
    view_limit INTEGER,
    current_views INTEGER DEFAULT 0,
    assigned_label VARCHAR(100),
    menu_id INTEGER,
    user_id INTEGER REFERENCES users(id),
    business_id INTEGER REFERENCES businesses(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Districts table
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    headquarters VARCHAR(100),
    population VARCHAR(20),
    area VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hashtags table
CREATE TABLE IF NOT EXISTS hashtags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(20) DEFAULT 'blue',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menus table
CREATE TABLE IF NOT EXISTS menus (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    labels JSONB,
    time_filter VARCHAR(20) DEFAULT '3months',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post hashtags junction table
CREATE TABLE IF NOT EXISTS post_hashtags (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    hashtag_id INTEGER REFERENCES hashtags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, hashtag_id)
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shares table
CREATE TABLE IF NOT EXISTS shares (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, key)
);

-- OTP codes table for temporary OTP storage
CREATE TABLE IF NOT EXISTS otp_codes (
    phone VARCHAR(20) PRIMARY KEY,
    otp VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin users
INSERT INTO admin_users (email, password, name, role) VALUES
('superadmin@localhub.com', 'password', 'Super Admin', 'superadmin'),
('admin@localhub.com', 'password', 'Admin User', 'admin'),
('viewer@localhub.com', 'password', 'Viewer User', 'viewer')
ON CONFLICT (email) DO NOTHING;

-- Insert sample users
INSERT INTO users (email, name, phone, district, user_type, is_active, is_verified) VALUES
('rajesh.kumar@gmail.com', 'Rajesh Kumar', '+91 98765 43210', 'Chennai', 'business', true, true),
('priya.s@yahoo.com', 'Priya Selvam', '+91 87654 32109', 'Coimbatore', 'business', true, true),
('anitha.devi@gmail.com', 'Anitha Devi', '+91 76543 21098', 'Salem', 'individual', true, false),
('kumar.krishnan@yahoo.com', 'Kumar Krishnan', '+91 65432 10987', 'Tiruchirappalli', 'business', false, false)
ON CONFLICT (email) DO NOTHING;

-- Insert sample businesses
INSERT INTO businesses (name, category, description, phone, address, status, is_verified, user_id) VALUES
('Kumar Electronics', 'Electronics', 'Latest electronics and gadgets', '+91 98765 43210', 'T. Nagar, Chennai', 'active', true, 1),
('Priya Textiles', 'Textiles', 'Traditional and modern textiles', '+91 87654 32109', 'RS Puram, Coimbatore', 'active', true, 2),
('Tech Solutions', 'IT Services', 'Computer repair and IT support', '+91 65432 10987', 'Anna Salai, Tiruchirappalli', 'pending', false, 4);

-- Insert sample posts
INSERT INTO posts (title, content, category, hashtags, status, user_id, business_id) VALUES
('New Electronics Store Opening', 'Grand opening of Kumar Electronics with 20% discount on all items', 'Electronics', '["electronics", "discount", "opening"]', 'published', 1, 1),
('Traditional Sarees Collection', 'Beautiful collection of traditional Tamil sarees now available', 'Textiles', '["textiles", "sarees", "traditional"]', 'published', 2, 2),
('IT Support Services', 'Professional computer repair and IT support services available', 'IT Services', '["it", "support", "computer"]', 'pending', 4, 3);

-- Insert districts
INSERT INTO districts (name, code, headquarters, population, area) VALUES 
('Chennai', 'CHN', 'Chennai', '7.09M', '426 km²'),
('Coimbatore', 'CBE', 'Coimbatore', '3.46M', '7469 km²'),
('Madurai', 'MDU', 'Madurai', '3.04M', '3741 km²'),
('Salem', 'SLM', 'Salem', '3.48M', '5245 km²'),
('Tiruchirappalli', 'TRY', 'Tiruchirappalli', '2.72M', '4404 km²'),
('Vellore', 'VLR', 'Vellore', '3.93M', '6077 km²'),
('Erode', 'ERD', 'Erode', '2.25M', '5692 km²'),
('Thanjavur', 'TJV', 'Thanjavur', '2.41M', '3396 km²'),
('Dindigul', 'DGL', 'Dindigul', '2.16M', '6266 km²'),
('Cuddalore', 'CDL', 'Cuddalore', '2.61M', '3678 km²')
ON CONFLICT (code) DO NOTHING;

-- Insert default hashtags
INSERT INTO hashtags (name, color) VALUES 
('business', 'blue'),
('food', 'green'),
('shopping', 'purple'),
('services', 'orange'),
('events', 'red'),
('electronics', 'blue'),
('textiles', 'green'),
('discount', 'yellow')
ON CONFLICT (name) DO NOTHING;

-- Insert default menus
INSERT INTO menus (name, description, icon, labels, time_filter, is_active) VALUES 
('Jobs', 'Job opportunities and career posts', '💼', '["Career", "Vacancy", "Full-time Job", "Part-time Job", "Internship"]', '3months', true),
('Offers', 'Deals and promotional offers', '🏷️', '["Discounts", "Coupons", "Sale", "Special Offer"]', '1month', true),
('Events', 'Community and business events', '🎉', '["Workshop", "Seminar", "Conference", "Networking"]', '6months', true),
('Services', 'Professional services', '🔧', '["Repair", "Maintenance", "Consultation"]', 'all', true);

-- Insert default settings
INSERT INTO settings (category, key, value, type, description) VALUES 
('general', 'siteName', 'LocalHub Admin', 'string', 'Site name'),
('general', 'siteDescription', 'District-wise business directory and social platform for Tamil Nadu', 'string', 'Site description'),
('general', 'contactEmail', 'admin@localhub.com', 'string', 'Contact email'),
('general', 'supportPhone', '+91 98765 43210', 'string', 'Support phone'),
('general', 'timezone', 'Asia/Kolkata', 'string', 'Default timezone'),
('platform', 'userRegistration', 'true', 'boolean', 'Allow user registration'),
('platform', 'businessRegistration', 'true', 'boolean', 'Allow business registration'),
('platform', 'postModeration', 'true', 'boolean', 'Enable post moderation'),
('platform', 'autoApproveBusinesses', 'false', 'boolean', 'Auto approve businesses'),
('security', 'sessionTimeout', '30', 'number', 'Session timeout in minutes'),
('security', 'passwordMinLength', '8', 'number', 'Minimum password length'),
('security', 'requireEmailVerification', 'true', 'boolean', 'Require email verification'),
('content', 'maxPostLength', '500', 'number', 'Maximum post length'),
('content', 'allowImages', 'true', 'boolean', 'Allow image uploads'),
('content', 'maxImageSize', '5', 'number', 'Maximum image size in MB')
ON CONFLICT (category, key) DO NOTHING;