CREATE POLICY "Users can self-register" ON users
  FOR INSERT TO anon
  WITH CHECK (true);
