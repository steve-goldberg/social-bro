-- Social Bro initial schema for TrailBase
-- TrailBase manages _user table internally. We reference it via foreign keys.

-- API Keys (encrypted, per user per service)
CREATE TABLE api_keys (
  id            BLOB NOT NULL PRIMARY KEY DEFAULT (uuid_v7()) CHECK(is_uuid_v7(id)),
  user_id       BLOB NOT NULL REFERENCES _user(id) ON DELETE CASCADE,
  service       TEXT NOT NULL,  -- 'youtube', 'rapidapi', 'openrouter'
  key           TEXT NOT NULL,  -- encrypted API key
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  UNIQUE(user_id, service)
) STRICT;

CREATE INDEX idx_api_keys_user ON api_keys(user_id);

-- YouTube search configuration per user
CREATE TABLE youtube_configs (
  id              BLOB NOT NULL PRIMARY KEY DEFAULT (uuid_v7()) CHECK(is_uuid_v7(id)),
  user_id         BLOB NOT NULL UNIQUE REFERENCES _user(id) ON DELETE CASCADE,
  max_results     INTEGER NOT NULL DEFAULT 25,
  date_range      TEXT NOT NULL DEFAULT 'any',
  region          TEXT NOT NULL DEFAULT 'US',
  video_duration  TEXT NOT NULL DEFAULT 'any',
  sort_order      TEXT NOT NULL DEFAULT 'relevance',
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

-- User settings (selected LLM model, etc.)
CREATE TABLE user_settings (
  id                BLOB NOT NULL PRIMARY KEY DEFAULT (uuid_v7()) CHECK(is_uuid_v7(id)),
  user_id           BLOB NOT NULL UNIQUE REFERENCES _user(id) ON DELETE CASCADE,
  selected_model_id TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

-- Search history
CREATE TABLE searches (
  id          BLOB NOT NULL PRIMARY KEY DEFAULT (uuid_v7()) CHECK(is_uuid_v7(id)),
  user_id     BLOB NOT NULL REFERENCES _user(id) ON DELETE CASCADE,
  query       TEXT NOT NULL,
  platform    TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE INDEX idx_searches_user ON searches(user_id);
CREATE INDEX idx_searches_platform ON searches(platform);
CREATE INDEX idx_searches_created ON searches(created_at);

-- Search results (cached from API calls)
CREATE TABLE search_results (
  id            BLOB NOT NULL PRIMARY KEY DEFAULT (uuid_v7()) CHECK(is_uuid_v7(id)),
  search_id     BLOB NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  external_id   TEXT NOT NULL,
  platform      TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok')),
  title         TEXT NOT NULL,
  description   TEXT,
  thumbnail     TEXT,
  url           TEXT NOT NULL,
  creator_id    TEXT,
  creator_name  TEXT,
  view_count    INTEGER,
  like_count    INTEGER,
  comment_count INTEGER,
  published_at  TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  UNIQUE(search_id, external_id)
) STRICT;

CREATE INDEX idx_search_results_search ON search_results(search_id);
CREATE INDEX idx_search_results_external ON search_results(external_id);

-- Saved searches (bookmarked with full data)
CREATE TABLE saved_searches (
  id          BLOB NOT NULL PRIMARY KEY DEFAULT (uuid_v7()) CHECK(is_uuid_v7(id)),
  user_id     BLOB NOT NULL REFERENCES _user(id) ON DELETE CASCADE,
  query       TEXT NOT NULL,
  platform    TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  UNIQUE(user_id, query, platform)
) STRICT;

CREATE INDEX idx_saved_searches_user ON saved_searches(user_id);

-- Saved search results
CREATE TABLE saved_search_results (
  id                BLOB NOT NULL PRIMARY KEY DEFAULT (uuid_v7()) CHECK(is_uuid_v7(id)),
  saved_search_id   BLOB NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  external_id       TEXT NOT NULL,
  title             TEXT NOT NULL,
  creator_name      TEXT NOT NULL,
  thumbnail         TEXT,
  url               TEXT NOT NULL,
  view_count        INTEGER NOT NULL DEFAULT 0,
  like_count        INTEGER NOT NULL DEFAULT 0,
  comment_count     INTEGER NOT NULL DEFAULT 0
) STRICT;

CREATE INDEX idx_saved_search_results_search ON saved_search_results(saved_search_id);

-- Saved items (individual videos/posts)
CREATE TABLE saved_items (
  id            BLOB NOT NULL PRIMARY KEY DEFAULT (uuid_v7()) CHECK(is_uuid_v7(id)),
  user_id       BLOB NOT NULL REFERENCES _user(id) ON DELETE CASCADE,
  external_id   TEXT NOT NULL,
  platform      TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok')),
  title         TEXT NOT NULL,
  description   TEXT,
  thumbnail     TEXT,
  url           TEXT NOT NULL,
  creator_id    TEXT,
  creator_name  TEXT,
  view_count    INTEGER,
  like_count    INTEGER,
  comment_count INTEGER,
  published_at  TEXT,
  saved_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  UNIQUE(user_id, external_id, platform)
) STRICT;

CREATE INDEX idx_saved_items_user ON saved_items(user_id);
CREATE INDEX idx_saved_items_platform ON saved_items(platform);

-- Repurpose videos (saved for transcript extraction + repurposing)
CREATE TABLE repurpose_videos (
  id            BLOB NOT NULL PRIMARY KEY DEFAULT (uuid_v7()) CHECK(is_uuid_v7(id)),
  user_id       BLOB NOT NULL REFERENCES _user(id) ON DELETE CASCADE,
  external_id   TEXT NOT NULL,
  platform      TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok')),
  title         TEXT NOT NULL,
  description   TEXT,
  thumbnail     TEXT,
  url           TEXT NOT NULL,
  creator_id    TEXT,
  creator_name  TEXT,
  view_count    INTEGER,
  like_count    INTEGER,
  comment_count INTEGER,
  published_at  TEXT,
  saved_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  UNIQUE(user_id, external_id, platform)
) STRICT;

CREATE INDEX idx_repurpose_videos_user ON repurpose_videos(user_id);

-- LLM Models (synced from OpenRouter)
CREATE TABLE llm_models (
  id                BLOB NOT NULL PRIMARY KEY DEFAULT (uuid_v7()) CHECK(is_uuid_v7(id)),
  model_id          TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  provider          TEXT NOT NULL,
  prompt_price      REAL NOT NULL,
  completion_price  REAL NOT NULL,
  context_length    INTEGER,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE INDEX idx_llm_models_provider ON llm_models(provider);

-- Scripts (transcripts + AI-repurposed content)
CREATE TABLE scripts (
  id                  BLOB NOT NULL PRIMARY KEY DEFAULT (uuid_v7()) CHECK(is_uuid_v7(id)),
  user_id             BLOB NOT NULL REFERENCES _user(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  caption             TEXT,
  script              TEXT NOT NULL,
  repurposed_script   TEXT,
  hooks               TEXT,  -- JSON array of 3 generated hooks
  notes               TEXT,
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  source_url          TEXT,
  repurpose_video_id  BLOB REFERENCES repurpose_videos(id) ON DELETE SET NULL,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE INDEX idx_scripts_user ON scripts(user_id);
CREATE INDEX idx_scripts_status ON scripts(status);
CREATE INDEX idx_scripts_created ON scripts(created_at);
CREATE INDEX idx_scripts_repurpose_video ON scripts(repurpose_video_id);
