-- Migration: password_hash nullable machen für einfaches Login
-- Version: 1
-- Datum: 2025-12-16

-- SQLite unterstützt kein ALTER COLUMN, daher müssen wir die Tabelle neu erstellen
-- Schritt 1: Neue Tabelle mit nullable password_hash erstellen
CREATE TABLE IF NOT EXISTS users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT,  -- NULL erlaubt für einfaches Login (nur Name)
  role TEXT NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Schritt 2: Daten kopieren
INSERT INTO users_new (id, username, password_hash, role, created_at, last_login)
SELECT id, username, password_hash, role, created_at, last_login
FROM users;

-- Schritt 3: Alte Tabelle löschen
DROP TABLE users;

-- Schritt 4: Neue Tabelle umbenennen
ALTER TABLE users_new RENAME TO users;

-- Schritt 5: Index neu erstellen
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

