-- ============================================================
-- 001_schema.sql — Tartakk database schema
-- Morocco-only marketplace · MAD currency · FR primary, AR secondary
-- ============================================================

-- REGIONS (12 régions du Maroc)
CREATE TABLE IF NOT EXISTS regions (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_fr  TEXT NOT NULL,
  name_ar  TEXT NOT NULL
);

INSERT INTO regions (id, name_fr, name_ar) VALUES
  (gen_random_uuid(), 'Casablanca-Settat',           'الدار البيضاء-سطات'),
  (gen_random_uuid(), 'Rabat-Salé-Kénitra',          'الرباط-سلا-القنيطرة'),
  (gen_random_uuid(), 'Marrakech-Safi',              'مراكش-آسفي'),
  (gen_random_uuid(), 'Fès-Meknès',                  'فاس-مكناس'),
  (gen_random_uuid(), 'Tanger-Tétouan-Al Hoceïma',   'طنجة-تطوان-الحسيمة'),
  (gen_random_uuid(), 'Souss-Massa',                 'سوس-ماسة'),
  (gen_random_uuid(), 'Béni Mellal-Khénifra',        'بني ملال-خنيفرة'),
  (gen_random_uuid(), 'Oriental',                    'الشرق'),
  (gen_random_uuid(), 'Drâa-Tafilalet',              'درعة-تافيلالت'),
  (gen_random_uuid(), 'Laâyoune-Sakia El Hamra',     'العيون-الساقية الحمراء'),
  (gen_random_uuid(), 'Guelmim-Oued Noun',           'كلميم-واد نون'),
  (gen_random_uuid(), 'Dakhla-Oued Ed-Dahab',        'الداخلة-وادي الذهب');

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT,
  email         TEXT UNIQUE,
  phone_number  TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  region_id     UUID REFERENCES regions(id),
  city          TEXT,
  role          TEXT DEFAULT 'buyer'
                CHECK (role IN ('buyer','seller','both','admin')),
  account_type  TEXT DEFAULT 'C2C'
                CHECK (account_type IN ('B2B','B2C','C2C')),
  company_name  TEXT,
  whatsapp      TEXT,
  is_verified   BOOLEAN DEFAULT false,
  is_banned     BOOLEAN DEFAULT false,
  rating        NUMERIC DEFAULT 0,
  review_count  INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_fr     TEXT NOT NULL,
  name_ar     TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  icon        TEXT,
  parent_id   UUID REFERENCES categories(id),
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true
);

INSERT INTO categories (id, name_fr, name_ar, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Immobilier',         'عقارات',              'immobilier',  '🏠',  1),
  (gen_random_uuid(), 'Véhicules',          'سيارات',              'vehicules',   '🚗',  2),
  (gen_random_uuid(), 'Électronique',       'إلكترونيات',          'electronique','📱',  3),
  (gen_random_uuid(), 'Mode & Vêtements',   'الموضة والملابس',     'mode',        '👗',  4),
  (gen_random_uuid(), 'Maison & Jardin',    'المنزل والحديقة',     'maison',      '🛋️', 5),
  (gen_random_uuid(), 'Emploi & Services',  'الخدمات والتوظيف',    'services',    '💼',  6),
  (gen_random_uuid(), 'Agriculture',        'فلاحة',               'agriculture', '🌾',  7),
  (gen_random_uuid(), 'Animaux',            'حيوانات',             'animaux',     '🐄',  8),
  (gen_random_uuid(), 'Loisirs & Sport',    'ترفيه ورياضة',        'loisirs',     '⚽',  9),
  (gen_random_uuid(), 'Autres',             'أخرى',                'autres',      '📦', 10);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES categories(id),
  region_id       UUID REFERENCES regions(id),
  city            TEXT,
  title           TEXT NOT NULL,
  title_ar        TEXT,
  description     TEXT,
  description_ar  TEXT,
  price           NUMERIC NOT NULL,
  currency        TEXT DEFAULT 'MAD',
  is_negotiable   BOOLEAN DEFAULT false,
  condition       TEXT CHECK (condition IN
                  ('neuf','très_bon','bon','acceptable')),
  listing_type    TEXT DEFAULT 'C2C'
                  CHECK (listing_type IN ('B2B','B2C','C2C')),
  min_order_qty   INT DEFAULT 1,
  stock_qty       INT DEFAULT 1,
  images          TEXT[],
  thumbnail_url   TEXT,
  is_active       BOOLEAN DEFAULT true,
  is_featured     BOOLEAN DEFAULT false,
  is_urgent       BOOLEAN DEFAULT false,
  view_count      INT DEFAULT 0,
  like_count      INT DEFAULT 0,
  expires_at      TIMESTAMPTZ DEFAULT (now() + interval '60 days'),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_seller_idx     ON products(seller_id);
CREATE INDEX IF NOT EXISTS products_category_idx   ON products(category_id);
CREATE INDEX IF NOT EXISTS products_region_idx     ON products(region_id);
CREATE INDEX IF NOT EXISTS products_active_idx     ON products(is_active, expires_at DESC);
CREATE INDEX IF NOT EXISTS products_created_idx    ON products(created_at DESC);

-- FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_idx    ON favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_product_idx ON favorites(product_id);

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  buyer_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message    TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  buyer_unread    INT DEFAULT 0,
  seller_unread   INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (buyer_id, seller_id, product_id)
);

CREATE INDEX IF NOT EXISTS conversations_buyer_idx  ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS conversations_seller_idx ON conversations(seller_id);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id, created_at);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  rating       INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (reviewer_id, seller_id, product_id)
);

CREATE INDEX IF NOT EXISTS reviews_seller_idx  ON reviews(seller_id);
CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews(product_id);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT,
  is_read     BOOLEAN DEFAULT false,
  action_id   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, created_at DESC);
