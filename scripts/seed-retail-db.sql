-- Connect to retail_db and create tables
-- Removed \connect metacommand - database is specified at psql invocation

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT,
  category TEXT,
  price NUMERIC
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id),
  order_date TIMESTAMP,
  total NUMERIC
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  product_id INT REFERENCES products(id),
  qty INT,
  price NUMERIC
);

CREATE INDEX idx_orders_customer ON orders(customer_id);

-- Seed customers
INSERT INTO customers (name, email, created_at) VALUES
('John Doe', 'john@example.com', NOW() - INTERVAL '180 days'),
('Jane Smith', 'jane@example.com', NOW() - INTERVAL '150 days'),
('Bob Johnson', 'bob@example.com', NOW() - INTERVAL '120 days'),
('Alice Williams', 'alice@example.com', NOW() - INTERVAL '90 days'),
('Charlie Brown', 'charlie@example.com', NOW() - INTERVAL '60 days'),
('Diana Davis', 'diana@example.com', NOW() - INTERVAL '30 days'),
('Eve Wilson', 'eve@example.com', NOW() - INTERVAL '15 days'),
('Frank Miller', 'frank@example.com', NOW() - INTERVAL '7 days'),
('Grace Lee', 'grace@example.com', NOW() - INTERVAL '3 days'),
('Henry Martinez', 'henry@example.com', NOW() - INTERVAL '1 day');

-- Seed products
INSERT INTO products (name, category, price) VALUES
('Laptop', 'Electronics', 999.99),
('Mouse', 'Electronics', 29.99),
('Keyboard', 'Electronics', 79.99),
('Monitor', 'Electronics', 299.99),
('USB Cable', 'Electronics', 9.99),
('Chair', 'Furniture', 199.99),
('Desk', 'Furniture', 399.99),
('Lamp', 'Furniture', 49.99),
('Book', 'Books', 19.99),
('Notebook', 'Stationery', 5.99);

-- Seed orders and order items
DO $$
DECLARE
  i INT;
  customer_id INT;
  product_id INT;
  order_id INT;
  item_count INT;
BEGIN
  FOR i IN 1..50 LOOP
    customer_id := ((i-1) % 10) + 1;
    INSERT INTO orders (customer_id, order_date, total)
    VALUES (customer_id, NOW() - INTERVAL '1 day' * ((i-1) % 180), FLOOR(RANDOM() * 2000 + 100)::NUMERIC)
    RETURNING id INTO order_id;
    
    -- Add 1-5 items per order
    item_count := FLOOR(RANDOM() * 5)::INT + 1;
    FOR j IN 1..item_count LOOP
      product_id := FLOOR(RANDOM() * 10)::INT + 1;
      INSERT INTO order_items (order_id, product_id, qty, price)
      VALUES (order_id, product_id, FLOOR(RANDOM() * 10)::INT + 1, (SELECT price FROM products WHERE id = product_id));
    END LOOP;
  END LOOP;
END $$;
