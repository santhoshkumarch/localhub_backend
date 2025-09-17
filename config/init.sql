-- Create tables for LocalHub Admin

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
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    district VARCHAR(100),
    business_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    joined_date DATE DEFAULT CURRENT_DATE,
    last_active VARCHAR(50),
    avatar VARCHAR(10),
    user_type VARCHAR(50) DEFAULT 'business'
);

-- Businesses table
CREATE TABLE IF NOT EXISTS businesses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    owner VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    district VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    created_at DATE DEFAULT CURRENT_DATE
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    author VARCHAR(255),
    district VARCHAR(100),
    hashtags TEXT[],
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'published',
    created_at DATE DEFAULT CURRENT_DATE
);

-- Districts table
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    user_count INTEGER DEFAULT 0,
    business_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Hashtags table
CREATE TABLE IF NOT EXISTS hashtags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(50),
    usage_count INTEGER DEFAULT 0,
    created_at DATE DEFAULT CURRENT_DATE
);

-- Insert default admin users
INSERT INTO admin_users (email, password, name, role) VALUES
('superadmin@localhub.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super Admin', 'superadmin'),
('admin@localhub.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin'),
('viewer@localhub.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Viewer User', 'viewer')
ON CONFLICT (email) DO NOTHING;

-- Insert sample data
INSERT INTO users (email, name, phone, district, business_count, posts_count, is_active, is_verified, joined_date, last_active, avatar, user_type) VALUES
('rajesh.kumar@gmail.com', 'Rajesh Kumar', '+91 98765 43210', 'Chennai', 2, 15, true, true, '2024-01-15', '2 hours ago', 'RK', 'business'),
('priya.s@yahoo.com', 'Priya Selvam', '+91 87654 32109', 'Coimbatore', 1, 8, true, true, '2024-01-12', '1 day ago', 'PS', 'business')
ON CONFLICT (email) DO NOTHING;

INSERT INTO businesses (name, category, owner, phone, address, district, status, rating, review_count, created_at) VALUES
('Kumar Electronics', 'Electronics', 'Rajesh Kumar', '+91 98765 43210', 'T. Nagar, Chennai', 'Chennai', 'active', 4.5, 23, '2024-01-15'),
('Priya Textiles', 'Textiles', 'Priya Selvam', '+91 87654 32109', 'RS Puram, Coimbatore', 'Coimbatore', 'active', 4.7, 35, '2024-01-12');

INSERT INTO posts (title, content, author, district, hashtags, likes, comments, status, created_at) VALUES
('New Electronics Store Opening', 'Grand opening of Kumar Electronics with 20% discount', 'Rajesh Kumar', 'Chennai', ARRAY['electronics', 'discount'], 45, 12, 'published', '2024-01-15'),
('Traditional Sarees Collection', 'Beautiful collection of traditional Tamil sarees', 'Priya Selvam', 'Coimbatore', ARRAY['textiles', 'sarees'], 32, 8, 'published', '2024-01-14');

INSERT INTO districts (name, user_count, business_count, posts_count, is_active) VALUES
('Chennai', 1250, 340, 890, true),
('Coimbatore', 980, 280, 650, true),
('Madurai', 750, 210, 480, true),
('Salem', 620, 180, 390, true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO hashtags (name, color, usage_count, created_at) VALUES
('business', 'blue', 45, '2024-01-15'),
('food', 'green', 32, '2024-01-14'),
('shopping', 'purple', 28, '2024-01-13')
ON CONFLICT (name) DO NOTHING;