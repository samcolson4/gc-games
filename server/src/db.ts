import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DB_DIR, "gc-games.db"));

db.exec(`PRAGMA journal_mode = WAL`);
db.exec(`PRAGMA foreign_keys = ON`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    display_name  TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS games (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    game_type    TEXT NOT NULL CHECK(game_type IN ('rummy','golf','mexican_train')),
    status       TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','completed')),
    created_by   INTEGER REFERENCES users(id),
    created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
    completed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS game_players (
    game_id    INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    join_order INTEGER NOT NULL,
    PRIMARY KEY (game_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS scores (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id      INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id      INTEGER NOT NULL REFERENCES users(id),
    round_number INTEGER NOT NULL,
    value        INTEGER NOT NULL,
    UNIQUE(game_id, user_id, round_number)
  );
`);

export default db;
