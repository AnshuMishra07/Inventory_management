-- Update product prices with sample values
-- Run this script to add cost prices to your products

-- Update Paper (PROD001)
UPDATE products SET cost_price = 3.00, selling_price = 5.00 WHERE sku = 'PROD001';

-- Update Pencil (PROD002)
UPDATE products SET cost_price = 2.00, selling_price = 4.00 WHERE sku = 'PROD002';

-- Update Stan-01 (PROD003)
UPDATE products SET cost_price = 10.00, selling_price = 15.00 WHERE sku = 'PROD003';

-- Update Stan-03 (PROD005)
UPDATE products SET cost_price = 8.00, selling_price = 12.00 WHERE sku = 'PROD005';

-- Update Stan-04 (PROD006)
UPDATE products SET cost_price = 7.00, selling_price = 11.00 WHERE sku = 'PROD006';

-- Verify the updates
SELECT name, sku, cost_price, selling_price FROM products;
