DROP TABLE IF EXISTS bridal_requests;
DROP TABLE IF EXISTS product_orders;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS services;

CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  min_price NUMERIC(10, 2) NOT NULL,
  max_price NUMERIC(10, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  customer_email VARCHAR(160) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  notes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  customer_email VARCHAR(160),
  customer_phone VARCHAR(30) NOT NULL,
  delivery_address TEXT NOT NULL,
  order_notes TEXT,
  items JSONB NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  estimated_delivery_date DATE,
  delivery_estimate_reason TEXT,
  accepted_at TIMESTAMP,
  delivered_at TIMESTAMP,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bridal_requests (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  event_date DATE,
  location TEXT,
  package_name VARCHAR(160) NOT NULL,
  add_ons JSONB NOT NULL DEFAULT '[]'::jsonb,
  include_bridal_kit BOOLEAN NOT NULL DEFAULT true,
  home_service BOOLEAN NOT NULL DEFAULT false,
  home_service_days INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  phone VARCHAR(30),
  password_hash TEXT,
  password_salt TEXT,
  google_sub VARCHAR(160) UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS barber_users (
  id SERIAL PRIMARY KEY,
  staff_id VARCHAR(80) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id SERIAL PRIMARY KEY,
  user_type VARCHAR(20) NOT NULL,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_reviews (
  id SERIAL PRIMARY KEY,
  client_user_id INTEGER REFERENCES client_users(id) ON DELETE SET NULL,
  client_name VARCHAR(120) NOT NULL,
  client_email VARCHAR(160),
  client_phone VARCHAR(30),
  feedback_text TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT client_reviews_has_content CHECK (feedback_text IS NOT NULL OR rating IS NOT NULL)
);
