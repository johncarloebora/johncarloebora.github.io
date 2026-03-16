-- ============================================================
-- Carlo Portfolio Admin - D1 Database Schema
-- ============================================================

-- Auth: Admin users
CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    email      TEXT    NOT NULL,
    created_at TEXT    DEFAULT (datetime('now')),
    updated_at TEXT    DEFAULT (datetime('now'))
);

-- Auth: Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    token      TEXT    NOT NULL UNIQUE,
    expires_at TEXT    NOT NULL,
    used       INTEGER DEFAULT 0,
    created_at TEXT    DEFAULT (datetime('now'))
);

-- Auth: Login attempt tracking (rate limiting)
CREATE TABLE IF NOT EXISTS login_attempts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT    NOT NULL,
    attempted_at TEXT  DEFAULT (datetime('now'))
);

-- Global site settings (key-value)
CREATE TABLE IF NOT EXISTS site_settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Sections: defines which sections exist and their order
CREATE TABLE IF NOT EXISTS sections (
    id         TEXT PRIMARY KEY,
    title      TEXT    NOT NULL,
    nav_icon   TEXT    NOT NULL,
    nav_label  TEXT    NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    visible    INTEGER NOT NULL DEFAULT 1,
    type       TEXT    NOT NULL DEFAULT 'builtin',
    config     TEXT,
    created_at TEXT    DEFAULT (datetime('now')),
    updated_at TEXT    DEFAULT (datetime('now'))
);

-- About section cards
CREATE TABLE IF NOT EXISTS about_cards (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL,
    icon       TEXT    NOT NULL DEFAULT 'fas fa-info-circle',
    content    TEXT    NOT NULL,
    type       TEXT    NOT NULL DEFAULT 'text',
    expanded   INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Stats row (about section)
CREATE TABLE IF NOT EXISTS stats (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    target     TEXT    NOT NULL,
    suffix     TEXT    DEFAULT '',
    label      TEXT    NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Skill cards (top-level groups)
CREATE TABLE IF NOT EXISTS skill_cards (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL,
    icon       TEXT    NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    expanded   INTEGER NOT NULL DEFAULT 0
);

-- Skill categories (within a skill card)
CREATE TABLE IF NOT EXISTS skill_categories (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_card_id INTEGER NOT NULL REFERENCES skill_cards(id) ON DELETE CASCADE,
    title         TEXT    NOT NULL,
    icon          TEXT    NOT NULL,
    sort_order    INTEGER NOT NULL DEFAULT 0
);

-- Individual skills (within a category)
CREATE TABLE IF NOT EXISTS skills (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    description TEXT,
    icon        TEXT    NOT NULL,
    proficiency INTEGER NOT NULL DEFAULT 50,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Experience timeline entries
CREATE TABLE IF NOT EXISTS experiences (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date_range  TEXT    NOT NULL,
    title       TEXT    NOT NULL,
    badge       TEXT,
    company     TEXT    NOT NULL,
    description TEXT,
    bullets     TEXT    NOT NULL DEFAULT '[]',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    expanded    INTEGER NOT NULL DEFAULT 0
);

-- Education entries
CREATE TABLE IF NOT EXISTS education (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    card_title  TEXT    NOT NULL,
    card_icon   TEXT    NOT NULL DEFAULT 'fas fa-graduation-cap',
    entries     TEXT    NOT NULL DEFAULT '[]',
    sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Project cards
CREATE TABLE IF NOT EXISTS projects (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    title          TEXT    NOT NULL,
    description    TEXT,
    thumbnail_path TEXT,
    gallery_type   TEXT,
    gallery_folder TEXT,
    tags           TEXT    DEFAULT '[]',
    skills         TEXT    DEFAULT '[]',
    sort_order     INTEGER NOT NULL DEFAULT 0
);

-- Social links
CREATE TABLE IF NOT EXISTS socials (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    platform   TEXT    NOT NULL,
    url        TEXT    NOT NULL,
    icon       TEXT    NOT NULL,
    label      TEXT    NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Media registry: tracks all files in R2
CREATE TABLE IF NOT EXISTS media (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    folder      TEXT    NOT NULL,
    filename    TEXT    NOT NULL,
    alt_text    TEXT,
    mime_type   TEXT,
    size_bytes  INTEGER,
    uploaded_at TEXT    DEFAULT (datetime('now')),
    UNIQUE(folder, filename)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sections_sort ON sections(sort_order);
CREATE INDEX IF NOT EXISTS idx_skill_cards_sort ON skill_cards(sort_order);
CREATE INDEX IF NOT EXISTS idx_skill_categories_card ON skill_categories(skill_card_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_experiences_sort ON experiences(sort_order);
CREATE INDEX IF NOT EXISTS idx_education_sort ON education(sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_sort ON projects(sort_order);
CREATE INDEX IF NOT EXISTS idx_socials_sort ON socials(sort_order);
CREATE INDEX IF NOT EXISTS idx_media_folder ON media(folder);
CREATE INDEX IF NOT EXISTS idx_login_attempts ON login_attempts(ip_address, attempted_at);
