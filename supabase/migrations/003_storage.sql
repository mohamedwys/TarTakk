-- ============================================================
-- 003_storage.sql — Storage buckets and policies
-- ============================================================

INSERT INTO storage.buckets
  (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',  'avatars',  true,  5242880,
   ARRAY['image/jpeg','image/png','image/webp','image/heic']),
  ('products', 'products', true, 10485760,
   ARRAY['image/jpeg','image/png','image/webp','image/heic'])
ON CONFLICT (id) DO NOTHING;

-- ----- AVATARS bucket -----
DROP POLICY IF EXISTS "avatars public read"   ON storage.objects;
DROP POLICY IF EXISTS "avatars auth upload"   ON storage.objects;
DROP POLICY IF EXISTS "avatars owner update"  ON storage.objects;
DROP POLICY IF EXISTS "avatars owner delete"  ON storage.objects;

CREATE POLICY "avatars public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars auth upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());

CREATE POLICY "avatars owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());

-- ----- PRODUCTS bucket -----
DROP POLICY IF EXISTS "products public read"  ON storage.objects;
DROP POLICY IF EXISTS "products auth upload"  ON storage.objects;
DROP POLICY IF EXISTS "products owner update" ON storage.objects;
DROP POLICY IF EXISTS "products owner delete" ON storage.objects;

CREATE POLICY "products public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "products auth upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'products');

CREATE POLICY "products owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'products' AND owner = auth.uid());

CREATE POLICY "products owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'products' AND owner = auth.uid());
