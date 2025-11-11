-- Universal Products Cache Table
CREATE TABLE universal_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  image_url TEXT,
  ingredients TEXT,
  nutrition_data JSONB,
  source TEXT NOT NULL, -- 'openfoodfacts', 'upcitemdb', 'manual'
  source_url TEXT,
  raw_data JSONB,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cache_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
  scan_count INTEGER DEFAULT 0,
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_universal_products_barcode ON universal_products(barcode);
CREATE INDEX idx_universal_products_cached_at ON universal_products(cached_at);
CREATE INDEX idx_universal_products_expires ON universal_products(cache_expires_at);

-- RLS Policies
ALTER TABLE universal_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active users can view cached products"
  ON universal_products FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM app_users 
      WHERE app_users.id = auth.uid() 
      AND app_users.is_active = true
    )
  );

CREATE POLICY "Active users can insert cached products"
  ON universal_products FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM app_users 
      WHERE app_users.id = auth.uid() 
      AND app_users.is_active = true
    )
  );

CREATE POLICY "Active users can update cached products"
  ON universal_products FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM app_users 
      WHERE app_users.id = auth.uid() 
      AND app_users.is_active = true
    )
  );

-- Function to update scan count
CREATE OR REPLACE FUNCTION increment_product_scan_count(product_barcode TEXT)
RETURNS void AS $$
BEGIN
  UPDATE universal_products
  SET scan_count = scan_count + 1,
      last_scanned_at = NOW()
  WHERE barcode = product_barcode;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;