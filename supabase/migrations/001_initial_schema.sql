-- ═══════════════════════════════════════════════════════════
-- MRR STUDIO — Schéma Supabase complet
-- À exécuter dans Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── Table : oauth_states (anti-CSRF) ─────────────────────
CREATE TABLE IF NOT EXISTS oauth_states (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Supprime automatiquement les states de plus de 10 minutes
CREATE INDEX IF NOT EXISTS idx_oauth_states_created ON oauth_states(created_at);

-- ── Table : tiktok_accounts ──────────────────────────────
CREATE TABLE IF NOT EXISTS tiktok_accounts (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  open_id             TEXT NOT NULL UNIQUE,
  username            TEXT,
  display_name        TEXT,
  avatar_url          TEXT,
  follower_count      BIGINT DEFAULT 0,
  following_count     BIGINT DEFAULT 0,
  likes_count         BIGINT DEFAULT 0,
  video_count         INT DEFAULT 0,
  bio                 TEXT,
  is_verified         BOOLEAN DEFAULT FALSE,

  -- Tokens OAuth (sensibles — service role uniquement)
  access_token        TEXT NOT NULL,
  refresh_token       TEXT NOT NULL,
  token_expires_at    TIMESTAMPTZ NOT NULL,
  refresh_expires_at  TIMESTAMPTZ NOT NULL,
  scope               TEXT,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Table : tiktok_videos_cache ──────────────────────────
CREATE TABLE IF NOT EXISTS tiktok_videos_cache (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id            TEXT NOT NULL UNIQUE,
  open_id             TEXT NOT NULL REFERENCES tiktok_accounts(open_id) ON DELETE CASCADE,
  title               TEXT,
  description         TEXT,
  view_count          BIGINT DEFAULT 0,
  like_count          BIGINT DEFAULT 0,
  comment_count       BIGINT DEFAULT 0,
  share_count         BIGINT DEFAULT 0,
  duration            INT,
  cover_url           TEXT,
  share_url           TEXT,
  created_at_tiktok   TIMESTAMPTZ,
  cached_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_open_id ON tiktok_videos_cache(open_id);
CREATE INDEX IF NOT EXISTS idx_videos_created ON tiktok_videos_cache(created_at_tiktok DESC);

-- ── Table : tiktok_audits ────────────────────────────────
CREATE TABLE IF NOT EXISTS tiktok_audits (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  open_id       TEXT NOT NULL REFERENCES tiktok_accounts(open_id) ON DELETE CASCADE,
  username      TEXT,
  niche         TEXT,
  objectif      TEXT,
  audit_result  JSONB NOT NULL,
  tiktok_data   JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audits_open_id ON tiktok_audits(open_id);
CREATE INDEX IF NOT EXISTS idx_audits_created ON tiktok_audits(created_at DESC);

-- ── Table : generated_scripts ────────────────────────────
CREATE TABLE IF NOT EXISTS generated_scripts (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  open_id           TEXT REFERENCES tiktok_accounts(open_id) ON DELETE SET NULL,
  pattern_slug      TEXT NOT NULL,
  inputs            JSONB NOT NULL,
  script_content    JSONB NOT NULL,
  score_assigned    FLOAT,
  is_favorite       BOOLEAN DEFAULT FALSE,
  regenerated_count INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scripts_open_id ON generated_scripts(open_id);
CREATE INDEX IF NOT EXISTS idx_scripts_pattern ON generated_scripts(pattern_slug);
CREATE INDEX IF NOT EXISTS idx_scripts_created ON generated_scripts(created_at DESC);

-- ── RLS : désactivé (usage personnel phase 1) ────────────
-- À activer en phase 2 lors de la commercialisation
ALTER TABLE tiktok_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_videos_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_audits DISABLE ROW LEVEL SECURITY;
ALTER TABLE generated_scripts DISABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_states DISABLE ROW LEVEL SECURITY;
