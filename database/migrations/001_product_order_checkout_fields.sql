ALTER TABLE product_orders
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(160),
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS order_notes TEXT;

UPDATE product_orders
SET delivery_address = 'Address not captured'
WHERE delivery_address IS NULL;

ALTER TABLE product_orders
  ALTER COLUMN delivery_address SET NOT NULL;
