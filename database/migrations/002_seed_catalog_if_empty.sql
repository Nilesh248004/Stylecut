INSERT INTO services (name, category, description, min_price, max_price, duration_minutes)
SELECT *
FROM (
  VALUES
    ('Classic Haircut', 'Hair', 'Personalized haircut with wash, styling, and finishing.', 299::numeric, 599::numeric, 45),
    ('Beard Trim and Shape', 'Grooming', 'Clean beard trim, neckline shaping, and detailing.', 149::numeric, 349::numeric, 25),
    ('Hair Spa', 'Hair Treatment', 'Deep conditioning treatment for dry or damaged hair.', 799::numeric, 1499::numeric, 60),
    ('Facial Cleanup', 'Skin Care', 'Refreshing facial cleanup for brighter, cleaner skin.', 499::numeric, 999::numeric, 45),
    ('Premium Facial', 'Skin Care', 'Advanced facial treatment based on skin type.', 1199::numeric, 2499::numeric, 75),
    ('Hair Color', 'Hair', 'Professional hair coloring with consultation.', 999::numeric, 3999::numeric, 120)
) AS seed(name, category, description, min_price, max_price, duration_minutes)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE services.name = seed.name
);

INSERT INTO products (name, category, description, price, image_url, stock_quantity)
SELECT *
FROM (
  VALUES
    ('Argan Hair Serum', 'Hair Care', 'Lightweight serum for shine and frizz control.', 499::numeric, 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=900&q=80', 18),
    ('Matte Styling Wax', 'Styling', 'Strong hold wax with a natural matte finish.', 349::numeric, 'https://images.unsplash.com/photo-1626784215021-2e39ccf971cd?auto=format&fit=crop&w=900&q=80', 25),
    ('Beard Oil', 'Beard Care', 'Nourishing beard oil for softness and healthy shine.', 399::numeric, 'https://images.unsplash.com/photo-1621607512022-6aecc4fed814?auto=format&fit=crop&w=900&q=80', 15),
    ('Charcoal Face Wash', 'Skin Care', 'Daily face wash for oil control and deep cleansing.', 299::numeric, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80', 30),
    ('Keratin Shampoo', 'Hair Care', 'Smoothing shampoo for stronger, softer hair.', 449::numeric, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=80', 22),
    ('Hydrating Face Cream', 'Skin Care', 'Moisturizing cream for a clean, fresh finish.', 549::numeric, 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=900&q=80', 12)
) AS seed(name, category, description, price, image_url, stock_quantity)
WHERE NOT EXISTS (
  SELECT 1 FROM products WHERE products.name = seed.name
);
