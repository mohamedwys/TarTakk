-- ============================================================
-- 002_rls.sql — Row Level Security policies
-- ============================================================

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites     ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- regions and categories are public reference data; no RLS required.

-- ----- PROFILES -----
DROP POLICY IF EXISTS "profiles public read"  ON profiles;
DROP POLICY IF EXISTS "profiles own update"   ON profiles;
DROP POLICY IF EXISTS "profiles own insert"   ON profiles;

CREATE POLICY "profiles public read"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "profiles own update"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles own insert"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ----- PRODUCTS -----
DROP POLICY IF EXISTS "products public read"      ON products;
DROP POLICY IF EXISTS "sellers manage products"   ON products;

CREATE POLICY "products public read"
  ON products FOR SELECT USING (is_active = true);

CREATE POLICY "sellers manage products"
  ON products FOR ALL USING (auth.uid() = seller_id);

-- ----- FAVORITES -----
DROP POLICY IF EXISTS "favorites own" ON favorites;

CREATE POLICY "favorites own"
  ON favorites FOR ALL USING (auth.uid() = user_id);

-- ----- CONVERSATIONS -----
DROP POLICY IF EXISTS "conversations participants read"   ON conversations;
DROP POLICY IF EXISTS "conversations buyer create"        ON conversations;
DROP POLICY IF EXISTS "conversations participants update" ON conversations;

CREATE POLICY "conversations participants read"
  ON conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "conversations buyer create"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "conversations participants update"
  ON conversations FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ----- MESSAGES -----
DROP POLICY IF EXISTS "messages participants read" ON messages;
DROP POLICY IF EXISTS "messages participants send" ON messages;

CREATE POLICY "messages participants read"
  ON messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

CREATE POLICY "messages participants send"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- ----- REVIEWS -----
DROP POLICY IF EXISTS "reviews public read"           ON reviews;
DROP POLICY IF EXISTS "reviews authenticated create"  ON reviews;
DROP POLICY IF EXISTS "reviews own delete"            ON reviews;

CREATE POLICY "reviews public read"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "reviews authenticated create"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "reviews own delete"
  ON reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- ----- NOTIFICATIONS -----
DROP POLICY IF EXISTS "notifications own" ON notifications;

CREATE POLICY "notifications own"
  ON notifications FOR ALL USING (auth.uid() = user_id);

-- Enable realtime for messages and conversations
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
