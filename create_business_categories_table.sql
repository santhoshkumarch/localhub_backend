-- Create business categories table
CREATE TABLE IF NOT EXISTS business_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default categories
INSERT INTO business_categories (name) VALUES 
('Restaurant & Food'),
('Retail & Shopping'),
('Healthcare & Medical'),
('Education & Training'),
('Professional Services'),
('Beauty & Wellness'),
('Automotive'),
('Real Estate'),
('Technology & IT'),
('Entertainment & Events')
ON CONFLICT (name) DO NOTHING;