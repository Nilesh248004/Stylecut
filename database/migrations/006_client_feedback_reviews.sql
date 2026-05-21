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
