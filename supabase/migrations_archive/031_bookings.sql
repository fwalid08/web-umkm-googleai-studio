-- 031_bookings.sql
-- Tabel booking terjadwal dari section `booking` (terpisah dari contact).
-- Submit publik via service-role (pola /api/orders); RLS owner-only defense-in-depth.

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  notes VARCHAR(1000) DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'baru'
    CHECK (status IN ('baru', 'dikonfirmasi', 'selesai', 'batal')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_website_id ON bookings(website_id);
CREATE INDEX IF NOT EXISTS idx_bookings_website_date ON bookings(website_id, booking_date);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own bookings" ON bookings;
CREATE POLICY "Owners can view own bookings" ON bookings
  FOR SELECT USING (
    website_id IN (SELECT id FROM websites WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Owners can update own bookings" ON bookings;
CREATE POLICY "Owners can update own bookings" ON bookings
  FOR UPDATE USING (
    website_id IN (SELECT id FROM websites WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Owners can delete own bookings" ON bookings;
CREATE POLICY "Owners can delete own bookings" ON bookings
  FOR DELETE USING (
    website_id IN (SELECT id FROM websites WHERE user_id = auth.uid())
  );

-- Trigger updated_at (pola 004/022: guard idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bookings_updated_at') THEN
    CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
