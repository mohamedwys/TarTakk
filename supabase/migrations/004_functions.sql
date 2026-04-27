-- ============================================================
-- 004_functions.sql — Search and helper functions
-- ============================================================

CREATE OR REPLACE FUNCTION search_products(
  search_term         TEXT    DEFAULT NULL,
  region_filter       UUID    DEFAULT NULL,
  category_filter     UUID    DEFAULT NULL,
  listing_type_filter TEXT    DEFAULT NULL,
  min_price           NUMERIC DEFAULT NULL,
  max_price           NUMERIC DEFAULT NULL,
  condition_filter    TEXT    DEFAULT NULL,
  page_num            INT     DEFAULT 0,
  page_size           INT     DEFAULT 20
)
RETURNS SETOF products
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM products
  WHERE is_active = true
    AND expires_at > now()
    AND (search_term IS NULL
         OR title          ILIKE '%' || search_term || '%'
         OR title_ar       ILIKE '%' || search_term || '%'
         OR description    ILIKE '%' || search_term || '%')
    AND (region_filter       IS NULL OR region_id    = region_filter)
    AND (category_filter     IS NULL OR category_id  = category_filter)
    AND (listing_type_filter IS NULL OR listing_type = listing_type_filter)
    AND (min_price           IS NULL OR price >= min_price)
    AND (max_price           IS NULL OR price <= max_price)
    AND (condition_filter    IS NULL OR condition = condition_filter)
  ORDER BY is_featured DESC, is_urgent DESC, created_at DESC
  LIMIT page_size
  OFFSET (page_num * page_size);
END;
$$;

-- Increment view counter for a product (used by detail screen)
CREATE OR REPLACE FUNCTION increment_product_views(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products
  SET view_count = view_count + 1
  WHERE id = p_id;
END;
$$;

-- Recompute a seller's aggregate rating after review changes
CREATE OR REPLACE FUNCTION recompute_seller_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_seller UUID;
BEGIN
  target_seller := COALESCE(NEW.seller_id, OLD.seller_id);

  UPDATE profiles p
  SET rating       = COALESCE((SELECT AVG(rating)::NUMERIC(3,2)
                                FROM reviews
                                WHERE seller_id = target_seller), 0),
      review_count = COALESCE((SELECT COUNT(*)
                                FROM reviews
                                WHERE seller_id = target_seller), 0)
  WHERE p.id = target_seller;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS reviews_recompute_rating ON reviews;
CREATE TRIGGER reviews_recompute_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION recompute_seller_rating();

-- Update last_message / last_message_at / unread counters when a message arrives
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  conv RECORD;
BEGIN
  SELECT buyer_id, seller_id INTO conv
  FROM conversations
  WHERE id = NEW.conversation_id;

  UPDATE conversations
  SET last_message    = NEW.content,
      last_message_at = NEW.created_at,
      buyer_unread    = CASE WHEN NEW.sender_id = conv.buyer_id
                             THEN buyer_unread
                             ELSE buyer_unread + 1 END,
      seller_unread   = CASE WHEN NEW.sender_id = conv.seller_id
                             THEN seller_unread
                             ELSE seller_unread + 1 END
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_update_conversation ON messages;
CREATE TRIGGER messages_update_conversation
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- Auto-create profile row whenever an auth user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
