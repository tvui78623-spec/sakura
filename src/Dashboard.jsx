import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// ======================================
// SAKURA PANEL DATABASE
// ======================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================================
// DATABASE DIRECTORY
// ======================================

const dataDir = path.join(__dirname, "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const databasePath = path.join(dataDir, "sakura.db");

// ======================================
// DATABASE CONNECTION
// ======================================

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

// ======================================
// CREATE TABLES
// ======================================

db.exec(`
  CREATE TABLE IF NOT EXISTS guilds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    owner_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,

    prefix TEXT NOT NULL DEFAULT '!',

    welcome_enabled INTEGER NOT NULL DEFAULT 0,

    welcome_message TEXT NOT NULL DEFAULT 'Welcome!',

    log_channel TEXT DEFAULT NULL,

    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (guild_id)
      REFERENCES guilds(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bot_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    setting_key TEXT UNIQUE NOT NULL,

    setting_value TEXT,

    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ======================================
// PREPARED STATEMENTS
// ======================================

// SAVE GUILD

const saveGuildStatement = db.prepare(`
  INSERT INTO guilds (
    id,
    name,
    icon,
    owner_id
  )
  VALUES (
    @id,
    @name,
    @icon,
    @owner_id
  )
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    icon = excluded.icon,
    owner_id = excluded.owner_id,
    updated_at = CURRENT_TIMESTAMP
`);

// GET ALL GUILDS

const getGuildsStatement = db.prepare(`
  SELECT *
  FROM guilds
  ORDER BY name ASC
`);

// GET SINGLE GUILD

const getGuildStatement = db.prepare(`
  SELECT *
  FROM guilds
  WHERE id = ?
`);

// DELETE GUILD

const deleteGuildStatement = db.prepare(`
  DELETE FROM guilds
  WHERE id = ?
`);

// GET GUILD SETTINGS

const getGuildSettingsStatement = db.prepare(`
  SELECT *
  FROM guild_settings
  WHERE guild_id = ?
`);

// SAVE GUILD SETTINGS

const saveGuildSettingsStatement = db.prepare(`
  INSERT INTO guild_settings (
    guild_id,
    prefix,
    welcome_enabled,
    welcome_message,
    log_channel
  )
  VALUES (
    @guild_id,
    @prefix,
    @welcome_enabled,
    @welcome_message,
    @log_channel
  )
  ON CONFLICT(guild_id) DO UPDATE SET
    prefix = excluded.prefix,
    welcome_enabled = excluded.welcome_enabled,
    welcome_message = excluded.welcome_message,
    log_channel = excluded.log_channel,
    updated_at = CURRENT_TIMESTAMP
`);

// ======================================
// BOT SETTINGS
// ======================================

const getBotSettingStatement = db.prepare(`
  SELECT setting_value
  FROM bot_settings
  WHERE setting_key = ?
`);

const saveBotSettingStatement = db.prepare(`
  INSERT INTO bot_settings (
    setting_key,
    setting_value
  )
  VALUES (?, ?)
  ON CONFLICT(setting_key) DO UPDATE SET
    setting_value = excluded.setting_value,
    updated_at = CURRENT_TIMESTAMP
`);

// ======================================
// DATABASE FUNCTIONS
// ======================================

export function saveGuild(guild) {
  if (!guild?.id || !guild?.name) {
    throw new Error("INVALID_GUILD_DATA");
  }

  return saveGuildStatement.run({
    id: String(guild.id),
    name: String(guild.name),
    icon: guild.icon || null,
    owner_id: guild.owner_id
      ? String(guild.owner_id)
      : null
  });
}

export function getGuilds() {
  return getGuildsStatement.all();
}

export function getGuild(guildId) {
  return getGuildStatement.get(String(guildId));
}

export function deleteGuild(guildId) {
  return deleteGuildStatement.run(String(guildId));
}

export function getGuildSettings(guildId) {
  return getGuildSettingsStatement.get(String(guildId));
}

export function saveGuildSettings(settings) {
  if (!settings?.guild_id) {
    throw new Error("INVALID_GUILD_SETTINGS");
  }

  return saveGuildSettingsStatement.run({
    guild_id: String(settings.guild_id),
    prefix: settings.prefix ?? "!",
    welcome_enabled: settings.welcome_enabled ? 1 : 0,
    welcome_message: settings.welcome_message ?? "Welcome!",
    log_channel: settings.log_channel || null
  });
}

// ======================================
// BOT SETTINGS FUNCTIONS
// ======================================

export function getBotSetting(key) {
  const result = getBotSettingStatement.get(String(key));

  return result?.setting_value ?? null;
}

export function saveBotSetting(key, value) {
  return saveBotSettingStatement.run(
    String(key),
    String(value)
  );
}

// ======================================
// DATABASE INFORMATION
// ======================================

export function getDatabaseStatus() {
  return {
    connected: db.open,
    path: databasePath,
    guildCount: getGuildsStatement.all().length
  };
}

// ======================================
// DATABASE CLOSE
// ======================================

export function closeDatabase() {
  if (db.open) {
    db.close();
    console.log("[DATABASE] Connection closed");
  }
}

// ======================================
// EXPORTS
// ======================================

export { db };

export default db;
