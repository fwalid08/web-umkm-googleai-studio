-- 018_storage_bucket.sql
-- Sprint 1 (F2-4): product-images bucket + storage.objects policies (runnable).
-- Private bucket (public=false); reads via signed URLs minted in buildSite.
-- Idempotent: safe to re-run via Dashboard > SQL Editor.

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Product images: service-role full access') THEN
    CREATE POLICY "Product images: service-role full access"
    ON storage.objects FOR ALL TO service_role
    USING (bucket_id = 'product-images')
    WITH CHECK (bucket_id = 'product-images');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Product images: authenticated read own website folder') THEN
    CREATE POLICY "Product images: authenticated read own website folder"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'product-images');
  END IF;
END $$;
