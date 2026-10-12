-- Example seed data for local development only.

INSERT INTO users (full_name, email, password_hash, role, status, phone, region)
VALUES
  ('Admin Platform', 'admin@agro.local', '$2a$10$yQsQn2tmobBJLxvCx17QKeZw3Qmk1suqBReZOYuonxAyHESH7FTli', 'admin', 'approved', '+37360000000', 'Chișinău'),
  ('Marcel Ferma Verde', 'seller@agro.local', '$2a$10$yQsQn2tmobBJLxvCx17QKeZw3Qmk1suqBReZOYuonxAyHESH7FTli', 'seller', 'approved', '+37369111111', 'Criuleni'),
  ('Distribuitor 24', 'distributor@agro.local', '$2a$10$yQsQn2tmobBJLxvCx17QKeZw3Qmk1suqBReZOYuonxAyHESH7FTli', 'distributor', 'approved', '+37379222222', 'Chișinău');

INSERT INTO product_listings (seller_id, product_name, variety, quantity_kg, price_per_kg, region, harvest_date, delivery_terms, status)
VALUES
  (
    (SELECT id FROM users WHERE email = 'seller@agro.local'),
    'Roșii',
    'Cherry',
    1200,
    3.5,
    'Criuleni',
    CURRENT_DATE - INTERVAL '2 days',
    'Livrare în 24h, ridicare disponibilă',
    'active'
  );
