-- PharmaLink Pro — PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users (customers + admins)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  company_name  VARCHAR(255),
  business_type VARCHAR(50),
  phone         VARCHAR(50),
  country       VARCHAR(100),
  city          VARCHAR(100),
  role          VARCHAR(20) NOT NULL DEFAULT 'customer',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  brand        VARCHAR(255),
  category     VARCHAR(50) NOT NULL,
  package_size VARCHAR(100),
  description  TEXT,
  image_url    VARCHAR(500),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  is_featured  BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(
  to_tsvector('english',
    name || ' ' || COALESCE(generic_name,'') || ' ' || COALESCE(brand,''))
);

-- RFQs
CREATE TABLE IF NOT EXISTS rfqs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number              VARCHAR(20) UNIQUE NOT NULL,
  customer_id             UUID REFERENCES users(id),
  guest_full_name         VARCHAR(255),
  guest_company           VARCHAR(255),
  guest_business_type     VARCHAR(50),
  guest_email             VARCHAR(255),
  guest_phone             VARCHAR(50),
  guest_country           VARCHAR(100),
  guest_city              VARCHAR(100),
  requested_delivery_date DATE,
  shipping_method         VARCHAR(50),
  message                 TEXT,
  status                  VARCHAR(30) NOT NULL DEFAULT 'NEW',
  internal_notes          TEXT,
  submitted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rfqs_status    ON rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_customer  ON rfqs(customer_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_submitted ON rfqs(submitted_at DESC);

-- RFQ Items
CREATE TABLE IF NOT EXISTS rfq_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id       UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  brand        VARCHAR(255),
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  unit         VARCHAR(50) NOT NULL DEFAULT 'units',
  notes        TEXT
);

-- RFQ Attachments
CREATE TABLE IF NOT EXISTS rfq_attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id      UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  file_name   VARCHAR(255) NOT NULL,
  file_url    VARCHAR(500) NOT NULL,
  file_size   INTEGER NOT NULL,
  mime_type   VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CMS Content Blocks
CREATE TABLE IF NOT EXISTS content_blocks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_key  VARCHAR(100) UNIQUE NOT NULL,
  content    JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  company_name  VARCHAR(255),
  comment       TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0
);

-- Site Content — full CMS sections managed by admin
CREATE TABLE IF NOT EXISTS site_content (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section    VARCHAR(100) UNIQUE NOT NULL,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
